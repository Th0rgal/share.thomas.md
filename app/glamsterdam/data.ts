export const PAGE_TITLE = 'Glamsterdam in Lean 4'

export const EELS_BLOB =
  'https://github.com/ethereum/execution-specs/blob/16898000911c1e3caa57be08509536c10ae92d3e'
export const GLOAS_BLOB =
  'https://github.com/ethereum/consensus-specs/blob/aa16bb4c156184e9548a997d53efaf2a228a6304'
export const EIPS_BLOB =
  'https://github.com/ethereum/EIPs/blob/ed9b712640c1646dfda7ccceca2e0fd936b6472f'
export const NETHERMIND_15187_BLOB =
  'https://github.com/NethermindEth/nethermind/blob/76ce18c734'

export const MERMAID_PIPELINE = `flowchart TB
    subgraph Upstream["Pinned Executable Specs (SHA256-locked)"]
        EELS["Execution Layer (Python EELS)<br/>ethereum/execution-specs@16898000<br/>amsterdam/vm, state_tracker, block_access_lists"]
        GLOAS["Consensus Layer (Python pyspec)<br/>ethereum/consensus-specs@aa16bb4c<br/>v1.7.0-beta.4 · specs/gloas/beacon-chain & fork"]
        PRs["Candidate 8037 Variants & Prototypes<br/>EIPs#12581 (D1..D13R) · EIPs#12582 (D13S/D13A)<br/>Nethermind #15186 / #15187 / #15203"]
    end

    subgraph Lean["Lean 4.31 Formal Model (0 sorryAx · 0 native_decide)"]
        Map["61/61 line-pinned mappings (source-map.yaml)"]
        Core["Executable state & meter transitions<br/>ElCore · Gas/Spec · CallTree · Eip12582 · Eip8246 · Gloas7732"]
        Proofs["60 kernel-checked guarantees<br/>+ 10 edge-case & mutant WitnessRefuters"]
        Map --> Core --> Proofs
    end

    subgraph Gates["Two-Way Trust Gates (turbo-lean CI)"]
        Diff["Downward check: Lean C-ABI @[export]<br/>vs AST-extracted upstream Python (pytest)"]
        Mut["Upward check: positive/negative witnesses<br/>+ 1-line bug mutation kill-tests"]
    end

    EELS --> Map
    GLOAS --> Map
    PRs --> Core
    Core --> Diff
    Proofs --> Mut`

export interface TrackSummary {
  id: string
  title: string
  sub: string
  lead: string
  sourceTarget: string
  guaranteesCount: string
  highlights: string[]
  footer: string
}

export const TRACK_SUMMARIES: TrackSummary[] = [
  {
    id: 'gas',
    title: 'Track 1 · 2D Gas & Reservoir',
    sub: 'EIP-8037 / 8038 / 2780 / 7778',
    lead: 'Maria Silva → Marius van der Wijden',
    sourceTarget: 'amsterdam/vm/{gas,interpreter,eoa_delegation}.py + #12581 / #12582',
    guaranteesCount: '22 core + #12582 suite',
    highlights: [
      '2D charge/spill/LIFO refund soundness, EIP-7778 dual block cap, and root refundCounter >= 0 telescope.',
      'Mapped theorem-by-theorem to EF’s 8 broken invariants (glamsterdam-gas-invariants).',
      'Multi-frame call-tree comparison across Osaka, D0, #12581 (D1..D13R), and #12582 (D13S / D13A).'
    ],
    footer: '3 D13S counterexamples · 1 Nethermind #15187 DELEGATECALL bug'
  },
  {
    id: 'eip8246',
    title: 'Track 2 · ETH Conservation & Cleanup',
    sub: 'EIP-8246 × EIP-7928 BAL',
    lead: 'Paweł Bylica & Benjamin Perez',
    sourceTarget: 'amsterdam/{state_tracker,block_access_lists,fork}.py + system.py',
    guaranteesCount: '11 guarantees (+11 shared EL)',
    highlights: [
      '1-to-1 ETH conservation across SELFDESTRUCT (including self-beneficiary) and fee settlement.',
      'Exact end-of-tx clear_account_preserving_balance semantics and same-tx CREATE + SELFDESTRUCT.',
      'Zero state-gas refund under 8246 + 8037; pre-existing collision storage isolated as explicit assumption.'
    ],
    footer: '1 High EELS × BAL desync · 1 Low unchecked sys-tx omission'
  },
  {
    id: 'epbs',
    title: 'Track 3 · ePBS & Builder Queues',
    sub: 'Gloas EIP-7732 + EIP-8282',
    lead: 'Potuz',
    sourceTarget: 'specs/gloas/{beacon-chain,fork}.md (v1.7.0-beta.4)',
    guaranteesCount: '16 guarantees',
    highlights: [
      'Supply neutrality (no ETH minting or saturating_sub clipping) and single bid settlement across all 4 timings.',
      'Proposer payment guarantee, unconditional attestation quorum anti-double-counting, and same-slot unbundling.',
      'Frame preservation proving untouched CL state (validators, BLS, sync committee) stays intact + 8282 queue safety.'
    ],
    footer: '5 pyspec edge-case refuters (incl. slashed payment resurrection)'
  }
]

export interface VariantComparisonRow {
  variant: string
  source: string
  setCallClearT2: string
  preCallClearT1: string
  siblingGasLeft: string
  delegateCallAllowance: string
  verdict: string
}

export const VARIANT_ROWS: VariantComparisonRow[] = [
  {
    variant: 'Amsterdam D0',
    source: 'execution-specs@16898000',
    setCallClearT2: 'Silent-failure band (parent clear refills gas_left after child OOG)',
    preCallClearT1: 'Both child & parent succeed',
    siblingGasLeft: 'g2 > g1 possible across siblings',
    delegateCallAllowance: 'Unbounded reservoir forward (INV-1)',
    verdict: 'Preserves Meter.Discipline, but leaves INV-1..6 exposure open'
  },
  {
    variant: 'EIPs#12581 (D13 / D13R)',
    source: 'ethereum/EIPs#12581',
    setCallClearT2: 'D13 closes T2; D13R re-opens T2f on post-clear subcall',
    preCallClearT1: 'D13R opens a new T1 silent-failure band',
    siblingGasLeft: 'D13 keeps g2 <= g1; D13R allows g2 > g1',
    delegateCallAllowance: 'Unbounded reservoir forward',
    verdict: 'D13 fixes dirty-clear bands, D13R trades same-child clear for new T1/T2f bands'
  },
  {
    variant: 'EIPs#12582 (D13S)',
    source: 'Early capped-repay draft',
    setCallClearT2: 'Re-opens T2 when clear happens inside a helper subcall',
    preCallClearT1: 'Strands 183,600 mid-frame after failed CREATE',
    siblingGasLeft: 'g2 > g1 (+97,920 jump on child 2 exit)',
    delegateCallAllowance: 'Violates Meter.Discipline (stateGasLeft > 0 && stateGasSpilled > 0)',
    verdict: 'Refuted on 3 reachable multi-frame traces'
  },
  {
    variant: 'EIPs#12582 (D13A)',
    source: 'Per-frame state_gas_ceiling',
    setCallClearT2: 'Closed (gas_left strictly non-increasing)',
    preCallClearT1: 'Clean-trace monotonic; 0->1->0 consumes state_gas_drawn',
    siblingGasLeft: 'g2 <= g1 across all intra-frame & exit steps',
    delegateCallAllowance: 'Inherited in spec (4x max CREATE); Nethermind #15187 capped it (fails on 4th)',
    verdict: 'Bounds untrusted callee drain by floor(g * 1530 / 200); needs client DELEGATECALL parity'
  }
]

export interface IssueLocation {
  label: string
  url: string
}

export interface AuditFinding {
  id: string
  track: 'Gas' | '8246' | 'ePBS'
  severity: 'High' | 'Medium' | 'Low'
  severityLabel: string
  locations: IssueLocation[]
  theorem: string
  description: string
}

export const AUDIT_FINDINGS: AuditFinding[] = [
  {
    id: 'F-8246-BAL',
    track: '8246',
    severity: 'High',
    severityLabel: 'High',
    locations: [
      {
        label: 'block_access_lists.py:813-825',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/block_access_lists.py#L813-L825`
      },
      {
        label: 'state_tracker.py:518-540',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/state_tracker.py#L518-L540`
      }
    ],
    theorem: 'f_8246_bal_storage_clears_ignored_refuter · t_8246_bal_patched_sound',
    description:
      'destroy_storage moves keys from tx_state.storage_writes into tx_state.storage_clears, which update_builder_from_tx ignores. In a 2-tx block (Tx 1 writes 42, Tx 2 wipes storage), BlockState ends at 0 while the EIP-7928 Block Access List retains 42.'
  },
  {
    id: 'F-12582-NM',
    track: 'Gas',
    severity: 'High',
    severityLabel: 'Spec / Client',
    locations: [
      {
        label: 'EvmInstructions.Call.cs:632 (#15187)',
        url: 'https://github.com/NethermindEth/nethermind/pull/15187'
      }
    ],
    theorem: 't_12582_prop1b_nethermind15187_proxied_factory_divergence',
    description:
      'EIPs#12582 specifies that DELEGATECALL and CALLCODE inherit parent.state_gas_ceiling, whereas Nethermind #15187 recomputed min(childExecGas * 1530 / 200, remaining) for all call types—causing a top-level proxied factory (16M exec, 160M reservoir) to fail on the 4th 24,576-byte CREATE.'
  },
  {
    id: 'F-7732-SLASH',
    track: 'ePBS',
    severity: 'Medium',
    severityLabel: 'Med-High',
    locations: [
      {
        label: 'beacon-chain.md:1578-1581',
        url: `${GLOAS_BLOB}/specs/gloas/beacon-chain.md#L1578-L1581`
      },
      {
        label: 'beacon-chain.md:1805-1814',
        url: `${GLOAS_BLOB}/specs/gloas/beacon-chain.md#L1805-L1814`
      }
    ],
    theorem: 'f_7732_slashed_payment_resurrection_refuter · t_7732_slashed_no_resurrection',
    description:
      'slash_validator zeroes matching entries in state.builder_pending_payments but leaves state.latest_execution_payload_bid.value untouched. If 2+ missed epochs elapse before the next block confirms the parent payload, apply_parent_execution_payload resurrects the slashed proposer’s revoked payment.'
  },
  {
    id: 'F-7732-FORK-BIT',
    track: 'ePBS',
    severity: 'Medium',
    severityLabel: 'Medium',
    locations: [
      {
        label: 'gloas/fork.md:198-200',
        url: `${GLOAS_BLOB}/specs/gloas/fork.md#L198-L200`
      }
    ],
    theorem: 'f_7732_fork_slot_availability_refuter',
    description:
      'upgrade_to_gloas initializes all SLOTS_PER_HISTORICAL_ROOT bits of execution_payload_availability to 0b1 after process_slot(s_fork - 1) has already run, leaving s_fork % 8192 stuck at 0b1 even if the fork-slot payload is withheld.'
  },
  {
    id: 'F-8282-CRED',
    track: 'ePBS',
    severity: 'Medium',
    severityLabel: 'Medium',
    locations: [
      {
        label: 'beacon-chain.md:2334-2361',
        url: `${GLOAS_BLOB}/specs/gloas/beacon-chain.md#L2334-L2361`
      },
      {
        label: 'gloas/fork.md:92-117',
        url: `${GLOAS_BLOB}/specs/gloas/fork.md#L92-L117`
      }
    ],
    theorem: 'f_8282_topup_credential_prefix_drop_refuter · f_7732_fork_onboard_cross_credential_refuter',
    description:
      'process_builder_deposit_request and onboard_builders_from_pending_deposits check pubkey in builder_pubkeys and 0xB0 withdrawal credentials in opposite orders: post-fork top-ups with zeroed credentials are dropped, while fork onboarding sweeps non-0xB0 deposits into an existing builder.'
  },
  {
    id: 'F-8038-7778',
    track: 'Gas',
    severity: 'Medium',
    severityLabel: 'Medium',
    locations: [
      {
        label: 'instructions/storage.py:139-151',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/vm/instructions/storage.py#L139-L151`
      },
      {
        label: 'vm/gas.py:1211-1222',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/vm/gas.py#L1211-L1222`
      }
    ],
    theorem: 'f_8038_7778_sstore_reset_refuter',
    description:
      'On a same-tx 0 -> X -> 0 reset, 97,920 state gas is credited immediately while 10,000 STORAGE_WRITE goes into refund_counter—not deducted from block execution_gas_used and clipped by the 20% refund cap when gas_used_before_refund < 50,000 (confirmed intended by Maria; EIP-7778 note pending).'
  },
  {
    id: 'F-7732-RING',
    track: 'ePBS',
    severity: 'Low',
    severityLabel: 'Low-Med',
    locations: [
      {
        label: 'beacon-chain.md:1620-1622',
        url: `${GLOAS_BLOB}/specs/gloas/beacon-chain.md#L1620-L1622`
      },
      {
        label: 'beacon-chain.md:1829',
        url: `${GLOAS_BLOB}/specs/gloas/beacon-chain.md#L1829`
      }
    ],
    theorem: 'f_7732_availability_ring_buffer_clobber_refuter',
    description:
      'When block.slot - parent_slot == k * SLOTS_PER_HISTORICAL_ROOT (8,192 skipped slots on mainnet, 64 on minimal), apply_parent_execution_payload overwrites the child slot’s freshly cleared False availability bit back to True.'
  },
  {
    id: 'F-8037-7702',
    track: 'Gas',
    severity: 'Low',
    severityLabel: 'Low',
    locations: [
      {
        label: 'vm/eoa_delegation.py:295',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/vm/eoa_delegation.py#L295-L296`
      }
    ],
    theorem: 't_8037_7702_delegation_exists_eq_alive_under_invariant',
    description:
      'set_delegation checks not account_exists(...) where all other NEW_ACCOUNT sites check not is_account_alive(...). We proved the two predicates coincide on any pruned state (NoEmptyAccountLeaves is preserved by all state_tracker mutators) and diverge only on unpruned state-test fixtures.'
  },
  {
    id: 'F-8246-SYSTX',
    track: '8246',
    severity: 'Low',
    severityLabel: 'Low',
    locations: [
      {
        label: 'amsterdam/fork.py:774-778',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/fork.py#L774-L778`
      }
    ],
    theorem: 'f_8246_unchecked_sys_tx_drops_deletes_refuter',
    description:
      'process_unchecked_system_transaction passes system_tx_state to incorporate_tx_into_block without running clear_account_preserving_balance over system_tx_output.accounts_to_delete.'
  },
  {
    id: 'F-2780-7928',
    track: 'Gas',
    severity: 'Low',
    severityLabel: 'Low',
    locations: [
      {
        label: 'vm/interpreter.py:161-196',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/vm/interpreter.py#L161-L196`
      }
    ],
    theorem: 'f_2780_7928_set_delegation_oog_omits_recipient_refuter',
    description:
      'In create_evm, set_delegation runs before recipient resolution. If charging 7702 state gas halts with OutOfGasError, process_top_level aborts before get_account(tx_env.state, recipient) records tx.to in BAL account_reads even though cold access gas was paid in intrinsic gas.'
  }
]

export interface OpenQuestionGroup {
  group: string
  contacts: string
  questions: string[]
}

export const OPEN_QUESTIONS: OpenQuestionGroup[] = [
  {
    group: 'Gas (EIP-8037 / 8038 / 2780 / 7778)',
    contacts: 'Marius van der Wijden & Maria Silva',
    questions: [
      'Ahead of ACDT #103 (16 Nov) and ACDE (19 Nov), which candidate direction is live to verify next: #12582 (D13A per-frame ceiling), RESERVOIR (#12577), a gasleft() / coefficient adjustment, or deferring 8037?',
      'Would formalizing an off-chain eth_estimateGas / fixed-budget determinism condition across the tx.gas = 2^24 reservoir threshold (Pimlico 4337 & Uniswap v4 notifyUnsubscribe cases) or full INV-8 7702 OOG-mined replay be useful?'
    ]
  },
  {
    group: 'ETH Conservation & Cleanup (EIP-8246)',
    contacts: 'Paweł Bylica & Benjamin Perez',
    questions: [
      'Is EIP-8246 staying in Glamsterdam as specified in execution-specs@16898000, or shifting toward removing 8246 in favor of EIP-7708 per-wei logs?',
      'Should update_builder_from_tx record tx_state.storage_clears in EIP-7928 Block Access Lists (as in t_8246_bal_patched_sound), and does our explicit isolation of deployment-collision wipe (deferred to EIP-8253) match your intent?'
    ]
  },
  {
    group: 'ePBS & Builder Queues (EIP-7732 + EIP-8282)',
    contacts: 'Potuz',
    questions: [
      'Do the reworked top-level theorems—supply neutrality (t_7732_no_eth_minting), proposer payment guarantee (t_7732_payment_guarantee), quorum anti-double-counting, same-slot unbundling (under A-SAME-SLOT-UNBUNDLING-BOUNDARY), and CL frame preservation (t_7732_frame)—match the properties you had in mind?',
      'For F-7732-SLASH (resurrected payment after 2+ missed epochs): should slash_validator also zero latest_execution_payload_bid.value, or drop lines 1578–1581 so builder settlement depends purely on payload confirmation / quorum?'
    ]
  }
]

export function renderMarkdown(): string {
  const lines: string[] = [
    `# ${PAGE_TITLE}`,
    '',
    'We formally verified the three Glamsterdam tracks we are auditing with Ethereum Foundation leads—**2D state gas** (`EIP-8037 / 8038 / 2780 / 7778`), **account cleanup & ETH conservation** (`EIP-8246`), and **ePBS + builder queues** (`Gloas EIP-7732 / 8282`)—in Lean 4.31 (`60` kernel-checked guarantees, `10` spec & prototype edge-case refuters, `0 sorryAx`).',
    '',
    '**Important:** our expertise is Lean 4 proof engineering and AI-assisted verification, not Ethereum protocol design. Every guarantee holds relative to the pinned executable specs and explicit boundary assumptions below; lead review of those assumptions is what turns a machine-checked theorem into something useful for the fork.',
    '',
    '## 1. What we modeled in Lean 4 (and how)',
    '',
    'Rather than formalizing prose EIPs in the abstract, we modeled the **executable Python reference specifications** line-by-line, using the EIP text as the intent to check against:',
    '',
    '- **Execution Layer (`EELS` Python code):** `ethereum/execution-specs@16898000` (`src/ethereum/forks/amsterdam/`—`vm/gas.py`, `state_tracker.py`, `vm/interpreter.py`, `vm/instructions/{storage,system}.py`, `vm/eoa_delegation.py`, `block_access_lists.py`, `fork.py`), alongside the candidate 8037 PRs (`ethereum/EIPs#12581` `D1..D13R` and `ethereum/EIPs#12582` `D13S / D13A`) and a targeted cross-check of Nethermind `#15186 / #15187 / #15203`.',
    '- **Consensus Layer (`pyspec` executable blocks):** `ethereum/consensus-specs@aa16bb4c` (`v1.7.0-beta.4`, `specs/gloas/beacon-chain.md` and `specs/gloas/fork.md`, with `fork-choice.md` and P2P gossip explicitly out of scope).',
    '- **Two-way trust gates (`turbo-lean`):** (1) *downward*—61/61 functions are SHA256-pinned in `source-map.yaml`, exported via Lean C-ABI (`@[export]`), and differentially tested against AST-extracted upstream Python (`pytest`); (2) *upward*—every guarantee carries positive/negative witnesses and 1-line bug mutation kill-tests (`WitnessRefuter`) so no theorem holds vacuously.',
    '',
    '```mermaid',
    MERMAID_PIPELINE,
    '```',
    '',
    '## 2. Verification scope across the three tracks',
    '',
    ...TRACK_SUMMARIES.flatMap((t) => [
      `### ${t.title} (${t.sub})`,
      `- **EF contacts:** ${t.lead}`,
      `- **Pinned target:** \`${t.sourceTarget}\``,
      `- **Checked closure:** ${t.guaranteesCount} (${t.footer})`,
      ...t.highlights.map((h) => `  - ${h}`),
      ''
    ]),
    '## 3. What the proofs surfaced along the way',
    '',
    '### 3.1 EIP-8037 / 8038 design variants compared in Lean',
    '',
    '| Variant | Source | Set-Call-Clear (`T2`) | Pre-Call Clear (`T1`) / `CREATE` | Cross-Sibling `gasleft()` | Callee / `DELEGATECALL` Reservoir | Takeaway |',
    '|---|---|---|---|---|---|---|',
    ...VARIANT_ROWS.map(
      (r) =>
        `| **${r.variant}** | \`${r.source}\` | ${r.setCallClearT2} | ${r.preCallClearT1} | ${r.siblingGasLeft} | ${r.delegateCallAllowance} | ${r.verdict} |`
    ),
    '',
    '### 3.2 Specification & prototype edge cases (all on unshipped Glamsterdam specs)',
    '',
    '| ID | Track | Severity | Upstream Location | Lean Refuter / Patch Proof | Description |',
    '|---|---|---|---|---|---|',
    ...AUDIT_FINDINGS.map((f) => {
      const locs = f.locations.map((l) => `[\`${l.label}\`](${l.url})`).join(' · ')
      return `| \`${f.id}\` | ${f.track} | ${f.severityLabel} | ${locs} | \`${f.theorem}\` | ${f.description} |`
    }),
    '',
    '## 4. Remaining gaps & what we still need from EF leads',
    '',
    '**Current unmodeled boundaries (do not over-read our 60 guarantees as covering these):**',
    '- **Off-chain `eth_estimateGas` / `eth_estimateUserOperationGas` binary search:** when `tx.gas > 2^24`, reservoir draws are invisible to `gasleft()` deltas (Pimlico 4337 incident & Uniswap v4 `notifyUnsubscribe{gas: 150_000}` behaving differently below vs. above `2^24`).',
    '- **Full `INV-8` replay trace:** we proved the empty-leaf `7702` equivalence and pre-dispatch OOG ordering, not yet the full "7702 OOG rolled back in a mined tx, then signature replayed" trace.',
    '- **Mainnet bytecode prevalence & multi-client differential:** deployed-contract scanning belongs to ChainSecurity / Dedaub / EF’s repricing tool; client parity beyond EELS + Nethermind `#15186–#15203` is not in this repo.',
    '',
    ...OPEN_QUESTIONS.flatMap((q) => [
      `### ${q.group} (${q.contacts})`,
      ...q.questions.map((item) => `- ${item}`),
      ''
    ])
  ]

  return lines.join('\n')
}
