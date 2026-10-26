import { COMPRESS_PROOFS, renderMarkdownReport } from "../ethlib_audit_report/data";

export async function GET() {
  return renderMarkdownReport("EthLib BLS12-381 G1 Compression Proofs", COMPRESS_PROOFS, 99);
}
