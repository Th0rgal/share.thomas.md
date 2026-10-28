import { CELL_ROUNDTRIP } from "../ethlib_cell_roundtrip/data";
import { renderMarkdownReport } from "../ethlib_audit_report/data";

export async function GET() {
  return renderMarkdownReport("EthLib KZG Cell Round-Trip", CELL_ROUNDTRIP, 126);
}
