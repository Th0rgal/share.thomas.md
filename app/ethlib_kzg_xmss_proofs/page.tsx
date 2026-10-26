import type { Metadata } from "next";
import ReportClient from "../ethlib_audit_report/ReportClient";
import { KZG_XMSS_PROOFS } from "../ethlib_audit_report/data";

export const metadata: Metadata = {
  title: "EthLib KZG & XMSS Proof Suite · Thomas Marchand",
  description:
    "Formal verification of EIP-4844 & EIP-7594 PeerDAS KZG (Polynomials, Core, Cells, Recovery, CeremonyChecks) and XMSS Blake2s in ethereum/EthLib.",
  alternates: {
    canonical: "https://share.thomas.md/ethlib_kzg_xmss_proofs",
  },
  openGraph: {
    title: "EthLib KZG & XMSS Proof Suite",
    description:
      "285+ kernel-checked theorems across KZG Polynomials, Core, Cells, Recovery, CeremonyChecks, and XMSS Blake2s.",
    url: "https://share.thomas.md/ethlib_kzg_xmss_proofs",
    type: "article",
  },
};

export default function EthLibKzgXmssProofsPage() {
  return (
    <ReportClient
      title="EthLib KZG & XMSS Proof Suite"
      subtitle="EIP-4844 & EIP-7594 PeerDAS KZG polynomial evaluation homomorphisms, g1LincombPoints validation, vanishing polynomials, ceremony checks, and XMSS Blake2s KATs."
      items={KZG_XMSS_PROOFS}
      mdPath="/ethlib_kzg_xmss_proofs.md"
    />
  );
}
