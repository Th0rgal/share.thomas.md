export type Severity = 'High' | 'Medium' | 'Low' | 'Proof'

export interface Finding {
  id: string
  severity: Severity
  component: string
  title: string
  issue: string
  codeSnippet?: string
  codeLang?: 'lean' | 'c' | 'python' | 'sh'
  options: string[]
  recommendation: string
}

export const COMPRESS_PROOFS: Finding[] = [
  {
    id: 'P1',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Compress.lean',
    title: 'Eliminate all 8 `bv_decide` SAT-solver axioms in `G1` flag-bit and byte round-trips',
    issue:
      '`#print axioms EthLib.Cryptography.Bls.G1.uncompress_compress` previously listed 8 `bv_decide` native axioms (`Bls.G1.uncompress_compress._native.bv_decide.ax_1_*`) and 1 `native_decide` axiom (`uncompress_infinityBytes`), meaning `G1.uncompress_compress` trusted external SAT/compiled evaluation rather than the Lean 4 kernel.',
    codeLang: 'lean',
    codeSnippet: `private theorem head_mask_clear (b : UInt8) (hb : b.toNat < 0x20) (s : Bool) :
    ((if s then (b ||| 0x80) ||| 0x20 else b ||| 0x80) &&& 0x1f) = b := by
  revert s
  revert hb
   revert b
  decide`,
    options: [
      '`head_compressed_set`, `head_infinity_clear`, `head_sign_true`, `head_sign_false`, and `head_mask_clear` proved over bounded `UInt8` domain (`b.toNat < 0x20`) via finite kernel `decide`.',
      '`shiftLeft_eight_or (a b : Nat) (hb : b < 256) : (a <<< 8) ||| b = a * 256 + b` proved in-kernel via `Nat.shiftLeft_eq` and `Nat.lor_eq_add`.',
      '`uncompress_infinityBytes : G1.uncompress G1.infinityBytes = .ok G1.zero` proved by kernel `decide`.'
    ],
    recommendation:
      '0 `bv_decide` and 0 `native_decide` axioms remain in `Proofs/Bls/Compress.lean`. `G1.uncompress_compress` now depends solely on `[propext, Classical.choice, Quot.sound]`.'
  },
  {
    id: 'P2',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Compress.lean',
    title: 'Converse canonical $\\mathbb{F}_p$ big-endian byte round-trip (`Fp.toBytesBE_fromBytesBE`)',
    issue:
      '`Proofs/Bls/Compress.lean` originally proved only `Fp.fromBytesBE x.toBytesBE = .ok x` (encoding then decoding). It lacked the converse direction showing that any accepted 48-byte buffer re-encodes to the exact same 48 bytes (ruling out encoding malleability).',
    codeLang: 'lean',
    codeSnippet: `theorem toBytesBE_fromBytesBE {bytes : ByteArray} {x : Fp}
    (h : Fp.fromBytesBE bytes = .ok x) :
    x.toBytesBE = bytes := by ...`,
    options: [
      '`bytesBEToNatAux_cons (acc : Nat) (u : UInt8) (l : List UInt8)` and `bytesBEToNatAux_lt` bounding base-256 big-endian accumulator values.',
      '`list_eq_of_bytesBEToNatAux_eq`: injectivity of big-endian byte decoding on lists of equal length.',
      '`Fp.toBytesBE_fromBytesBE`: if `Fp.fromBytesBE bytes = .ok x`, then `x.toBytesBE = bytes` and `bytes.size = 48`.'
    ],
    recommendation:
      'Proved in-kernel (68/68 tight specifications in `Proofs/Bls/Compress.lean` verified by `turbo-lean audit-spec`).'
  },
  {
    id: 'P3',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Compress.lean',
    title: 'Non-vanishing of $x^3 + 4$ in $\\mathbb{F}_p$ (`cube_add_four_ne_zero`) and `G1.uncompress_valid`',
    issue:
      'To prove the converse $\\mathbb{G}_1$ decompression round-trip `G1.compress_uncompress`, one must prove that every point returned by `G1.uncompress` lies on $E(\\mathbb{F}_p) : y^2 = x^3 + 4$ and that $y \\neq 0$ (so negating $y$ strictly flips `Fp.signBit y`).',
    codeLang: 'lean',
    codeSnippet: `theorem cube_add_four_ne_zero (x : Fp) :
    x * x * x + Fp.ofNat 4 ≠ Fp.zero

theorem uncompress_valid {bytes : ByteArray} {p : G1}
    (h : G1.uncompress bytes = .ok p) :
    p = G1.zero ∨ (p.z = Fp.one ∧ G1.isOnCurve p = true)`,
    options: [
      '`neg_four_pow_third_ne_one`: proves $(-4)^{(p-1)/3} \\not\\equiv 1 \\pmod p$ via a 381-bit binary squaring chain in `ZMod Fp.modulus`, establishing by Fermat\'s Little Theorem that $-4$ has no cube root in $\\mathbb{F}_p$.',
      '`cube_add_four_ne_zero (x : Fp) : x * x * x + Fp.ofNat 4 ≠ 0`: guarantees $y^2 = x^3 + 4 \\neq 0$ for every affine curve point.',
      '`uncompress_valid`: every `p` accepted by `G1.uncompress` is either `G1.zero` or a normalized (`p.z = 1`) point on $y^2 = x^3 + 4$.'
    ],
    recommendation:
      'Proved in-kernel with zero solver axioms (`[propext, Classical.choice, Quot.sound]`).'
  },
  {
    id: 'P4',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Compress.lean',
    title: 'Converse canonical $\\mathbb{G}_1$ decompression round-trip (`G1.compress_uncompress`)',
    issue:
      'Completes the bijective serialization specification for compressed $\\mathbb{G}_1$ points: any 48-byte buffer accepted by `G1.uncompress` re-compresses to the identical 48-byte buffer.',
    codeLang: 'lean',
    codeSnippet: `theorem compress_uncompress {bytes : ByteArray} {p : G1}
    (h : G1.uncompress bytes = .ok p) :
    G1.compress p = bytes`,
    options: [
      'Infinity case (`isInfinity = true`): verifies that `head = 0xc0` and `tailAllZero bytes 1 = true` force `bytes = G1.infinityBytes = G1.compress G1.zero`.',
      'Non-infinity case (`isInfinity = false`): combines `Fp.toBytesBE_fromBytesBE`, `Fp.sqrt_ok`, `cube_add_four_ne_zero`, and `signBit_neg_of_ne_zero` to reconstruct the exact flag bits (`0x80` and `0x20`) in byte 0.'
    ],
    recommendation:
      'Proved in-kernel. Together with `G1.uncompress_compress`, this establishes a complete, malleability-free bijection between valid $\\mathbb{G}_1$ points and canonical 48-byte encodings.'
  }
]

export const BLS_PROOFS: Finding[] = [
  {
    id: 'P5',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Fp2.lean',
    title: 'Quadratic extension field $\\mathbb{F}_{p^2} = \\mathbb{F}_p[u]/(u^2 + 1)$ (`Field Fp2` and `Fp2.sqrt_ok`)',
    issue:
      '`EthLib/Cryptography/Bls/Fp2.lean` previously had no proof file. Downstream operations (`G2`, `HashToCurve.simpleSwu`, `Fp6`, `Fp12`) rely on $\\mathbb{F}_{p^2}$ being a field with a sound square-root algorithm.',
    codeLang: 'lean',
    codeSnippet: `instance : Field Fp2
theorem norm_eq_zero_iff (a : Fp2) : a.norm = Fp.zero ↔ a = Fp2.zero
theorem mul_inverse_cancel {a : Fp2} (ha : a ≠ Fp2.zero) : a * a.inverse = Fp2.one
theorem sqrt_ok {a c : Fp2} (h : Fp2.sqrt a = .ok c) : c * c = a`,
    options: [
      '`AddCommGroup Fp2` and `CommRing Fp2` proved by componentwise reduction to `Fp` (`ZMod Fp.modulus`).',
      '`sq_ne_neg_one (x : Fp) : x * x ≠ -Fp.one` proved via $p \\equiv 3 \\pmod 4$ and Fermat\'s Little Theorem, yielding `norm_eq_zero_iff : a.c0^2 + a.c1^2 = 0 ↔ a = 0` and unconditional `Field Fp2`.',
      '`sqrt_ok`: proves that whenever `Fp2.sqrt a = .ok c`, $c^2 = a$ in $\\mathbb{F}_{p^2}$.'
    ],
    recommendation:
      '81/81 tight specifications proved in `Proofs/Bls/Fp2.lean` with 0 `sorryAx` and 0 `bv_decide`.'
  },
  {
    id: 'P6',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Fp6.lean, Fp12.lean',
    title: 'Unconditional degree-6 and degree-12 tower fields $\\mathbb{F}_{p^6}$ and $\\mathbb{F}_{p^{12}}$ (`Field Fp6`, `Field Fp12`, `norm_eq_zero_iff`)',
    issue:
      '`EthLib/Cryptography/Bls/Fp6.lean` and `Fp12.lean` construct the towering extensions $\\mathbb{F}_{p^6} = \\mathbb{F}_{p^2}[v]/(v^3 - (u+1))$ and $\\mathbb{F}_{p^{12}} = \\mathbb{F}_{p^6}[w]/(w^2 - v)$ used by the optimal Ate pairing, and previously had zero proofs.',
    codeLang: 'lean',
    codeSnippet: `instance : Field Fp6
instance : Field Fp12
theorem Fp6.norm_eq_zero_iff (a : Fp6) : Fp6.norm a = 0 ↔ a = 0
theorem Fp12.norm_eq_zero_iff (a : Fp12) : Fp12.norm a = 0 ↔ a = 0
theorem Fp12.powNat_eq_pow (a : Fp12) (n : Nat) : Fp12.powNat a n = a ^ n`,
    options: [
      '`AddCommGroup`, `CommRing`, and unconditional `Field` instances for both `Fp6` and `Fp12`.',
      '`Fp6.norm_eq_zero_iff` and `Fp12.norm_eq_zero_iff` proved by descending norms to $\\mathbb{F}_p$ and showing $2^{(p-1)/3} \\not\\equiv 1 \\pmod p$ and $2^{(p-1)/2} \\not\\equiv 1 \\pmod p$ via Fermat\'s Little Theorem.',
      'Unconditional `mul_inverse_cancel`, `inverse_mul_cancel`, `inverse_zero`, and binary exponentiation equivalence `Fp12.powNat_eq_pow`.'
    ],
    recommendation:
      '134/134 tight specifications proved across `Proofs/Bls/Fp6.lean` (70/70) and `Proofs/Bls/Fp12.lean` (64/64) with 0 warnings.'
  },
  {
    id: 'P7',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/G2.lean',
    title: '$\\mathbb{G}_2$ projective equivalence, twist curve membership, and 96-byte serialization round-trips (`Proofs/Bls/G2.lean`)',
    issue:
      '`EthLib/Cryptography/Bls/G2.lean` defines the twisted curve $E\'(\\mathbb{F}_{p^2}) : y^2 = x^3 + 4(1+u)$ and 96-byte point compression/decompression in `Bls/Compress.lean`, which previously had no formal specification.',
    codeLang: 'lean',
    codeSnippet: `theorem isOnTwist_generator : G2.isOnTwist G2.generator = true
theorem uncompress_valid {b : ByteArray} {q : G2}
    (h : G2.uncompress b = .ok q) :
    q = G2.zero ∨ (q.z = Fp2.one ∧ G2.isOnTwist q = true)
theorem uncompress_compress {p : G2} (h : G2.isOnTwist p = true) :
    ∃ q, G2.uncompress (G2.compress p) = .ok q ∧ (q == p) = true
theorem compress_uncompress {b : ByteArray} {q : G2}
    (h : G2.uncompress b = .ok q) : G2.compress q = b`,
    options: [
      'Projective `BEq` reflexivity, symmetry, and infinity equivalence (`beq_iff_isInfinity_of_isInfinity`), plus `G2.add`, `double`, `neg`, and `mulNat` identity laws.',
      '`isOnTwist_generator` and `cube_add_bTwist_ne_zero (x : Fp2) : x * x * x + bTwist ≠ 0` (via $N_{\\mathbb{F}_{p^2}/\\mathbb{F}_p}(-4(1+u)) = 32$ not being a cube in $\\mathbb{F}_p$).',
      'Full 96-byte serialization round-trips: `fp2FromBytes_fp2ToBytes`, `fp2ToBytes_fp2FromBytes`, `uncompress_valid`, `uncompress_compress`, and `compress_uncompress`.'
    ],
    recommendation:
      'Curve membership and encoding round-trips are proved. The new group, exact-order, and subgroup-check proofs are described below. EthLib has no G2 MSM implementation.'
  },
  {
    id: 'P8',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Pairing.lean',
    title: 'Total `millerLoop`, `millerAdd`/`millerDouble` tangent consistency, and `finalExponentiation` laws',
    issue:
      'After making `Fp2.powNat`, `Fp12.powNat`, and `millerLoop` total (resolving Issue #52) and fixing the exceptional affine branches in `millerAdd` and `millerDouble`, we prove their algebraic and boundary properties in `Proofs/Bls/Pairing.lean`.',
    codeLang: 'lean',
    codeSnippet: `theorem millerAdd_self_eq_millerDouble (T P : EmbeddedPoint) :
    millerAdd T T P = millerDouble T P
theorem millerLoop_inf_left (s : Nat) (R0 P : EmbeddedPoint) (h : R0.inf = true) :
    millerLoop s R0 P = Fp12.one
theorem pairing_zero_left (q : G2) : pairing G1.zero q = Fp12.one`,
    options: [
      '`millerAdd_self_eq_millerDouble`: adding $T$ to itself in `millerAdd` agrees identically with `millerDouble T P`.',
      '`millerAdd_opp_inf` and `millerDouble_y_zero_inf`: vertical chord ($T = -R_0$) and 2-torsion vertical tangent ($T_y = 0$) transition cleanly to `inf = true`.',
      '`millerLoop_inf_left`, `millerLoop_inf_right`, `finalExponentiation_one`, `pairing_zero_left`, `pairing_zero_right`, and `pairingCheck_empty`.'
    ],
    recommendation:
      'Boundary and identity laws are proved. Full pairing bilinearity and non-degeneracy remain open; these lemmas do not establish them.'
  },
  {
    id: 'P9',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Sha256.lean, HashToCurve.lean',
    title: 'SHA-256 (FIPS 180-4) and RFC 9380 `HashToCurve` (`simpleSwu_total`, `simpleSwu_curve_eq`, `isSquareFp2_iff`)',
    issue:
      'Neither `Bls/Sha256.lean` nor `Bls/HashToCurve.lean` had a proof file. In particular, the simplified SWU map onto the 3-isogenous curve $E\' : y^2 = x^3 + A\'x + B\'$ requires proving both the polynomial identity $g(x_2) = Z^3 u^6 g(x_1)$ and totality (`simpleSwu_total`) showing that at least one of $g(x_1(u))$ or $g(x_2(u))$ is a square in $\\mathbb{F}_{p^2}$ for every $u \\in \\mathbb{F}_{p^2}$.',
    codeLang: 'lean',
    codeSnippet: `theorem isSquareFp2_iff (a : Fp2) :
    isSquareFp2 a = true ↔ ∃ b : Fp2, b * b = a
theorem simpleSwu_total (u : Fp2) :
    ∃ p : Fp2 × Fp2, simpleSwu u = .ok p ∧ p.2 * p.2 = swuG p.1`,
    options: [
      '`Proofs/Bls/Sha256.lean`: proves `bytesBEToU32_u32ToBytesBE`, `hash_size`, bitwise `ch_self`/`maj_self`/`maj_comm` (no `bv_decide`), and kernel-checked (`decide +kernel`) FIPS 180-4 KATs.',
      '`Proofs/Bls/HashToCurve.lean`: proves `expandMessageXmd` RFC 9380 guards, `isSquare_iff`, `isSquareFp2_iff`, `sq_or_neg_sq`, `sqrt_of_norm_sq`, `swuG_x2_eq`, `simpleSwu_curve_eq`, `simpleSwu_total`, and `psi`/`psi2`/`clearCofactor` identity laws.'
    ],
    recommendation:
      'SHA-256 size/serialization lemmas and known-answer tests, plus SSWU totality and curve membership, are proved. Isogeny curve preservation is now proved below. General cofactor-clearing subgroup membership remains open. Known-answer tests are not a full SHA-256 specification-equivalence proof.'
  },
  {
    id: 'P10',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Signatures.lean',
    title: 'IRTF BLS signature verification and `coreVerify_sound` (`Proofs/Bls/Signatures.lean`)',
    issue:
      'Proves validation implications and boundary specifications for IRTF `KeyValidate`, `SkToPk`, `Sign`, `Aggregate`, `CoreVerify`, `AggregateVerify`, `FastAggregateVerify`, and Ethereum consensus wrappers.',
    codeLang: 'lean',
    codeSnippet: `theorem coreVerifyPoint_sound {pk : G1} {msg sigBytes : ByteArray}
    (h : coreVerifyPoint pk msg sigBytes = true) :
    sigBytes.size = 96 ∧
      ∃ sig q : G2,
        G2.uncompress sigBytes = .ok sig ∧
        G2.inSubgroup sig = true ∧
        HashToCurve.hashToG2 msg DST = .ok q ∧
        Bls.pairingCheck #[(G1.generator, sig), (G1.neg pk, q)] = true`,
    options: [
      '`G1.keyValidatePoint_size` and `G1.keyValidatePoint_noninf_and_subgroup`: any accepted public key is 48 bytes, non-infinity, and in the prime-order subgroup.',
      '`coreVerify_eq_coreVerifyPoint`: single-decompression `coreVerifyPoint` agrees identically with `coreVerify`.',
      '`coreVerifyPoint_sound` and `coreVerify_sound`: `coreVerify pkBytes msg sigBytes = true` implies valid 48-byte pubkey, 96-byte subgroup-checked signature, successful `hashToG2`, and `pairingCheck = true`.'
    ],
    recommendation:
      'These theorems expose validation and the pairing equation checked by the implementation. End-to-end signature and aggregate completeness remain open and require the missing pairing and hash-to-subgroup proofs.'
  }
]

BLS_PROOFS.push(
  {
    id: 'P13',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/G2Group.lean, G2Validity.lean, G2Order.lean, G2Equiv.lean, G2Subgroup.lean',
    title: 'G2 group arithmetic, exact generator order, and subgroup checking',
    issue: 'The concrete Jacobian operations now connect to Mathlib’s curve group. Decoded points satisfy the validity hypotheses; equality means projective equivalence.',
    codeLang: 'lean',
    codeSnippet: `theorem toPoint_mulNat {P : G2} (h : Valid P) (k : Nat) :
    toPoint (mulNat P k) = k • toPoint P

theorem addOrderOf_toPoint_generator :
    addOrderOf (toPoint generator) = Fr.modulus

theorem inSubgroup_iff_modulus_smul_eq_zero {p : G2} (hp : Valid p) :
    inSubgroup p = true ↔ Fr.modulus • toPoint p = 0`,
    options: [
      'Zero, negation, doubling, addition, and scalar multiplication preserve validity and agree with the mathematical group operations.',
      'A kernel-checked ladder establishes the generator’s exact prime order. Boolean equality agrees with group equality on valid points.',
      'The subgroup check is exactly an r-torsion test on valid points, including every successfully decoded point.'
    ],
    recommendation: 'Checked without native-evaluation axioms. This does not prove that every r-torsion point is a generator multiple, pairing correctness, or ceremony completeness.'
  },
  {
    id: 'P14',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Bls/Isogeny.lean',
    title: 'The RFC 9380 isogeny maps SSWU points onto the BLS twist',
    issue: 'The rational map now has a curve-preservation proof tied to its executable coefficients. Its denominator pole cannot lie on the source curve.',
    codeLang: 'lean',
    codeSnippet: `theorem isoMapG2_curve_eq {x y : Fp2} (h : y*y = swuG x) :
    let p := isoMapG2 x y
    p.2*p.2 = p.1*p.1*p.1 + G2.bTwist`,
    options: [
      'A polynomial identity establishes preservation after clearing denominators.',
      'The common pole would require a square root of 4 + 4i; its norm is 32, which is not a square in the base field.',
      'Successful SSWU followed by the isogeny yields a valid G2 representative.'
    ],
    recommendation: 'Kernel-checked with only standard Lean axioms. General cofactor-clearing subgroup membership and end-to-end hash-to-G2 correctness remain open.'
  }
)

BLS_PROOFS.push(
  {
    id: 'P15', severity: 'Proof', component: 'EthLib/Cryptography/Proofs/Bls/PairingInvariant.lean',
    title: 'Pairing input representation invariance for projectively equal G2 points',
    issue: 'The raw pairing implementation now has a checked representation-invariance refinement for the G2 input. This is a prerequisite for quotient-level pairing semantics, not bilinearity.',
    codeLang: 'lean',
    codeSnippet: `theorem pairing_eq_of_g2_beq {p : G1} {q q' : G2}
    (h : (q == q') = true) : pairing p q = pairing p q'`,
    options: [
      'Projective equality implies equal affine normalization for G2 points.',
      'The executable `Embedded.ofG2` map is invariant under that equality.',
      'The result does not prove the Miller recurrence, bilinearity, or non-degeneracy.'
    ],
    recommendation: 'Checked with standard Lean axioms only. Continue with ambient-curve embeddings and line-function invariants before attempting bilinearity.'
  }
)

export const KZG_XMSS_PROOFS: Finding[] = [
  {
    id: 'P11',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Kzg/Polynomials.lean',
    title: 'Polynomial evaluation homomorphisms and vanishing polynomial roots',
    issue:
      '`Proofs/Kzg/Polynomials.lean` previously covered only `computeRootsOfUnity`. The polynomial ring operations used by EIP-4844 and EIP-7594 (`addPolynomialcoeff`, `subPolynomialcoeff`, `multiplyPolynomialcoeff`, `dividePolynomialcoeff`, `vanishingPolynomialcoeff`) had no algebraic proofs.',
    codeLang: 'lean',
    codeSnippet: `theorem evalPolyAt_addPoly (a b : PolynomialCoeff) (x : Fr) :
    evalPolyAt (addPolynomialcoeff a b) x = evalPolyAt a x + evalPolyAt b x
theorem evalPolyAt_mulPoly {a b p : PolynomialCoeff} (x : Fr)
    (h : multiplyPolynomialcoeff a b = .ok p) :
    evalPolyAt p x = evalPolyAt a x * evalPolyAt b x
theorem vanishingPolynomialcoeff_eval_root {zs : Array Fr} {v : PolynomialCoeff}
    (hv : vanishingPolynomialcoeff zs = .ok v) {z : Fr} (hz : z ∈ zs.toList) :
    evalPolyAt v z = Fr.zero`,
    options: [
      'Evaluation homomorphisms: `evalPolyAt_addPoly` and `evalPolyAt_mulPoly`.',
      'Division rejection and short-dividend lemmas match the implementation. The quotient/remainder evaluation identity and coefficient cutoff are proved in P16; successful coefficient interpolation at distinct nodes is proved in P19.',
      '`vanishingPolynomialcoeff_eval_root` and `vanishingPolynomialcoeff_size`: proves that the vanishing polynomial has degree `zs.size` and vanishes at every $z \\in \\text{zs}$.'
    ],
    recommendation:
      '63/63 tight specifications proved in `Proofs/Kzg/Polynomials.lean` with 0 warnings.'
  },
  {
    id: 'P12',
    severity: 'Proof',
    component: 'EthLib/Cryptography/Proofs/Kzg/Core.lean, Cells.lean, Recovery.lean, CeremonyChecks.lean, Xmss/Blake2s.lean',
    title: 'EIP-4844 & EIP-7594 PeerDAS validation soundness, `CeremonyChecks` BLS laws, and `Blake2s` KATs',
    issue:
      'Expands the KZG and XMSS proof suite across `Core.lean`, `Cells.lean`, `Recovery.lean`, `CeremonyChecks.lean`, and `Xmss/Blake2s.lean` to cover single-pass `validateKzgG1Point`, `g1LincombPoints`, PeerDAS batch challenge/verification guards, concrete `G1`/`G2` laws, and kernel-checked `Blake2s` KATs.',
    codeLang: 'lean',
    codeSnippet: `theorem validateKzgG1_eq_validateKzgG1Point (b : Bytes48) :
    validateKzgG1 b = (validateKzgG1Point b).isOk
theorem g1LincombPoints_size_mismatch (points : Array Bls.G1) (scalars : Array Fr)
    (h : points.size ≠ scalars.size) :
    g1LincombPoints points scalars = .error .sizeMismatch
-- Ceremony conclusions still require ConcreteBlsLaws
-- and SubgroupExponents; no concrete instance is supplied.`,
    options: [
      '`Proofs/Kzg/Core.lean` (19/19 tight): proves `validateKzgG1_eq_validateKzgG1Point`, `validateKzgG1Point_ok_valid`, `g1LincombPoints` specifications, and size/format rejection lemmas.',
      '`Proofs/Kzg/Cells.lean` (24/24) & `Recovery.lean` (17/17): 41 theorems covering `cosetShiftForCell`, `cosetForCell`, `verifyCellKzgProofBatch`, and `recoverCellsAndKzgProofs` validation invariants.',
      '`Proofs/Kzg/CeremonyChecks.lean` (24/24) & `Proofs/Xmss/Blake2s.lean` (14/14): proves concrete `G1`/`G2` `CeremonyChecks` laws and kernel-checked (`decide +kernel`) `Blake2s` known-answer digests (`hash_empty`, `hash_abc`, `hash_one_full_block`, `hash_block_and_tail`).'
    ],
    recommendation:
      'Validation lemmas compile, but ceremony consistency still assumes `ConcreteBlsLaws.pairingEq_mul_iff` and `SubgroupExponents`. KZG/cell completeness, trusted-setup consistency, and Reed-Solomon reconstruction remain open. Four XMSS known-answer theorems in KeyGen, Sign, and Verify still use `native_decide`.'
  }
]

export const AUDIT_FINDINGS: Finding[] = [
  {
    id: 'F1',
    severity: 'High',
    component: 'EthLib/Cryptography/Bls/Pairing.lean',
    title: 'Incomplete affine formulas in `millerAdd` and `millerDouble`, and ignored `P.inf` in `millerLoop`',
    issue:
      '`millerAdd` computes $\\lambda = (y_2 - y_1) \\cdot (x_2 - x_1)^{-1}$ in $\\mathbb{F}_{p^{12}}$ without checking $T_x = R_{0,x}$. Since `Fp12.inverse 0 = 0`, doubling ($T = R_0$) or adding opposite points ($T = -R_0$) silently sets $\\lambda = 0$ and returns a bogus non-infinity point. Similarly, `millerDouble` does not check $T_y = 0$ (2-torsion), and `millerLoop` never checks `P.inf`.',
    codeLang: 'lean',
    codeSnippet: `#eval do
  let p := Embedded.ofG2 G2.generator
  let q := Embedded.ofG1 G1.generator
  let qZero := Embedded.ofG1 G1.zero
  IO.println (millerLoop 2 p qZero == Fp12.one)            -- false
  IO.println ((millerAdd p p q).1 == (millerDouble p q).1) -- false`,
    options: [
      'Option A: Keep the incomplete formulas and add preconditions ($T_x \\neq R_{0,x}$, `!P.inf`) to future theorems.',
      'Option B: Handle `R0.inf || P.inf` in `millerLoop`, $T_x = R_{0,x}$ in `millerAdd` (doubling vs. vertical line $P_x - T_x$ to $\\mathcal{O}$), and $T_y = 0$ in `millerDouble`.',
      'Option C: Rewrite the Miller loop in homogeneous projective coordinates over $\\mathbb{F}_{p^2}$.'
    ],
    recommendation:
      'Option B. It makes `millerAdd`, `millerDouble`, and `millerLoop` total and algebraically sound on all `EmbeddedPoint` inputs.'
  },
  {
    id: 'F2',
    severity: 'High',
    component: 'EthLib/Cryptography/Kzg/Cells.lean, Kzg/Exports.lean',
    title: 'Missing input validation and out-of-bounds `get!` in `computeVerifyCellKzgProofBatchChallengeExport`',
    issue:
      '`computeVerifyCellKzgProofBatchChallengeExport` does not check that `commitmentIndices`, `cellIndices`, `cosetsEvals`, and `proofs` have equal lengths or valid bounds. It writes `cellIndices.size` into the Fiat-Shamir header while looping over `cosetsEvals.size` with `commitmentIndices[k]!` and `cellIndices[k]!`, panicking on mismatched lengths. `unpackIndicesBE` also truncates `b.size % 8` trailing bytes, and `computeChallengeExport` skips blob/commitment validation.',
    codeLang: 'lean',
    codeSnippet: `buf := buf ++ uint64ToBytesBE commitments.size
           ++ uint64ToBytesBE cellIndices.size
for k in [:cosetsEvals.size] do
  buf := buf ++ uint64ToBytesBE commitmentIndices[k]!
  buf := buf ++ uint64ToBytesBE cellIndices[k]!`,
    options: [
      'Option A: Validate array lengths, index bounds, byte widths, and `b.size % 8 == 0` in `Kzg/Exports.lean` and `Cells.lean`.',
      'Option B: Remove the challenge exports from the public C ABI.'
    ],
    recommendation:
      'Option A, since the Python test suite calls both exports directly.'
  },
  {
    id: 'F3',
    severity: 'High',
    component: 'EthLib/Cryptography/Bls/Fp2.lean, Fp12.lean, Pairing.lean',
    title: '`partial def` on `Fp2.powNat`, `Fp12.powNat`, and `millerLoop` blocks kernel verification (Issue #52)',
    issue:
      'Marking `Fp2.powNat`, `Fp12.powNat`, and `millerLoop` as `partial def` makes them opaque to the Lean 4 kernel. As a result, `Fp2.sqrt`, `G2.uncompress`, `finalExponentiation`, `pairingCheck`, `Signatures.*`, and `Kzg.verify*` cannot be unfolded or proved.',
    codeLang: 'lean',
    codeSnippet: `partial def powNat (a : Fp2) (e : Nat) : Fp2 := ...
partial def millerLoop (n : Nat) (R0 P : EmbeddedPoint) : Fp12 := ...`,
    options: [
      'Option A: Replace `partial def` with `def ... termination_by e` on `powNat` and remove `partial` from `millerLoop` (whose inner `go` loop is already structurally recursive).',
      'Option B: Define separate total shadow functions inside `Proofs/`.'
    ],
    recommendation:
      'Option A. It takes less than 10 lines, resolves Issue #52, and unlocks kernel unfolding across the entire pairing, signature, and KZG stack.'
  },
  {
    id: 'F4',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Kzg/Core.lean, Cells.lean',
    title: 'Re-decompressing 4,096 `TrustedSetup` $\\mathbb{G}_1$ points on every MSM (`3.6M` redundant `Fp.sqrt` calls in `pytest`)',
    issue:
      '`TrustedSetup` pre-decompresses `g1Lagrange : Array Bls.G1` and `g1Monomial : Array Bls.G1` at startup, yet `blobToKzgCommitment`, `computeKzgProofImpl`, `computeKzgProofMultiImpl`, and `verifyCellKzgProofBatchImpl` pass `setup.g1LagrangeBytes` / `setup.g1MonomialBytes` to `g1Lincomb`, running `G1.uncompress` (`Fp.sqrt`) 4,096 times per MSM (516,224 times per blob in `computeCellsAndKzgProofs`). In addition, `verifyKzgProofImpl` and `verifyBlobKzgProofBatch` decompress every commitment and proof twice.',
    codeLang: 'lean',
    codeSnippet: `let monomial := setup.g1MonomialBytes
let proof ← g1Lincomb (monomial.extract 0 quotient.size) quotient -- 4,033 Fp.sqrt calls per cell!`,
    options: [
      'Option A: Add `g1LincombPoints` over pre-decoded `Array G1`, pass `setup.g1Lagrange` and `setup.g1Monomial` directly, and decode commitments/proofs once via `validateKzgG1Point`.',
      'Option B: Keep re-decompressing `g1LagrangeBytes` and `g1MonomialBytes` on every MSM.'
    ],
    recommendation:
      'Option A. It eliminates over 3.6 million 381-bit `Fp.sqrt` modular exponentiations across the KZG test suite and removes double decompression in `verifyKzgProof` and `verifyBlobKzgProofBatch`.'
  },
  {
    id: 'F5',
    severity: 'Medium',
    component: 'bindings/python/module.c, Bls/Exports.lean, Kzg/Exports.lean',
    title: 'C `extern` prototype mismatches in `module.c` and misleading `@&` borrow annotations in `Exports.lean`',
    issue:
      'Lean compiles `Unit -> UInt64` exports as `uint64_t eth_*_const_*(lean_object*)`, but `module.c` declares them as taking `(uint8_t)` (ISO C11 Undefined Behavior under CFI). Meanwhile, `Exports.lean` marks parameters with `@&` (borrowed), which Lean 4.29 silently ignores on `@[export]` definitions (generating owned parameters that decrement refcounts) while `bls.c` and `kzg.c` pass owned references.',
    codeLang: 'c',
    codeSnippet: `/* Constants.c */ LEAN_EXPORT uint64_t eth_bls_const_bytes_per_pubkey(lean_object* x_1);
/* module.c    */ extern uint64_t eth_bls_const_bytes_per_pubkey(uint8_t);`,
    options: [
      'Option A: Fix the `extern` declarations in `module.c` to take `lean_object*` (`lean_box(0)`) and remove the misleading `@&` annotations from `@[export]` functions in `Exports.lean`.',
      'Option B: Keep `@&` via non-exported wrapper functions and add manual `lean_dec_ref` calls in C.'
    ],
    recommendation:
      'Option A. It fixes the C prototype mismatch and makes the Lean signatures match the owned ABI generated by Lean 4.'
  },
  {
    id: 'F6',
    severity: 'Medium',
    component: 'bindings/python/kzg.c, bls.c',
    title: 'Unchecked `NULL` allocations and runtime C99 VLAs in CPython bindings',
    issue:
      '`kzg.c` does not check `PyList_New` or `PyBytes_FromStringAndSize` for `NULL` before calling `PyList_SET_ITEM`, segfaulting on OOM. Both `bls.c` and `kzg.c` also allocate stack buffers using runtime-sized C99 VLAs (`uint8_t out[BYTES_PER_PUBKEY]`).',
    codeLang: 'c',
    codeSnippet: `PyObject* cells = PyList_New(CELLS_PER_EXT_BLOB);
for (size_t i = 0; i < CELLS_PER_EXT_BLOB; i++) {
  PyList_SET_ITEM(cells, i, PyBytes_FromStringAndSize(...));
}`,
    options: [
      'Option A: Check all `PyList_New` and `PyBytes_FromStringAndSize` calls for `NULL` and replace runtime VLAs with `PyMem_Malloc` buffers.',
      'Option B: Rewrite the bindings in Cython or CFFI.'
    ],
    recommendation:
      'Option A. Adding explicit `NULL` checks and `PyMem_Malloc` fixes all 669 injected allocation-failure paths cleanly.'
  },
  {
    id: 'F7',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Bls/G1.lean, G2.lean',
    title: 'Derived structural `BEq` on `G1` and `G2` compares raw Jacobian coordinates instead of projective equality',
    issue:
      '`G1` and `G2` derive structural `BEq`, comparing $(X, Y, Z)$ fields directly instead of Jacobian equivalence $(X / Z^2, Y / Z^3)$. Two Jacobian representations of the same curve point compare as `false`, and `G1.zero` ($\\langle 0, 1, 0 \\rangle$) is not equal (`==`) to `(default : G1)` ($\\langle 0, 0, 0 \\rangle$).',
    codeLang: 'lean',
    codeSnippet: `let g := G1.generator
let gScaled : G1 := { x := 4 * g.x, y := 8 * g.y, z := 2 }
IO.println (g == gScaled)              -- false
IO.println (G1.zero == (default : G1)) -- false`,
    options: [
      'Option A: Implement projective `BEq` on `G1` and `G2` ($Z = 0$ for $\\mathcal{O}$, and $X_1 Z_2^2 = X_2 Z_1^2 \\land Y_1 Z_2^3 = Y_2 Z_1^3$ otherwise) and document that it must not be given a `LawfulBEq` instance.',
      'Option B: Remove `BEq` from `G1` and `G2` and compare via `toAffine`.'
    ],
    recommendation:
      'Option A. Projective `BEq` avoids field inversions and matches the `G1Quot` relation in `Proofs/Bls/G1Group.lean`.'
  },
  {
    id: 'F8',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Bls/Fp2.lean, Fp6.lean, Fp12.lean',
    title: '`@[inline]` on tower operations causes a 101,145-line (3.1 MB) C code blowup in `Pairing.c`',
    issue:
      'Inlining `add`, `sub`, and `Fp2.mul` across the $\\mathbb{F}_{p^{12}} \\to \\mathbb{F}_{p^6} \\to \\mathbb{F}_{p^2}$ tower inside `millerDouble` and `millerAdd` triggers 3,642 nested `!lean_is_exclusive` reset/reuse branches, expanding `Pairing.c` to 101,145 lines (3.1 MB).',
    codeLang: 'sh',
    codeSnippet: `$ wc -l .lake/build/ir/EthLib/Cryptography/Bls/Pairing.c
101145 .lake/build/ir/EthLib/Cryptography/Bls/Pairing.c`,
    options: [
      'Option A: Remove `@[inline]` from `Fp2.add/sub/mul`, `Fp6.add/sub`, and `Fp12.add/sub`.',
      'Option B: Keep `@[inline]` only on `Fp2.add/sub`.'
    ],
    recommendation:
      'Option A. Removing `@[inline]` reduces `Pairing.c` from 101,145 lines to 2,277 lines and speeds up C compilation.'
  },
  {
    id: 'F9',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Bls/HashToCurve.lean, Kzg/Core.lean, Cells.lean',
    title: 'Raw `panic!` in `simpleSwu`, unvalidated empty DST in `expandMessageXmd`, and `.toOption.get!`',
    issue:
      '`simpleSwu` had a raw `panic!` in its unreachable `else` branch instead of propagating a typed `BlsError` into `hashToG2 : Except BlsError G2`. `expandMessageXmd` did not reject an empty DST (`dst.size == 0`, violating RFC 9380 section 3.1), and `Kzg/Core.lean` and `Cells.lean` used `(G1.uncompress ...).toOption.get!`.',
    codeLang: 'lean',
    codeSnippet: `match Fp2.sqrt gx2 with
| .ok y => .ok (x2, if sgn0Fp2 u = sgn0Fp2 y then y else -y)
| .error _ => .error .swuNoSquareFound`,
    options: [
      'Option A: Make `simpleSwu` return `Except BlsError (Fp2 × Fp2)` and fail loudly with `.swuNoSquareFound`, guard `dst.size == 0` in `expandMessageXmd`, and replace `.toOption.get!` with `uncompressG1`.',
      'Option B: Keep `panic!` in `simpleSwu`.'
    ],
    recommendation:
      'Option A. Failing with `.error .swuNoSquareFound` eliminates `panic!`, avoids failing open with an off-curve point, and makes `simpleSwu_curve_eq` unconditional on `.ok (x, y)`.'
  },
  {
    id: 'F10',
    severity: 'Medium',
    component: 'setup.py, .github/workflows/ci.yml',
    title: '`setup.py` builds all ~3,350 Mathlib + Proof modules during wheel packaging, and CI skips `pytest`',
    issue:
      '`setup.py` runs `lake build` instead of `lake build EthLib`, compiling ~3,350 Mathlib and `Proofs` modules when building the Python wheel even though the C extension only links `EthLib`. In addition, `.github/workflows/ci.yml` never builds or tests the Python bindings.',
    codeLang: 'python',
    codeSnippet: `# setup.py:71
subprocess.check_call(["lake", "build", "EthLib"], cwd=REPO_ROOT)`,
    options: [
      'Option A: Change `setup.py` to run `["lake", "build", "EthLib"]` and run `pytest` on the CPython bindings in `.github/workflows/ci.yml`.',
      'Option B: Remove `@[default_target]` from `lean_lib Proofs` in `lakefile.lean`.'
    ],
    recommendation:
      'Option A. `lake build` still checks all proofs by default, while `pip install .` only builds `EthLib`.'
  },
  {
    id: 'F11',
    severity: 'Low',
    component: 'EthLib/Cryptography/Bls/Compress.lean, Signatures.lean',
    title: 'Redundant double $\\mathbb{G}_1$ decompression and redundant subgroup check in `fastAggregateVerify`',
    issue:
      '`G1.keyValidate` discarded the decompressed $\\mathbb{G}_1$ point, forcing callers to run `G1.uncompress` (`Fp.sqrt`) a second time. In `fastAggregateVerify`, the sum of validated public keys was re-compressed to bytes and passed to `coreVerify`, which decompressed it twice and re-ran a 255-bit $r \\cdot P = \\mathcal{O}$ subgroup check.',
    codeLang: 'lean',
    codeSnippet: `def keyValidatePoint (bytes : ByteArray) : Except BlsError G1 := do
  let p ← uncompress bytes
  if p.isInfinity then throw .pointAtInfinity
  if !inSubgroup p then throw .notInSubgroup
  return p`,
    options: [
      'Option A: Add `G1.keyValidatePoint` and `coreVerifyPoint` so validated $\\mathbb{G}_1$ points are reused directly without re-decompression.',
      'Option B: Keep the double decompression as-is.'
    ],
    recommendation:
      'Option A. It cuts $\\mathbb{G}_1$ decompressions in half while keeping `G1.keyValidate` compatible with existing proofs.'
  }
]

KZG_XMSS_PROOFS.push(
  {
    id: 'P16', severity: 'Proof', component: 'EthLib/Cryptography/Proofs/Kzg/Division.lean',
    title: 'Polynomial division quotient/remainder identity and degree cutoff',
    issue: 'The actual division loop now has a quotient/remainder evaluation identity and a coefficient cutoff for the remainder, including the short-dividend case.',
    codeLang: 'lean',
    codeSnippet: `theorem dividePolynomialcoeff_inner_eval (a b : PolynomialCoeff) (x quot : Fr)
    (shift : Nat) (hfit : shift + b.size ≤ a.size) :
    evalPolyAt (...) x = evalPolyAt a x - evalPolyAt b x * quot * Fr.powNat x shift`,
    options: [
      '`evalPolyAt_set` characterizes one coefficient update exactly.',
      '`dividePolynomialcoeff_inner_eval` identifies one subtraction pass with `quot * X^shift * b(X)`.',
      '`dividePolynomialcoeff_inner_leading_zero` proves the selected top coefficient is cancelled when the divisor lead is nonzero.'
    ],
    recommendation: '`dividePolynomialcoeff_quotient_remainder_spec` proves the evaluation identity for every field point and zero remainder coefficients at indices at least divisor size minus one. It requires a nonempty divisor with nonzero leading coefficient. Interpolation at distinct nodes on successful return is proved in P19. End-to-end KZG correctness remains open.'
  }

)

BLS_PROOFS.push(
  {
    id: 'P17', severity: 'Proof', component: 'EthLib/Cryptography/Proofs/Bls/HashToCurveValidity.lean',
    title: 'Successful hash-to-G2 results are valid twist-curve points',
    issue: 'The SSWU, isogeny, Frobenius maps, and cofactor expression now compose to curve validity for every successful `hashToG2` result.',
    codeLang: 'lean',
    codeSnippet: `theorem hashToG2_valid {msg dst : ByteArray} {P : G2}
    (h : hashToG2 msg dst = .ok P) : G2.Valid P`,
    options: [
      '`psi_valid`, `psi2_valid`, and `mulNegX_valid` preserve nonsingular twist-curve membership.',
      '`clearCofactor_valid` proves the executable cofactor expression remains on the twist.',
      'The theorem deliberately does not assert r-torsion, RFC conformance, or subgroup security.'
    ],
    recommendation: 'Checked with standard Lean axioms only. Prove the cofactor scalar identity and r-torsion next.'
  }
)

BLS_PROOFS.push(
  { id: 'P18', severity: 'Proof', component: 'EthLib/Cryptography/Proofs/Bls/FinalExponentiation.lean', title: 'Final exponentiation lands in the r-torsion target for nonzero Miller values', issue: 'The extension tower cardinalities and the exact final exponent are proved in the kernel.', codeLang: 'lean', codeSnippet: `theorem finalExponentiation_pow_modulus {f : Fp12} (hf : f ≠ 0) :
  finalExponentiation f ^ Fr.modulus = 1`, options: ['Finite cardinalities of Fp2, Fp6, and Fp12 are derived from coordinate equivalences.', 'The divisibility of the scalar modulus is checked by kernel reduction.', 'The theorem requires a nonzero input and does not prove Miller non-vanishing or pairing bilinearity.'], recommendation: 'Checked with standard Lean axioms only. Full optimal-Ate bilinearity and non-degeneracy remain open.' }
)

KZG_XMSS_PROOFS.push(
  { id: 'P19', severity: 'Proof', component: 'EthLib/Cryptography/Proofs/Kzg/Interpolation.lean', title: 'Successful coefficient interpolation reproduces samples at distinct nodes', issue: 'The executable interpolation loop is proved correct at every supplied node when inputs have equal length, nodes are pairwise distinct, and the function returns `.ok`.', codeLang: 'lean', codeSnippet: `theorem interpolatePolynomialcoeff_eval_at_of_distinct ...`, options: ['The proof follows the actual monadic multiplication and accumulation loops.', 'Distinctness is required because the implementation does not reject duplicate nodes.', 'The success hypothesis remains explicit because size-limit failures are part of the executable specification.'], recommendation: 'Checked with standard Lean axioms only. Unconditional KZG opening and recovery correctness remain open.' }
)

BLS_PROOFS.push(
  { id: 'P20', severity: 'Proof', component: 'EthLib/Cryptography/Proofs/Bls/PairingTateBilinearity.lean', title: 'Prove scalar bilinearity of the concrete reduced Tate pairing', issue: 'The actual r-step Miller/Tate implementation is proved additive in both source arguments, including projective representatives, infinity cases, and subgroup validity.', codeLang: 'lean', codeSnippet: `theorem reducedTatePairing_mulNat_both ...`, options: ['The proof follows the actual Miller and chord/vertical recurrences.', 'All support and nonzero hypotheses are discharged from concrete curve facts.', 'The theorem is for reduced Tate pairing and does not identify it with the signed optimal-Ate executable pairing.'], recommendation: 'Checked in the kernel with standard axioms only. The signed Ate comparison, pairing non-degeneracy, and ConcreteBlsLaws pairing equivalence remain open.' }
)

export const FINDINGS: Finding[] = [
  ...AUDIT_FINDINGS,
  ...COMPRESS_PROOFS,
  ...BLS_PROOFS,
  ...KZG_XMSS_PROOFS,
]

export function renderMarkdownReport(title: string, items: Finding[], prNumber = 55): Response {
  const lines: string[] = [
    `# ${title}`,
    "",
    "- **Repository**: https://github.com/ethereum/EthLib",
    `- **Pull Request**: https://github.com/ethereum/EthLib/pull/${prNumber}`,
    "",
  ];

  for (const f of items) {
    lines.push(`## ${f.id} [${f.severity}]: ${f.title}`);
    lines.push(`- **Component**: \`${f.component}\``);
    lines.push("");
    lines.push(f.severity === "Proof" ? "### Specification & Scope" : "### Issue");
    lines.push(f.issue);
    lines.push("");
    if (f.codeSnippet) {
      lines.push("```lean");
      lines.push(f.codeSnippet);
      lines.push("```");
      lines.push("");
    }
    lines.push(f.severity === "Proof" ? "### Theorems Proved" : "### Options");
    for (const opt of f.options) {
      lines.push(`- ${opt}`);
    }
    lines.push("");
    lines.push(f.severity === "Proof" ? "### Verification Status" : "### Resolution");
    lines.push(f.recommendation);
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
