import type { ScopeBoundaryItem, TrackCardSummary } from './types'
import { ROUTES } from './routes'

export const MERMAID_PIPELINE = `flowchart TB
    subgraph Upstream["Pinned Executable Specs (SHA256-locked)"]
        EELS["Execution Layer (Python EELS)<br/>ethereum/execution-specs@16898000<br/>amsterdam/vm, state_tracker, block_access_lists"]
        GLOAS["Consensus Layer (Python pyspec)<br/>ethereum/consensus-specs@aa16bb4c<br/>v1.7.0-beta.4 · specs/gloas/beacon-chain & fork"]
        PRs["Candidate 8037 Variants & Prototype<br/>EIPs#12581 (D1..D13R) · EIPs#12582 (D13S/D13A)<br/>Nethermind #15187 DELEGATECALL check"]
    end

    subgraph Lean["Lean 4.31 Formal Model (0 sorryAx · 0 native_decide)"]
        Map["61 symbol mappings in source-map.yaml<br/>(23 SHA256-locked upstream files)"]
        Core["Executable state & meter transitions<br/>ElCore · Gas/Spec · CallTree · Eip12582 · Eip8246 · Gloas7732"]
        Proofs["51 positive invariant theorems<br/>+ 10 edge-case counterexamples + 14 #12582 theorems"]
        Map --> Core --> Proofs
    end

    subgraph Gates["Verification Gates"]
        Diff["21 C-ABI @[export] functions<br/>differentially tested vs upstream Python"]
        Mut["13 explicit mutant / refuter kill-checks<br/>+ reproducible Gloas pyspec test"]
    end

    EELS --> Map
    GLOAS --> Map
    PRs --> Core
    Core --> Diff
    Proofs --> Mut`

export const TRACK_CARDS: TrackCardSummary[] = [
  {
    id: 'gas',
    href: ROUTES.gas.href,
    title: '2D State Gas & Reservoir',
    sub: 'EIP-8037 / 8038 / 2780 / 7778',
    contacts: 'Marius van der Wijden · Maria Silva',
    sourceTarget: 'amsterdam/vm/{gas,interpreter,eoa_delegation}.py + #12581 / #12582',
    coverageBadge: '21 ledger + 14 #12582 + 11 shared EL',
    bottomLine:
      'Compares Amsterdam D0, #12581, and #12582 on multi-frame call trees ahead of ACDT #103 (16 Nov).',
    highlights: [
      '2D charge/spill/LIFO refund soundness, EIP-7778 dual block cap, and root refundCounter >= 0.',
      'Refutes D13S on 3 multi-frame traces; verifies D13A non-increasing gas_left and bounded callee drain.',
      'Catches Nethermind #15187 DELEGATECALL allowance clamp breaking 4x max-size proxied factory deploys.'
    ],
    edgeCasesLine: '4 Gas edge cases + 3 D13S trace refutations → /glamsterdam_gas'
  },
  {
    id: 'eip8246',
    href: ROUTES.eip8246.href,
    title: 'Account Cleanup & ETH Conservation',
    sub: 'EIP-8246 × EIP-7928 BAL',
    contacts: 'Paweł Bylica · Benjamin Perez',
    sourceTarget: 'amsterdam/{state_tracker,block_access_lists,fork}.py + system.py',
    coverageBadge: '11 ledger + 11 shared EL',
    bottomLine:
      'Proves SELFDESTRUCT / end-of-tx cleanup conservation and a 2-line fix for a High BAL desync.',
    highlights: [
      'Exact clear_account_preserving_balance semantics on TransactionState (deletes leaf iff balance == 0).',
      'SELFDESTRUCT wei conservation (including self-beneficiary), fee settlement, and 0 state-gas refund.',
      'Surfaces F-8246-BAL (storage_clears ignored by update_builder_from_tx) + end-to-end patched proof.'
    ],
    edgeCasesLine: '1 High EELS × BAL desync · 1 Low sys-tx omission → /glamsterdam_8246'
  },
  {
    id: 'epbs',
    href: ROUTES.epbs.href,
    title: 'ePBS & Builder Queues',
    sub: 'Gloas EIP-7732 + EIP-8282',
    contacts: 'Potuz',
    sourceTarget: 'specs/gloas/{beacon-chain,fork}.md (v1.7.0-beta.4)',
    coverageBadge: '17 ledger entries',
    bottomLine:
      'Verifies five core Gloas consensus invariants and isolates five pyspec boundary bugs.',
    highlights: [
      'Supply neutrality (no saturating_sub minting) and single settlement across all 4 confirmation timings.',
      'Proposer payment guarantee and unconditional per-validator attestation quorum cap.',
      'Same-slot unbundling at the CL commitment boundary + 5 pyspec refuters (incl. slashed payment resurrection).'
    ],
    edgeCasesLine: '5 Gloas pyspec edge cases → /glamsterdam_epbs'
  }
]

export const OVERVIEW_SCOPE_GAPS: ScopeBoundaryItem[] = [
  {
    label: 'Off-chain eth_estimateGas & fixed-budget subcalls above 2^24',
    detail:
      'Estimators that binary-search on gasleft() deltas miss reservoir draws when tx.gas > 16,777,216, and a fixed-budget subcall (e.g. {gas: 150_000}) can fail below 2^24 yet succeed above 2^24. This RPC/estimator layer is not yet modeled in Lean.'
  },
  {
    label: 'Full INV-8 mined-OOG 7702 replay trace',
    detail:
      'We proved empty-leaf equivalence (account_exists == is_account_alive on pruned state) and pre-dispatch 7702 OOG ordering, not yet the full trace where an OOGed 7702 authorization is mined and replayed.'
  },
  {
    label: 'Targeted state projections & external contract prevalence',
    detail:
      'Gloas7732 models targeted projections of BeaconState (with fork-choice.md & P2P out of scope), Eip8246 balance conservation uses a two-account transfer projection alongside full finite-map storage tracking, and deployed-bytecode scanning belongs to ChainSecurity, Dedaub, and EF’s repricing tool.'
  }
]
