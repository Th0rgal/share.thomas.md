"use client";

import { useState } from "react";
import { FINDINGS, PROOF_COVERAGE, Finding, Severity } from "./data";

export default function ReportClient() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    F1: true,
    F2: true,
  });
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");

  const toggleFinding = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const f of FINDINGS) {
      next[f.id] = true;
    }
    setOpenIds(next);
  };

  const collapseAll = () => {
    setOpenIds({});
  };

  const filteredFindings =
    filterSeverity === "all"
      ? FINDINGS
      : FINDINGS.filter((f) => f.severity === filterSeverity);

  const allExpanded =
    filteredFindings.length > 0 &&
    filteredFindings.every((f) => Boolean(openIds[f.id]));

  const counts = {
    all: FINDINGS.length,
    High: FINDINGS.filter((f) => f.severity === "High").length,
    Medium: FINDINGS.filter((f) => f.severity === "Medium").length,
    Low: FINDINGS.filter((f) => f.severity === "Low").length,
  };

  return (
    <article>
      <h1>Formal Audit &amp; Quorum Review of ethereum/EthLib</h1>

      <div className="report-meta">
        <span>October 2026</span>
        <span>·</span>
        <span>
          Target:{" "}
          <a
            href="https://github.com/ethereum/EthLib/tree/57af539e81b8c6f0f54c8b4da3adbc77b122a100"
            target="_blank"
            rel="noopener noreferrer"
          >
            ethereum/EthLib@57af539
          </a>
        </span>
        <span>·</span>
        <span>Quorum: Claude Fable 5.1, GPT-6 Astra, Argon</span>
        <span>·</span>
        <span>
          Remediation PR:{" "}
          <a
            href="https://github.com/ethereum/EthLib/pull/55"
            target="_blank"
            rel="noopener noreferrer"
          >
            ethereum/EthLib#55
          </a>
        </span>
      </div>

      <p>
        I allocated some compute to review{" "}
        <a
          href="https://github.com/ethereum/EthLib"
          target="_blank"
          rel="noopener noreferrer"
        >
          ethereum/EthLib
        </a>
        , an executable Lean 4 specification and formal verification library for
        Ethereum primitives (SSZ, RLP, EIP-4844 &amp; EIP-7594 PeerDAS KZG,
        BLS12-381, and Keccak-256). We did not review every single line of
        upstream specs, but we ran a multi-round formal audit across the
        codebase and proof suite until our quorum of models (Claude Fable 5.1,
        GPT-6 Astra, and Argon) converged and found no remaining issues.
      </p>

      <p>
        The codebase is remarkably clean. It compiles against Lean{" "}
        <code>v4.28.0</code> and Mathlib with zero <code>sorry</code>, zero{" "}
        <code>axiom</code>, and zero <code>unsafe</code> blocks across{" "}
        <code>EthLib/</code> and <code>Proofs/</code>. At the same time, our
        review uncovered 14 concrete findings across executable semantics, proof
        faithfulness, and theorem coverage. Every finding below can be expanded
        to read the context, what seems to be the issue, the options we
        considered, and our quorum recommendation.
      </p>

      <div className="summary-grid">
        <div className="summary-stat">
          <div className="stat-label">Total Findings</div>
          <div className="stat-value">14</div>
          <div className="stat-note">Quorum-verified across 3 rounds</div>
        </div>
        <div className="summary-stat">
          <div className="stat-label">High Severity</div>
          <div className="stat-value">4</div>
          <div className="stat-note">F1, F2, F3, F4 (spec &amp; soundness)</div>
        </div>
        <div className="summary-stat">
          <div className="stat-label">Medium Severity</div>
          <div className="stat-value">6</div>
          <div className="stat-note">F5, F6, F7, F8, F9, F10</div>
        </div>
        <div className="summary-stat">
          <div className="stat-label">Low / Info</div>
          <div className="stat-value">4</div>
          <div className="stat-note">F11, F12, F13, F14</div>
        </div>
      </div>

      <h2>Quorum-Verified Findings</h2>

      <p>
        Click on any finding below to expand the full analysis, minimal Lean 4
        reproducer, remediation options, and quorum recommendation.
      </p>

      <div className="findings-toolbar">
        <div className="findings-filter-group">
          <button
            type="button"
            className={`toolbar-btn ${filterSeverity === "all" ? "active" : ""}`}
            onClick={() => setFilterSeverity("all")}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            className={`toolbar-btn ${filterSeverity === "High" ? "active" : ""}`}
            onClick={() => setFilterSeverity("High")}
          >
            High ({counts.High})
          </button>
          <button
            type="button"
            className={`toolbar-btn ${filterSeverity === "Medium" ? "active" : ""}`}
            onClick={() => setFilterSeverity("Medium")}
          >
            Medium ({counts.Medium})
          </button>
          <button
            type="button"
            className={`toolbar-btn ${filterSeverity === "Low" ? "active" : ""}`}
            onClick={() => setFilterSeverity("Low")}
          >
            Low ({counts.Low})
          </button>
        </div>

        <button
          type="button"
          className="toolbar-btn"
          onClick={allExpanded ? collapseAll : expandAll}
        >
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="findings-list">
        {filteredFindings.map((finding: Finding) => {
          const isOpen = Boolean(openIds[finding.id]);
          const sevLower = finding.severity.toLowerCase();
          return (
            <div
              key={finding.id}
              className="finding-card"
              data-open={isOpen ? "true" : "false"}
            >
              <button
                type="button"
                className="finding-summary"
                onClick={() => toggleFinding(finding.id)}
                aria-expanded={isOpen}
              >
                <span className="finding-id">{finding.id}</span>
                <span className={`severity-badge severity-${sevLower}`}>
                  {finding.severity}
                </span>
                <div className="finding-title-wrap">
                  <p className="finding-title">{finding.title}</p>
                  <div className="finding-subtitle">
                    <span className="finding-file">{finding.component}</span>
                  </div>
                </div>
                <span className="finding-chevron" aria-hidden="true">
                  ›
                </span>
              </button>

              {isOpen && (
                <div className="finding-details">
                  <div className="detail-section">
                    <div className="detail-heading">Context</div>
                    <p>{finding.context}</p>
                  </div>

                  <div className="detail-section">
                    <div className="detail-heading">
                      What seems to be the issue
                    </div>
                    <p>{finding.issue}</p>
                    {finding.codeSnippet && (
                      <pre>
                        <code>{finding.codeSnippet}</code>
                      </pre>
                    )}
                  </div>

                  <div className="detail-section">
                    <div className="detail-heading">
                      Possible options to fix it
                    </div>
                    <div className="options-list">
                      {finding.options.map((opt) => (
                        <div key={opt} className="option-item">
                          <p>{opt}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-heading">
                      Quorum Recommendation (Fable 5.1 · Astra · Argon)
                    </div>
                    <div className="recommendation-box">
                      <p>{finding.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2>Subsystem Proof Coverage Matrix</h2>

      <p>
        Part of finding F10 is that different subsystems in EthLib currently sit
        at very different stages of formal verification. The table below
        summarizes the proof status of each module at commit{" "}
        <code>57af539</code> and after our remediation pull request.
      </p>

      <table>
        <thead>
          <tr>
            <th>Subsystem</th>
            <th>Module</th>
            <th>Status</th>
            <th>Notes &amp; PR Additions</th>
          </tr>
        </thead>
        <tbody>
          {PROOF_COVERAGE.map((row) => (
            <tr key={row.subsystem}>
              <td>
                <strong>{row.subsystem}</strong>
              </td>
              <td>
                <code>{row.module}</code>
              </td>
              <td>{row.status}</td>
              <td>{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Methodology &amp; Note</h2>

      <p>
        We ran this review by combining Lean 4 type-checking and counterexample
        search with an adversarial quorum of three independent frontier models
        (Claude Fable 5.1, GPT-6 Astra, and Argon), cross-checking against the
        Ethereum Execution Layer specs, Consensus Layer specs (Deneb and Fulu),
        and parallel formal verification efforts.
      </p>

      <p>
        If the team would like help reviewing additional specifications or
        speeding up the Lean 4 proving process across the remaining subsystems,
        feel free to reach out at{" "}
        <a href="https://thomas.md" target="_blank" rel="noopener noreferrer">
          thomas.md
        </a>
        .
      </p>
    </article>
  );
}
