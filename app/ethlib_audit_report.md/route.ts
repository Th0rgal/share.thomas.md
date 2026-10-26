import { FINDINGS } from "../ethlib_audit_report/data";

export async function GET() {
  const lines: string[] = [
    "# ethereum/EthLib Audit Findings",
    "",
    "- **Target**: https://github.com/ethereum/EthLib/tree/57af539e81b8c6f0f54c8b4da3adbc77b122a100",
    "- **PR**: https://github.com/ethereum/EthLib/pull/55",
    "",
  ];

  for (const f of FINDINGS) {
    lines.push(`## ${f.id} [${f.severity}]: ${f.title}`);
    lines.push(`- **Component**: \`${f.component}\``);
    lines.push("");
    lines.push("### Issue");
    lines.push(f.issue);
    lines.push("");
    if (f.codeSnippet) {
      lines.push("```lean");
      lines.push(f.codeSnippet);
      lines.push("```");
      lines.push("");
    }
    lines.push("### Options");
    for (const opt of f.options) {
      lines.push(`- ${opt}`);
    }
    lines.push("");
    lines.push("### Recommendation");
    lines.push(f.recommendation);
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
