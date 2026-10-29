import { G2_SUBGROUP_PROOFS } from "../ethlib_g2_subgroup/data";
import { renderMarkdownReport } from "../ethlib_audit_report/data";

export async function GET() {
  return renderMarkdownReport(
    "EthLib G2, HashToCurve & FK20 Proof Series",
    G2_SUBGROUP_PROOFS,
    148
  );
}
