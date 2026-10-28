import type { Metadata } from "next";
import ReportClient from "../ethlib_audit_report/ReportClient";
import { FIELD_PROOFS } from "./data";

export const metadata: Metadata = {
  title: "EthLib BLS Tower Fields · Thomas Marchand",
  description: "Unconditional field instances and total exponentiation for the concrete BLS tower operations.",
  alternates: { canonical: "https://share.thomas.md/ethlib_field_proofs" },
};

export default function FieldProofPage() {
  return <ReportClient title="BLS tower field proofs" items={FIELD_PROOFS}
    prNumber={128} rawMdHref="/ethlib_field_proofs.md" activeTab="fields" />;
}
