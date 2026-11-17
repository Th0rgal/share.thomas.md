import type { AuditFinding } from './types'
import { EELS_BLOB, GLOAS_BLOB } from './routes'

export const AUDIT_FINDINGS: AuditFinding[] = [
  {
    id: 'F-8246-BAL',
    track: 'eip8246',
    trackLabel: '8246',
    severity: 'High',
    severityLabel: 'High',
    title: 'Block Access List misses whole-account storage clears',
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
    leanSymbols: [
      'f_8246_bal_storage_clears_ignored_refuter',
      't_8246_bal_tx_block_state_desync',
      't_8246_bal_patched_sound',
      't_8246_storage_clears_recorded_in_bal'
    ],
    summary:
      'destroy_storage moves every key of a cleared account out of tx_state.storage_writes into tx_state.storage_reads and records the address only in tx_state.storage_clears. EIP-7928’s update_builder_from_tx iterates over storage_writes and ignores storage_clears.',
    impact:
      'In a two-transaction block where Tx 1 writes slot := 42 and Tx 2 wipes storage via SELFDESTRUCT / clear_account_preserving_balance, BlockState ends at 0 while the Block Access List retains 42.',
    fixNote:
      'Proved sound in t_8246_bal_patched_sound and end-to-end in t_8246_storage_clears_recorded_in_bal: emit a post-value of 0 in update_builder_from_tx for cleared non-zero slots when tx_state.storage_clears contains the address.'
  },
  {
    id: 'F-12582-NM',
    track: 'gas',
    trackLabel: 'Gas',
    severity: 'High',
    severityLabel: 'Spec / Client',
    title: 'Nethermind #15187 caps DELEGATECALL state-gas allowance instead of inheriting parent ceiling',
    locations: [
      {
        label: 'Nethermind #15187 (EthereumGasPolicy.CreateChildFrameGas)',
        url: 'https://github.com/NethermindEth/nethermind/pull/15187'
      },
      {
        label: 'ethereum/EIPs#12582',
        url: 'https://github.com/ethereum/EIPs/pull/12582'
      }
    ],
    leanSymbols: [
      't_12582_prop1_delegatecall_frame_invariance',
      't_12582_prop1b_nethermind15187_proxied_factory_divergence'
    ],
    summary:
      'EIPs#12582 specifies that DELEGATECALL and CALLCODE inherit parent.state_gas_ceiling unchanged, whereas Nethermind #15187 recomputed min(childExecGas * 1530 / 200, remaining) inside EthereumGasPolicy.CreateChildFrameGas for all call types.',
    impact:
      'When a top-level proxy (16.6M exec gas, 160M reservoir) forwards 16.5M gas via DELEGATECALL into a factory deploying four 24,576-byte contracts (4 × 37,784,880 = 151,139,520 state gas), #12582 deploys all 4 while #15187 clamps the allowance to 126,225,000 and fails OOG on the 4th CREATE.',
    fixNote:
      'Gate the child state-gas allowance clamp in CreateChildFrameGas on CALL / STATICCALL / CREATE / CREATE2 so DELEGATECALL and CALLCODE inherit the caller’s ceiling.'
  },
  {
    id: 'F-7732-SLASH',
    track: 'epbs',
    trackLabel: 'ePBS',
    severity: 'Medium',
    severityLabel: 'Med-High',
    title: 'Slashed proposer payment resurrected after 2+ missed epochs',
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
    leanSymbols: [
      'f_7732_slashed_payment_resurrection_refuter',
      't_7732_composed_trace_resurrects_slashed_payment',
      't_7732_slashed_no_resurrection'
    ],
    summary:
      'slash_validator clears matching entries in state.builder_pending_payments but leaves state.latest_execution_payload_bid.value non-zero.',
    impact:
      'If two epoch boundaries pass without a block (rotating out both halves of builder_pending_payments) before the next block confirms the parent payload, apply_parent_execution_payload takes the parent_epoch < previous_epoch fallback (elif parent_bid.value > 0) and pays the slashed proposer.',
    fixNote:
      'Either zero state.latest_execution_payload_bid.value (or gate the fallback on not state.validators[parent_proposer].slashed, proved in t_7732_slashed_no_resurrection), or decide by design whether builder payment revocation belongs in slash_validator at all.'
  },
  {
    id: 'F-7732-FORK-BIT',
    track: 'epbs',
    trackLabel: 'ePBS',
    severity: 'Medium',
    severityLabel: 'Medium',
    title: 'upgrade_to_gloas overwrites the fork-slot payload availability bit to 0b1',
    locations: [
      {
        label: 'gloas/fork.md:198-200',
        url: `${GLOAS_BLOB}/specs/gloas/fork.md#L198-L200`
      }
    ],
    leanSymbols: ['f_7732_fork_slot_availability_refuter'],
    summary:
      'At the fork boundary, process_slot(s_fork - 1) runs before upgrade_to_gloas, which then initializes all SLOTS_PER_HISTORICAL_ROOT bits of execution_payload_availability to 0b1.',
    impact:
      'Slot s_fork enters block processing with execution_payload_availability[s_fork % 8192] == 0b1 and nothing clears it if the fork-slot builder withholds its payload.'
  },
  {
    id: 'F-8282-CRED',
    track: 'epbs',
    trackLabel: 'ePBS',
    severity: 'Medium',
    severityLabel: 'Medium',
    title: 'Asymmetric 0xB0 credential checks between fork onboarding and post-fork builder top-ups',
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
    leanSymbols: [
      'f_8282_topup_credential_prefix_drop_refuter',
      'f_7732_fork_onboard_cross_credential_refuter'
    ],
    summary:
      'process_builder_deposit_request checks the 0xB0 credential prefix before pubkey in builder_pubkeys, whereas onboard_builders_from_pending_deposits checks pubkey in builder_pubkeys first.',
    impact:
      'Post-fork top-ups with zeroed/non-0xB0 credentials (common when topping up by pubkey) are silently ignored instead of crediting the existing builder, while fork onboarding sweeps pending non-0xB0 deposits into any pubkey already in builder_pubkeys. (Also note: specs/gloas/beacon-chain.md uses 0xB0 while EIP-7732 prose still writes 0x03.)'
  },
  {
    id: 'F-8038-7778',
    track: 'gas',
    trackLabel: 'Gas',
    severity: 'Medium',
    severityLabel: 'Medium',
    title: 'Same-tx 0 -> X -> 0 SSTORE reset splits credit across reservoir and 20%-capped refund_counter',
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
    leanSymbols: ['f_8038_7778_sstore_reset_refuter'],
    summary:
      'Resetting a freshly written slot (0 -> X -> 0) immediately returns 97,920 state gas to the meter, while the 10,000 STORAGE_WRITE portion goes into refund_counter.',
    impact:
      'Under EIP-7778, refund_counter is excluded from block execution_gas_used and capped at 20% of tx execution gas, clipping user refunds whenever gas_used_before_refund < 50,000. Worth an explicit note in EIP-7778 / EIP-8038.'
  },
  {
    id: 'F-7732-RING',
    track: 'epbs',
    trackLabel: 'ePBS',
    severity: 'Low',
    severityLabel: 'Low-Med',
    title: 'Availability ring-buffer wrap clobbers child slot bit after 8,192 skipped slots',
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
    leanSymbols: ['f_7732_availability_ring_buffer_clobber_refuter'],
    summary:
      'When block.slot - parent_slot == k * SLOTS_PER_HISTORICAL_ROOT (8,192 skipped slots on mainnet, 64 on minimal), parent_slot and block.slot alias modulo SLOTS_PER_HISTORICAL_ROOT.',
    impact:
      'apply_parent_execution_payload writes 0b1 for parent_slot after process_slots cleared the next slot’s bit to 0b0, leaving the child slot’s availability bit stuck at 0b1.'
  },
  {
    id: 'F-8037-7702',
    track: 'gas',
    trackLabel: 'Gas',
    severity: 'Low',
    severityLabel: 'Low',
    title: 'EIP-7702 set_delegation checks account_exists instead of is_account_alive',
    locations: [
      {
        label: 'vm/eoa_delegation.py:295',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/vm/eoa_delegation.py#L295-L296`
      }
    ],
    leanSymbols: [
      'f_8037_7702_delegation_exists_vs_alive_refuter',
      't_8037_7702_delegation_exists_eq_alive_under_invariant'
    ],
    summary:
      'set_delegation gates StateGasCosts.NEW_ACCOUNT (183,600) on not account_exists(...) whereas CALL and SELFDESTRUCT check not is_account_alive(...).',
    impact:
      'We proved the two predicates coincide on every pruned post-Spurious-Dragon state (NoEmptyAccountLeaves is preserved by all state_tracker mutators) and diverge only on unpruned state-test fixtures containing explicit EMPTY_ACCOUNT leaves.'
  },
  {
    id: 'F-8246-SYSTX',
    track: 'eip8246',
    trackLabel: '8246',
    severity: 'Low',
    severityLabel: 'Low',
    title: 'process_unchecked_system_transaction drops system_tx_output.accounts_to_delete',
    locations: [
      {
        label: 'amsterdam/fork.py:774-778',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/fork.py#L774-L778`
      }
    ],
    leanSymbols: ['f_8246_unchecked_sys_tx_drops_deletes_refuter'],
    summary:
      'process_unchecked_system_transaction passes system_tx_state directly to incorporate_tx_into_block without iterating clear_account_preserving_balance over system_tx_output.accounts_to_delete.',
    impact:
      'Dormant while current system contracts (EIP-2935 / 4788 / 7002 / 7251) do not invoke SELFDESTRUCT, but diverges from standard end-of-transaction cleanup.'
  },
  {
    id: 'F-2780-7928',
    track: 'gas',
    trackLabel: 'Gas',
    severity: 'Low',
    severityLabel: 'Low',
    title: '7702 authorization OOG in create_evm omits tx.to from BAL account_reads',
    locations: [
      {
        label: 'vm/interpreter.py:161-196',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/vm/interpreter.py#L161-L196`
      }
    ],
    leanSymbols: ['f_2780_7928_set_delegation_oog_omits_recipient_refuter'],
    summary:
      'In create_evm, set_delegation runs before recipient resolution. If charging 7702 state gas halts with OutOfGasError, process_top_level aborts before get_account(tx_env.state, recipient) records tx.to in BAL account_reads.',
    impact:
      'Cold access gas for tx.to was already paid in intrinsic gas, yet tx.to is absent from the EIP-7928 Block Access List on authorization OOG.'
  }
]

export function findingsForTrack(track: 'gas' | 'eip8246' | 'epbs'): AuditFinding[] {
  return AUDIT_FINDINGS.filter((f) => f.track === track)
}
