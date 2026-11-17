import type {
  EfInvariantRow,
  GuaranteeCluster,
  ScopeBoundaryItem,
  TrackDecisionBox,
  VariantComparisonRow
} from './types'
import { EELS_BLOB } from './routes'

export const GAS_DECISIONS: TrackDecisionBox = {
  eyebrow: 'Input needed ahead of ACDT #103 (16 Nov) & ACDE (19 Nov)',
  contacts: 'Marius van der Wijden · Maria Silva',
  bottomLine:
    'We formalized the pinned Amsterdam D0 gas meter alongside EIPs#12581 (D1..D13R) and EIPs#12582 (D13S / D13A) in Lean 4, refuted D13S on three multi-frame traces, and caught a DELEGATECALL allowance divergence in Nethermind #15187. Whichever direction ACD selects next week, we can turn around proof + differential checks on the new spec PR immediately.',
  questions: [
    {
      prompt: 'Which candidate direction should we prioritize verifying next?',
      detail:
        'EIPs#12582 (D13A per-frame state-gas ceiling), EIPs#12577 (RESERVOIR opcode), a gasleft() / state-gas coefficient adjustment, or deferring EIP-8037 while EIP-8038 ships standalone?'
    },
    {
      prompt: 'For #12582 (if live), is parent-ceiling inheritance on DELEGATECALL / CALLCODE final?',
      detail:
        'EIPs#12582 specifies that DELEGATECALL inherits parent.state_gas_ceiling (allowing a proxied factory to deploy four 24,576-byte contracts), whereas Nethermind #15187 clamped all call kinds in EthereumGasPolicy.CreateChildFrameGas (failing on the 4th CREATE).'
    },
    {
      prompt: 'Would formalizing an RPC estimator condition or the full INV-8 replay trace help?',
      detail:
        'Two known gaps remain outside our EELS meter theorems: (a) off-chain eth_estimateGas binary search & fixed-budget subcall determinism across the tx.gas = 2^24 reservoir threshold, and (b) the end-to-end INV-8 trace where a 7702 authorization OOGs inside a mined transaction and is replayed.'
    }
  ]
}

export const GAS_VARIANT_ROWS: VariantComparisonRow[] = [
  {
    variant: 'Amsterdam D0',
    source: 'execution-specs@16898000',
    setCallClear:
      'Silent child-failure band: parent 1 -> 0 clear refills gas_left after child OOG',
    preCallClearOrCreate: 'Pre-call 0 -> 1 -> 0 clear succeeds in both child and parent',
    siblingGasLeft: 'g2 > g1 possible across sibling calls',
    calleeReservoir: 'Unbounded reservoir forwarded to untrusted callee (INV-1)',
    verdict: 'Preserves spill invariant, but leaves INV-1..6 exposure open'
  },
  {
    variant: 'EIPs#12581 (D13 / D13R)',
    source: 'ethereum/EIPs#12581',
    setCallClear:
      'D13 closes set-call-clear; D13R re-opens it whenever a post-clear subcall runs',
    preCallClearOrCreate:
      'D13R introduces a new silent-failure band on pre-call 0 -> 1 -> 0 clear',
    siblingGasLeft: 'D13 keeps g2 <= g1; D13R allows g2 > g1',
    calleeReservoir: 'Unbounded reservoir forwarded to callee',
    verdict: 'D13 fixes dirty-clear bands; D13R trades same-child clear for new bands'
  },
  {
    variant: 'EIPs#12582 (D13S)',
    source: 'Early capped-repay draft',
    setCallClear: 'Re-opens silent child failure when clear runs inside a helper subcall',
    preCallClearOrCreate: 'Strands 183,600 execution gas mid-frame after a failed CREATE',
    siblingGasLeft: 'g2 > g1 (+97,920 jump on second sibling exit)',
    calleeReservoir: 'Breaks meter spill invariant (stateGasLeft > 0 && stateGasSpilled > 0)',
    verdict: 'Refuted in Lean on 3 reachable multi-frame traces'
  },
  {
    variant: 'EIPs#12582 (D13A)',
    source: 'Per-frame state_gas_ceiling',
    setCallClear: 'Closed: gas_left is non-increasing across charges, refills, and call exits',
    preCallClearOrCreate:
      'Single-charge monotone when state_gas_drawn matches; 0 -> 1 -> 0 consumes drawn allowance',
    siblingGasLeft: 'g2 <= g1 across intra-frame and call-exit transitions',
    calleeReservoir:
      'Callee drain bounded by floor(childExecGas * 1530 / 200); DELEGATECALL inherits ceiling in spec (#15187 diverged)',
    verdict: 'Strongest structural properties; needs client DELEGATECALL alignment'
  }
]

export const GAS_EF_INVARIANTS: EfInvariantRow[] = [
  {
    id: 'INV-1',
    property:
      'With a reservoir, code after a failed call can still write storage; call{gas: X} does not cap callee state gas under D0.',
    status: 'Proved',
    theorems: [
      't_calltree_e1_fixed_grant_starvation',
      't_calltree_e3_m3_revert_restore_catch_band',
      't_12582_prop3b_untrusted_callee_reservoir_drain_bound'
    ],
    boundaryNote: 'Proved on EELS & #12582 meters; D13A bounds untrusted callee drain by floor(g * 1530 / 200).'
  },
  {
    id: 'INV-2',
    property:
      'Setting a zero slot and clearing it in the same transaction returns 97,920 state gas immediately rather than at tx settlement.',
    status: 'Proved',
    theorems: [
      't_8038_sstore_refund_delta_potential',
      't_8038_refund_counter_telescope_trace_root_nonneg',
      't_calltree_eip12581_same_child_clear_tradeoff'
    ],
    boundaryNote: 'Exact potential + root refundCounter >= 0 proved across nested reverts.'
  },
  {
    id: 'INV-3',
    property:
      'A reverting call hands back spilled/reservoir storage gas; a failed CREATE hands back 183,600.',
    status: 'Proved',
    theorems: [
      't_8037_meter_reservoir_roundtrip_on_revert',
      't_calltree_e3_m3_revert_restore_catch_band',
      't_calltree_d13s_failed_create_strands_gas'
    ],
    boundaryNote: 'Characterizes D0/D1/D4 immediate parent restore vs D3/D13/D13R/D13S settlement deferral.'
  },
  {
    id: 'INV-4',
    property:
      'Fixed gas grants sized for Osaka fail under 5–8x higher state creation costs and +7,200 warm/cold updates.',
    status: 'Partial',
    theorems: [
      't_calltree_e1_fixed_grant_starvation',
      't_8038_2780_warm_cold_bounds',
      't_7778_8037_dual_cap'
    ],
    boundaryNote: 'Cost deltas and 50k fixed-grant starvation proved; deployed-contract prevalence is an external scan.'
  },
  {
    id: 'INV-5',
    property:
      'gasleft() can rise during a call under D0/D13R/D13S, and reservoir-paid state gas is invisible to gasleft() deltas.',
    status: 'Proved',
    theorems: [
      't_calltree_e3_m4_sibling_underflow_and_d13s_break',
      't_12582_prop2_gas_left_non_increasing_in_frame',
      't_12582_prop2b_child_exit_bounded_by_child_gas_left'
    ],
    boundaryNote: 'Proves g2 > g1 on D0/D3/D13R/D13S and non-increasing gas_left on D13A.'
  },
  {
    id: 'INV-6',
    property:
      'Retained 1/64 + state-gas refills can let a parent finish and record failure after a child OOG.',
    status: 'Partial',
    theorems: [
      't_calltree_e3_m2_dirty_clear_band_and_d13r_break',
      't_12582_prop3_subcall_ceiling_bounded'
    ],
    boundaryNote: 'On-chain silent-failure bands proved; off-chain eth_estimateGas binary search is not yet modeled.'
  },
  {
    id: 'INV-7',
    property:
      'The 2,300 transfer/send stipend cannot create a storage slot regardless of reservoir size.',
    status: 'Proved',
    theorems: ['t_calltree_sstore_sentry_excludes_reservoir'],
    boundaryNote: 'SSTORE sentry checks gas_left <= 2,300 only and excludes stateGasLeft across all schedules.'
  },
  {
    id: 'INV-8',
    property:
      'An EIP-7702 authorization that OOGs is rolled back while the transaction is mined, leaving the signature replayable.',
    status: 'Partial',
    theorems: [
      't_8037_7702_delegation_exists_eq_alive_under_invariant',
      'f_2780_7928_set_delegation_oog_omits_recipient_refuter'
    ],
    boundaryNote: 'Proves empty-leaf equivalence and pre-dispatch OOG ordering; full mined-tx replay trace is still open.'
  }
]

export const GAS_GUARANTEE_CLUSTERS: GuaranteeCluster[] = [
  {
    id: 'gas-core-meter',
    title: '2D meter conservation, spill discipline & EIP-7778 dual block cap',
    badge: '12 guarantees + 11 shared EL',
    summary:
      'Two-leg gas charging (gas_left + state_gas_reservoir), LIFO state-gas refunds, 100% reservoir round-trip across child calls and reverts, CREATE state-gas deduction before the 63/64 cap, and EIP-7778 block max(execution_gas_used, state_gas_used) accounting.',
    scopeNote:
      'Models the EELS meter and SSTORE refund transitions directly (vm/gas.py, instructions/storage.py, interpreter.py); memory expansion and precompile schedules are outside scope.',
    theorems: [
      {
        name: 't_8037_charge_gas_sound',
        file: 'Glamsterdam/Gas/Spec.lean:76',
        statement:
          'Two-leg charge_gas conserves gasLeft + stateGasReservoir + regularGas + stateGas without underflow.'
      },
      {
        name: 'spill_invariant_preserved_by_meter_ops',
        file: 'Glamsterdam/Common/ElCore.lean:730',
        statement:
          'All six GasMeter transitions preserve stateGasLeft = 0 ∨ stateGasSpilled = 0, and LIFO credit_state_gas_refund is an exact left-inverse of charge_state_gas_from_meter.'
      },
      {
        name: 't_8037_meter_reservoir_roundtrip_on_revert',
        file: 'Glamsterdam/Gas/Spec.lean:106',
        statement:
          'Forwarding stateGasLeft to a child frame, spilling into gasLeft, and reverting restores both parent.stateGasLeft and parent.gasLeft.'
      },
      {
        name: 't_8037_allocate_evm_gas_sound',
        file: 'Glamsterdam/Gas/Spec.lean:307',
        statement:
          'allocate_evm_gas partitions tx.gas into intrinsic.execution + executionGas + stateGasReservoir with intrinsic.execution + executionGas <= 16,777,216 (2^24).'
      },
      {
        name: 't_7778_8037_dual_cap',
        file: 'Glamsterdam/Gas/Spec.lean:359',
        statement:
          'Block gas bottleneck max(executionGasUsed, stateGasUsed) upper-bounds both dimensions and is invariant to refund_counter.'
      },
      {
        name: 't_8038_refund_counter_telescope_trace_root_nonneg',
        file: 'Glamsterdam/Gas/Spec.lean:594',
        statement:
          'Across arbitrary multi-slot SSTORE writes, resets, and nested frame reverts, root refundCounter remains >= 0.'
      }
    ],
    upstreamRefs: [
      {
        label: 'amsterdam/vm/gas.py',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/vm/gas.py`
      },
      {
        label: 'amsterdam/vm/interpreter.py',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/vm/interpreter.py`
      }
    ]
  },
  {
    id: 'gas-calltree',
    title: 'Multi-frame call-tree comparison (Osaka vs D0 vs #12581 vs D13S)',
    badge: '9 call-tree guarantees',
    summary:
      'Parameterized multi-frame call-tree semantics comparing Osaka, Amsterdam D0, EIPs#12581 (D1, D3, D4, D13, D13R), and D13S on fixed-grant subcalls, set-call-clear, pre-call clear, revert-catch, sibling gasleft() deltas, and failed CREATE.',
    scopeNote:
      'Evaluated over parameterized 2-to-4-frame call/create traces capturing the exact EELS / #12581 / #12582 meter merge equations.',
    theorems: [
      {
        name: 't_calltree_sstore_sentry_excludes_reservoir',
        file: 'Glamsterdam/Gas/CallTree.lean:280',
        statement:
          'Whenever gasLeft <= 2,300, SSTORE halts with OutOfGasError under every fork variant regardless of stateGasLeft.'
      },
      {
        name: 't_calltree_e3_m2_dirty_clear_band_and_d13r_break',
        file: 'Glamsterdam/Gas/CallTree.lean:422',
        statement:
          'D0 exhibits the set-call-clear silent child-failure band, D1/D13 close it, and D13R re-opens it whenever a post-clear subcall runs.'
      },
      {
        name: 't_calltree_d13r_introduces_new_t1_band',
        file: 'Glamsterdam/Gas/CallTree.lean:474',
        statement:
          'On pre-call 0 -> 1 -> 0 clear before CALL(GAS), D0 succeeds while D13R starves the child and repays 97,920 into parent gasLeft.'
      },
      {
        name: 't_calltree_e3_m4_sibling_underflow_and_d13s_break',
        file: 'Glamsterdam/Gas/CallTree.lean:591',
        statement:
          'Cross-sibling [g1, g2] gasleft() measurement stays g2 <= g1 on Osaka/D1/D4/D13, but yields g2 > g1 on D0, D3, D13R, and D13S.'
      },
      {
        name: 't_calltree_d13s_reopens_t2_on_child_clear',
        file: 'Glamsterdam/Gas/CallTree.lean:647',
        statement:
          'Clearing slots inside a helper subcall after a failed child call produces childExcess > 0 in D13S, re-opening silent child failure.'
      },
      {
        name: 't_calltree_d13s_failed_create_strands_gas',
        file: 'Glamsterdam/Gas/CallTree.lean:719',
        statement:
          'A reverting CREATE under D13S credits 183,600 after incorporate_child and strands execution gas in stateGasLeft mid-frame.'
      }
    ],
    upstreamRefs: [
      {
        label: 'ethereum/EIPs#12581',
        url: 'https://github.com/ethereum/EIPs/pull/12581'
      }
    ]
  },
  {
    id: 'gas-12582-d13a',
    title: 'EIPs#12582 (D13A) per-frame state-gas ceiling suite',
    badge: '14 Lean theorems',
    summary:
      'Dedicated formalization of EIPs#12582’s per-frame state_gas_ceiling: non-increasing gas_left within frames and across call exits, bounded untrusted callee reservoir drain, DELEGATECALL ceiling inheritance vs Nethermind #15187, and single-step clean-trace monotonicity.',
    scopeNote:
      'Single-charge monotonicity (t_12582_prop4b_clean_trace_single_charge_monotone) holds when pre-states share equal stateGasDrawn and stateGasCeiling; multi-step traces where a lower-reservoir run spills into gasLeft while a higher-reservoir run draws from stateGasLeft diverge on stateGasDrawn.',
    theorems: [
      {
        name: 't_12582_prop1_delegatecall_frame_invariance',
        file: 'Glamsterdam/Gas/Eip12582.lean:430',
        statement:
          'Under normative #12582, executing state/exec ops via DELEGATECALL preserves identical active gas counters to executing them inline.'
      },
      {
        name: 't_12582_prop1b_nethermind15187_proxied_factory_divergence',
        file: 'Glamsterdam/Gas/Eip12582.lean:531',
        statement:
          'A top-level proxy forwarding 16.5M exec gas + 160M reservoir via DELEGATECALL deploys 4/4 max-size contracts under #12582 and 3/4 under Nethermind #15187.'
      },
      {
        name: 't_12582_prop2_gas_left_non_increasing_in_frame',
        file: 'Glamsterdam/Gas/Eip12582.lean:543',
        statement:
          'Execution charges, ceiling-bounded state charges, and state refills never increase gasLeft within a frame.'
      },
      {
        name: 't_12582_prop2b_child_exit_bounded_by_child_gas_left',
        file: 'Glamsterdam/Gas/Eip12582.lean:574',
        statement:
          'Across success, revert, or halt, parent gasLeft after exit_child_d13a never exceeds pre-call parent.gasLeft whenever childGas <= callCost.'
      },
      {
        name: 't_12582_prop3b_untrusted_callee_reservoir_drain_bound',
        file: 'Glamsterdam/Gas/Eip12582.lean:726',
        statement:
          'An untrusted CALL with grant g drains at most floor(g * 1530 / 200) net state gas from the caller’s reservoir regardless of internal refills or subcalls.'
      },
      {
        name: 't_12582_prop4b_clean_trace_single_charge_monotone',
        file: 'Glamsterdam/Gas/Eip12582.lean:873',
        statement:
          'For two meters with matching stateGasDrawn and stateGasCeiling, more initial gasLeft and stateGasLeft preserves gas ordering across a single state or exec charge.'
      }
    ],
    upstreamRefs: [
      {
        label: 'ethereum/EIPs#12582',
        url: 'https://github.com/ethereum/EIPs/pull/12582'
      },
      {
        label: 'Nethermind #15187',
        url: 'https://github.com/NethermindEth/nethermind/pull/15187'
      }
    ]
  }
]

export const GAS_SCOPE_BOUNDARIES: ScopeBoundaryItem[] = [
  {
    label: 'Off-chain eth_estimateGas & fixed-budget subcalls above 2^24',
    detail:
      'RPC estimators that binary-search on gasleft() deltas miss reservoir draws when tx.gas > 16,777,216, and a fixed-budget subcall (e.g. {gas: 150_000}) can fail when tx.gas <= 2^24 yet succeed when tx.gas > 2^24 because caller reservoir funds the subcall’s state gas. This RPC estimation layer is not yet proved as a Lean theorem in our Glamsterdam suite.'
  },
  {
    label: 'Full INV-8 mined-OOG signature replay trace',
    detail:
      'We proved empty-leaf equivalence (NoEmptyAccountLeaves) and pre-dispatch 7702 OOG ordering in create_evm, not yet the full multi-tx trace where an OOGed 7702 authorization is mined and replayed.'
  },
  {
    label: 'Meter kernel vs full EVM bytecode & prevalence scans',
    detail:
      'Our theorems model the EELS / #12581 / #12582 gas meters, SSTORE refund rules, and multi-frame call/create combinators—not memory expansion, precompiles, or mainnet contract prevalence (covered by ChainSecurity, Dedaub, and EF’s repricing tool).'
  }
]
