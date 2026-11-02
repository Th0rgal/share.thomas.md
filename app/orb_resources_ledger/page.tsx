import type { Metadata } from "next";
import { LedgerView } from "./LedgerView";

export const metadata: Metadata = {
  title: "Orb · Resources — Ledger",
  robots: { index: false },
};

export default function Page() {
  return <LedgerView />;
}
