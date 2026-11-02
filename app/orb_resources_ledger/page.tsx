import type { Metadata } from "next";
import { LedgerView } from "./LedgerView";

export const metadata: Metadata = {
  title: "Orb · Resources — Constellation",
  robots: { index: false },
};

export default function Page() {
  return <LedgerView />;
}
