import type { Metadata } from "next";
import ReportClient from "./ReportClient";

export const metadata: Metadata = {
  title: "EthLib Formal Proofs & Audit Findings · Thomas Marchand",
  description:
    "Quorum-verified formal proof suite (800+ theorems, 0 sorry, 0 bv_decide) and spec remediation across BLS12-381, EIP-4844/7594 KZG, XMSS, and CPython FFI in ethereum/EthLib.",
  alternates: {
    canonical: "https://share.thomas.md/ethlib_audit_report",
  },
  openGraph: {
    title: "EthLib Formal Proofs & Audit Findings",
    description:
      "Complete formal proof suite and quorum-verified audit findings for ethereum/EthLib.",
    url: "https://share.thomas.md/ethlib_audit_report",
    type: "article",
  },
};

export default function EthLibAuditReportPage() {
  return <ReportClient />;
}
