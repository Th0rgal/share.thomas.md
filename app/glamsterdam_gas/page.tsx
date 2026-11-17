import {
  buildGlamsterdamMetadata,
  DecisionBox,
  EfInvariantsTable,
  FindingDisclosureList,
  GlamsterdamFooterNav,
  GlamsterdamHeader,
  GuaranteeClusterList,
  ScopeBoundaryList,
  VariantComparisonTable
} from '../glamsterdam/_shared/components'
import { findingsForTrack } from '../glamsterdam/_shared/findingsData'
import {
  GAS_DECISIONS,
  GAS_EF_INVARIANTS,
  GAS_GUARANTEE_CLUSTERS,
  GAS_SCOPE_BOUNDARIES,
  GAS_VARIANT_ROWS
} from '../glamsterdam/_shared/gasData'
import '../glamsterdam/_shared/glamsterdam.css'

export const metadata = buildGlamsterdamMetadata('gas')

export default function GlamsterdamGasPage() {
  const gasFindings = findingsForTrack('gas')

  return (
    <article className="is-posts glam-article">
      <GlamsterdamHeader pageId="gas" />

      <p>
        Dedicated formal verification note for Glamsterdam’s{' '}
        <strong>two-dimensional state gas</strong> stack (
        <code>EIP-8037 / 8038 / 2780 / 7778</code>), pinned against{' '}
        <code>ethereum/execution-specs@16898000</code> and extended with candidate refill/ceiling
        PRs{' '}
        <a
          href="https://github.com/ethereum/EIPs/pull/12581"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>EIPs#12581</code>
        </a>{' '}
        and{' '}
        <a
          href="https://github.com/ethereum/EIPs/pull/12582"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>EIPs#12582</code>
        </a>
        .
      </p>

      <DecisionBox box={GAS_DECISIONS} />

      <h2 className="section-heading">1. Comparing EIP-8037 / 8038 variants on multi-frame call trees</h2>

      <p>
        With Glamsterdam paused while ACD evaluates options (
        <a
          href="https://blog.ethereum.org/2026/11/06/glamsterdam-8037-8038"
          target="_blank"
          rel="noopener noreferrer"
        >
          6 Nov EF post
        </a>{' '}
        and{' '}
        <a
          href="https://github.com/ethereum/glamsterdam-gas-invariants"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>glamsterdam-gas-invariants</code>
        </a>
        ), our multi-frame Lean model puts <code>Amsterdam D0</code>, <code>#12581</code>, and{' '}
        <code>#12582</code> side by side on the exact call patterns where silent child failure,
        mid-frame gas stranding, or <code>gasleft()</code> jumps occur:
      </p>

      <VariantComparisonTable rows={GAS_VARIANT_ROWS} />

      <h2 className="section-heading">2. Spec &amp; prototype edge cases surfaced in Lean</h2>

      <p>
        Four concrete spec/client interactions surfaced while formalizing the pinned EELS gas model
        and cross-checking Nethermind’s <code>#15187</code> prototype:
      </p>

      <FindingDisclosureList findings={gasFindings} />

      <h2 className="section-heading">3. Mapping to EF’s 8 Glamsterdam gas invariants</h2>

      <p>
        Direct theorem-by-theorem alignment against the eight broken invariants catalogued in{' '}
        <code>ethereum/glamsterdam-gas-invariants</code>, noting explicitly where coverage is
        complete at the EELS meter level vs. partial:
      </p>

      <EfInvariantsTable rows={GAS_EF_INVARIANTS} />

      <h2 className="section-heading">4. Kernel-checked guarantee clusters</h2>

      <p>
        Expand any cluster below for representative Lean theorem names, file/line locations, and
        exact modeling boundaries:
      </p>

      <GuaranteeClusterList clusters={GAS_GUARANTEE_CLUSTERS} />

      <h2 className="section-heading">5. Explicit scope boundaries &amp; open gaps</h2>

      <ScopeBoundaryList items={GAS_SCOPE_BOUNDARIES} />

      <GlamsterdamFooterNav pageId="gas" />
    </article>
  )
}
