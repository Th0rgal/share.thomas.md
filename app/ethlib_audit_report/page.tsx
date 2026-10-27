import type { Metadata } from "next";
import ReportClient from "./ReportClient";

export const metadata: Metadata = {
  title: "EthLib Formal Proofs & Audit Findings · Thomas Marchand",
  description:
    "Formal proofs and specification fixes across BLS12-381, KZG, XMSS, and CPython bindings, with remaining obligations stated explicitly.",
  alternates: {
    canonical: "https://share.thomas.md/ethlib_audit_report",
  },
  openGraph: {
    title: "EthLib Formal Proofs & Audit Findings",
    description:
      "Formal proofs, audit findings, and remaining proof obligations for ethereum/EthLib.",
    url: "https://share.thomas.md/ethlib_audit_report",
    type: "article",
  },
};

export default function EthLibAuditReportPage() {
  return <ReportClient />;
}
