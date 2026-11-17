import type { GuaranteeCluster, ScopeBoundaryItem, TrackDecisionBox } from './types'
import { GLOAS_BLOB } from './routes'

export const EPBS_DECISIONS: TrackDecisionBox = {
  eyebrow: 'Input needed from Gloas / ePBS spec lead',
  contacts: 'Potuz',
  bottomLine:
    'We structured the Gloas v1.7.0-beta.4 (EIP-7732 + EIP-8282) Lean model around five top-level consensus invariants—supply neutrality, proposer payment guarantee, attestation quorum anti-double-counting, same-slot unbundling at the CL state boundary, and untouched-CL non-interference—while capturing five concrete pyspec edge cases (including a reproducible pyspec test for slashed proposer payment resurrection).',
  questions: [
    {
      prompt: 'Do the five top-level theorem statements and their boundary assumptions match what you want guaranteed?',
      detail:
        'Specifically: supply neutrality (t_7732_no_eth_minting + t_7732_single_settlement), proposer payment guarantee (t_7732_payment_guarantee), unconditional validator quorum cap (t_7732_quorum_weight_unconditional), same-slot unbundling under block_hash commitment, and CL frame preservation.'
    },
    {
      prompt: 'How should specs/gloas resolve F-7732-SLASH (slashed proposer payment resurrected after 2+ missed epochs)?',
      detail:
        'Should slash_validator also zero latest_execution_payload_bid.value (or gate lines 1805–1814 on not parent_proposer.slashed), or should lines 1578–1581 be removed so builder payment settlement depends strictly on payload confirmation / quorum?'
    },
    {
      prompt: 'Should process_builder_deposit_request and onboard_builders_from_pending_deposits align on pubkey-first top-up matching?',
      detail:
        'Right now fork onboarding checks pubkey in builder_pubkeys first while post-fork deposit requests check the 0xB0 credential prefix first (dropping zeroed-credential top-ups). Also flagging a minor doc drift: beacon-chain.md uses 0xB0 while EIP-7732 prose still writes 0x03.'
    }
  ]
}

export const EPBS_GUARANTEE_CLUSTERS: GuaranteeCluster[] = [
  {
    id: 'epbs-supply-and-settlement',
    title: 'Supply neutrality, builder solvency & single bid settlement',
    badge: '5 guarantees',
    summary:
      'Every committed builder bid settles at most once across apply_parent_execution_payload and process_builder_pending_payments across all four confirmation timings; can_builder_cover_bid prevents saturation clipping so builder debit + proposer withdrawal is strictly supply-neutral; builder exits require pendingToWithdraw == 0.',
    scopeNote:
      'Proved on the exact decision and arithmetic transitions extracted from specs/gloas/beacon-chain.md; multi-slot pending-payment accumulation is gated via pendingToWithdraw inside can_builder_cover_bid.',
    theorems: [
      {
        name: 't_7732_no_eth_minting',
        file: 'Glamsterdam/Gloas7732/Spec.lean:320',
        statement:
          'When can_builder_cover_bid = true, builder withdrawal debit and proposer fee-recipient credit conserve exact Gwei with zero saturating_sub inflation.'
      },
      {
        name: 't_7732_single_settlement',
        file: 'Glamsterdam/Gloas7732/Spec.lean:233',
        statement:
          'Across same-epoch child confirmation, next-epoch child confirmation, quorum epoch rotation, and missed-parent branches, a committed bid settles at most once.'
      },
      {
        name: 't_7732_builder_solvency',
        file: 'Glamsterdam/Gloas7732/Spec.lean:292',
        statement:
          'can_builder_cover_bid = true guarantees builderBalance >= MIN_DEPOSIT_AMOUNT + pendingToWithdraw + bidAmount.'
      },
      {
        name: 't_7732_exit_safety',
        file: 'Glamsterdam/Gloas7732/Spec.lean:352',
        statement:
          'process_builder_exit_request initiates builder exit only when isActive = true and pendingToWithdraw = 0.'
      }
    ],
    upstreamRefs: [
      {
        label: 'specs/gloas/beacon-chain.md:1719-1834',
        url: `${GLOAS_BLOB}/specs/gloas/beacon-chain.md#L1719-L1834`
      }
    ]
  },
  {
    id: 'epbs-payment-and-quorum',
    title: 'Proposer payment guarantee, slashing revocation & unconditional quorum cap',
    badge: '5 guarantees',
    summary:
      'Guarantees that a positive committed bid confirmed by the child block or reaching attestation quorum credits an exact BuilderPendingWithdrawal of bidValue; proves unconditionally across any sequence of attestations in an epoch that each validator adds effective_balance to payment.weight at most once; and proves the patched slashing path free of payment resurrection.',
    scopeNote:
      't_7732_quorum_weight_unconditional inducts over an arbitrary epoch attestation trace using participation-flag state.',
    theorems: [
      {
        name: 't_7732_payment_guarantee',
        file: 'Glamsterdam/Gloas7732/Spec.lean:250',
        statement:
          'Whenever bidValue > 0 and either child confirmation or attestation weight >= quorum holds (with unslashed proposer), feeRecipient receives an exact BuilderPendingWithdrawal of bidValue.'
      },
      {
        name: 't_7732_quorum_weight_unconditional',
        file: 'Glamsterdam/Gloas7732/Spec.lean:408',
        statement:
          'Across any sequence of attestations in an epoch (including target/head equivocations), a single validator contributes at most effectiveBalance to payment.weight.'
      },
      {
        name: 't_7732_slash_validator_clears_matching_payments',
        file: 'Glamsterdam/Gloas7732/Spec.lean:492',
        statement:
          'slash_validator clears every entry in state.builder_pending_payments whose proposer_index equals slashed_index.'
      },
      {
        name: 't_7732_slashed_no_resurrection',
        file: 'Glamsterdam/Gloas7732/Spec.lean:550',
        statement:
          'Patched slash_validator + apply_parent_execution_payload never appends a BuilderPendingWithdrawal when parentProposerSlashed = true across any number of missed epochs.'
      }
    ],
    upstreamRefs: [
      {
        label: 'specs/gloas/beacon-chain.md:1475-1581',
        url: `${GLOAS_BLOB}/specs/gloas/beacon-chain.md#L1475-L1581`
      }
    ]
  },
  {
    id: 'epbs-unbundling-and-frame',
    title: 'Same-slot unbundling boundary, EIP-8282 request binding & CL frame check',
    badge: '3 guarantees + 4 refuters',
    summary:
      'Shows that bid.block_hash commitment in process_execution_payload_bid + parent_block_hash verification in process_parent_execution_payload prevent replacing a builder’s committed payload at slot N under single-block / collision-resistance hypotheses, verifies execution_requests_root gating on empty vs full parents, and checks untouched CL state projection fields.',
    scopeNote:
      'Read these boundaries strictly: Gloas7732/Spec.lean models targeted projections of BeaconState rather than the full SSZ container, so t_7732_frame verifies projection non-interference paired with source-map.yaml inspection, and fork-choice / PTC tie-breaking (fork-choice.md) is external to t_7732_same_slot_unbundling.',
    theorems: [
      {
        name: 't_7732_same_slot_unbundling',
        file: 'Glamsterdam/Gloas7732/Spec.lean:457',
        statement:
          'Under committedBidBlockHash = builderPayload.blockHash and hash collision-resistance, any canonical full payload accepted at slot N equals builderPayload (no private-tx unbundling at the CL state boundary).'
      },
      {
        name: 't_8282_7732_queue_safety',
        file: 'Glamsterdam/Gloas7732/Spec.lean:670',
        statement:
          'Parent execution requests (including EIP-8282 builder deposit/exit requests) must be empty on empty parents and match parent_bid.execution_requests_root on full parents.'
      },
      {
        name: 't_7732_frame',
        file: 'Glamsterdam/Gloas7732/Spec.lean:651',
        statement:
          'Parent payload and builder payment transitions leave projected non-builder CL fields untouched across arbitrary full/empty slot sequences.'
      }
    ],
    assumptions: [
      'A-SAME-SLOT-UNBUNDLING-BOUNDARY: Private tx is known only to the slot-N builder prior to envelope reveal, no competing consensus block is canonical at slot N, and ExecutionPayload.block_hash is collision-resistant.',
      'X-GLOAS-FORK-CHOICE & X-GLOAS-P2P-GOSSIP: specs/gloas/fork-choice.md (LMD-GHOST payload tree, PTC timeliness) and libp2p gossip topics are out of scope.'
    ],
    upstreamRefs: [
      {
        label: 'specs/gloas/beacon-chain.md:1835-1858',
        url: `${GLOAS_BLOB}/specs/gloas/beacon-chain.md#L1835-L1858`
      },
      {
        label: 'specs/gloas/fork.md',
        url: `${GLOAS_BLOB}/specs/gloas/fork.md`
      }
    ]
  }
]

export const EPBS_SCOPE_BOUNDARIES: ScopeBoundaryItem[] = [
  {
    label: 'Targeted BeaconState projections vs full SSZ state',
    detail:
      'Gloas7732/Spec.lean models targeted record projections of the Gloas payment, attestation-weight, builder-deposit/exit, and fork-upgrade functions (16 SHA256-locked functions in source-map.yaml) rather than a full SSZ BeaconState container. In particular, t_7732_frame checks non-interference on projected fields alongside source-map inspection.'
  },
  {
    label: 'Fork-choice & P2P gossip out of scope',
    detail:
      'specs/gloas/fork-choice.md (PTC payload timeliness and LMD-GHOST payload tree) and specs/gloas/p2p-interface.md are excluded by scope agreement; t_7732_same_slot_unbundling captures only the beacon-chain.md commitment boundary.'
  }
]
