import { KEYGEN_PROOF } from "../ethlib_keygen_proof/data";
import { renderMarkdownReport } from "../ethlib_audit_report/data";

export async function GET() {
  return renderMarkdownReport("EthLib XMSS KeyGen Known Answer", KEYGEN_PROOF, 127);
}
