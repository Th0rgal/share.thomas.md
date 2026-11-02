import type { Metadata } from "next";
import { FlowView } from "./FlowView";

export const metadata: Metadata = {
  title: "Orb · Resources — Flow",
  robots: { index: false },
};

export default function Page() {
  return <FlowView />;
}
