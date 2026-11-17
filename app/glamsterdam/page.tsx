import Link from 'next/link'
import Mermaid from '../components/Mermaid'
import {
  buildGlamsterdamMetadata,
  GlamsterdamFooterNav,
  GlamsterdamHeader,
  ScopeBoundaryList,
  sevBadgeClass
} from './_shared/components'
import { AUDIT_FINDINGS } from './_shared/findingsData'
import {
  MERMAID_PIPELINE,
  OVERVIEW_SCOPE_GAPS,
  TRACK_CARDS
} from './_shared/overviewData'
import {
  EELS_BLOB,
  GLOAS_BLOB,
  METHODOLOGY_TRUST,
  TRUST_FACTS
} from './_shared/routes'
import './_shared/glamsterdam.css'

export const metadata = buildGlamsterdamMetadata('overview')

export default function GlamsterdamOverviewPage() {
  return (
    <article className="is-posts glam-article">
      <GlamsterdamHeader pageId="overview" />

      <p>
        Across our three Glamsterdam formal verification tracks with Ethereum Foundation leads—
        <Link href="/glamsterdam_gas">
          <strong>2D state gas</strong>
        </Link>{' '}
        (<code>EIP-8037 / 8038 / 2780 / 7778</code>),{' '}
        <Link href="/glamsterdam_8246">
          <strong>account cleanup &amp; ETH conservation</strong>
        </Link>{' '}
        (<code>EIP-8246</code>), and{' '}
        <Link href="/glamsterdam_epbs">
          <strong>ePBS + builder queues</strong>
        </Link>{' '}
        (<code>Gloas EIP-7732 / 8282</code>)—we translated the pinned Python reference
        specifications into Lean 4.31 to machine-check core invariants, compare competing spec PRs,
        and surface cross-EIP edge cases early.
      </p>

      <p>
        <strong>Scope &amp; role:</strong> our contribution here is Lean 4 proof engineering and
        AI-assisted formalization, not protocol design. Every theorem holds relative to pinned
        upstream commits and explicit model boundaries—review by EF spec authors is what confirms
        those statements match what Ethereum intends to ship.
      </p>

      <div className="stats-grid not-prose">
        {TRUST_FACTS.map((fact) => (
          <div key={fact.sub} className="stat-card">
            <div className="stat-value">{fact.label}</div>
            <div className="stat-label">{fact.sub}</div>
          </div>
        ))}
      </div>

      <h2 className="section-heading">1. Tracks &amp; dedicated deep dives</h2>

      <p>
        Each track now has a dedicated note with lead-specific decision questions above the fold,
        full edge-case breakdowns, and expandable theorem inventories:
      </p>

      <div className="glam-wide-breakout not-prose">
        <div className="glam-tracks-grid">
          {TRACK_CARDS.map((t) => (
            <Link key={t.id} href={t.href} className="glam-track-card">
              <div className="glam-track-head">
                <div className="glam-track-title-row">
                  <span className="glam-track-title">{t.title}</span>
                  <span className="glam-track-pill">{t.coverageBadge}</span>
                </div>
                <span className="glam-track-sub">{t.sub}</span>
              </div>

              <div className="glam-track-meta">
                <div>
                  <strong>Contacts:</strong> {t.contacts}
                </div>
                <div>
                  <strong>Target:</strong> <code>{t.sourceTarget}</code>
                </div>
              </div>

              <ul className="glam-track-list">
                {t.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>

              <div className="glam-track-foot">{t.edgeCasesLine}</div>
            </Link>
          ))}
        </div>
      </div>

      <h2 className="section-heading">2. How the Lean 4 model is anchored to upstream code</h2>

      <p>
        Rather than formalizing prose EIPs in isolation, we modeled the executable Python specs and
        checked prose intent against them:
      </p>

      <ul>
        <li>
          <strong>Execution Layer (Python EELS):</strong>{' '}
          <a
            href={`${EELS_BLOB}/src/ethereum/forks/amsterdam`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>ethereum/execution-specs@16898000</code>
          </a>{' '}
          (<code>vm/gas.py</code>, <code>state_tracker.py</code>, <code>vm/interpreter.py</code>,{' '}
          <code>vm/instructions/storage.py</code>, <code>vm/instructions/system.py</code>,{' '}
          <code>vm/eoa_delegation.py</code>, <code>block_access_lists.py</code>,{' '}
          <code>fork.py</code>), plus{' '}
          <a
            href="https://github.com/ethereum/EIPs/pull/12581"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>EIPs#12581</code>
          </a>
          ,{' '}
          <a
            href="https://github.com/ethereum/EIPs/pull/12582"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>EIPs#12582</code>
          </a>
          , and Nethermind’s{' '}
          <a
            href="https://github.com/NethermindEth/nethermind/pull/15187"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>#15187</code>
          </a>{' '}
          <code>CreateChildFrameGas</code> prototype.
        </li>
        <li>
          <strong>Consensus Layer (executable <code>pyspec</code>):</strong>{' '}
          <a href={`${GLOAS_BLOB}/specs/gloas`} target="_blank" rel="noopener noreferrer">
            <code>ethereum/consensus-specs@aa16bb4c</code>
          </a>{' '}
          (<code>v1.7.0-beta.4</code>, <code>specs/gloas/beacon-chain.md</code> and{' '}
          <code>specs/gloas/fork.md</code>; <code>fork-choice.md</code> and P2P gossip excluded).
        </li>
        <li>
          <strong>Exact ledger &amp; gate accounting:</strong> {METHODOLOGY_TRUST} Across{' '}
          <code>source-map.yaml</code>, <code>61</code> Lean definitions map onto <code>23</code>{' '}
          SHA256-locked upstream files, and <code>21</code> core transition functions export C-ABI
          symbols (<code>@[export]</code>) differentially tested against Python.
        </li>
      </ul>

      <Mermaid chart={MERMAID_PIPELINE} />

      <h2 className="section-heading">3. Cross-track index of surfaced edge cases</h2>

      <p>
        All 10 edge cases below sit on unshipped Glamsterdam branches (none affect live Osaka
        mainnet). Click through to each track page for full counterexample traces and candidate
        patches:
      </p>

      <div className="glam-wide-breakout not-prose">
        <div className="glam-table-wrap">
          <table className="glam-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Track</th>
                <th>Severity</th>
                <th>Upstream Location</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_FINDINGS.map((f) => {
                const trackHref =
                  f.track === 'gas'
                    ? '/glamsterdam_gas'
                    : f.track === 'eip8246'
                      ? '/glamsterdam_8246'
                      : '/glamsterdam_epbs'
                return (
                  <tr key={f.id}>
                    <td className="glam-cell-nowrap">
                      <Link href={trackHref}>
                        <code>{f.id}</code>
                      </Link>
                    </td>
                    <td className="glam-cell-track">
                      <Link href={trackHref}>{f.trackLabel}</Link>
                    </td>
                    <td className="glam-cell-nowrap">
                      <span className={sevBadgeClass(f.severity)}>{f.severityLabel}</span>
                    </td>
                    <td>
                      <div className="glam-loc-list">
                        {f.locations.map((loc) => (
                          <a
                            key={loc.url}
                            href={loc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glam-loc-link"
                          >
                            <code>{loc.label}</code>
                          </a>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{f.title}.</strong> {f.impact}
                      </div>
                      <div className="glam-thm">{f.leanSymbols.join(' · ')}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="section-heading">4. Known unmodeled boundaries</h2>

      <p>What the current Lean suite explicitly does <strong>not</strong> claim to cover yet:</p>

      <ScopeBoundaryList items={OVERVIEW_SCOPE_GAPS} />

      <GlamsterdamFooterNav pageId="overview" />
    </article>
  )
}
