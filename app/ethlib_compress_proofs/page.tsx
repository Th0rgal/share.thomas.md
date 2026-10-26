import type { Metadata } from "next";
import ReportClient from "../ethlib_audit_report/ReportClient";
import { COMPRESS_PROOFS } from "../ethlib_audit_report/data";

export const metadata: Metadata = {
  title: "EthLib BLS12-381 G1 Compression Proofs · Thomas Marchand",
  description:
    "Kernel-verified BLS12-381 G1 compression & decompression proof suite (0 bv_decide, converse canonical round-trip theorems) for ethereum/EthLib.",
  alternates: {
    canonical: "https://share.thomas.md/ethlib_compress_proofs",
  },
  openGraph: {
    title: "EthLib BLS12-381 G1 Compression Proofs",
    description:
      "Eliminating all 8 bv_decide uses in Proofs/Bls/Compress.lean and proving converse canonical compression round-trips.",
    url: "https://share.thomas.md/ethlib_compress_proofs",
    type: "article",
  },
};

export default function EthLibCompressProofsPage() {
  return (
    <ReportClient
      title="EthLib BLS12-381 G1 Compression Proofs"
      items={COMPRESS_PROOFS}
      prNumber={99}
      rawMdHref="/ethlib_compress_proofs.md"
      activeTab="compress"
    />
  );
}
