import { KZG_XMSS_PROOFS } from "../ethlib_audit_report/data";
import { renderMarkdownReport } from "../ethlib_audit_report.md/route";

export async function GET() {
  return renderMarkdownReport("EthLib KZG & XMSS Proof Suite", KZG_XMSS_PROOFS);
}
