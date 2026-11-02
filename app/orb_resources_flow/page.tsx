import type { Metadata } from "next";
import { FlowView } from "./FlowView";

export const metadata: Metadata = {
  title: "Orb · Resources — one flow at a time",
  robots: { index: false },
};

export default function Page() {
  return <FlowView />;
}
