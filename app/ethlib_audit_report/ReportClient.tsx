"use client";

import { useState } from "react";
import { FINDINGS, Finding, Severity } from "./data";

export default function ReportClient() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
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
    <article className="is-posts">
      <h1 className="title-display">ethereum/EthLib Audit Findings</h1>

      <div className="report-subtitle not-prose">
        <a
          href="https://github.com/ethereum/EthLib/tree/57af539e81b8c6f0f54c8b4da3adbc77b122a100"
          target="_blank"
          rel="noopener noreferrer"
        >
          ethereum/EthLib@57af539
        </a>
        {" · "}
        <span>
          PR:{" "}
          <a
            href="https://github.com/ethereum/EthLib/pull/55"
            target="_blank"
            rel="noopener noreferrer"
          >
            ethereum/EthLib#55
          </a>
        </span>
        {" · "}
        <a href="/ethlib_audit_report.md">Raw .md</a>
      </div>

      <div className="toolbar-row not-prose">
        <div className="filter-group">
          <button
            type="button"
            className={`filter-chip ${filterSeverity === "all" ? "is-active" : ""}`}
            onClick={() => setFilterSeverity("all")}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterSeverity === "High" ? "is-active" : ""}`}
            onClick={() => setFilterSeverity("High")}
          >
            High ({counts.High})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterSeverity === "Medium" ? "is-active" : ""}`}
            onClick={() => setFilterSeverity("Medium")}
          >
            Medium ({counts.Medium})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterSeverity === "Low" ? "is-active" : ""}`}
            onClick={() => setFilterSeverity("Low")}
          >
            Low ({counts.Low})
          </button>
        </div>

        <button
          type="button"
          className="toggle-link"
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
              className={`finding-card ${isOpen ? "is-open" : ""}`}
            >
              <button
                type="button"
                className="finding-summary"
                onClick={() => toggleFinding(finding.id)}
                aria-expanded={isOpen}
              >
                <span className="finding-id">{finding.id}</span>
                <span className={`sev-badge sev-${sevLower}`}>
                  {finding.severity}
                </span>
                <span className="finding-title-wrap">
                  <span className="finding-title">{finding.title}</span>
                  <span className="finding-component">{finding.component}</span>
                </span>
                <span className="finding-chevron" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="finding-body">
                  <div className="finding-block">
                    <div className="finding-block-label">Issue</div>
                    <p>{finding.issue}</p>
                    {finding.codeSnippet && (
                      <pre className="code-snippet">
                        <code>{finding.codeSnippet}</code>
                      </pre>
                    )}
                  </div>

                  <div className="finding-block">
                    <div className="finding-block-label">Options</div>
                    <ul className="options-list">
                      {finding.options.map((opt) => (
                        <li key={opt}>{opt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="finding-block">
                    <div className="finding-block-label">Recommendation</div>
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
    </article>
  );
}
