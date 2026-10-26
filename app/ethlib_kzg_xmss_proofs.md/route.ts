import { KZG_XMSS_PROOFS, renderMarkdownReport } from "../ethlib_audit_report/data";

export async function GET() {
  return renderMarkdownReport("EthLib KZG & XMSS Proof Suite", KZG_XMSS_PROOFS, 101);
}
