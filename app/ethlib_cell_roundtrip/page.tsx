import type { Metadata } from "next";
import ReportClient from "../ethlib_audit_report/ReportClient";
import { CELL_ROUNDTRIP } from "./data";

export const metadata: Metadata = {
  title: "EthLib KZG Cell Round-Trip · Thomas Marchand",
  description: "A kernel-checked proof that KZG cell serialization preserves all 64 field elements.",
  alternates: { canonical: "https://share.thomas.md/ethlib_cell_roundtrip" },
};

export default function CellRoundTripPage() {
  return <ReportClient title="KZG cell round-trip" items={CELL_ROUNDTRIP}
    prNumber={126} rawMdHref="/ethlib_cell_roundtrip.md" activeTab="cells" />;
}
