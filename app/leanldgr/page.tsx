import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import OrbResourcesEmbed from './OrbResourcesEmbed'
import {
  PAGE_TITLE, INTRO, DISCLAIMER, HUMAN_TIME, ARCHITECTURE_INTRO, DELIVERABLES, PLAN,
  REPO_URL, TURBO_LEAN_URL, BOLOS_PATCH_URL, VANADIUM_PATCH_URL, MERMAID_ARCHITECTURE,
  BENCHMARK_CARDS, CANDIDATE_A_READING, CANDIDATE_A_SOURCE_URL, CANDIDATE_A_PROOF_URL,
  LIMITS, ISSUES_SUMMARY, ISSUE_REPORT_URL, RESOURCE_WINDOW_NOTICE, RESOURCE_FACTS,
  RESOURCE_COST, type BenchmarkChartItem
} from './data'
import './leanldgr.css'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    'POC Lean 4 sur les apps Bitcoin C (BOLOS) et Rust (Vanadium) de Ledger : jumeau formel, sous-ensemble freestanding 32-bit et observations de benchmarks.',
  alternates: {
    canonical: 'https://share.thomas.md/leanldgr'
  },
  robots: { index: false },
  openGraph: {
    title: PAGE_TITLE,
    description:
      'Modélisation formelle Lean 4 et intégration de noyaux freestanding sur Ledger app-bitcoin (C) et Vanadium (Rust).',
    url: 'https://share.thomas.md/leanldgr',
    type: 'article'
  }
}

function BenchmarkColumn({
  title,
  sub,
  items,
  variant,
  footer,
  sources
}: {
  title: string
  sub: string
  items: BenchmarkChartItem[]
  variant: 'rust' | 'c'
  footer: string
  sources: { label: string; url: string }[]
}) {
  return (
    <div className="ldgr-bench-col">
      <div className="ldgr-bench-col-head">
        <span className="ldgr-bench-col-title">{title}</span>
        <span className="ldgr-bench-col-sub">{sub}</span>
      </div>

      {items.map((item) => (
        <div key={item.label} className="ldgr-metric">
          <div className="ldgr-metric-head">
            <span className="ldgr-metric-name">{item.label} <small>· {item.campaign}</small></span>
          </div>
          <div className="ldgr-bars">
            <div className="ldgr-bar-row">
              <span className="ldgr-bar-tag">Baseline</span>
              <div className="ldgr-bar-track">
                <div className="ldgr-bar-fill is-orig" style={{ width: `${100 / Math.max(100, item.optPct) * 100}%` }} />
                <div className="ldgr-bar-val">
                  <span>{item.origValue}</span>
                </div>
              </div>
            </div>
            <div className="ldgr-bar-row is-opt">
              <span className="ldgr-bar-tag is-opt">Optimisé</span>
              <div className="ldgr-bar-track">
                <div
                  className={`ldgr-bar-fill ${variant === 'rust' ? 'is-opt-rust' : 'is-opt-c'}`}
                  style={{ width: `${item.optPct / Math.max(100, item.optPct) * 100}%` }}
                />
                <div className="ldgr-bar-val">
                  <span>{item.optValue}</span>
                  <span className="ldgr-bar-delta">{item.delta}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="ldgr-bench-foot">
        {footer}<br />
        {sources.map((source, index) => <span key={source.url}>
          {index > 0 && ' · '}<a href={source.url}>{source.label}</a>
        </span>)}
      </div>
    </div>
  )
}

export default function LeanLedgerReportPage() {
  return (
    <article className="is-posts ldgr-article">
      <h1 className="title-display">{PAGE_TITLE}</h1>
      <p>{INTRO}</p>
      <p><strong>Important :</strong> {DISCLAIMER}</p>

      <h2 className="section-heading">1. Méthodologie et architecture</h2>
      <p>{HUMAN_TIME}</p>
      <p>{ARCHITECTURE_INTRO}</p>
      <ul>{DELIVERABLES.map((text) => <li key={text}>{text}</li>)}</ul>
      <p>
        <a href={REPO_URL}>Projet</a> · <a href={TURBO_LEAN_URL}>turbo-lean</a> ·{' '}
        <a href={BOLOS_PATCH_URL}>Patch BOLOS</a> · <a href={VANADIUM_PATCH_URL}>Patch Vanadium</a>
      </p>
      <Mermaid chart={MERMAID_ARCHITECTURE} />

      <h2 className="section-heading">2. Plan d’exécution</h2>
      <ol>{PLAN.map((text) => <li key={text}>{text}</li>)}</ol>

      <h2 className="section-heading">3. Résultats</h2>
      <div className="ldgr-bench-breakout not-prose">
        <div className="ldgr-bench-grid">
          {BENCHMARK_CARDS.map((card) => <BenchmarkColumn key={card.title} {...card} />)}
        </div>
      </div>
      <p>{CANDIDATE_A_READING}</p>
      <p><a href={CANDIDATE_A_SOURCE_URL}>Détails A</a> ·{' '}
        <a href={CANDIDATE_A_PROOF_URL}>Preuve de substitution</a></p>
      <ul>{LIMITS.map((text) => <li key={text}>{text}</li>)}</ul>

      <h2 className="section-heading">4. Bugs et anomalies trouvés dans Vanadium</h2>
      <p>{ISSUES_SUMMARY}</p>
      <p><a href={ISSUE_REPORT_URL}>Catalogue détaillé</a> ·{' '}
        <a href={VANADIUM_PATCH_URL}>Correctifs</a></p>

      <h2 className="section-heading">5. Ressources du run initial</h2>
      <p>{RESOURCE_WINDOW_NOTICE}</p>
      <ul>{RESOURCE_FACTS.map((text) => <li key={text}>{text}</li>)}</ul>
      <p>{RESOURCE_COST}</p>
      <OrbResourcesEmbed />
    </article>
  )
}
