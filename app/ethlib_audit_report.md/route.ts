import { FINDINGS, type Finding } from "../ethlib_audit_report/data";

export function renderMarkdownReport(title: string, items: Finding[]): Response {
  const lines: string[] = [
    `# ${title}`,
    "",
    "- **Repository**: https://github.com/ethereum/EthLib",
    "",
  ];

  for (const f of items) {
    lines.push(`## ${f.id} [${f.severity}]: ${f.title}`);
    lines.push(`- **Component**: \`${f.component}\``);
    lines.push("");
    lines.push(f.severity === "Proof" ? "### Specification & Scope" : "### Issue");
    lines.push(f.issue);
    lines.push("");
    if (f.codeSnippet) {
      lines.push("```lean");
      lines.push(f.codeSnippet);
      lines.push("```");
      lines.push("");
    }
    lines.push(f.severity === "Proof" ? "### Theorems Proved" : "### Options");
    for (const opt of f.options) {
      lines.push(`- ${opt}`);
    }
    lines.push("");
    lines.push(f.severity === "Proof" ? "### Verification Status" : "### Resolution");
    lines.push(f.recommendation);
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

export async function GET() {
  return renderMarkdownReport("EthLib Formal Proofs & Audit Findings", FINDINGS);
}
