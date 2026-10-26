import { BLS_PROOFS, renderMarkdownReport } from "../ethlib_audit_report/data";

export async function GET() {
  return renderMarkdownReport("EthLib BLS12-381 Complete Proof Suite", BLS_PROOFS, 100);
}
