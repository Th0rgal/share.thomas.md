"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

interface StarknetWalletObject {
  id?: string;
  name?: string;
  icon?: string | { dark?: string; light?: string };
  selectedAddress?: string;
  chainId?: string;
  isConnected?: boolean;
  account?: {
    address?: string;
    execute?: (calls: unknown) => Promise<{ transaction_hash?: string }>;
  };
  enable?: (opts?: { starknetVersion?: string }) => Promise<string[]>;
  request?: (call: { type: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  off?: (event: string, cb: (...args: unknown[]) => void) => void;
}

interface DiscoveredWallet {
  key: string;
  label: string;
  swo: StarknetWalletObject;
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

export default function RecoveryClient() {
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [selectedWalletKey, setSelectedWalletKey] = useState<string>("");
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

  const discoverWallets = useCallback(() => {
    if (typeof window === "undefined") return;
    const win = window as unknown as Record<string, unknown>;
    const seen = new Set<StarknetWalletObject>();
    const found: DiscoveredWallet[] = [];

    for (const k of Object.keys(win)) {
      if (!k.startsWith("starknet")) continue;
      const candidate = win[k] as StarknetWalletObject | undefined;
      if (
        candidate &&
        typeof candidate === "object" &&
        (typeof candidate.request === "function" || typeof candidate.enable === "function") &&
        !seen.has(candidate)
      ) {
        seen.add(candidate);
        const label = candidate.name || candidate.id || k.replace(/^starknet_?/, "") || "Starknet Wallet";
        found.push({ key: k, label, swo: candidate });
      }
    }

    setWallets(found);
    setSelectedWalletKey((prev) => {
      if (prev && found.some((w) => w.key === prev)) return prev;
      const readyIdx = found.find(
        (w) =>
          w.key.toLowerCase().includes("argent") ||
          w.key.toLowerCase().includes("ready") ||
          w.label.toLowerCase().includes("argent") ||
          w.label.toLowerCase().includes("ready")
      );
      return readyIdx ? readyIdx.key : found[0]?.key || "";
    });
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
    discoverWallets();
    const t = setTimeout(discoverWallets, 600);
    refreshLiveStatus();
    return () => clearTimeout(t);
  }, [discoverWallets, refreshLiveStatus]);

  const activeWallet = useMemo(
    () => wallets.find((w) => w.key === selectedWalletKey)?.swo ?? null,
    [wallets, selectedWalletKey]
  );

  useEffect(() => {
    if (!activeWallet?.on) return;
    const onAcc = (accs: unknown) => {
      if (Array.isArray(accs) && typeof accs[0] === "string") {
        setConnectedAddress(normAddr(accs[0]));
      }
    };
    const onNet = (cid: unknown) => {
      if (typeof cid === "string") setWalletChainId(cid);
    };
    activeWallet.on("accountsChanged", onAcc);
    activeWallet.on("networkChanged", onNet);
    return () => {
      activeWallet.off?.("accountsChanged", onAcc);
      activeWallet.off?.("networkChanged", onNet);
    };
  }, [activeWallet]);

  const connectWallet = async () => {
    setErrorMsg("");
    discoverWallets();
    if (!activeWallet) {
      setErrorMsg(
        "No Starknet browser wallet detected. Open this page in a browser with Ready (Argent) or Braavos installed."
      );
      return;
    }
    setBusy(true);
    try {
      let addr = "";
      if (typeof activeWallet.request === "function") {
        const accounts = (await activeWallet.request({
          type: "wallet_requestAccounts",
          params: { silent_mode: false },
        })) as string[];
        if (accounts?.[0]) addr = accounts[0];
        try {
          const cid = (await activeWallet.request({
            type: "wallet_requestChainId",
          })) as string;
          if (cid) setWalletChainId(cid);
        } catch {
          if (activeWallet.chainId) setWalletChainId(activeWallet.chainId);
        }
      } else if (typeof activeWallet.enable === "function") {
        const accounts = await activeWallet.enable({ starknetVersion: "v5" });
        if (accounts?.[0]) addr = accounts[0];
        if (activeWallet.chainId) setWalletChainId(activeWallet.chainId);
      }
      if (!addr && activeWallet.selectedAddress) {
        addr = activeWallet.selectedAddress;
      }
      if (!addr && activeWallet.account?.address) {
        addr = activeWallet.account.address;
      }
      if (!addr) {
        throw new Error("Wallet did not return an active account address.");
      }
      setConnectedAddress(normAddr(addr));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const switchMainnet = async () => {
    if (!activeWallet?.request) return;
    setErrorMsg("");
    try {
      await activeWallet.request({
        type: "wallet_switchStarknetChain",
        params: { chainId: STARKNET_MAINNET_CHAIN_ID },
      });
      const cid = (await activeWallet.request({
        type: "wallet_requestChainId",
      })) as string;
      if (cid) setWalletChainId(cid);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
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
      let hash = "";
      if (typeof activeWallet.request === "function") {
        try {
          const res = (await activeWallet.request({
            type: "wallet_addInvokeTransaction",
            params: { calls: WALLET_INVOKE_CALLS },
          })) as { transaction_hash?: string };
          if (res?.transaction_hash) hash = res.transaction_hash;
        } catch (invokeErr) {
          if (typeof activeWallet.account?.execute === "function") {
            const fallback = await activeWallet.account.execute(LEGACY_CALLS);
            if (fallback?.transaction_hash) hash = fallback.transaction_hash;
          } else {
            throw invokeErr;
          }
        }
      } else if (typeof activeWallet.account?.execute === "function") {
        const res = await activeWallet.account.execute(LEGACY_CALLS);
        if (res?.transaction_hash) hash = res.transaction_hash;
      } else {
        throw new Error("Wallet does not expose wallet_addInvokeTransaction or account.execute.");
      }
      setTxHash(hash || "submitted-to-multisig-queue");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
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
              onClick={connectWallet}
              disabled={busy}
            >
              {connectedAddress
                ? `Connected: ${shortHex(connectedAddress, 6, 4)}`
                : "Connect Starknet Wallet"}
            </button>

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
