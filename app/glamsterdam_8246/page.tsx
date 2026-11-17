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
  EIP8246_DECISIONS,
  EIP8246_GUARANTEE_CLUSTERS,
  EIP8246_SCOPE_BOUNDARIES
} from '../glamsterdam/_shared/eip8246Data'
import { findingsForTrack } from '../glamsterdam/_shared/findingsData'
import '../glamsterdam/_shared/glamsterdam.css'

export const metadata = buildGlamsterdamMetadata('eip8246')

export default function Glamsterdam8246Page() {
  const findings = findingsForTrack('eip8246')

  return (
    <article className="is-posts glam-article">
      <GlamsterdamHeader pageId="eip8246" />

      <p>
        Dedicated formal verification note for{' '}
        <strong>EIP-8246 (clear destroyed account without balance wipe)</strong> and its
        interaction with <strong>EIP-7928 Block Access Lists</strong> and{' '}
        <strong>EIP-8037 state gas</strong>, pinned against{' '}
        <code>ethereum/execution-specs@16898000</code>.
      </p>

      <DecisionBox box={EIP8246_DECISIONS} />

      <h2 className="section-heading">1. Spec edge cases surfaced in EIP-8246 × EIP-7928</h2>

      <p>
        Connecting <code>state_tracker.py</code>’s <code>destroy_storage</code> and{' '}
        <code>clear_account_preserving_balance</code> to <code>block_access_lists.py</code>’s{' '}
        <code>update_builder_from_tx</code> exposed one High state-vs-BAL desynchronization (with a
        machine-checked two-line fix) and one Low system-transaction cleanup omission:
      </p>

      <FindingDisclosureList findings={findings} />

      <h2 className="section-heading">2. Kernel-checked guarantee clusters</h2>

      <p>
        Expand each cluster for the underlying Lean theorem declarations, file/line references, and
        exact projection vs. finite-map scope:
      </p>

      <GuaranteeClusterList clusters={EIP8246_GUARANTEE_CLUSTERS} />

      <h2 className="section-heading">3. Explicit scope boundaries</h2>

      <ScopeBoundaryList items={EIP8246_SCOPE_BOUNDARIES} />

      <GlamsterdamFooterNav pageId="eip8246" />
    </article>
  )
}
