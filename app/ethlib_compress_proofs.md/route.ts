import { COMPRESS_PROOFS } from "../ethlib_audit_report/data";
import { renderMarkdownReport } from "../ethlib_audit_report.md/route";

export async function GET() {
  return renderMarkdownReport("EthLib BLS12-381 G1 Compression Proofs", COMPRESS_PROOFS);
}
