import type { GuaranteeCluster, ScopeBoundaryItem, TrackDecisionBox } from './types'
import { EELS_BLOB } from './routes'

export const EIP8246_DECISIONS: TrackDecisionBox = {
  eyebrow: 'Input needed from EIP-8246 & BAL authors',
  contacts: 'Paweł Bylica · Benjamin Perez',
  bottomLine:
    'In execution-specs@16898000, EIP-8246’s clear_account_preserving_balance preserves ETH across SELFDESTRUCT and same-tx CREATE + SELFDESTRUCT, but its storage_clears path is ignored by EIP-7928’s update_builder_from_tx—desynchronizing BlockState from the Block Access List across two transactions. We proved a two-line fix sound end-to-end.',
  questions: [
    {
      prompt: 'Should update_builder_from_tx record tx_state.storage_clears in EIP-7928 Block Access Lists?',
      detail:
        'When Tx 1 writes slot := 42 and Tx 2 wipes the account via destroy_storage, BlockState ends at 0 while BAL keeps 42. Recording post-value 0 for cleared non-zero slots (proved in t_8246_bal_patched_sound and t_8246_storage_clears_recorded_in_bal) closes the desync.'
    },
    {
      prompt: 'Does keeping pre-existing storage on CREATE collision out of EIP-8246 scope match your intent?',
      detail:
        'Our same-tx CREATE + SELFDESTRUCT proofs explicitly isolate pre-Spurious-Dragon storage-only collision accounts as out of scope (deferred to Hegota / EIP-8253 rather than silently assumed).'
    },
    {
      prompt: 'Is Glamsterdam keeping EIP-8246 as specified, or revisiting its scope alongside EIP-7708?',
      detail:
        'Knowing whether clear_account_preserving_balance stays as the Glamsterdam target (and whether process_unchecked_system_transaction should also run it for symmetry) lets us lock or update the proof suite.'
    }
  ]
}

export const EIP8246_GUARANTEE_CLUSTERS: GuaranteeCluster[] = [
  {
    id: '8246-bal-sync',
    title: 'EIP-8246 × EIP-7928 Block Access List synchronization',
    badge: '3 guarantees + 1 refuter',
    summary:
      'Multi-account TransactionState and BlockState formalization of destroy_storage_tx, clear_account_preserving_balance_tx, incorporate_tx_into_block, and EIP-7928’s update_builder_from_tx: constructs the two-tx BAL desync on commit 16898000 and proves the patched builder sound across all prior write states.',
    scopeNote:
      'Proved over the full finite-map TransactionState / BlockState storage tracker (ElCore.lean + Eip8246/Spec.lean), not a simplified two-account snapshot.',
    theorems: [
      {
        name: 't_8246_bal_tx_block_state_desync',
        file: 'Glamsterdam/Eip8246/Spec.lean:416',
        statement:
          'In a 2-tx block (Tx 1 writes slot := val, Tx 2 runs destroy_storage_tx), BlockState storage is 0 while tx2.storageWrites has no entry and tx2.storageClears is ignored by update_builder_from_tx.'
      },
      {
        name: 't_8246_bal_patched_sound',
        file: 'Glamsterdam/Eip8246/Spec.lean:356',
        statement:
          'Patched update_builder_from_tx records some postVal iff postVal != indexStartVal across all combinations of prior block writes, same-tx writes, and storage_clears.'
      },
      {
        name: 't_8246_storage_clears_recorded_in_bal',
        file: 'Glamsterdam/Eip8246/Spec.lean:454',
        statement:
          'End-to-end theorem connecting clear_account_preserving_balance_tx and incorporate_tx_into_block to update_builder_from_tx: patched BAL records some 0 matching BlockState = 0.'
      }
    ],
    upstreamRefs: [
      {
        label: 'amsterdam/block_access_lists.py:760-825',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/block_access_lists.py#L760-L825`
      },
      {
        label: 'amsterdam/state_tracker.py:494-540',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/state_tracker.py#L494-L540`
      }
    ]
  },
  {
    id: '8246-cleanup-semantics',
    title: 'Exact clear_account_preserving_balance & checkpoint rollback semantics',
    badge: '4 guarantees + 11 shared EL',
    summary:
      'Proves that end-of-transaction cleanup zeroes nonce, code, and storage while preserving exact account balance—deleting the trie leaf iff balance == 0—and that reverting child frames discard accounts_to_delete while preserving accumulated BAL reads.',
    scopeNote:
      't_8246_tx_state_clear_exact and the shared ElCore theorems operate on multi-account TransactionState; t_8246_balance_preserved and t_8246_same_tx_create_destroy add projection checks + a mutation kill-test (m_8246_1_refuter).',
    theorems: [
      {
        name: 't_8246_tx_state_clear_exact',
        file: 'Glamsterdam/Eip8246/Spec.lean:57',
        statement:
          'On TransactionState, clear_account_preserving_balance_tx preserves balance, sets nonce = 0 and code = empty, wipes every storage slot to 0, and deletes the account iff balance == 0.'
      },
      {
        name: 't_8246_same_tx_create_destroy',
        file: 'Glamsterdam/Eip8246/Spec.lean:46',
        statement:
          'For addresses in created_accounts ∩ accounts_to_delete, end-of-tx cleanup clears nonce, code, and storage while keeping residual balance intact.'
      },
      {
        name: 'incorporate_child_frame_revert_discards_deletes',
        file: 'Glamsterdam/Common/ElCore.lean:546',
        statement:
          'When a child frame reverts or halts, incorporate_child_frame discards child.accountsToDelete and restores all 5 mutable write maps while keeping BAL read sets.'
      },
      {
        name: 'no_empty_account_leaves_preserved',
        file: 'Glamsterdam/Common/ElCore.lean:501',
        statement:
          'All state_tracker.py account mutators (modify_state, set_account_balance, move_ether, create_ether, increment_nonce, set_code) preserve NoEmptyAccountLeaves.'
      }
    ],
    assumptions: [
      'A-NO-PRE-EXISTING-STORAGE-ON-CREATE / X-EIP-8253-COLLISION-WIPE: Target of CREATE/CREATE2 has empty storage prior to creation; pre-Spurious-Dragon storage-only collision accounts are deferred to EIP-8253.'
    ],
    upstreamRefs: [
      {
        label: 'amsterdam/state_tracker.py:793-846',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/state_tracker.py#L793-L846`
      },
      {
        label: 'amsterdam/fork.py:442-505',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/fork.py#L442-L505`
      }
    ]
  },
  {
    id: '8246-conservation-and-gas',
    title: 'SELFDESTRUCT balance conservation, fee settlement & zero state-gas refund',
    badge: '4 guarantees',
    summary:
      'Verifies that SELFDESTRUCT never burns ETH (including when beneficiary == originator), sender fee deduction + coinbase tip + base/blob burn conserve total wei, and same-tx CREATE + SELFDESTRUCT grants zero state-gas refund under EIP-8246 + EIP-8037.',
    scopeNote:
      'State-level conservation here covers the two-account SELFDESTRUCT transfer projection (SelfdestructStep / WorldSnapshot) and scalar tx-fee settlement (update_sender_state + disburse_gas_fees), rather than an inductive sum over an unbounded address map.',
    theorems: [
      {
        name: 't_8246_selfdestruct_conservation',
        file: 'Glamsterdam/Eip8246/Spec.lean:121',
        statement:
          'exec_selfdestruct conserves total balance for both distinct beneficiaries and self-beneficiary calls (originator == beneficiary).'
      },
      {
        name: 't_8246_tx_fee_settlement_conservation',
        file: 'Glamsterdam/Eip8246/Spec.lean:252',
        statement:
          'Sender max-fee deduction, leftover gas refund, coinbase priority fee, and burned base + blob fees satisfy exact 1-to-1 wei conservation.'
      },
      {
        name: 't_8246_no_state_gas_refund',
        file: 'Glamsterdam/Eip8246/Spec.lean:173',
        statement:
          'Same-transaction CREATE + SELFDESTRUCT deducts state creation + execution gas and credits 0 back to GasMeter.stateGasLeft or refundCounter.'
      },
      {
        name: 't_8246_eth_conservation',
        file: 'Glamsterdam/Eip8246/Spec.lean:275',
        statement:
          'End-of-tx clear_account_preserving_balance preserves target + recipient balances (paired with m_8246_1_refuter and ethConservationMetaGate).'
      }
    ],
    upstreamRefs: [
      {
        label: 'amsterdam/vm/instructions/system.py',
        url: `${EELS_BLOB}/src/ethereum/forks/amsterdam/vm/instructions/system.py`
      }
    ]
  }
]

export const EIP8246_SCOPE_BOUNDARIES: ScopeBoundaryItem[] = [
  {
    label: 'Two-account balance projection vs multi-account storage map',
    detail:
      'Storage clearing and BAL consistency are proved over the full multi-account TransactionState / BlockState finite-list maps, whereas ETH balance conservation is proved on the two-account SELFDESTRUCT transfer projection and per-tx fee settlement arithmetic (consolidating onto a whole-map balance sum is part of our planned Lean cleanup).'
  },
  {
    label: 'Pre-existing storage on CREATE collision (EIP-8253)',
    detail:
      'Pre-Spurious-Dragon accounts with nonce == 0, empty code, and non-empty storage at a CREATE/CREATE2 target are explicitly excluded from EIP-8246 scope (tracked under EIP-8253).'
  }
]
