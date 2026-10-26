import type { Metadata } from "next";
import ReportClient from "./ReportClient";

export const metadata: Metadata = {
  title: "Formal Audit & Quorum Review of ethereum/EthLib · Thomas Marchand",
  description:
    "Quorum-verified formal audit of ethereum/EthLib across SSZ, RLP, EIP-4844/7594 KZG, BLS12-381, and Keccak-256, with interactive findings and Lean 4 remediation proofs.",
  alternates: {
    canonical: "https://share.thomas.md/ethlib_audit_report",
  },
  openGraph: {
    title: "Formal Audit & Quorum Review of ethereum/EthLib",
    description:
      "14 quorum-verified findings across executable semantics, proof faithfulness, and theorem coverage in ethereum/EthLib.",
    url: "https://share.thomas.md/ethlib_audit_report",
    type: "article",
  },
};

export default function EthLibAuditReportPage() {
  return <ReportClient />;
}
