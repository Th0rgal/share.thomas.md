// The four Glamsterdam notes. Each page renders its Markdown string and its
// .md route serves the same string, so there is one copy of every sentence.

const EELS =
  'https://github.com/ethereum/execution-specs/blob/16898000911c1e3caa57be08509536c10ae92d3e/src/ethereum/forks/amsterdam'
const GLOAS =
  'https://github.com/ethereum/consensus-specs/blob/aa16bb4c156184e9548a997d53efaf2a228a6304/specs/gloas'
const EIPS = 'https://github.com/ethereum/EIPs/pull'
const CS = 'https://github.com/ethereum/consensus-specs'

export type GlamsterdamPage = {
  slug: string
  title: string
  description: string
  markdown: string
}

const overview: GlamsterdamPage = {
  slug: 'glamsterdam',
  title: 'Glamsterdam formal verification',
  description:
    'Lean 4 proofs and spec edge cases for three Glamsterdam tracks: 2D state gas, EIP-8246 and ePBS.',
  markdown: `
# Glamsterdam formal verification

We formally verified three parts of Glamsterdam with the Ethereum Foundation. For each one we translated the Python reference spec into Lean 4, proved the properties the EIP authors care about, and wrote a concrete counterexample whenever a property failed. Every result is tied to a pinned spec commit: it says what that version of the spec does, not what the EIP text intends, so review by the spec authors is what confirms the two match.

- [2D state gas](/glamsterdam_gas) (EIP-8037, 8038, 2780, 7778): the gas accounting holds on the current spec, and we compare the proposed refill fixes (EIPs#12581 and #12582) on multi-frame calls. Three spec edge cases, and one divergence in the Nethermind prototype of #12582.
- [SELFDESTRUCT burn removal](/glamsterdam_8246) (EIP-8246): ETH is conserved and cleared accounts behave as intended, but storage cleared by 8246 is missing from the block access list of EIP-7928.
- [ePBS and builder deposits](/glamsterdam_epbs) (EIP-7732, 8282): builder payments settle once and quorum weight is never double counted. Five spec edge cases, two of them also reported upstream by others, one already fixed.

## Where things stand (17 Nov 2026)

- Glamsterdam has been live on Sepolia since 6 Oct. Hoodi is on hold until the 8037/8038 issues are settled, and there is no mainnet date yet ([EF post, 6 Nov](https://blog.ethereum.org/2026/11/06/glamsterdam-8037-8038)).
- [ACDT #103](https://github.com/ethereum/pm/issues/2299) on 16 Nov went through the audit results on 8037/8038. No decision was taken there; the path forward is expected at [ACDE #249](https://github.com/ethereum/pm/issues/2285) on 19 Nov.
- On the consensus side, one of the bugs we found, the fork-slot availability bit, was fixed in [consensus-specs#5808](${CS}/pull/5808). The next spec release waits on the payload binding choice ([#5770](${CS}/pull/5770) or [#5820](${CS}/pull/5820)).

## How we did it

- **Translating the specs.** We translated the executable Python specs (execution-specs for the execution layer, the consensus-specs pyspec for Gloas) into Lean 4, function by function. To check the translation, we compiled the Lean code and ran it against the original Python on generated inputs.
- **Choosing what to prove.** This is the part that matters most. We started from the bugs and issues already found on these EIPs, including those raised during the EF review of 8037/8038 with the audit teams, and reviewed client implementations such as the Nethermind prototype of #12582. Above all, we discussed with the spec authors in each group which properties were worth proving: Maria Silva and Marius van der Wijden for the gas EIPs, Paweł Bylica for 8246, and Potuz for ePBS.
- **Checking the properties themselves.** A proof is only as useful as its statement, so every property also has checks on the property (meta specs): a reachable example showing it is not vacuously true, and a mutated spec that reintroduces a known bug, on which the property must fail.
- **Contributing to the shared gas model.** We also completed the remaining proof obligations of the shared Lean model of the Amsterdam gas rules started by EF researchers.

## What the proofs cover

The execution layer model follows [execution-specs at 16898000](${EELS}) (Amsterdam). The consensus layer model follows [consensus-specs v1.7.0-beta.4](${GLOAS}) (\`beacon-chain.md\` and \`fork.md\`). The proofs use no \`sorry\` and no custom axioms.

Not covered: fork choice and P2P gossip, bytecode execution (the gas work models the gas meter, not the interpreter), client RPC behaviour such as \`eth_estimateGas\`, and systematic comparison with geth, reth or Nethermind.
`
}

const gas: GlamsterdamPage = {
  slug: 'glamsterdam_gas',
  title: 'Glamsterdam: 2D state gas',
  description:
    'Lean 4 proofs on EIP-8037, 8038, 2780 and 7778, a comparison of EIPs#12581 and #12582, and the edge cases found.',
  markdown: `
# 2D state gas (EIP-8037, 8038, 2780, 7778)

Part of the [Glamsterdam notes](/glamsterdam).

We modelled the Amsterdam gas code of [execution-specs at 16898000](${EELS}) as a gas meter in Lean, together with the two proposed changes to how state gas flows back on refills: [EIPs#12581](${EIPS}/12581) and [EIPs#12582](${EIPS}/12582), which adds a per-frame state gas allowance on top of #12581.

## Status (17 Nov 2026)

- The four EIPs are in Last Call and scheduled for Glamsterdam. #12581, #12582 and the RESERVOIR opcode proposal [#12577](${EIPS}/12577) are still open.
- At [ACDT #103](https://github.com/ethereum/pm/issues/2299) the audits reported that most affected contracts hit INV-4 (fixed gas budgets that are now too small) or INV-7 (hardcoded gas reserves) from [glamsterdam-gas-invariants](https://github.com/ethereum/glamsterdam-gas-invariants). Changing 8037 now was estimated to cost 3 to 6 months. The decision is expected at ACDE #249 on 19 Nov.
- Our results suggest that neither #12581 nor #12582 helps the INV-4 cases (see below). They change where refilled gas goes, which is INV-1, 2, 3 and 5.

## What we proved on the current spec

- Charging state gas is sound across both gas dimensions, and the reservoir comes back intact when a child frame succeeds, errors or reverts.
- Transaction gas is split correctly between execution gas and the reservoir, and system transactions start with the right reservoir.
- The EIP-7778 dual block gas cap holds, and EIP-8038/2780 warm and cold access costs stay within their bounds.
- The SSTORE refund counter can go negative inside a child frame, but never at the end of the transaction.

## Comparing the proposed fixes

- **#12582:** we proved the four properties the PR claims. A DELEGATECALL or CALLCODE library call is accounted exactly as if its code ran inline. \`gas_left\` never goes up inside a frame. A callee forwarded \`g\` gas can draw at most \`floor(g * 1530 / 200)\` state gas from the caller. A revert gives the allowance back, but setting and clearing a slot does not, so a child that repeatedly sets and clears a slot ends up paying from \`gas_left\` even with a full reservoir.
- **D13S**, an earlier variant, breaks on three traces: a clear in a sibling frame pushes \`gasleft()\` up, a clear in a helper call brings back silent child failures, and a failed CREATE strands gas.
- **Fixed budgets (INV-4):** a subcall with a fixed 50,000 gas budget that writes a fresh slot worked on Osaka and runs out of gas on the current spec and on #12581, whatever the refill rule.
- **Estimators:** when \`tx.gas\` is above \`2^24\` the reservoir is not empty, and estimating state gas from \`gasleft()\` differences underestimates it. A caught subcall with a fixed budget can fail or succeed depending only on the \`tx.gas\` the sender signed: 500k fails a 150k-budget subcall, 16.9M lets it succeed. This is the pattern behind the Uniswap v4 \`notifyUnsubscribe\` case.

## Edge cases found

- **Nethermind #12582 prototype:** [nethermind#15187](https://github.com/NethermindEth/nethermind/pull/15187) recomputes the allowance on DELEGATECALL instead of inheriting the caller's, so a factory behind a proxy can deploy only three max-size contracts instead of four. Not yet raised on the PR.
- **SSTORE 0 to X to 0** ([storage.py](${EELS}/vm/instructions/storage.py)): the 97,920 state gas comes back directly, but the 10,000 reset refund goes through the capped refund counter and is not removed from block gas. Possibly intended; worth confirming against EIP-7778.
- **set_delegation** ([eoa_delegation.py](${EELS}/vm/eoa_delegation.py)): checks \`account_exists\` where every other new-account charge checks \`is_account_alive\`. The two agree on any pruned state, so this only matters for an unpruned empty account.
- **Delegation out of gas and the BAL** ([interpreter.py](${EELS}/vm/interpreter.py)): if \`set_delegation\` runs out of gas in \`create_evm\`, the read of the recipient is never recorded in the block access list.

## Not covered

Live RPC estimation loops, replaying the Uniswap v4 trace, and INV-8 (replay after a mined transaction whose 7702 delegation was rolled back) are outside the model.
`
}

const eip8246: GlamsterdamPage = {
  slug: 'glamsterdam_8246',
  title: 'Glamsterdam: EIP-8246',
  description:
    'Lean 4 proofs on EIP-8246 (remove SELFDESTRUCT burn) and its interaction with the EIP-7928 block access list.',
  markdown: `
# Removing the SELFDESTRUCT burn (EIP-8246)

Part of the [Glamsterdam notes](/glamsterdam).

We modelled the account cleanup of [execution-specs at 16898000](${EELS}) (\`state_tracker.py\`, \`fork.py\`, \`block_access_lists.py\`) and how it interacts with the block access list (BAL) of EIP-7928.

## Status (17 Nov 2026)

EIP-8246 is in Last Call and scheduled for Glamsterdam, next to EIP-7708 (ETH transfer logs), whose open PRs [#12613](${EIPS}/12613) and [#12623](${EIPS}/12623) do not touch 8246. Wiping pre-existing storage when a contract is created over it is a separate EIP (8253, draft, not scheduled) and stays out of scope.

## What we proved

- ETH is conserved across calls, creates, reverts, SELFDESTRUCT to itself and sends to an already destroyed account. SELFDESTRUCT burns nothing, and fee settlement accounts for every wei.
- Clearing an account keeps its balance, removes its code, nonce and storage, and deletes it from the trie only when nothing is left. The cleared address can be deployed to again.
- No state gas is refunded by the cleanup.
- Once the BAL also records \`storage_clears\` (first edge case below), it matches the block's state.

## Edge cases found

- **Cleared storage missing from the BAL** ([block_access_lists.py](${EELS}/block_access_lists.py), \`update_builder_from_tx\`): \`destroy_storage\` records the cleared account in \`storage_clears\`, which the BAL builder ignores. If one transaction writes 42 to a slot and a later one in the same block clears the account, the state ends at 0 while the BAL still says 42. Still present on the current spec, and the most important result of this track.
- **System transactions** ([fork.py](${EELS}/fork.py), \`process_unchecked_system_transaction\`): the accounts a system transaction marks for deletion are never cleaned up. A defence in depth fix.
`
}

const epbs: GlamsterdamPage = {
  slug: 'glamsterdam_epbs',
  title: 'Glamsterdam: ePBS',
  description:
    'Lean 4 proofs on Gloas ePBS (EIP-7732) and builder deposits (EIP-8282), with the spec edge cases found.',
  markdown: `
# ePBS and builder deposits (EIP-7732, 8282)

Part of the [Glamsterdam notes](/glamsterdam).

We modelled the Gloas state transition of [consensus-specs v1.7.0-beta.4](${GLOAS}) (\`beacon-chain.md\` and \`fork.md\`), organised around the invariants Potuz listed with us: supply neutrality, payment to the proposer, no double counting, untouched existing operations, and same-slot unbundling.

## Status (17 Nov 2026)

There is no Gloas release after v1.7.0-beta.4 yet. The next one waits on how the payload is bound to the bid ([#5770](${CS}/pull/5770), block hash check, or [#5820](${CS}/pull/5820), payload root in the bid). We will rerun the model once that lands.

## What we proved

- Each bid settles at most once, and a bid that is confirmed or attested by quorum pays the proposer exactly its value.
- Builders stay solvent, withdrawals never underflow, and no ETH is created.
- Quorum weight is never counted twice, across slots or epochs.
- Same-slot unbundling is safe up to the consensus layer commitment.
- Fields outside ePBS are left untouched, and the EIP-8282 builder withdrawal queue drains in order.

## Edge cases found

- **Slashed proposer still paid** ([beacon-chain.md](${GLOAS}/beacon-chain.md), \`slash_validator\` and \`apply_parent_execution_payload\`): slashing clears the pending payment but not \`latest_execution_payload_bid.value\`, so if the next block comes two or more epochs later the payment comes back. Also reported in [#5754](${CS}/issues/5754), still open. Two fixes work: zero the bid value on slashing, or drop the payment removal from \`slash_validator\`.
- **Fork-slot availability bit** (\`upgrade_to_gloas\`): the bit for the fork slot was left set. Also reported in [#5794](${CS}/issues/5794) and fixed in [#5808](${CS}/pull/5808) on 12 Nov.
- **Availability bit overwritten after a long gap** (\`process_slot\` and \`apply_parent_execution_payload\`): when the gap between a block and its parent is a multiple of 8,192 slots, setting the parent's bit overwrites the child's. Unlikely in practice.
- **Builder top-up dropped** (\`process_builder_deposit_request\`): the credential prefix is checked before the pubkey, so a top-up to an existing builder without 0xB0 credentials is dropped.
- **Fork onboarding credits validator deposits to builders** (\`onboard_builders_from_pending_deposits\`): the same two checks in the opposite order, so a 0x01 or 0x02 deposit for a builder pubkey is credited to the builder. Minor, but the two functions should agree.
`
}

export const GLAMSTERDAM_PAGES = { overview, gas, eip8246, epbs }

export function markdownRoute(page: GlamsterdamPage) {
  return async function GET() {
    return new Response(page.markdown.trim() + '\n', {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    })
  }
}

export function pageMetadata(page: GlamsterdamPage) {
  const url = `https://share.thomas.md/${page.slug}`
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: { title: page.title, description: page.description, url, type: 'article' as const }
  }
}
