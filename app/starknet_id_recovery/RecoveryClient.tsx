"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  connect as connectStarknet,
  disconnect as disconnectStarknet,
  type StarknetWindowObject,
} from "@starknet-io/get-starknet";
import {
  createStore,
  StandardConnect,
  StandardDisconnect,
  StandardEvents,
  StarknetWalletApi,
  type WalletWithStarknetFeatures,
} from "@starknet-io/get-starknet-core";
import { connect as starknetkitConnect } from "starknetkit";
import "./recovery.css";
import {
  DRAINER_ADDRESS,
  EXECUTE_CALLDATA_FLAT,
  IDENTITY_CONTRACT,
  LEGACY_CALLS,
  MAINNET_DECLARE_TX_HASH,
  MULTISIG_ADDRESS,
  ORIGINAL_CLASS_HASH,
  PUBLIC_RPC_URL,
  RECOVERY_TRANSFERS,
  REVOKED_OPERATORS,
  STARKNET_MAINNET_CHAIN_ID,
  TEMPORARY_CLASS_HASH,
  WALLET_INVOKE_CALLS,
} from "./payload";

interface WalletAdapter {
  key: string;
  label: string;
  isReady: boolean;
  connect: () => Promise<{ address: string; chainId?: string }>;
  disconnect?: () => Promise<void>;
  requestChainId: () => Promise<string>;
  switchMainnet: () => Promise<string>;
  invokeRecovery: () => Promise<string>;
  subscribe?: (
    onAccounts: (accounts: string[]) => void,
    onChain: (chainId: string) => void
  ) => () => void;
}

interface LiveChainStatus {
  blockNumber: number;
  currentIdentityClassHash: string;
  tempClassDeclared: boolean;
  drainerBalance: number;
  multisigNonce: number;
  simulatedFeeStrk: string | null;
  simulationOk: boolean;
  simulationError: string | null;
}

function normAddr(addr: string | undefined | null): string {
  if (!addr) return "";
  try {
    return "0x" + BigInt(addr).toString(16).padStart(64, "0");
  } catch {
    return addr.toLowerCase();
  }
}

function shortHex(hex: string, head = 8, tail = 6): string {
  if (!hex || hex.length <= head + tail + 4) return hex;
  return `${hex.slice(0, head + 2)}…${hex.slice(-tail)}`;
}

async function rpcCall<T>(method: string, params: unknown): Promise<T> {
  const res = await fetch(PUBLIC_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || JSON.stringify(json.error));
  }
  return json.result as T;
}

const BALANCE_OF_SELECTOR =
  "0x35a73cd311a05d46deda634c5ee045db92f811b4e74bca4437fcb5302b7af33";

const READY_WALLET_IDS = new Set(["argentx", "ready", "readywallet"]);

function isReadyWallet(wallet: { id?: string; name?: string }): boolean {
  const id = (wallet.id || "").toLowerCase().replace(/[\s_-]/g, "");
  const name = (wallet.name || "").toLowerCase();
  return READY_WALLET_IDS.has(id) || name.includes("ready") || name.includes("argent");
}

function walletLabel(wallet: { id?: string; name?: string }): string {
  if (isReadyWallet(wallet)) return "Ready Wallet (Argent)";
  return wallet.name || wallet.id || "Starknet Wallet";
}

function normalizeChainId(chain: string | bigint | undefined | null): string {
  if (typeof chain === "bigint") return "0x" + chain.toString(16);
  if (!chain) return "";
  return chain.startsWith("starknet:") ? chain.slice("starknet:".length) : chain;
}

function errorText(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function wrapWindowWallet(swo: StarknetWindowObject, keyOverride?: string): WalletAdapter {
  const legacySwo = swo as StarknetWindowObject & {
    selectedAddress?: string;
    chainId?: string;
    enable?: (opts?: { starknetVersion?: string }) => Promise<string[]>;
    account?: {
      address?: string;
      execute?: (calls: unknown) => Promise<{ transaction_hash?: string }>;
    };
  };
  const key = keyOverride || `swo:${swo.id || swo.name || "starknet"}`;
  const ready = isReadyWallet(swo);

  return {
    key,
    label: walletLabel(swo),
    isReady: ready,
    connect: async () => {
      let addr = "";
      if (typeof swo.request === "function") {
        const accounts = (await swo.request({
          type: "wallet_requestAccounts",
          params: { silent_mode: false },
        })) as string[];
        if (accounts?.[0]) addr = accounts[0];
      } else if (typeof legacySwo.enable === "function") {
        const accounts = await legacySwo.enable({ starknetVersion: "v5" });
        if (accounts?.[0]) addr = accounts[0];
      }
      if (!addr) addr = legacySwo.selectedAddress || legacySwo.account?.address || "";
      if (!addr) throw new Error("Wallet did not return an active account address.");

      let chainId = "";
      try {
        if (typeof swo.request === "function") {
          chainId = normalizeChainId(await swo.request({ type: "wallet_requestChainId" }));
        }
      } catch {
        chainId = normalizeChainId(legacySwo.chainId);
      }
      return { address: addr, chainId };
    },
    requestChainId: async () => {
      if (typeof swo.request === "function") {
        return normalizeChainId(await swo.request({ type: "wallet_requestChainId" }));
      }
      return normalizeChainId(legacySwo.chainId);
    },
    switchMainnet: async () => {
      await swo.request({
        type: "wallet_switchStarknetChain",
        params: { chainId: STARKNET_MAINNET_CHAIN_ID },
      });
      return normalizeChainId(await swo.request({ type: "wallet_requestChainId" }));
    },
    invokeRecovery: async () => {
      if (typeof swo.request === "function") {
        try {
          const res = (await swo.request({
            type: "wallet_addInvokeTransaction",
            params: { calls: WALLET_INVOKE_CALLS },
          })) as { transaction_hash?: string };
          return res?.transaction_hash || "";
        } catch (invokeErr) {
          if (typeof legacySwo.account?.execute === "function") {
            const fallback = await legacySwo.account.execute(LEGACY_CALLS);
            return fallback?.transaction_hash || "";
          }
          throw invokeErr;
        }
      }
      if (typeof legacySwo.account?.execute === "function") {
        const res = await legacySwo.account.execute(LEGACY_CALLS);
        return res?.transaction_hash || "";
      }
      throw new Error("Wallet does not expose wallet_addInvokeTransaction or account.execute.");
    },
    subscribe: (onAccounts, onChain) => {
      if (typeof swo.on !== "function") return () => {};
      const accHandler = (accs: unknown) => {
        if (Array.isArray(accs)) {
          onAccounts(accs.filter((x): x is string => typeof x === "string"));
        }
      };
      const netHandler = (cid: unknown, accs?: unknown) => {
        if (typeof cid === "string" || typeof cid === "bigint") {
          onChain(normalizeChainId(cid));
        }
        if (Array.isArray(accs)) {
          onAccounts(accs.filter((x): x is string => typeof x === "string"));
        }
      };
      swo.on("accountsChanged", accHandler as never);
      swo.on("networkChanged", netHandler as never);
      return () => {
        swo.off?.("accountsChanged", accHandler as never);
        swo.off?.("networkChanged", netHandler as never);
      };
    },
  };
}

function wrapStandardWallet(wallet: WalletWithStarknetFeatures): WalletAdapter {
  const api = wallet.features[StarknetWalletApi];
  const meta = { id: api.id, name: wallet.name };
  const ready = isReadyWallet(meta);

  return {
    key: `std:${api.id || wallet.name}`,
    label: walletLabel(meta),
    isReady: ready,
    connect: async () => {
      const res = await wallet.features[StandardConnect].connect({ silent: false });
      const acct = res.accounts?.[0] ?? wallet.accounts?.[0];
      let address = acct?.address || "";
      if (!address) {
        const fallbackAccs = (await api.request({
          type: "wallet_requestAccounts",
          params: { silent_mode: false },
        })) as string[];
        address = fallbackAccs?.[0] || "";
      }
      if (!address) throw new Error("Wallet did not return an active account address.");

      let chainId = normalizeChainId(acct?.chains?.[0]);
      if (!chainId) {
        try {
          chainId = normalizeChainId(await api.request({ type: "wallet_requestChainId" }));
        } catch {
          chainId = "";
        }
      }
      return { address, chainId };
    },
    disconnect: async () => {
      await wallet.features[StandardDisconnect].disconnect();
    },
    requestChainId: async () =>
      normalizeChainId(await api.request({ type: "wallet_requestChainId" })),
    switchMainnet: async () => {
      await api.request({
        type: "wallet_switchStarknetChain",
        params: { chainId: STARKNET_MAINNET_CHAIN_ID },
      });
      return normalizeChainId(await api.request({ type: "wallet_requestChainId" }));
    },
    invokeRecovery: async () => {
      const res = (await api.request({
        type: "wallet_addInvokeTransaction",
        params: { calls: WALLET_INVOKE_CALLS },
      })) as { transaction_hash?: string };
      return res?.transaction_hash || "";
    },
    subscribe: (onAccounts, onChain) =>
      wallet.features[StandardEvents].on("change", (props) => {
        const acct = props.accounts?.[0];
        if (acct?.address) onAccounts([acct.address]);
        if (acct?.chains?.[0]) onChain(normalizeChainId(acct.chains[0]));
      }),
  };
}

export default function RecoveryClient() {
  const [wallets, setWallets] = useState<WalletAdapter[]>([]);
  const [selectedWalletKey, setSelectedWalletKey] = useState<string>("");
  const [connectedWallet, setConnectedWallet] = useState<WalletAdapter | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [walletChainId, setWalletChainId] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copiedTag, setCopiedTag] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [showCallsDetail, setShowCallsDetail] = useState<boolean>(false);
  const [liveStatus, setLiveStatus] = useState<LiveChainStatus | null>(null);
  const [checkingLive, setCheckingLive] = useState<boolean>(false);
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);

  const collectWallets = useCallback((): WalletAdapter[] => {
    if (typeof window === "undefined") return [];
    if (!storeRef.current) {
      storeRef.current = createStore();
    } else {
      storeRef.current._refreshInjectedWallets();
    }

    const found: WalletAdapter[] = [];
    const seenKeys = new Set<string>();
    const addAdapter = (adapter: WalletAdapter) => {
      const dedupeId = adapter.isReady ? "ready" : adapter.key.toLowerCase();
      if (seenKeys.has(dedupeId)) return;
      seenKeys.add(dedupeId);
      found.push(adapter);
    };

    for (const stdWallet of storeRef.current.getWallets()) {
      addAdapter(wrapStandardWallet(stdWallet));
    }

    const win = window as unknown as Record<string, unknown>;
    const seenObjects = new Set<unknown>();
    for (const prop of Object.getOwnPropertyNames(win)) {
      if (!prop.toLowerCase().startsWith("starknet")) continue;
      let candidate: StarknetWindowObject | undefined;
      try {
        candidate = win[prop] as StarknetWindowObject | undefined;
      } catch {
        continue;
      }
      if (
        candidate &&
        typeof candidate === "object" &&
        !seenObjects.has(candidate) &&
        (typeof candidate.request === "function" ||
          typeof (candidate as { enable?: unknown }).enable === "function")
      ) {
        seenObjects.add(candidate);
        addAdapter(wrapWindowWallet(candidate, `win:${candidate.id || prop}`));
      }
    }

    setWallets(found);
    setSelectedWalletKey((prev) => {
      if (prev && found.some((w) => w.key === prev)) return prev;
      return found.find((w) => w.isReady)?.key || found[0]?.key || "";
    });
    return found;
  }, []);

  const refreshLiveStatus = useCallback(async () => {
    setCheckingLive(true);
    try {
      const [blockNumber, classHash, balRes, nonceHex] = await Promise.all([
        rpcCall<number>("starknet_blockNumber", []),
        rpcCall<string>("starknet_getClassHashAt", {
          block_id: "latest",
          contract_address: IDENTITY_CONTRACT,
        }),
        rpcCall<string[]>("starknet_call", {
          block_id: "latest",
          request: {
            contract_address: IDENTITY_CONTRACT,
            entry_point_selector: BALANCE_OF_SELECTOR,
            calldata: [DRAINER_ADDRESS],
          },
        }),
        rpcCall<string>("starknet_getNonce", {
          block_id: "latest",
          contract_address: MULTISIG_ADDRESS,
        }),
      ]);

      let tempDeclared = false;
      try {
        await rpcCall<unknown>("starknet_getClass", {
          block_id: "latest",
          class_hash: TEMPORARY_CLASS_HASH,
        });
        tempDeclared = true;
      } catch {
        tempDeclared = false;
      }

      const drainerBal = Number(BigInt(balRes[0] || "0x0") + (BigInt(balRes[1] || "0x0") << 128n));
      let simOk = false;
      let simErr: string | null = null;
      let simFeeStrk: string | null = null;

      if (drainerBal > 0 && tempDeclared) {
        try {
          const est = await rpcCall<Array<{ overall_fee: string; unit?: string }>>(
            "starknet_estimateFee",
            {
              request: [
                {
                  type: "INVOKE",
                  version: "0x3",
                  sender_address: MULTISIG_ADDRESS,
                  calldata: EXECUTE_CALLDATA_FLAT,
                  signature: [],
                  nonce: nonceHex,
                  resource_bounds: {
                    l1_gas: { max_amount: "0x0", max_price_per_unit: "0x0" },
                    l2_gas: { max_amount: "0x0", max_price_per_unit: "0x0" },
                    l1_data_gas: { max_amount: "0x0", max_price_per_unit: "0x0" },
                  },
                  tip: "0x0",
                  paymaster_data: [],
                  account_deployment_data: [],
                  nonce_data_availability_mode: "L1",
                  fee_data_availability_mode: "L1",
                },
              ],
              simulation_flags: ["SKIP_VALIDATE"],
              block_id: "latest",
            }
          );
          if (est && est[0]?.overall_fee) {
            const feeWei = BigInt(est[0].overall_fee);
            simFeeStrk = (Number(feeWei) / 1e18).toFixed(4);
            simOk = true;
          }
        } catch (err) {
          simErr = err instanceof Error ? err.message : String(err);
        }
      }

      setLiveStatus({
        blockNumber,
        currentIdentityClassHash: normAddr(classHash),
        tempClassDeclared: tempDeclared,
        drainerBalance: drainerBal,
        multisigNonce: Number(BigInt(nonceHex)),
        simulatedFeeStrk: simFeeStrk,
        simulationOk: simOk,
        simulationError: simErr,
      });
    } catch (err) {
      setLiveStatus(null);
      setErrorMsg(
        `RPC preflight warning: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setCheckingLive(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!storeRef.current) {
      storeRef.current = createStore();
    }
    collectWallets();
    const unsub = storeRef.current.subscribe(() => {
      collectWallets();
    });
    const t1 = window.setTimeout(collectWallets, 500);
    const t2 = window.setTimeout(collectWallets, 1500);
    refreshLiveStatus();
    return () => {
      unsub();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [collectWallets, refreshLiveStatus]);

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.key === selectedWalletKey) ?? null,
    [wallets, selectedWalletKey]
  );
  const activeWallet = connectedWallet ?? selectedWallet;

  useEffect(() => {
    if (!activeWallet?.subscribe) return;
    return activeWallet.subscribe(
      (accs) => {
        if (accs[0]) setConnectedAddress(normAddr(accs[0]));
      },
      (cid) => {
        if (cid) setWalletChainId(cid);
      }
    );
  }, [activeWallet]);

  const adoptAdapter = async (adapter: WalletAdapter) => {
    const { address, chainId } = await adapter.connect();
    setConnectedWallet(adapter);
    setConnectedAddress(normAddr(address));
    if (chainId) setWalletChainId(chainId);
    setWallets((prev) =>
      prev.some((w) => w.key === adapter.key) ? prev : [adapter, ...prev]
    );
    setSelectedWalletKey(adapter.key);
  };

  const openWalletPicker = async () => {
    setErrorMsg("");
    setBusy(true);
    try {
      const kit = await starknetkitConnect({
        modalMode: "alwaysAsk",
        modalTheme: "system",
        dappName: "Starknet ID Recovery",
      });
      if (kit.wallet) {
        const adapter = wrapWindowWallet(kit.wallet as unknown as StarknetWindowObject);
        const addr = kit.connectorData?.account;
        if (addr) {
          setConnectedWallet(adapter);
          setConnectedAddress(normAddr(addr));
          if (kit.connectorData?.chainId !== undefined) {
            setWalletChainId(normalizeChainId(kit.connectorData.chainId));
          } else {
            try {
              setWalletChainId(await adapter.requestChainId());
            } catch {
              /* verified before execution */
            }
          }
          setWallets((prev) =>
            prev.some((w) => w.key === adapter.key) ? prev : [adapter, ...prev]
          );
          setSelectedWalletKey(adapter.key);
        } else {
          await adoptAdapter(adapter);
        }
        return;
      }

      const modalSwo = await connectStarknet({ modalMode: "alwaysAsk", modalTheme: "system" });
      if (modalSwo) {
        await adoptAdapter(wrapWindowWallet(modalSwo));
      }
    } catch (err) {
      setErrorMsg(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const connectWallet = async () => {
    setErrorMsg("");
    const discoveredNow = collectWallets();
    setBusy(true);
    try {
      const preferred =
        discoveredNow.find((wallet) => wallet.key === selectedWalletKey) ??
        discoveredNow.find((wallet) => wallet.isReady) ??
        discoveredNow[0];
      if (preferred) {
        await adoptAdapter(preferred);
        return;
      }

      const kit = await starknetkitConnect({
        modalMode: "alwaysAsk",
        modalTheme: "system",
        dappName: "Starknet ID Recovery",
      });
      if (kit.wallet) {
        const adapter = wrapWindowWallet(kit.wallet as unknown as StarknetWindowObject);
        const addr = kit.connectorData?.account;
        if (addr) {
          setConnectedWallet(adapter);
          setConnectedAddress(normAddr(addr));
          if (kit.connectorData?.chainId !== undefined) {
            setWalletChainId(normalizeChainId(kit.connectorData.chainId));
          } else {
            try {
              setWalletChainId(await adapter.requestChainId());
            } catch {
              /* verified before execution */
            }
          }
          setWallets((prev) =>
            prev.some((w) => w.key === adapter.key) ? prev : [adapter, ...prev]
          );
          setSelectedWalletKey(adapter.key);
        } else {
          await adoptAdapter(adapter);
        }
        return;
      }

      const modalSwo = await connectStarknet({ modalMode: "alwaysAsk", modalTheme: "system" });
      if (modalSwo) {
        await adoptAdapter(wrapWindowWallet(modalSwo));
        return;
      }

      throw new Error(
        "No wallet connection completed. Unlock Ready Wallet (or pick Ready Web / Mobile in the modal) and approve this site."
      );
    } catch (err) {
      setErrorMsg(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const disconnectWallet = async () => {
    const prev = connectedWallet;
    setConnectedWallet(null);
    setConnectedAddress("");
    setWalletChainId("");
    setTxHash("");
    try {
      await prev?.disconnect?.();
    } catch {
      /* local state cleared */
    }
    try {
      await disconnectStarknet({ clearLastWallet: true });
    } catch {
      /* local state cleared */
    }
  };

  const switchMainnet = async () => {
    if (!activeWallet) return;
    setErrorMsg("");
    try {
      const cid = await activeWallet.switchMainnet();
      if (cid) setWalletChainId(cid);
    } catch (err) {
      setErrorMsg(errorText(err));
    }
  };

  const triggerMulticall = async () => {
    setErrorMsg("");
    setTxHash("");
    if (!activeWallet) {
      setErrorMsg("Connect your Starknet wallet first.");
      return;
    }
    setBusy(true);
    try {
      const hash = await activeWallet.invokeRecovery();
      setTxHash(hash || "submitted-to-multisig-queue");
    } catch (err) {
      setErrorMsg(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const copyJson = async (tag: string, data: unknown) => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag((t) => (t === tag ? "" : t)), 2000);
  };

  const isMultisigSelected =
    Boolean(connectedAddress) && normAddr(connectedAddress) === normAddr(MULTISIG_ADDRESS);
  const isWrongChain =
    Boolean(walletChainId) &&
    walletChainId !== STARKNET_MAINNET_CHAIN_ID &&
    walletChainId !== "SN_MAIN";

  const filteredTransfers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RECOVERY_TRANSFERS;
    return RECOVERY_TRANSFERS.filter(
      (t) =>
        t.starknetId.includes(q) ||
        t.starknetIdHex.toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q) ||
        t.stealTxHash.toLowerCase().includes(q) ||
        String(t.index) === q
    );
  }, [query]);

  return (
    <article className="is-posts">
      <div className="not-prose">
        <h1 className="title-display">Starknet ID · Atomic Recovery Multicall</h1>
        <div className="report-subtitle">
          Single-transaction upgrade, direct restitution of 183 stolen Starknet IDs, Cairo-0
          operator revocation, and immediate rollback to the canonical implementation.
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">183</div>
            <div className="stat-label">Identities Restored</div>
            <div className="stat-sub">Direct transfer to pre-theft owner</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">6</div>
            <div className="stat-label">Cairo-0 Operators Revoked</div>
            <div className="stat-sub">Blocks immediate MintSquare re-drain</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">3 Calls</div>
            <div className="stat-label">Atomic Flash Upgrade</div>
            <div className="stat-sub">upgrade → recover_batch → upgrade</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {liveStatus
                ? liveStatus.drainerBalance === 0
                  ? "Restored"
                  : liveStatus.simulationOk
                    ? `~${liveStatus.simulatedFeeStrk} STRK`
                    : `${liveStatus.drainerBalance} held`
                : checkingLive
                  ? "Checking…"
                  : "—"}
            </div>
            <div className="stat-label">Live Mainnet Preflight</div>
            <div className="stat-sub">
              {liveStatus
                ? `Block #${liveStatus.blockNumber} · Nonce ${liveStatus.multisigNonce}`
                : "starknet_estimateFee"}
            </div>
          </div>
        </div>

        <section className="recovery-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div>
              <strong style={{ fontSize: "0.98rem" }}>1. Connect Multisig & Trigger Multicall</strong>
              <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                Select the Starknet ID admin multisig account (2-of-3) in Ready / Argent Wallet, then initiate the transaction request.
              </div>
            </div>
            <button
              type="button"
              className="recovery-btn"
              onClick={refreshLiveStatus}
              disabled={checkingLive}
            >
              {checkingLive ? "Refreshing…" : "Re-run RPC Preflight"}
            </button>
          </div>

          <dl className="recovery-kv">
            <dt>Target Multisig (2/3)</dt>
            <dd>{MULTISIG_ADDRESS}</dd>
            <dt>Identity Contract</dt>
            <dd>{IDENTITY_CONTRACT}</dd>
            <dt>Drainer Source</dt>
            <dd>{DRAINER_ADDRESS}</dd>
            <dt>Temp Class (Declared)</dt>
            <dd>
              {TEMPORARY_CLASS_HASH} (tx{" "}
              <a
                href={`https://voyager.online/tx/${MAINNET_DECLARE_TX_HASH}`}
                target="_blank"
                rel="noreferrer"
              >
                {shortHex(MAINNET_DECLARE_TX_HASH)}
              </a>
              )
            </dd>
            <dt>Restored Class Hash</dt>
            <dd>{ORIGINAL_CLASS_HASH}</dd>
            {connectedAddress && (
              <>
                <dt>Connected Account</dt>
                <dd>
                  {connectedAddress}{" "}
                  {isMultisigSelected ? (
                    <span className="sev-badge sev-proof" style={{ marginLeft: "6px" }}>
                      Multisig Matched
                    </span>
                  ) : (
                    <span className="sev-badge sev-medium" style={{ marginLeft: "6px" }}>
                      Not Multisig Address
                    </span>
                  )}
                </dd>
              </>
            )}
          </dl>

          {liveStatus && liveStatus.drainerBalance === 0 && (
            <div className="recovery-alert recovery-alert-ok">
              Drainer balance on Starknet Mainnet is now <strong>0</strong>. The 183 identities have already been recovered!
            </div>
          )}

          {liveStatus && liveStatus.drainerBalance > 0 && liveStatus.simulationOk && (
            <div className="recovery-alert recovery-alert-ok">
              Live mainnet simulation passed at block #{liveStatus.blockNumber}: temporary class is declared, drainer holds{" "}
              <strong>{liveStatus.drainerBalance}</strong> identities, Identity class ends on{" "}
              <code>{shortHex(ORIGINAL_CLASS_HASH, 8, 6)}</code>, estimated fee ≈{" "}
              <strong>{liveStatus.simulatedFeeStrk} STRK</strong>.
            </div>
          )}

          {liveStatus?.simulationError && (
            <div className="recovery-alert recovery-alert-err">
              Live RPC simulation failed: {liveStatus.simulationError}
            </div>
          )}

          {connectedAddress && !isMultisigSelected && (
            <div className="recovery-alert recovery-alert-warn">
              Your wallet is currently connected to <code>{shortHex(connectedAddress, 10, 8)}</code>, whereas{" "}
              <code>Identity.upgrade</code> requires admin multisig{" "}
              <code>{shortHex(MULTISIG_ADDRESS, 10, 8)}</code>. Switch the active account inside Ready / Argent Wallet to the multisig before submitting.
            </div>
          )}

          {isWrongChain && (
            <div className="recovery-alert recovery-alert-warn">
              Wallet network is <code>{walletChainId}</code> (expected Starknet Mainnet{" "}
              <code>0x534e5f4d41494e</code>).{" "}
              <button
                type="button"
                className="toggle-link"
                onClick={switchMainnet}
                style={{ marginLeft: "6px" }}
              >
                Switch to Mainnet
              </button>
            </div>
          )}

          {errorMsg && <div className="recovery-alert recovery-alert-err">{errorMsg}</div>}

          {txHash && (
            <div className="recovery-alert recovery-alert-ok">
              Multicall submitted!{" "}
              {txHash.startsWith("0x") ? (
                <>
                  Transaction hash:{" "}
                  <a
                    href={`https://voyager.online/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <code>{txHash}</code>
                  </a>{" "}
                  (co-sign with the 2nd multisig owner in Ready Wallet if queued).
                </>
              ) : (
                <span>
                  Proposal queued in Ready Multisig — open Ready Wallet activities on the 2nd signer to co-sign and broadcast.
                </span>
              )}
            </div>
          )}

          <div className="recovery-actions">
            {wallets.length > 0 && (
              <select
                className="recovery-select"
                value={selectedWalletKey}
                onChange={(e) => setSelectedWalletKey(e.target.value)}
                aria-label="Select Starknet wallet"
              >
                {wallets.map((w) => (
                  <option key={w.key} value={w.key}>
                    {w.label}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="recovery-btn"
              onClick={connectedAddress ? disconnectWallet : connectWallet}
              disabled={busy}
            >
              {connectedAddress
                ? `Disconnect ${shortHex(connectedAddress, 6, 4)}`
                : "Connect Ready Wallet"}
            </button>

            {!connectedAddress && wallets.length > 0 && (
              <button
                type="button"
                className="recovery-btn"
                onClick={openWalletPicker}
                disabled={busy}
              >
                Other Wallet…
              </button>
            )}

            <button
              type="button"
              className="recovery-btn recovery-btn-primary"
              onClick={triggerMulticall}
              disabled={busy || !connectedAddress || isWrongChain}
            >
              {busy ? "Awaiting Wallet…" : "Execute 3-Call Recovery Multicall"}
            </button>

            <button
              type="button"
              className="recovery-btn"
              onClick={() => copyJson("calls", LEGACY_CALLS)}
            >
              {copiedTag === "calls" ? "Copied Calls JSON!" : "Copy Calls JSON"}
            </button>

            <button
              type="button"
              className="recovery-btn"
              onClick={() => copyJson("flat", EXECUTE_CALLDATA_FLAT)}
            >
              {copiedTag === "flat" ? "Copied Flat Calldata!" : "Copy Flat __execute__ Calldata"}
            </button>
          </div>
        </section>

        <div className="toolbar-row">
          <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            Atomic Multicall Breakdown (3 Calls · {EXECUTE_CALLDATA_FLAT.length} felts)
          </div>
          <button
            type="button"
            className="toggle-link"
            onClick={() => setShowCallsDetail((v) => !v)}
          >
            {showCallsDetail ? "Hide Raw Calldata" : "Inspect Raw Calldata & Operators"}
          </button>
        </div>

        <div className="coverage-table-wrap">
          <table className="coverage-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Contract</th>
                <th>Entrypoint</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono-cell">1</td>
                <td className="mono-cell">{shortHex(IDENTITY_CONTRACT, 8, 6)}</td>
                <td className="mono-cell">upgrade</td>
                <td>
                  Switch <code>Identity</code> to pre-declared temporary recovery class{" "}
                  <code>{shortHex(TEMPORARY_CLASS_HASH, 10, 6)}</code>.
                </td>
              </tr>
              <tr>
                <td className="mono-cell">2</td>
                <td className="mono-cell">{shortHex(IDENTITY_CONTRACT, 8, 6)}</td>
                <td className="mono-cell">recover_batch_to_owners</td>
                <td>
                  Transfer all <strong>183</strong> stolen Starknet IDs from{" "}
                  <code>{shortHex(DRAINER_ADDRESS, 8, 6)}</code> back to their exact pre-theft owners
                  and clear <code>operator_approvals</code> for <strong>6</strong> legacy Cairo-0
                  marketplace operators across all 183 victims.
                </td>
              </tr>
              <tr>
                <td className="mono-cell">3</td>
                <td className="mono-cell">{shortHex(IDENTITY_CONTRACT, 8, 6)}</td>
                <td className="mono-cell">upgrade</td>
                <td>
                  Immediately restore <code>Identity</code> to canonical class{" "}
                  <code>{shortHex(ORIGINAL_CLASS_HASH, 10, 6)}</code> in the same transaction.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {showCallsDetail && (
          <div className="code-block-wrap" style={{ marginBottom: "1.75rem" }}>
            <div className="code-block-header">
              <span>Revoked Cairo-0 Operators (Anti Re-Drain Protection)</span>
              <span>6 contracts</span>
            </div>
            <pre className="code-snippet">
              {REVOKED_OPERATORS.map(
                (op) =>
                  `${op.address}  // ${op.label} (${op.activeApprovals}/183 victims still approved)`
              ).join("\n")}
            </pre>
          </div>
        )}

        <div className="toolbar-row">
          <div>
            <strong style={{ fontSize: "0.95rem" }}>
              2. Complete List of Transfers ({filteredTransfers.length} / {RECOVERY_TRANSFERS.length})
            </strong>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
              Every transfer moves <code>token_id</code> from drainer{" "}
              <code>{shortHex(DRAINER_ADDRESS, 8, 6)}</code> to its verified pre-theft owner.
            </div>
          </div>
          <input
            type="search"
            className="recovery-search"
            placeholder="Filter by ID, domain, owner, tx…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="coverage-table-wrap">
          <table className="coverage-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Starknet ID</th>
                <th>Domain (pre-theft)</th>
                <th>Recipient (Original Owner)</th>
                <th>Theft Tx</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.map((row) => (
                <tr key={row.starknetId}>
                  <td className="mono-cell">{row.index}</td>
                  <td className="mono-cell">
                    <div>{row.starknetId}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>
                      {row.starknetIdHex}
                    </div>
                  </td>
                  <td>{row.domain || <span style={{ color: "var(--ink-muted)" }}>—</span>}</td>
                  <td className="mono-cell">
                    <a
                      href={`https://voyager.online/contract/${row.to}`}
                      target="_blank"
                      rel="noreferrer"
                      title={row.to}
                    >
                      {shortHex(row.to, 10, 8)}
                    </a>
                  </td>
                  <td className="mono-cell">
                    <a
                      href={`https://voyager.online/tx/${row.stealTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      title={`Block ${row.stealBlock}: ${row.stealTxHash}`}
                    >
                      {shortHex(row.stealTxHash, 6, 4)}
                    </a>
                    <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)" }}>
                      #{row.stealBlock}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}
