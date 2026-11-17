import type { Metadata } from 'next'
import Link from 'next/link'
import type {
  AuditFinding,
  EfInvariantRow,
  GlamsterdamPageId,
  GuaranteeCluster,
  ScopeBoundaryItem,
  Severity,
  TrackDecisionBox,
  VariantComparisonRow
} from './types'
import { ROUTES } from './routes'

export function buildGlamsterdamMetadata(pageId: GlamsterdamPageId): Metadata {
  const route = ROUTES[pageId]
  const canonicalUrl = `https://share.thomas.md${route.href}`
  return {
    title: route.metaTitle,
    description: route.description,
    alternates: {
      canonical: canonicalUrl
    },
    robots: { index: false, follow: false },
    openGraph: {
      title: route.metaTitle,
      description: route.description,
      url: canonicalUrl,
      type: 'article'
    }
  }
}

export function sevBadgeClass(sev: Severity): string {
  if (sev === 'High') return 'sev-badge sev-high'
  if (sev === 'Medium') return 'sev-badge sev-medium'
  return 'sev-badge sev-low'
}

export function GlamsterdamHeader({ pageId }: { pageId: GlamsterdamPageId }) {
  const route = ROUTES[pageId]
  const orderedIds: GlamsterdamPageId[] = ['overview', 'gas', 'eip8246', 'epbs']

  return (
    <>
      <nav className="report-tabs not-prose" aria-label="Glamsterdam audit sections">
        {orderedIds.map((id) => {
          const item = ROUTES[id]
          const isActive = id === pageId
          return (
            <Link
              key={id}
              href={item.href}
              className={isActive ? 'report-tab is-active' : 'report-tab'}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.tabLabel}
            </Link>
          )
        })}
      </nav>

      <h1 className="title-display">{route.title}</h1>

      <div className="report-subtitle not-prose">
        <span>Lean 4.31</span>
        {' · '}
        <span>{route.subtitleSummary}</span>
        {' · '}
        <a href={route.rawMdHref}>Raw .md</a>
      </div>
    </>
  )
}

export function GlamsterdamFooterNav({ pageId }: { pageId: GlamsterdamPageId }) {
  const orderedIds: GlamsterdamPageId[] = ['overview', 'gas', 'eip8246', 'epbs']
  const others = orderedIds.filter((id) => id !== pageId)

  return (
    <div className="glam-footer-nav not-prose">
      <span>Companion Glamsterdam notes:</span>
      <div className="glam-footer-links">
        {others.map((id) => (
          <Link key={id} href={ROUTES[id].href}>
            {ROUTES[id].tabLabel}
          </Link>
        ))}
        <a href={ROUTES[pageId].rawMdHref}>Raw Markdown</a>
      </div>
    </div>
  )
}

export function DecisionBox({ box }: { box: TrackDecisionBox }) {
  return (
    <section className="glam-decision-box not-prose" aria-label={box.eyebrow}>
      <div className="glam-decision-head">
        <span className="glam-decision-eyebrow">{box.eyebrow}</span>
        <span className="glam-decision-contacts">{box.contacts}</span>
      </div>
      <p className="glam-decision-bottomline">{box.bottomLine}</p>
      <ol className="glam-decision-list">
        {box.questions.map((q) => (
          <li key={q.prompt}>
            <strong>{q.prompt}</strong> {q.detail}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function FindingDisclosureList({
  findings,
  defaultOpenFirst = true
}: {
  findings: AuditFinding[]
  defaultOpenFirst?: boolean
}) {
  return (
    <div className="glam-disclosure-stack not-prose">
      {findings.map((f, idx) => (
        <details
          key={f.id}
          className="glam-details"
          open={defaultOpenFirst && idx === 0 ? true : undefined}
        >
          <summary className="glam-details-summary">
            <span className={sevBadgeClass(f.severity)}>{f.severityLabel}</span>
            <div className="finding-title-wrap">
              <span className="finding-title">
                <code>{f.id}</code> — {f.title}
              </span>
              <span className="finding-component">
                {f.locations.map((l) => l.label).join(' · ')}
              </span>
            </div>
            <span className="glam-details-marker" aria-hidden="true" />
          </summary>

          <div className="glam-details-body">
            <p>{f.summary}</p>
            <p>
              <strong>Impact:</strong> {f.impact}
            </p>
            {f.fixNote && (
              <div className="glam-scope-note">
                <strong>Candidate fix / status:</strong> {f.fixNote}
              </div>
            )}

            <div className="glam-loc-row">
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

            <div className="glam-thm">
              Lean declarations: {f.leanSymbols.join(' · ')}
            </div>
          </div>
        </details>
      ))}
    </div>
  )
}

export function GuaranteeClusterList({ clusters }: { clusters: GuaranteeCluster[] }) {
  return (
    <div className="glam-disclosure-stack not-prose">
      {clusters.map((c, idx) => (
        <details key={c.id} className="glam-details" open={idx === 0 ? true : undefined}>
          <summary className="glam-details-summary">
            <span className="sev-badge sev-proof">{c.badge}</span>
            <div className="finding-title-wrap">
              <span className="finding-title">{c.title}</span>
              <span className="finding-component">
                {c.theorems.length} representative kernel-checked declarations
              </span>
            </div>
            <span className="glam-details-marker" aria-hidden="true" />
          </summary>

          <div className="glam-details-body">
            <p>{c.summary}</p>

            <ul className="glam-thm-list">
              {c.theorems.map((t) => (
                <li key={t.name}>
                  <code>{t.name}</code> <span className="glam-thm">({t.file})</span> —{' '}
                  {t.statement}
                </li>
              ))}
            </ul>

            <div className="glam-scope-note">
              <strong>Model boundary:</strong> {c.scopeNote}
              {c.assumptions && c.assumptions.length > 0 && (
                <>
                  {' '}
                  {c.assumptions.join(' ')}
                </>
              )}
            </div>

            {c.upstreamRefs && c.upstreamRefs.length > 0 && (
              <div className="glam-loc-row">
                {c.upstreamRefs.map((ref) => (
                  <a
                    key={ref.url}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glam-loc-link"
                  >
                    <code>{ref.label}</code>
                  </a>
                ))}
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}

export function VariantComparisonTable({ rows }: { rows: VariantComparisonRow[] }) {
  return (
    <div className="glam-wide-breakout not-prose">
      <div className="glam-table-wrap">
        <table className="glam-table">
          <thead>
            <tr>
              <th>Variant</th>
              <th>Set-Call-Clear</th>
              <th>Pre-Call Clear / CREATE</th>
              <th>Sibling gasleft()</th>
              <th>Callee / DELEGATECALL Reservoir</th>
              <th>Takeaway</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.variant}>
                <td className="glam-cell-nowrap">
                  <strong>{row.variant}</strong>
                  <div className="glam-thm">{row.source}</div>
                </td>
                <td>{row.setCallClear}</td>
                <td>{row.preCallClearOrCreate}</td>
                <td>{row.siblingGasLeft}</td>
                <td>{row.calleeReservoir}</td>
                <td>{row.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function EfInvariantsTable({ rows }: { rows: EfInvariantRow[] }) {
  return (
    <div className="glam-wide-breakout not-prose">
      <div className="glam-table-wrap">
        <table className="glam-table">
          <thead>
            <tr>
              <th>Invariant</th>
              <th>Status</th>
              <th>Property</th>
              <th>Lean Coverage &amp; Boundary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="glam-cell-nowrap">
                  <code>{row.id}</code>
                </td>
                <td className="glam-cell-nowrap">
                  <span
                    className={
                      row.status === 'Proved'
                        ? 'sev-badge sev-proof'
                        : 'sev-badge sev-medium'
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td>{row.property}</td>
                <td>
                  <div>{row.boundaryNote}</div>
                  <div className="glam-thm">{row.theorems.join(' · ')}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ScopeBoundaryList({ items }: { items: ScopeBoundaryItem[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.label}>
          <strong>{item.label}:</strong> {item.detail}
        </li>
      ))}
    </ul>
  )
}
