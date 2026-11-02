import type { Metadata } from "next";
import RecoveryClient from "./RecoveryClient";

export const metadata: Metadata = {
  title: "Starknet ID · Atomic Recovery Multicall",
  description:
    "Execute or export the atomic 3-call Starknet ID direct restitution multicall (183 identities + Cairo-0 operator revocation).",
  robots: { index: false },
};

export default function StarknetIdRecoveryPage() {
  return <RecoveryClient />;
}
