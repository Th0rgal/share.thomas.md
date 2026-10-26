import { FINDINGS, renderMarkdownReport } from "../ethlib_audit_report/data";

export async function GET() {
  return renderMarkdownReport("EthLib Formal Proofs & Audit Findings", FINDINGS, 55);
}
