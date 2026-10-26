export type Severity = 'High' | 'Medium' | 'Low'

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

export const FINDINGS: Finding[] = [
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
    title: '`partial def` on `Fp2.powNat`, `Fp12.powNat`, and `millerLoop` blocks kernel verification',
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
      'Option A. It takes less than 10 lines and unlocks kernel unfolding across the entire pairing, signature, and KZG stack.'
  },
  {
    id: 'F4',
    severity: 'High',
    component: 'EthLib/Cryptography/Proofs/**',
    title: 'Proof coverage gaps and `native_decide` contamination of `G1.uncompress_compress`',
    issue:
      'In-kernel axiom auditing (`Lean.collectAxioms`) showed that `G1.uncompress_compress` depends on `native_decide` solely because `uncompress_infinityBytes` used `by native_decide`, and `Blake2s.sigma_row_permutation` used 10 `native_decide` calls on a $10 \\times 16$ table. In addition, $\\mathbb{F}_{p^2}$, $\\mathbb{F}_{p^6}$, $\\mathbb{F}_{p^{12}}$, $\\mathbb{G}_2$, `Pairing`, `HashToCurve`, `Sha256`, and `Signatures` had zero proof files.',
    codeLang: 'lean',
    codeSnippet: `private theorem uncompress_infinityBytes :
    uncompress infinityBytes = .ok G1.zero := by native_decide`,
    options: [
      'Option A: Replace `native_decide` in `uncompress_infinityBytes` and `sigma_row_permutation` with kernel reductions (`decide`), and add `Proofs/Bls/Pairing.lean`.',
      'Option B: Keep `native_decide` in the trusted computing base.'
    ],
    recommendation:
      'Option A. Eliminating `native_decide` from `G1.uncompress_compress` and `sigma_row_permutation` keeps core algebraic theorems purely inside the Lean kernel.'
  },
  {
    id: 'F5',
    severity: 'Medium',
    component: 'bindings/python/module.c, Bls/Exports.lean, Kzg/Exports.lean',
    title: 'C `extern` prototype mismatches in `module.c` and misleading `@&` borrow annotations in `Exports.lean`',
    issue:
      'Lean compiles `Unit -> UInt64` exports as `uint64_t eth_*_const_*(lean_object*)`, but `module.c` declares them as taking `(uint8_t)` (ISO C11 Undefined Behavior under CFI). Meanwhile, `Exports.lean` marks parameters with `@&` (borrowed), which Lean 4 silently strips on `@[export]` definitions while `bls.c` and `kzg.c` pass owned references.',
    codeLang: 'c',
    codeSnippet: `/* Constants.c */ LEAN_EXPORT uint64_t eth_bls_const_bytes_per_pubkey(lean_object* x_1);
/* module.c    */ extern uint64_t eth_bls_const_bytes_per_pubkey(uint8_t);`,
    options: [
      'Option A: Fix the `extern` declarations in `module.c` to take `lean_object*` (`lean_box(0)`) and remove `@&` from `@[export]` functions in `Exports.lean`.',
      'Option B: Keep `@&` via wrapper functions and add manual `lean_dec_ref` calls in C.'
    ],
    recommendation:
      'Option A. It fixes the C prototype mismatch and aligns `Exports.lean` with the owned calling convention used by `bls.c` and `kzg.c`.'
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
      'Option A. Adding explicit `NULL` checks and `PyMem_Malloc` fixes the crash paths with minimal changes.'
  },
  {
    id: 'F7',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Kzg/Recovery.lean',
    title: 'Spec version note: `recoverCellsAndKzgProofs` requires strictly ascending `cellIndices`',
    issue:
      '`recoverCellsAndKzgProofs` rejects unsorted `cellIndices` with `.indicesNotAscending`. Earlier `consensus-specs` (v1.5.0) only checked for duplicates and bounds, whereas newer Fulu specs and `EthLib` test vectors require strict ascending order.',
    codeLang: 'lean',
    codeSnippet: `if (Array.range (cellIndices.size - 1)).any
    (fun i => cellIndices[i + 1]! ≤ cellIndices[i]!) then
  throw .indicesNotAscending`,
    options: [
      'Option A: Keep the strict ascending check (matching Fulu vectors and `Proofs/Kzg/Recovery.lean`) and document the precondition.',
      'Option B: Sort `(cellIndices, cells)` internally before recovery.'
    ],
    recommendation:
      'Option A, as `test_recover_cells_and_kzg_proofs.py` (`test_invalid_shuffled_*`) and `Proofs/Kzg/Recovery.lean` explicitly test for `.indicesNotAscending`.'
  },
  {
    id: 'F8',
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
      'Option A: Implement projective `BEq` on `G1` and `G2` ($Z = 0$ for $\\mathcal{O}$, and $X_1 Z_2^2 = X_2 Z_1^2 \\land Y_1 Z_2^3 = Y_2 Z_1^3$ otherwise).',
      'Option B: Remove `BEq` from `G1` and `G2` and compare via `toAffine`.'
    ],
    recommendation:
      'Option A. Projective `BEq` avoids field inversions and matches the `G1Quot` relation in `Proofs/Bls/G1Group.lean`.'
  },
  {
    id: 'F9',
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
    id: 'F10',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Kzg/Polynomials.lean',
    title: 'Zero-divisor, trailing-zero, and degree bound edge cases in `Polynomials.lean`',
    issue:
      '`dividePolynomialcoeff` checks `a.size < b.size` before checking if $b = 0$ (accepting `dividePolynomialcoeff #[1] #[0, 0] = .ok #[]`) and rejects valid non-zero divisors with trailing high-degree zeros (`#[2, 0]`). `multiplyPolynomialcoeff` is off by one on the max degree bound (`a.size + b.size` vs. `a.size + b.size - 1`) and returns `#[0]` on empty inputs.',
    codeLang: 'lean',
    codeSnippet: `IO.println (dividePolynomialcoeff #[1] #[0, 0])    -- Except.ok #[]
IO.println (dividePolynomialcoeff #[2, 4] #[2, 0]) -- Except.error zeroDivisorPolynomial`,
    options: [
      'Option A: Strip trailing high-degree zeros from `b`, check `b.isEmpty` before `a.size < b.size`, and fix the empty/size checks in `multiplyPolynomialcoeff`.',
      'Option B: Enforce a canonical non-zero leading coefficient via a subtype.'
    ],
    recommendation:
      'Option A. It fixes all three edge cases while preserving the plain `Array Fr` representation.'
  },
  {
    id: 'F11',
    severity: 'Medium',
    component: 'EthLib/Cryptography/Bls/HashToCurve.lean, Kzg/Core.lean, Cells.lean',
    title: 'Raw `panic!` in `simpleSwu`, unvalidated empty DST in `expandMessageXmd`, and `.toOption.get!`',
    issue:
      '`simpleSwu` has a raw `panic!` in its `else` branch even though at least one of $g(x_1)$ or $g(x_2)$ is mathematically guaranteed to be a quadratic residue in $\\mathbb{F}_{p^2}$. `expandMessageXmd` does not reject an empty DST (`dst.size == 0`, violating RFC 9380 section 3.1), and `Kzg/Core.lean` and `Cells.lean` use `(G1.uncompress ...).toOption.get!`.',
    codeLang: 'lean',
    codeSnippet: `let x :=
  if isSquare gx1 then x1
  else if isSquare gx2 then x2
  else panic! "neither gx1 nor gx2 is a square"`,
    options: [
      'Option A: Return `x2` in the `else` branch of `simpleSwu`, guard `dst.size == 0` in `expandMessageXmd`, and return the validated `G1` point from `validateKzgG1Point` instead of calling `.toOption.get!`.',
      'Option B: Propagate `Except` across `HashToCurve`.'
    ],
    recommendation:
      'Option A. It makes `simpleSwu` total and panic-free, enforces RFC 9380 non-empty DSTs, and removes `.toOption.get!`.'
  },
  {
    id: 'F12',
    severity: 'Medium',
    component: 'setup.py, .github/workflows/ci.yml',
    title: '`setup.py` builds all ~3,350 Mathlib + Proof modules during wheel packaging, and CI skips `pytest`',
    issue:
      '`setup.py` runs `lake build` instead of `lake build EthLib`, compiling ~3,350 Mathlib and `Proofs` modules when building the Python wheel even though the C extension only links `EthLib`. In addition, `.github/workflows/ci.yml` never builds or tests the Python bindings.',
    codeLang: 'python',
    codeSnippet: `# setup.py:71
subprocess.check_call(["lake", "build"], cwd=REPO_ROOT)`,
    options: [
      'Option A: Change `setup.py` to run `["lake", "build", "EthLib"]` and add `pytest` to `.github/workflows/ci.yml`.',
      'Option B: Remove `@[default_target]` from `lean_lib Proofs` in `lakefile.lean`.'
    ],
    recommendation:
      'Option A. `lake build` still checks all proofs by default, while `pip install .` only builds `EthLib`.'
  },
  {
    id: 'F13',
    severity: 'Low',
    component: 'EthLib/Cryptography/Bls/Compress.lean, Signatures.lean, Kzg/Core.lean',
    title: 'Redundant double $\\mathbb{G}_1$ decompression and redundant subgroup check in `fastAggregateVerify`',
    issue:
      '`G1.keyValidate` and `validateKzgG1` discard the decompressed $\\mathbb{G}_1$ point, forcing every caller to run `G1.uncompress` (`Fp.sqrt`) a second time. In `fastAggregateVerify`, the sum of validated public keys is re-compressed to bytes and passed to `coreVerify`, which decompresses it twice and re-runs a 255-bit $r \\cdot P = \\mathcal{O}$ subgroup check.',
    codeLang: 'lean',
    codeSnippet: `match G1.keyValidate pubkey with
| .error _ => false
| .ok () =>
  match G1.uncompress pubkey, G2.uncompress signature with ...`,
    options: [
      'Option A: Add `G1.keyValidatePoint` and `coreVerifyPoint` so validated $\\mathbb{G}_1$ points are reused directly without re-decompression.',
      'Option B: Keep the double decompression as-is.'
    ],
    recommendation:
      'Option A. It cuts $\\mathbb{G}_1$ decompressions in half while keeping `G1.keyValidate` compatible with existing proofs.'
  },
  {
    id: 'F14',
    severity: 'Low',
    component: 'EthLib/Cryptography/Xmss/Types.lean, Proofs/Xmss/Types.lean',
    title: 'Missing XMSS `PublicKey` and `Signature` byte serializers',
    issue:
      '`Xmss/Constants.lean` exports `BYTES_PER_PUBLIC_KEY` and `BYTES_PER_SIGNATURE` and `Xmss/Errors.lean` defines `.badPublicKeySize` and `.badSignatureSize`, but `PublicKey` and `Signature` had no `toBytes` / `ofBytes` serialization functions.',
    codeLang: 'lean',
    codeSnippet: `| badPublicKeySize (got : Nat)
| badSignatureSize (got : Nat)`,
    options: [
      'Option A: Implement `PublicKey.toBytes`/`ofBytes` and `Signature.toBytes`/`ofBytes` in `Xmss/Types.lean` and prove their round-trip theorems in `Proofs/Xmss/Types.lean`.',
      'Option B: Remove the unused constants and error constructors.'
    ],
    recommendation:
      'Option A. Adding `toBytes`/`ofBytes` and their round-trip proofs completes the XMSS serialization boundary.'
  }
]
