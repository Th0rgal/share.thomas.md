import {
  buildGlamsterdamMetadata,
  DecisionBox,
  FindingDisclosureList,
  GlamsterdamFooterNav,
  GlamsterdamHeader,
  GuaranteeClusterList,
  ScopeBoundaryList
} from '../glamsterdam/_shared/components'
import {
  EPBS_DECISIONS,
  EPBS_GUARANTEE_CLUSTERS,
  EPBS_SCOPE_BOUNDARIES
} from '../glamsterdam/_shared/epbsData'
import { findingsForTrack } from '../glamsterdam/_shared/findingsData'
import '../glamsterdam/_shared/glamsterdam.css'

export const metadata = buildGlamsterdamMetadata('epbs')

export default function GlamsterdamEpbsPage() {
  const findings = findingsForTrack('epbs')

  return (
    <article className="is-posts glam-article">
      <GlamsterdamHeader pageId="epbs" />

      <p>
        Dedicated formal verification note for{' '}
        <strong>Gloas ePBS (EIP-7732) &amp; builder deposit/exit queues (EIP-8282)</strong>, pinned
        against <code>ethereum/consensus-specs@aa16bb4c</code> (<code>v1.7.0-beta.4</code>,{' '}
        <code>specs/gloas/beacon-chain.md</code> and <code>specs/gloas/fork.md</code>).
      </p>

      <DecisionBox box={EPBS_DECISIONS} />

      <h2 className="section-heading">1. Core consensus invariants verified in Lean 4</h2>

      <p>
        Rather than leading with isolated corner cases, the Gloas proof suite is organized around
        supply neutrality, proposer payment guarantees, unconditional validator quorum caps,
        same-slot unbundling at the CL commitment boundary, and non-interference on untouched CL
        fields:
      </p>

      <GuaranteeClusterList clusters={EPBS_GUARANTEE_CLUSTERS} />

      <h2 className="section-heading">2. Gloas v1.7.0-beta.4 pyspec edge cases surfaced along the way</h2>

      <p>
        Translating the executable <code>pyspec</code> blocks of <code>beacon-chain.md</code> and{' '}
        <code>fork.md</code> into Lean surfaced five concrete boundary bugs—each backed by an
        in-kernel counterexample witness (plus a standalone <code>pyspec</code> reproduction for{' '}
        <code>F-7732-SLASH</code>):
      </p>

      <FindingDisclosureList findings={findings} />

      <h2 className="section-heading">3. Explicit scope boundaries</h2>

      <ScopeBoundaryList items={EPBS_SCOPE_BOUNDARIES} />

      <GlamsterdamFooterNav pageId="epbs" />
    </article>
  )
}
