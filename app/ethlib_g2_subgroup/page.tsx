import type { Metadata } from "next";
import ReportClient from "../ethlib_audit_report/ReportClient";
import { G2_SUBGROUP_PROOFS } from "./data";

export const metadata: Metadata = {
  title: "EthLib G2, HashToCurve & FK20 Proofs · Thomas Marchand",
  description:
    "Focused Lean v4.35.0 proof series (#142, #143, #144, #145, #148) covering G2 group law, 96-byte serialization, FK20 cell proofs, SSWU 3-isogeny hash-to-curve, and cofactor subgroup landing.",
  alternates: { canonical: "https://share.thomas.md/ethlib_g2_subgroup" },
};

export default function G2SubgroupProofPage() {
  return (
    <ReportClient
      title="G2, HashToCurve & FK20 proof series"
      items={G2_SUBGROUP_PROOFS}
      prNumber={148}
      rawMdHref="/ethlib_g2_subgroup.md"
      activeTab="g2subgroup"
    />
  );
}
