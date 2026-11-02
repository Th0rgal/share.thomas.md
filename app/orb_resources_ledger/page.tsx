import type { Metadata } from "next";
import { LedgerView } from "./LedgerView";

export const metadata: Metadata = {
  title: "Orb · Resources — split flows and stock",
  robots: { index: false },
};

export default function Page() {
  return <LedgerView />;
}
