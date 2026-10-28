import type { Finding } from "../ethlib_audit_report/data";

export const CELL_ROUNDTRIP: Finding[] = [
  {
    "id": "C1",
    "severity": "Proof",
    "component": "EthLib/Cryptography/Proofs/Kzg/Cells.lean",
    "title": "Cell bytes decode to the same 64 field elements",
    "issue": "For any 64-element array of canonical field values, serializing it to a 2,048-byte cell and decoding it returns exactly the original array. The only hypothesis is the array length.",
    "codeLang": "lean",
    "codeSnippet": "theorem cellToCosetEvals_cosetEvalsToCell\n    (ys : CosetEvals)\n    (hsize : ys.size = FIELD_ELEMENTS_PER_CELL) :\n    cellToCosetEvals (cosetEvalsToCell ys) = .ok ys",
    "options": [
      "Each 32-byte chunk decodes successfully using the existing field round-trip proof.",
      "The decoder preserves all 64 values in order; its size and field-error checks succeed."
    ],
    "recommendation": "Commit 58c062d: full build passed (3,557 jobs), declaration checker passed (10 existing exceptions; zero new or stale), and the theorem uses only propext, Classical.choice and Quot.sound. Astra and Gemini reviewed this proof. PR #126 is open. This does not certify the trusted setup or complete KZG verification."
  }
];
