export type Severity = 'High' | 'Medium' | 'Low'

export interface Finding {
  id: string
  severity: Severity
  component: string
  title: string
  context: string
  issue: string
  codeSnippet?: string
  options: string[]
  recommendation: string
}

export interface ProofRow {
  subsystem: string
  module: string
  status: string
  notes: string
}

export const FINDINGS: Finding[] = [
  {
    id: 'F1',
    severity: 'High',
    component: 'EthLib/Cryptography/Bls/Pairing.lean',
    title: 'Incomplete affine formulas in millerAdd and millerDouble, and ignored P.inf in millerLoop',
    context:
      'The BLS12-381 pairing engine embeds G1 and G2 points into the degree-12 extension field Fp12 as affine points with an explicit infinity flag (`EmbeddedPoint`), then runs the Miller loop (`millerLoop`) using `millerDouble` and `millerAdd`.',
    issue:
      'In `millerAdd`, the chord slope `Line.addSlope` computes `(y2 - y1) * (x2 - x1).inverse` without checking whether `T.x == R0.x`. Because `Fp12.inverse 0` returns `0` in Lean, calling `millerAdd` when `T = R0` (doubling) or `T = -R0` (vertical line to infinity) silently sets the slope to `0` and produces a bogus non-infinity point (`inf := false`). Similarly, `millerDouble` inverts `2 * T.y` without checking `T.y == 0` (2-torsion points), and `millerLoop` never checks `P.inf` (evaluating lines at affine `(0, 0)` when `P` is `Embedded.ofG1 G1.zero`). In production paths through `pairingCheck`, infinity pairs are filtered out beforehand and inputs are prime-order subgroup points, so this is not exploitable through the public signature API today, but the functions themselves violate the group and pairing laws on general inputs.',
    codeSnippet: `#eval do
  let p := Embedded.ofG2 G2.generator
  let q := Embedded.ofG1 G1.generator
  let qZero := Embedded.ofG1 G1.zero
  -- All three print false in unpatched EthLib:
  IO.println (millerLoop 2 p qZero == Fp12.one)
  IO.println ((millerAdd p p q).1 == (millerDouble p q).1)
  let negP : EmbeddedPoint := { x := p.x, y := -p.y, inf := false }
  IO.println (millerAdd p negP q).1.inf`,
    options: [
      'Option A: Keep the incomplete formulas and add preconditions (`T.x != R0.x`, `!P.inf`, `!R0.inf`) to every future theorem about `millerAdd`, `millerDouble`, and `millerLoop`.',
      'Option B: Make `millerAdd`, `millerDouble`, and `millerLoop` total and algebraically complete by handling `R0.inf || P.inf` at the start of `millerLoop`, checking `T.x == R0.x` in `millerAdd` (delegating to `millerDouble` when `T.y == R0.y` and returning `inf := true` with vertical line `P.x - T.x` when `T = -R0`), and checking `T.y == 0` in `millerDouble`.',
      'Option C: Rewrite the Miller loop in homogeneous projective coordinates over Fp2 to avoid field inversions inside the loop.'
    ],
    recommendation:
      'Our agent quorum recommends Option B right now (and Option C later if raw pairing speed becomes a priority). Option B is a small, localized change that makes `millerAdd`, `millerDouble`, and `millerLoop` unconditionally sound on all `EmbeddedPoint` values and lets us prove their identity and doubling laws directly.'
  },
  {
    id: 'F2',
    severity: 'High',
    component: 'EthLib/Cryptography/Kzg/Cells.lean, Kzg/Exports.lean',
    title: 'Missing input validation, transcript mismatch, and out-of-bounds get! in computeVerifyCellKzgProofBatchChallenge',
    context:
      'EIP-7594 (PeerDAS) batch cell verification derives a Fiat-Shamir challenge `r` by hashing commitments, commitment indices, cell indices, coset evaluations, and KZG proofs. `EthLib` exposes this challenge calculation directly to C and Python through `computeVerifyCellKzgProofBatchChallengeExport`.',
    issue:
      'While `verifyCellKzgProofBatch` validates all array lengths and index bounds before calling `computeVerifyCellKzgProofBatchChallenge`, the exported function `computeVerifyCellKzgProofBatchChallengeExport` only validates `cellToCosetEvals` on `cells`. It never checks that `commitmentIndices.size == cellIndices.size == cosetsEvals.size == proofs.size`, nor that `commitmentIndices[k] < commitments.size` or `cellIndices[k] < CELLS_PER_EXT_BLOB`. Worse, line 141 writes `cellIndices.size` into the Fiat-Shamir header while line 143 loops over `cosetsEvals.size` and indexes `commitmentIndices[k]!`, `cellIndices[k]!`, and `proofs[k]!`. If the arrays have different lengths, Lean panics and substitutes `0` or `ByteArray.empty` into the transcript hash. In addition, `unpackIndicesBE` silently truncates `b.size % 8` trailing bytes, and `computeChallengeExport` skips `blob` and `commitment` validation at the Lean export boundary.',
    codeSnippet: `// Kzg/Cells.lean:141-145
buf := buf ++ uint64ToBytesBE commitments.size
           ++ uint64ToBytesBE cellIndices.size
...
for k in [:cosetsEvals.size] do
  buf := buf ++ uint64ToBytesBE commitmentIndices[k]!
  buf := buf ++ uint64ToBytesBE cellIndices[k]!`,
    options: [
      'Option A: Validate array-length equality, index bounds, commitment/proof byte sizes, and `b.size % 8 == 0` in `Kzg/Exports.lean` (and inside `computeVerifyCellKzgProofBatchChallenge`), running `computeVerifyCellKzgProofBatchChallengeExport` and `computeChallengeExport` inside `runKzg`.',
      'Option B: Remove `computeVerifyCellKzgProofBatchChallengeExport` and `computeChallengeExport` from the public C ABI and keep them as private internal helpers.'
    ],
    recommendation:
      'Our quorum recommends Option A because the Python test suite (`bindings/python/tests/kzg/`) calls both exports directly. Adding full validation inside `Exports.lean` and `Cells.lean` keeps the test surface intact while closing the out-of-bounds panic and transcript mismatch.'
  },
  {
    id: 'F3',
    severity: 'High',
    component: 'EthLib/Cryptography/Bls/Fp2.lean, Fp12.lean, Pairing.lean',
    title: 'partial def on Fp2.powNat, Fp12.powNat, and millerLoop blocks kernel verification of pairing, signatures, and KZG',
    context:
      '`Fp2.powNat`, `Fp12.powNat`, and `millerLoop` implement binary exponentiation and the Miller loop recursion at the heart of the BLS12-381 pairing.',
    issue:
      'In Lean 4, marking a function `partial def` compiles it for native execution, but makes it completely opaque to the logical kernel. No unfolding or equational lemmas exist for a `partial def`; the kernel treats it as an uninterpreted constant of an `Inhabited` type. Even though `Fp.powNat` and `Fr.powNat` were already made total with `termination_by e`, `Fp2.powNat`, `Fp12.powNat`, and `millerLoop` were left as `partial def`. As a result, `Fp2.sqrt`, `G2.uncompress`, `finalExponentiation`, `pairingCheck`, `Signatures.coreVerify`, `Signatures.ethFastAggregateVerify`, and `Kzg.verify*` cannot be unfolded or proved in Lean. This is also why `CeremonyChecks.lean` had to leave `ConcreteBlsLaws` as an uninstantiated structure hypothesis.',
    codeSnippet: `// Bls/Fp2.lean:64 & Bls/Fp12.lean:65
partial def powNat (a : Fp2) (e : Nat) : Fp2 := ...

// Bls/Pairing.lean:130
partial def millerLoop (n : Nat) (R0 P : EmbeddedPoint) : Fp12 := ...`,
    options: [
      'Option A: Replace `partial def` on `Fp2.powNat` and `Fp12.powNat` with `def ... termination_by e` (matching `Fp.powNat` and `Fr.powNat`), and remove `partial` from `millerLoop` (whose inner `go` loop is already structurally recursive on `i : Nat`).',
      'Option B: Keep `partial def` on the executable functions and define separate shadow functions in `Proofs/` for verification.'
    ],
    recommendation:
      'Our quorum strongly recommends Option A. Removing `partial` takes less than 10 lines of changes, requires no shadow duplication, and immediately unlocks kernel unfolding for the entire pairing, signature, and KZG verification stack.'
  },
  {
    id: 'F4',
    severity: 'High',
    component: 'EthLib/Cryptography/Proofs/**',
    title: 'Proof coverage gaps across BLS, KZG, and XMSS, plus native_decide contamination of G1.uncompress_compress',
    context:
      '`EthLib` contains 32 proof files (`EthLib/Cryptography/Proofs/`) with 1,190 theorems covering prime fields, G1 arithmetic, FFT, barycentric interpolation, and XMSS.',
    issue:
      'We ran an in-kernel transitive axiom audit (`Lean.collectAxioms`) across all 1,190 theorems. While 0 theorems use `sorryAx`, 15 theorems depend on non-kernel native evaluation axioms (`native_decide` or `bv_decide`). In particular, the flagship theorem `G1.uncompress_compress` (`Proofs/Bls/Compress.lean:465`) is contaminated by `native_decide` only because a private helper lemma `uncompress_infinityBytes` (`Compress.lean:319`) uses `by native_decide` on a 48-byte constant where `G1.uncompress` returns `.ok G1.zero` before even touching `Fp.sqrt`. Similarly, `Blake2s.sigma_row_permutation` uses 10 `native_decide` axioms on a 10x16 table of small integers where `decide` finishes in milliseconds. Beyond axiom hygiene, zero proofs currently exist for `Fp2`, `Fp6`, `Fp12`, `G2`, `Pairing`, `HashToCurve`, `Sha256`, `Signatures`, KZG proof completeness (`verifyKzgProof (computeKzgProof blob z)`), or Reed-Solomon polynomial recovery (`recoverPolynomialcoeff`).',
    codeSnippet: `// Proofs/Bls/Compress.lean:319
private theorem uncompress_infinityBytes :
    uncompress infinityBytes = .ok G1.zero := by native_decide`,
    options: [
      'Option A: Replace `native_decide` in `uncompress_infinityBytes` and `Blake2s.sigma_row_permutation` with kernel reductions (`decide` / `simp`), add `Proofs/Bls/Pairing.lean` for the newly total Miller loop and tower exponentiation, and add a CI axiom gate (`Lean.collectAxioms`) so future PRs cannot accidentally introduce `native_decide` into core algebraic theorems.',
      'Option B: Leave `native_decide` in place and document that the trusted computing base includes the Lean native compiler and C runtime.'
    ],
    recommendation:
      'Our quorum recommends Option A. Using `native_decide` for heavy 1024-byte SHA2/Blake2s known-answer vectors is understandable, but contaminating `G1.uncompress_compress` and `sigma_row_permutation` with `native_decide` is accidental and easy to eliminate in-kernel.'
  },
  {
    id: 'F5',
    severity: 'Medium',
    component: 'bindings/python/module.c, Bls/Exports.lean, Kzg/Exports.lean',
    title: '9 C extern prototype mismatches in module.c (ISO C11 UB) and contradictory @& borrow annotations in Exports.lean',
    context:
      'The Python C extension (`bindings/python/`) links against `@[export]` C symbols generated by Lean from `Bls/Constants.lean`, `Kzg/Constants.lean`, `Bls/Exports.lean`, and `Kzg/Exports.lean`.',
    issue:
      'Inspecting the generated C files in `.lake/build/ir/` revealed two ABI mismatches. First, in `Constants.c`, Lean compiles `Unit -> UInt64` functions as `uint64_t eth_*_const_*(lean_object* x_1)`, where `Unit` is a pointer (`lean_object*`). Yet `bindings/python/module.c:24-72` declares all 9 constant getters as taking `(uint8_t)` and calls them with `0`. Calling a function through a mismatched C prototype is Undefined Behavior under ISO C11 section 6.5.2.2p9 and aborts under Control-Flow Integrity (`-fsanitize=cfi-icall`). Second, every function in `Bls/Exports.lean` and `Kzg/Exports.lean` marks its inputs with `@&` (borrowed), while `bls.c` and `kzg.c` pass freshly allocated `m_rc = 1` objects inline without calling `lean_dec_ref`. In Lean 4.29, `@[export]` silently strips `@&` from the exported C function and compiles it as owned (emitting `lean_dec_ref` inside the export, which we verified across 80,000 iterations in a native C harness). Thus the two mistakes cancel each other out today, but leave misleading `@&` annotations in `Exports.lean`.',
    codeSnippet: `/* Emitted in .lake/build/ir/EthLib/Cryptography/Bls/Constants.c */
LEAN_EXPORT uint64_t eth_bls_const_bytes_per_pubkey(lean_object* x_1);

/* Declared in bindings/python/module.c:24-27 */
extern uint64_t eth_bls_const_bytes_per_pubkey(uint8_t);`,
    options: [
      'Option A: Fix all 9 `extern uint64_t eth_*_const_*` declarations in `module.c` to take `lean_object*` and pass `lean_box(0)`, and remove the misleading `@&` borrow annotations from `@[export]` definitions in `Bls/Exports.lean` and `Kzg/Exports.lean`.',
      'Option B: Keep `@&` in `Exports.lean` by exporting thin wrappers and manually calling `lean_dec_ref` on every temporary `ByteArray` and `Array` in `bls.c` and `kzg.c`.'
    ],
    recommendation:
      'Our quorum recommends Option A. Letting the exported C functions consume their freshly constructed arguments is cleaner and less error-prone on the C side, and removing `@&` aligns the Lean source with what the Lean compiler actually emits.'
  },
  {
    id: 'F6',
    severity: 'Medium',
    component: 'bindings/python/kzg.c, bls.c, module.c',
    title: 'Unchecked NULL returns from PyList_New and PyBytes_FromStringAndSize, C99 VLAs, missing thread init, and swallowed errors',
    context:
      '`bindings/python/kzg.c`, `bls.c`, and `module.c` marshal Python bytes and lists to and from the Lean runtime.',
    issue:
      'In `kzg.c`, `py_compute_kzg_proof` (lines 195-200), `py_compute_cells` (lines 331-335), `py_compute_cells_and_kzg_proofs` (lines 359-371), and `py_recover_cells_and_kzg_proofs` (lines 520-532) do not check `PyList_New` or `PyBytes_FromStringAndSize` for `NULL` before passing them to `PyList_SET_ITEM` or `PyTuple_Pack`, causing a segmentation fault on allocation failure. In addition, `bls.c:35` and `kzg.c:144,165,187,242,387` allocate output buffers as runtime-sized C99 VLAs (`uint8_t out[BYTES_PER_PUBKEY]`, where `BYTES_PER_PUBKEY` is a non-const global loaded at init), which is not portable to MSVC. Moreover, `run_io_into_bytearray` and `run_io_into_bool` print Lean errors directly to `stderr` via `lean_io_result_show_error` and raise a generic `RuntimeError("<fn> failed")`, and non-main Python threads calling into the extension never invoke `lean_initialize_thread()`.',
    codeSnippet: `// bindings/python/kzg.c:359-367
PyObject* cells = PyList_New(CELLS_PER_EXT_BLOB);
PyObject* proofs = PyList_New(CELLS_PER_EXT_BLOB);
for (size_t i = 0; i < CELLS_PER_EXT_BLOB; i++) {
  PyList_SET_ITEM(cells, i,
    PyBytes_FromStringAndSize((const char*) (buf + i * BYTES_PER_CELL), BYTES_PER_CELL));
  ...
}`,
    options: [
      'Option A: Check every `PyList_New` and `PyBytes_FromStringAndSize` return value for `NULL` with proper cleanup, replace the runtime VLAs with heap/fixed buffers, and remove the dead `n == 0` fallback in `bls.c:64`.',
      'Option B: Wrap the C extension in Cython or CFFI instead of hand-written CPython C API code.'
    ],
    recommendation:
      'Our quorum recommends Option A. The existing C extension is compact and fast; adding proper `NULL` checks and replacing the runtime VLAs fixes the crash paths with minimal churn.'
  },
  {
    id: 'F7',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Kzg/Recovery.lean',
    title: 'Spec note: recoverCellsAndKzgProofs requires strictly ascending cellIndices',
    context:
      '`recoverCellsAndKzgProofs` (`Kzg/Recovery.lean:130-166`) reconstructs all 128 cells and KZG proofs of an extended blob from at least 64 known cells.',
    issue:
      'At lines 150-154, `recoverCellsAndKzgProofs` rejects `cellIndices` unless they are strictly ascending (`cellIndices[i + 1]! <= cellIndices[i]!`), throwing `.indicesNotAscending`. Note that earlier revisions of `ethereum/consensus-specs` (v1.5.0) only required `cell_indices` to be duplicate-free and in range, whereas newer Fulu drafts and `EthLib`s own test vectors (`test_recover_cells_and_kzg_proofs.py:124-145`) enforce strict ascending order to rule out duplicates and unsorted inputs in a single pass.',
    codeSnippet: `// Kzg/Recovery.lean:152-154
if (Array.range (cellIndices.size - 1)).any
    (fun i => cellIndices[i + 1]! ≤ cellIndices[i]!) then
  throw .indicesNotAscending`,
    options: [
      'Option A: Keep the strict ascending check (matching Fulu test vectors and `recoverCellsAndKzgProofs_indicesNotAscending` in `Proofs/Kzg/Recovery.lean`) and document clearly that callers must pass sorted `cellIndices`.',
      'Option B: Sort `(cellIndices, cells)` internally before running Reed-Solomon recovery.'
    ],
    recommendation:
      'Our quorum recommends Option A because `EthLib`s test suite (`test_invalid_shuffled_*`) and `Proofs/Kzg/Recovery.lean` explicitly require unsorted `cellIndices` to be rejected.'
  },
  {
    id: 'F8',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Bls/G1.lean, G2.lean',
    title: 'Derived structural BEq on G1 and G2 compares raw Jacobian coordinates instead of projective equivalence',
    context:
      '`G1` (`Bls/G1.lean:29`) and `G2` (`Bls/G2.lean:23`) represent elliptic curve points in Jacobian projective coordinates `(x, y, z)`, where `(X, Y, Z)` with `Z != 0` corresponds to the affine point `(X / Z^2, Y / Z^3)` and any point with `Z = 0` represents the point at infinity.',
    issue:
      'Both `G1` and `G2` derive `BEq` (`deriving Inhabited, BEq, Repr`), which compares `p.x == q.x && p.y == q.y && p.z == q.z` coordinate-by-coordinate. As a result, two Jacobian representations of the exact same curve point compare as `false` under `==`, and `G1.zero` (`⟨0, 1, 0⟩`) is not equal (`==`) to `(default : G1)` (`⟨0, 0, 0⟩`) even though both represent the point at infinity (`z = 0`).',
    codeSnippet: `#eval do
  let g := G1.generator
  let gScaled : G1 := { x := 4 * g.x, y := 8 * g.y, z := 2 }
  IO.println (g.toAffine == gScaled.toAffine) -- true
  IO.println (g == gScaled)                   -- false!
  IO.println (G1.zero == (default : G1))      -- false!`,
    options: [
      'Option A: Replace the derived `BEq` on `G1` and `G2` with a projective `BEq` instance that equates all `z = 0` points and checks `x1 * z2^2 == x2 * z1^2 && y1 * z2^3 == y2 * z1^3` for non-infinity points.',
      'Option B: Remove `BEq` from `G1` and `G2` altogether and force callers to compare `p.toAffine == q.toAffine`.'
    ],
    recommendation:
      'Our quorum recommends Option A. Projective `BEq` avoids expensive field inversions, matches the `G1Quot` equivalence relation already used in `Proofs/Bls/G1Group.lean`, and prevents subtle bugs if any caller uses `==` on `G1` or `G2`.'
  },
  {
    id: 'F9',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Bls/Fp2.lean, Fp6.lean, Fp12.lean, Kzg/TrustedSetup.lean',
    title: '@[inline] on Fp2/Fp6/Fp12.add and sub causes a 101,145-line (3.1 MB) C code blowup in Pairing.c, plus 726 MB init RSS',
    context:
      'Lean 4 compiles `.lean` modules to C code in `.lake/build/ir/` and optimizes allocations using its Reset/Reuse pass, which branches on `!lean_is_exclusive(obj)` to reuse memory cells in place.',
    issue:
      'While `Fp2.mul`, `Fp6.mul`, and `Fp12.mul` are marked `@[noinline]`, `Fp2.add/sub`, `Fp6.add/sub`, and `Fp12.add/sub` are explicitly marked `@[inline]`. When these nested additions and subtractions are inlined across the `Fp12 -> Fp6 -> Fp2` tower inside `millerDouble` and `millerAdd`, Lean generates 3,642 nested `!lean_is_exclusive` case-splits. As a result, the 175-line `Pairing.lean` file expands into 101,145 lines (3.1 MB) of C code (`millerAdd` alone is 56,847 lines, and `millerDouble` is 31,839 lines), stalling `clang -O3` for ~3 minutes. Separately, `TrustedSetup.lean` decompresses all 8,257 setup points eagerly at module initialization time, taking 5.27 seconds of CPU time and ~726 MB of resident memory (RSS) when importing the library.',
    codeSnippet: `$ wc -l .lake/build/ir/EthLib/Cryptography/Bls/Pairing.c
101145 .lake/build/ir/EthLib/Cryptography/Bls/Pairing.c
# millerAdd:    56,847 lines of C
# millerDouble: 31,839 lines of C`,
    options: [
      'Option A: Remove `@[inline]` from `Fp2.add/sub`, `Fp6.add/sub`, and `Fp12.add/sub` so each tower layer compiles as a small, reusable function.',
      'Option B: Keep `@[inline]` on `Fp2.add/sub` only and mark `Fp6.add/sub` and `Fp12.add/sub` as `@[noinline]`.'
    ],
    recommendation:
      'Our quorum recommends Option A. Removing `@[inline]` from `Fp2/Fp6/Fp12.add/sub` shrinks `Pairing.c` from 101,145 lines down to ~1,000 lines, speeds up C compilation by an order of magnitude, and improves instruction-cache locality.'
  },
  {
    id: 'F10',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Kzg/Polynomials.lean',
    title: 'Algebraic edge cases in dividePolynomialcoeff and multiplyPolynomialcoeff',
    context:
      '`Kzg/Polynomials.lean` provides coefficient-form polynomial arithmetic (`addPolynomialcoeff`, `multiplyPolynomialcoeff`, `dividePolynomialcoeff`, `interpolatePolynomialcoeff`) used by KZG cell proof generation and erasure recovery.',
    issue:
      'We found three algebraic edge cases in `Polynomials.lean`. First, `dividePolynomialcoeff` checks `if a.size < b.size then return #[]` before checking whether the divisor `b` is zero, so `dividePolynomialcoeff #[1] #[0, 0]` returns `.ok #[]` instead of `.error .zeroDivisorPolynomial`. Second, `interpolatePolynomialcoeff` documents that leading (high-degree) coefficients may be zero, yet `dividePolynomialcoeff` does not strip trailing high-degree zeros from `b`, rejecting valid non-zero divisors such as `#[2, 0]` with `.zeroDivisorPolynomial`. Third, `multiplyPolynomialcoeff` checks `a.size + b.size > FIELD_ELEMENTS_PER_EXT_BLOB` instead of `a.size + b.size - 1 > FIELD_ELEMENTS_PER_EXT_BLOB` (an off-by-one inherited from `consensus-specs` v1.5.0) and returns `.ok #[0]` instead of `.ok #[]` when multiplying by an empty polynomial `#[ ]`.',
    codeSnippet: `#eval do
  -- Zero divisor #[0, 0] accepted when a.size < b.size:
  IO.println (dividePolynomialcoeff #[1] #[0, 0]) -- Except.ok #[]
  -- Non-zero constant divisor #[2, 0] with trailing zero rejected:
  IO.println (dividePolynomialcoeff #[2, 4] #[2, 0]) -- Except.error zeroDivisorPolynomial`,
    options: [
      'Option A: Strip trailing high-degree zero coefficients from `b` at the start of `dividePolynomialcoeff`, check `b.isEmpty` (zero divisor) before comparing `a.size < b.size`, and handle empty inputs and the exact product size `a.size + b.size - 1` in `multiplyPolynomialcoeff`.',
      'Option B: Restrict all `PolynomialCoeff` values via a subtype invariant requiring the highest coefficient to be non-zero.'
    ],
    recommendation:
      'Our quorum recommends Option A. It preserves the simple `Array Fr` representation while making `dividePolynomialcoeff` and `multiplyPolynomialcoeff` algebraically sound on all coefficient arrays.'
  },
  {
    id: 'F11',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Bls/Errors.lean, HashToCurve.lean, Kzg/Core.lean, Cells.lean',
    title: 'panicWith_eq simp lemma vacuity on error paths, raw panic! in simpleSwu, empty DST in expandMessageXmd, and .toOption.get!',
    context:
      '`Bls/Errors.lean` defines a helper `panicWith fallback msg := panic! msg; fallback` together with `@[simp] theorem panicWith_eq : panicWith fallback msg = fallback := rfl`.',
    issue:
      'Because Lean erases the runtime `panic!` effect in the kernel, marking `panicWith_eq` as `@[simp]` causes theorems like `size_fftField` and `size_computeRootsOfUnity` to hold unconditionally even for invalid inputs that abort with a panic at runtime, and causes `computeRootsOfUnity_def` (`Proofs/Kzg/Polynomials.lean:190`) to silently simplify away its `(BLS_MODULUS - 1) % order != 0` guard. In addition, `HashToCurve.simpleSwu` (`HashToCurve.lean:137`) uses a raw `panic!` in its `else` branch (even though mathematically at least one of `gx1` or `gx2` is always a square, so returning `x2` in the `else` branch is total and panic-free), `expandMessageXmd` (`HashToCurve.lean:35`) does not reject an empty domain separation tag (`dst.size == 0`, required by RFC 9380 section 3.1), and `Kzg/Core.lean` and `Kzg/Cells.lean` use `(Bls.G1.uncompress ...).toOption.get!` (whose fallback default `⟨0, 0, 0⟩` is the point at infinity).',
    codeSnippet: `// Bls/HashToCurve.lean:135-137
let x :=
  if isSquare gx1 then x1
  else if isSquare gx2 then x2
  else panic! "neither gx1 nor gx2 is a square"`,
    options: [
      'Option A: Replace `else if isSquare gx2 then x2 else panic! ...` in `simpleSwu` with `else x2`, add `dst.size == 0` and `lenInBytes == 0` handling in `expandMessageXmd`, and return the validated `G1` point directly from `validateKzgG1Point` so `.toOption.get!` is never needed.',
      'Option B: Convert `fftField`, `computeRootsOfUnity`, and `expandMessageXmd` to return `Except` instead of using `panicWith`.'
    ],
    recommendation:
      'Our quorum recommends Option A right away (and Option B when refactoring the FFT proof APIs). Returning the validated `G1` point from `validateKzgG1Point` eliminates `.toOption.get!` and cuts G1 decompression work in half at the same time.'
  },
  {
    id: 'F12',
    severity: 'Medium',
    component: 'lakefile.lean, setup.py, .github/workflows/ci.yml, publish.yml',
    title: 'Python wheel build compiles ~3,350 Mathlib and Proof modules from scratch, and CI never tests the Python bindings',
    context:
      '`lakefile.lean` defines two targets marked `@[default_target]`: `lean_lib EthLib` (the executable cryptography library, ~80 modules with zero Mathlib dependency) and `lean_lib Proofs` (which imports Mathlib, ~3,350 modules).',
    issue:
      'In `setup.py:71`, `LakeBuildExt` runs `lake build` without specifying the `EthLib` target, and `.github/workflows/publish.yml:65` sets `CIBW_BEFORE_BUILD: lake clean` without `lake exe cache get`. As a result, building each Python wheel compiles all ~3,350 Mathlib and `Proofs` modules from scratch even though the Python C extension only links `EthLib`. Furthermore, `.github/workflows/ci.yml` only runs `lake build` and never compiles or runs `pytest` on `bindings/python/`, and the KZG pytest files only check `EthLib` against its own outputs rather than against official `ethereum/consensus-spec-tests` vectors.',
    codeSnippet: `# setup.py:71
subprocess.check_call(["lake", "build"], cwd=REPO_ROOT)
# Compiles all ~3,350 Mathlib + Proofs modules instead of just ["lake", "build", "EthLib"]!`,
    options: [
      'Option A: Change `setup.py:71` to run `["lake", "build", "EthLib"]`, add a Python extension build and test step in `.github/workflows/ci.yml`, and integrate official `consensus-spec-tests` KZG vectors.',
      'Option B: Remove `@[default_target]` from `lean_lib Proofs` in `lakefile.lean`.'
    ],
    recommendation:
      'Our quorum recommends Option A. Keeping `Proofs` as a default target for `lake build` is great for proof verification in CI, while changing `setup.py` to `lake build EthLib` makes `pip install .` and wheel builds 50x faster.'
  },
  {
    id: 'F13',
    severity: 'Low',
    component: 'EthLib/Cryptography/Bls/Compress.lean, Signatures.lean, Pairing.lean, Kzg/Cells.lean',
    title: 'Redundant double G1 decompression, redundant aggregate subgroup check, and unoptimized pairing/cell routines',
    context:
      '`G1.keyValidate` and `validateKzgG1` validate 48-byte compressed G1 points (computing a modular square root `Fp.sqrt` via `powNat` and checking subgroup membership) before signature or KZG verification.',
    issue:
      'Because `G1.keyValidate` and `validateKzgG1` return `Except Error Unit` and discard the decompressed `G1` point, every caller in `Bls/Signatures.lean`, `Kzg/Core.lean`, and `Kzg/Cells.lean` immediately calls `G1.uncompress` a second time on the exact same bytes, running `Fp.sqrt` twice per point. In `fastAggregateVerify` (`Signatures.lean:65-66`), after validating and summing all public keys into `agg : G1`, the code compresses `agg` (`Fp.inverse`) to `aggBytes` and passes `aggBytes` to `coreVerify`, which decompresses `aggBytes` twice and runs a 255-bit scalar multiplication `G1.inSubgroup` on a sum of already-validated subgroup points. Also note that `G2.inSubgroup` returns `true` on `p.isInfinity` (so `coreVerify` relies on `pairingCheck` skipping the second pair when `sig` is infinity) and runs a 255-bit scalar multiplication instead of an endomorphism check, and `finalExponentiation` uses a naive 4,314-bit exponentiation.',
    codeSnippet: `// Bls/Signatures.lean:40-44
match G1.keyValidate pubkey with
| .error _ => false
| .ok () =>
  match G1.uncompress pubkey, G2.uncompress signature with
  | .ok pk, .ok sig => ...`,
    options: [
      'Option A: Add `G1.keyValidatePoint : ByteArray -> Except BlsError G1` and `validateKzgG1Point : Bytes48 -> KzgM Bls.G1` that return the validated `G1` point directly, and pass `agg : G1` directly to an internal `coreVerifyPoint` helper in `fastAggregateVerify` (checking `!agg.isInfinity` without re-running `G1.inSubgroup` or `Fp.sqrt`).',
      'Option B: Leave the double decompression as-is to mirror the literal structure of the Python reference specs.'
    ],
    recommendation:
      'Our quorum recommends Option A. Keeping `G1.keyValidate` and `validateKzgG1` as thin wrappers preserves backward compatibility with existing proofs while eliminating half of all G1 decompressions and the redundant 255-bit subgroup scalar multiplication on `agg`.'
  },
  {
    id: 'F14',
    severity: 'Low',
    component: 'EthLib/Cryptography/Xmss/Constants.lean, Errors.lean, Types.lean, KeyGen.lean',
    title: 'Unwired XMSS C-ABI exports, missing PublicKey and Signature byte serializers, and unguarded UInt32.ofNat in SecretKey.leaves',
    context:
      '`EthLib/Cryptography/Xmss/` implements a stateful post-quantum hash-based signature scheme using Blake2s and WOTS+C target-sum encoding.',
    issue:
      '`Xmss/Constants.lean:146-188` exports 9 `eth_xmss_const_*` C symbols with a docstring stating that the Python C extension reads every size through them at module-init time, and `Xmss/Errors.lean` defines `runXmss`, `.badPublicKeySize`, and `.badSignatureSize`. Yet no `PublicKey` or `Signature` byte serialization functions exist, `unpackBytes?` has zero callers outside proofs, and no XMSS C or Python bindings exist. In addition, `SecretKey.leaves (epoch : Nat)` (`KeyGen.lean:56`) truncates `epoch` via `UInt32.ofNat` without an explicit range guard (relying on callers checking `sk.covers epoch` beforehand).',
    codeSnippet: `// Xmss/Errors.lean:30-32 (never constructed anywhere in EthLib)
| badPublicKeySize (got : Nat)
| badSignatureSize (got : Nat)`,
    options: [
      'Option A: Implement `PublicKey.toBytes` / `PublicKey.ofBytes` and `Signature.toBytes` / `Signature.ofBytes` in `Xmss/Types.lean` (using `packBytes`, `unpackBytes?`, `.badPublicKeySize`, and `.badSignatureSize`) and prove their round-trip theorems in `Proofs/Xmss/Types.lean`.',
      'Option B: Remove the unused error constructors and `@[export]` symbols until the Python XMSS bindings are ready.'
    ],
    recommendation:
      'Our quorum recommends Option A. Adding `PublicKey` and `Signature` byte serialization with formal round-trip proofs (`PublicKey.ofBytes_toBytes` and `Signature.ofBytes_toBytes`) completes the XMSS specification boundary that `Types.lean` and `Errors.lean` were designed for.'
  }
]

export const PROOF_COVERAGE: ProofRow[] = [
  {
    subsystem: 'BLS12-381',
    module: 'Fp, Fr',
    status: 'Proved in-kernel',
    notes: 'Pratt primality certificates for p and r, ZMod ring and field isomorphism.'
  },
  {
    subsystem: 'BLS12-381',
    module: 'G1 (Group, MSM, Order)',
    status: 'Proved in-kernel',
    notes: 'Weierstrass Jacobian group law, Pippenger MSM equivalence, generator order r * G = O.'
  },
  {
    subsystem: 'BLS12-381',
    module: 'Compress (G1)',
    status: 'Partial',
    notes: 'G1.uncompress_compress proved (fixed to remove native_decide in our PR). Missing converse compress_uncompress and G2 compression proofs.'
  },
  {
    subsystem: 'BLS12-381',
    module: 'Fp2, Fp6, Fp12, G2, Pairing',
    status: 'Partial (PR adds Pairing.lean)',
    notes: 'Previously blocked by partial def. Our PR makes powNat and millerLoop total and proves Miller loop identity and doubling laws. Full tower field and bilinearity proofs remain open.'
  },
  {
    subsystem: 'BLS12-381',
    module: 'HashToCurve, Sha256, Signatures',
    status: 'Unproved',
    notes: 'No formal proofs yet for SHA-256, SWU isogeny maps, or BLS signature verification.'
  },
  {
    subsystem: 'KZG / PeerDAS',
    module: 'Fft, BitReversal, Barycentric',
    status: 'Proved in-kernel',
    notes: 'NTT/FFT inverse round-trip, evaluation equivalence, bit-reversal involution, and Lagrange barycentric evaluation.'
  },
  {
    subsystem: 'KZG / PeerDAS',
    module: 'CeremonyChecks',
    status: 'Conditional',
    notes: 'Proved under an assumed ConcreteBlsLaws structure hypothesis.'
  },
  {
    subsystem: 'KZG / PeerDAS',
    module: 'Polynomials, Core, Cells, Recovery',
    status: 'Validation & shape only',
    notes: 'Proves roots of unity, output array sizes, and input validation error cases. Missing algebraic polynomial division/interpolation proofs and Reed-Solomon recovery completeness.'
  },
  {
    subsystem: 'XMSS',
    module: 'Encoding, TweakHash, Merkle, Ots, Correctness',
    status: 'Proved in-kernel',
    notes: 'End-to-end functional completeness (verify_sign, verify_keyGen_sign), WOTS+C code size and incomparability, tweak injectivity, and key/signature byte round-trip (added in our PR).'
  }
]
