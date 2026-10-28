import type { Metadata } from "next";
import ReportClient from "../ethlib_audit_report/ReportClient";
import { KEYGEN_PROOF } from "./data";

export const metadata: Metadata = {
  title: "EthLib XMSS KeyGen Proof · Thomas Marchand",
  description: "A kernel-checked XMSS KeyGen known answer with passing build and declaration checks in CI.",
  alternates: { canonical: "https://share.thomas.md/ethlib_keygen_proof" },
};

export default function KeyGenProofPage() {
  return <ReportClient title="XMSS KeyGen known answer" items={KEYGEN_PROOF}
    prNumber={127} rawMdHref="/ethlib_keygen_proof.md" activeTab="keygen" />;
}
