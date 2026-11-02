import type { Metadata } from "next";
import { ReservoirsView } from "./ReservoirsView";

export const metadata: Metadata = {
  title: "Orb · Resources — rate over time",
  robots: { index: false },
};

export default function Page() {
  return <ReservoirsView />;
}
