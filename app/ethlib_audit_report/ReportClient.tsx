"use client";

import React, { useState } from "react";
import katex from "katex";
import { FINDINGS, Finding, Severity } from "./data";

function renderFormattedText(text: string): React.ReactNode[] {
  const tokenRegex = /(\$[^$]+\$|`[^`]+`)/g;
  const parts = text.split(tokenRegex);
  return parts.map((part, idx) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const math = part.slice(1, -1);
      const html = katex.renderToString(math, {
        throwOnError: false,
        displayMode: false,
      });
      return (
        <span
          key={idx}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={idx}>{part.slice(1, -1)}</code>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

const LEAN_KEYWORDS = new Set([
  "def",
  "partial",
  "theorem",
  "private",
  "protected",
  "let",
  "in",
  "do",
  "if",
  "then",
  "else",
  "for",
  "match",
  "with",
  "by",
  "return",
  "throw",
  "fun",
  "where",
  "structure",
  "inductive",
  "instance",
  "native_decide",
  "decide",
  "termination_by",
  "decreasing_by",
  "revert",
]);

const C_KEYWORDS = new Set([
  "extern",
  "for",
  "if",
  "else",
  "return",
  "const",
  "void",
  "char",
  "int",
  "uint8_t",
  "uint64_t",
  "size_t",
  "LEAN_EXPORT",
]);

const PY_KEYWORDS = new Set([
  "import",
  "from",
  "def",
  "return",
  "if",
  "else",
  "for",
  "in",
]);

function highlightLine(
  line: string,
  lang: "lean" | "c" | "python" | "sh" = "lean"
): React.ReactNode[] {
  let codePart = line;
  let commentPart = "";

  if (lang === "lean") {
    const idx = line.indexOf("--");
    if (idx !== -1) {
      codePart = line.slice(0, idx);
      commentPart = line.slice(idx);
    }
  } else if (lang === "python" || lang === "sh") {
    const idx = line.indexOf("#");
    if (idx !== -1) {
      codePart = line.slice(0, idx);
      commentPart = line.slice(idx);
    }
  } else if (lang === "c") {
    const idx = line.indexOf("//");
    if (idx !== -1) {
      codePart = line.slice(0, idx);
      commentPart = line.slice(idx);
    }
  }

  const tokenPattern =
    /(\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|#[a-zA-Z_]\w*|\b\d+\b|\b[A-Za-z_][A-Za-z0-9_']*\b|:=|==|≤|!=|->|\+\+|\.[a-zA-Z_]\w*)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(codePart)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(codePart.slice(lastIndex, match.index));
    }
    const tok = match[0];
    const key = `${match.index}-${tok}`;

    if (tok.startsWith("/*")) {
      nodes.push(
        <span key={key} className="tok-cmt">
          {tok}
        </span>
      );
    } else if (tok.startsWith('"')) {
      nodes.push(
        <span key={key} className="tok-str">
          {tok}
        </span>
      );
    } else if (tok.startsWith("#")) {
      nodes.push(
        <span key={key} className="tok-cmd">
          {tok}
        </span>
      );
    } else if (/^\d+$/.test(tok)) {
      nodes.push(
        <span key={key} className="tok-num">
          {tok}
        </span>
      );
    } else if (/^(:=|==|≤|!=|->|\+\+)$/.test(tok)) {
      nodes.push(
        <span key={key} className="tok-op">
          {tok}
        </span>
      );
    } else if (tok.startsWith(".")) {
      nodes.push(
        <span key={key} className="tok-fn">
          {tok}
        </span>
      );
    } else if (
      (lang === "lean" && LEAN_KEYWORDS.has(tok)) ||
      (lang === "c" && C_KEYWORDS.has(tok)) ||
      (lang === "python" && PY_KEYWORDS.has(tok))
    ) {
      nodes.push(
        <span key={key} className="tok-kw">
          {tok}
        </span>
      );
    } else if (tok === "true" || tok === "false" || tok === "panic!") {
      nodes.push(
        <span key={key} className="tok-cmd">
          {tok}
        </span>
      );
    } else if (/^[A-Z]/.test(tok) || tok === "lean_object") {
      nodes.push(
        <span key={key} className="tok-type">
          {tok}
        </span>
      );
    } else {
      nodes.push(tok);
    }

    lastIndex = tokenPattern.lastIndex;
  }

  if (lastIndex < codePart.length) {
    nodes.push(codePart.slice(lastIndex));
  }

  if (commentPart) {
    nodes.push(
      <span key="cmt" className="tok-cmt">
        {commentPart}
      </span>
    );
  }

  return nodes;
}

function renderCodeBlock(
  snippet: string,
  lang: "lean" | "c" | "python" | "sh" = "lean"
) {
  const langLabel =
    lang === "lean"
      ? "Lean 4"
      : lang === "c"
        ? "C"
        : lang === "python"
          ? "Python"
          : "Shell";
  const lines = snippet.split("\n");
  return (
    <div className="code-block-wrap">
      <div className="code-block-header">
        <span>{langLabel}</span>
      </div>
      <pre className="code-snippet">
        <code>
          {lines.map((line, i) => (
            <React.Fragment key={i}>
              {highlightLine(line, lang)}
              {i < lines.length - 1 ? "\n" : null}
            </React.Fragment>
          ))}
        </code>
      </pre>
    </div>
  );
}

export interface ReportClientProps {
  title?: string;
  items?: Finding[];
  prNumber?: number;
  rawMdHref?: string;
  activeTab?: "all" | "compress" | "bls" | "kzg" | "cells";
}

export default function ReportClient({
  title = "ethereum/EthLib Audit & Proofs",
  items = FINDINGS,
  prNumber = 55,
  rawMdHref = "/ethlib_audit_report.md",
  activeTab = "all",
}: ReportClientProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");

  const toggleFinding = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const f of items) {
      next[f.id] = true;
    }
    setOpenIds(next);
  };

  const collapseAll = () => {
    setOpenIds({});
  };

  const filteredFindings =
    filterSeverity === "all"
      ? items
      : items.filter((f) => f.severity === filterSeverity);

  const allExpanded =
    filteredFindings.length > 0 &&
    filteredFindings.every((f) => Boolean(openIds[f.id]));

  const counts = {
    all: items.length,
    Proof: items.filter((f) => f.severity === "Proof").length,
    High: items.filter((f) => f.severity === "High").length,
    Medium: items.filter((f) => f.severity === "Medium").length,
    Low: items.filter((f) => f.severity === "Low").length,
  };

  return (
    <article className="is-posts">
      <h1 className="title-display">{title}</h1>

      <div className="report-subtitle not-prose">
        <a
          href="https://github.com/ethereum/EthLib"
          target="_blank"
          rel="noopener noreferrer"
        >
          ethereum/EthLib
        </a>
        {" · "}
        <span>
          PR:{" "}
          <a
            href={`https://github.com/ethereum/EthLib/pull/${prNumber}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            ethereum/EthLib#{prNumber}
          </a>
        </span>
        {" · "}
        <a href={rawMdHref}>Raw .md</a>
      </div>

      <nav className="report-tabs not-prose" aria-label="PR Reports">
        <a
          href="/ethlib_audit_report"
          className={`report-tab ${activeTab === "all" ? "is-active" : ""}`}
        >
          Overview &amp; Spec Fixes (#55)
        </a>
        <a
          href="/ethlib_compress_proofs"
          className={`report-tab ${activeTab === "compress" ? "is-active" : ""}`}
        >
          G1 Compress Proofs (#99)
        </a>
        <a
          href="/ethlib_bls_proofs"
          className={`report-tab ${activeTab === "bls" ? "is-active" : ""}`}
        >
          BLS Tower &amp; Signatures (#100)
        </a>
        <a
          href="/ethlib_kzg_xmss_proofs"
          className={`report-tab ${activeTab === "kzg" ? "is-active" : ""}`}
        >
          KZG &amp; PeerDAS Proofs (#101)
        </a>
        <a href="/ethlib_cell_roundtrip"
          className={`report-tab ${activeTab === "cells" ? "is-active" : ""}`}>
          Cell Round-Trip (#126)
        </a>
      </nav>

      <div className="toolbar-row not-prose">
        <div className="filter-group">
          <button
            type="button"
            className={`filter-chip ${filterSeverity === "all" ? "is-active" : ""}`}
            onClick={() => setFilterSeverity("all")}
          >
            All ({counts.all})
          </button>
          {counts.Proof > 0 && (
            <button
              type="button"
              className={`filter-chip ${filterSeverity === "Proof" ? "is-active" : ""}`}
              onClick={() => setFilterSeverity("Proof")}
            >
              Proofs ({counts.Proof})
            </button>
          )}
          {counts.High > 0 && (
            <button
              type="button"
              className={`filter-chip ${filterSeverity === "High" ? "is-active" : ""}`}
              onClick={() => setFilterSeverity("High")}
            >
              High ({counts.High})
            </button>
          )}
          {counts.Medium > 0 && (
            <button
              type="button"
              className={`filter-chip ${filterSeverity === "Medium" ? "is-active" : ""}`}
              onClick={() => setFilterSeverity("Medium")}
            >
              Medium ({counts.Medium})
            </button>
          )}
          {counts.Low > 0 && (
            <button
              type="button"
              className={`filter-chip ${filterSeverity === "Low" ? "is-active" : ""}`}
              onClick={() => setFilterSeverity("Low")}
            >
              Low ({counts.Low})
            </button>
          )}
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
          const isProof = finding.severity === "Proof";
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
                  <span className="finding-title">
                    {renderFormattedText(finding.title)}
                  </span>
                  <span className="finding-component">{finding.component}</span>
                </span>
                <span className="finding-chevron" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="finding-body">
                  <div className="finding-block">
                    <div className="finding-block-label">
                      {isProof ? "Specification & Scope" : "Issue"}
                    </div>
                    <p>{renderFormattedText(finding.issue)}</p>
                    {finding.codeSnippet &&
                      renderCodeBlock(finding.codeSnippet, finding.codeLang)}
                  </div>

                  <div className="finding-block">
                    <div className="finding-block-label">
                      {isProof ? "Theorems Proved" : "Options"}
                    </div>
                    <ul className="options-list">
                      {finding.options.map((opt) => (
                        <li key={opt}>{renderFormattedText(opt)}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="finding-block">
                    <div className="finding-block-label">
                      {isProof ? "Verification Status" : "Recommendation"}
                    </div>
                    <div className="recommendation-box">
                      <p>{renderFormattedText(finding.recommendation)}</p>
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
