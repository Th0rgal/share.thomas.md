import { FIELD_PROOFS } from "../ethlib_field_proofs/data";
import { renderMarkdownReport } from "../ethlib_audit_report/data";

export async function GET() {
  return renderMarkdownReport("EthLib BLS Tower Field Proofs", FIELD_PROOFS, 128);
}
