import type { Finding } from "../ethlib_audit_report/data";

export const FIELD_PROOFS: Finding[] = [
  {
    id: "T1",
    severity: "Proof",
    component: "EthLib/Cryptography/Proofs/Bls/Fp2.lean, Fp6.lean, Fp12.lean",
    title: "The three tower fields have unconditional Field instances",
    issue: "The concrete Fp2, Fp6 and Fp12 operations satisfy the field laws. In particular, each norm is zero exactly at zero, so every nonzero element has a multiplicative inverse. These are proved facts about the existing operations, not extra assumptions.",
    codeLang: "lean",
    codeSnippet: "theorem Fp2.norm_eq_zero_iff (a : Fp2) :\n    Fp2.norm a = 0 ↔ a = 0\n\ntheorem Fp6.norm_eq_zero_iff (a : Fp6) :\n    Fp6.norm a = 0 ↔ a = 0\n\ntheorem Fp12.norm_eq_zero_iff (a : Fp12) :\n    Fp12.norm a = 0 ↔ a = 0",
    options: [
      "Addition and multiplication satisfy the commutative ring laws at each tower level.",
      "Norm non-vanishing proves inverse cancellation and supports the three Field instances."
    ],
    recommendation: "Merged in PR #128 (commit 43805a1): full CI build and declaration checker passed, and an exhaustive transitive audit of 371 declarations in the field proof modules found only propext, Classical.choice and Quot.sound. This is the field foundation extracted from #100; it does not certify pairing or KZG."
  },
  {
    id: "T2",
    severity: "Proof",
    component: "EthLib/Cryptography/Bls/Fp2.lean, Fp12.lean",
    title: "Field exponentiation terminates and agrees with natural powers",
    issue: "Fp2.powNat and Fp12.powNat keep their square-and-multiply algorithm but now have termination proofs, allowing the kernel to unfold them.",
    codeLang: "lean",
    codeSnippet: "theorem Fp2.powNat_eq_pow (a : Fp2) (e : Nat) :\n    Fp2.powNat a e = a ^ e\n\ntheorem Fp12.powNat_eq_pow (a : Fp12) (e : Nat) :\n    Fp12.powNat a e = a ^ e",
    options: [
      "Every recursive call halves a nonzero exponent, which proves termination.",
      "The executable functions agree with the natural-power operations of the proved field instances."
    ],
    recommendation: "The two obsolete partial-definition exceptions are removed from the checker baseline. The same full build and axiom audit cover these changes. Miller-loop changes remain in #100."
  }
];
