"use client";

import { useMemo, useState } from "react";
import "../starknet_id_recovery/recovery.css";
import {
  DRAINER_ADDRESS,
  IDENTITY_CONTRACT,
  ORIGINAL_CLASS_HASH,
  RECOVERY_TRANSFERS,
  REVOKED_OPERATORS,
  TEMPORARY_CLASS_HASH,
} from "../starknet_id_recovery/payload";

function shortHex(hex: string, head = 8, tail = 6): string {
  if (!hex || hex.length <= head + tail + 2) return hex;
  return `${hex.slice(0, head + 2)}…${hex.slice(-tail)}`;
}

export default function TransfersReportClient() {
  const [query, setQuery] = useState<string>("");

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
      <h1 className="title-display">Starknet ID · Recovery Transfers (183 / 183)</h1>
      <div className="report-subtitle">
        Starknet Mainnet · Identity{" "}
        <a
          href={`https://voyager.online/contract/${IDENTITY_CONTRACT}`}
          target="_blank"
          rel="noreferrer"
        >
          {shortHex(IDENTITY_CONTRACT, 6, 4)}
        </a>{" "}
        · Markdown export:{" "}
        <a href="/starknet_id_transfers.md">/starknet_id_transfers.md</a>
      </div>

      <p>
        Between blocks <code>17290492</code> and <code>17292870</code> (118 transactions),{" "}
        <strong>183</strong> Starknet IDs were drained into{" "}
        <a
          href={`https://voyager.online/contract/${DRAINER_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          title={DRAINER_ADDRESS}
        >
          <code>{shortHex(DRAINER_ADDRESS, 8, 6)}</code>
        </a>{" "}
        through legacy Cairo-0 marketplace operator approvals whose{" "}
        <code>isValidSignature</code> path lacked the <code>VALID</code> magic check. Zero
        identities left the drainer address (<code>balance_of == 183</code>).
      </p>

      <p>
        Restitution executes as a single atomic 3-call transaction from the Starknet ID admin
        multisig: temporarily upgrade <code>Identity</code> to{" "}
        <code>{shortHex(TEMPORARY_CLASS_HASH, 8, 6)}</code>, transfer all <strong>183</strong>{" "}
        token IDs directly back to their verified pre-theft owners while clearing{" "}
        <code>operator_approvals</code> for {REVOKED_OPERATORS.length} legacy Cairo-0 marketplace
        operators across those 183 accounts, and immediately restore canonical class{" "}
        <code>{shortHex(ORIGINAL_CLASS_HASH, 8, 6)}</code> in the same transaction.
      </p>

      <div className="not-prose">
        <div className="toolbar-row" style={{ marginTop: "1.75rem" }}>
          <div>
            <strong style={{ fontSize: "0.95rem" }}>
              Complete List of Transfers ({filteredTransfers.length} / {RECOVERY_TRANSFERS.length})
            </strong>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
              Every transfer moves <code>token_id</code> from{" "}
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
