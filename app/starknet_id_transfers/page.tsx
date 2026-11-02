import type { Metadata } from "next";
import TransfersReportClient from "./TransfersReportClient";

export const metadata: Metadata = {
  title: "Starknet ID · Recovery Transfers (183 / 183)",
  description:
    "Summary report and complete verified list of all 183 Starknet ID restitution transfers to their pre-theft owners.",
  alternates: {
    canonical: "https://share.thomas.md/starknet_id_transfers",
  },
  robots: { index: false },
};

export default function StarknetIdTransfersPage() {
  return <TransfersReportClient />;
}
