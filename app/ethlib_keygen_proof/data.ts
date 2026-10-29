import type { Finding } from "../ethlib_audit_report/data";

export const KEYGEN_PROOF: Finding[] = [
  {
    id: "K1",
    severity: "Proof",
    component: "EthLib/Cryptography/Proofs/Xmss/KeyGen.lean",
    title: "XMSS KeyGen known answer — #127",
    issue: "The existing seed (bytes 0 through 31) generates the existing reference public key for epochs 6 through 8. The theorem, seed, expected output and executable code are unchanged. This replaces native evaluation with a kernel-checked proof of that concrete example.",
    codeLang: "lean",
    codeSnippet: "theorem keyGen_known_answer :\n    (keyGen exampleSeed 6 8).toOption.map Prod.snd =\n      some examplePublicKey",
    options: [
      "The seed-derived chains, leaf hashes and Merkle authentication path reconstruct the reference root. Intermediate hash states are checked by the kernel.",
      "The actual keyGen wrapper returns the reference public key, without assuming the Sign known answer."
    ],
    recommendation: "Merged in PR #127 (commit c248b8a): GitHub CI passed the full build and declaration check, and a transitive audit of 2,067 KeyGen declarations found only propext, Classical.choice and Quot.sound. Sign and general XMSS correctness are covered separately."
  }
];
