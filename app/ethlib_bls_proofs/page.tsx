import type { Metadata } from "next";
import ReportClient from "../ethlib_audit_report/ReportClient";
import { BLS_PROOFS } from "../ethlib_audit_report/data";

export const metadata: Metadata = {
  title: "EthLib BLS12-381 Complete Proof Suite · Thomas Marchand",
  description:
    "Formal verification of the BLS12-381 cryptographic stack (Fp2/Fp6/Fp12 tower fields, G2 96-byte serialization, Pairing, SHA-256, HashToCurve, Signatures) in ethereum/EthLib.",
  alternates: {
    canonical: "https://share.thomas.md/ethlib_bls_proofs",
  },
  openGraph: {
    title: "EthLib BLS12-381 Complete Proof Suite",
    description:
      "500+ kernel-checked theorems across Fp2, Fp6, Fp12, G2, Pairing, Sha256, HashToCurve, and Signatures.",
    url: "https://share.thomas.md/ethlib_bls_proofs",
    type: "article",
  },
};

export default function EthLibBlsProofsPage() {
  return (
    <ReportClient
      title="EthLib BLS12-381 Complete Proof Suite"
      items={BLS_PROOFS}
      prNumber={100}
      rawMdHref="/ethlib_bls_proofs.md"
      activeTab="bls"
    />
  );
}
