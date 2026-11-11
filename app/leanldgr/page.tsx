import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import OrbResourcesEmbed from './OrbResourcesEmbed'
import {
  C_BENCH_BARS,
  MERMAID_ARCHITECTURE,
  PAGE_TITLE,
  RUST_BENCH_BARS,
  VANADIUM_ISSUES,
  type BenchmarkChartItem
} from './data'
import './leanldgr.css'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    'POC Lean 4 sur les apps Bitcoin C (BOLOS) et Rust (Vanadium) de Ledger : preuves formelles, empreinte RAM/Flash réduite et exécution plus rapide.',
  alternates: {
    canonical: 'https://share.thomas.md/leanldgr'
  },
  robots: { index: false },
  openGraph: {
    title: PAGE_TITLE,
    description:
      'Vérification formelle Lean 4 et optimisation binaire sur Ledger app-bitcoin (C) et Vanadium (Rust).',
    url: 'https://share.thomas.md/leanldgr',
    type: 'article'
  }
}

function sevClass(sev: 'High' | 'Medium' | 'Low'): string {
  if (sev === 'High') return 'sev-badge sev-high'
  if (sev === 'Medium') return 'sev-badge sev-medium'
  return 'sev-badge sev-low'
}

function BenchmarkColumn({
  title,
  sub,
  items,
  variant,
  footer
}: {
  title: string
  sub: string
  items: BenchmarkChartItem[]
  variant: 'rust' | 'c'
  footer: string
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
            <span className="ldgr-metric-name">{item.label}</span>
            <span className="ldgr-metric-delta">{item.delta}</span>
          </div>
          <div className="ldgr-bars">
            <div className="ldgr-bar-row">
              <span className="ldgr-bar-tag">Baseline</span>
              <div className="ldgr-bar-track">
                <div className="ldgr-bar-fill is-orig" style={{ width: '100%' }} />
                <div className="ldgr-bar-val">
                  <span>{item.origValue}</span>
                  <span>100 %</span>
                </div>
              </div>
            </div>
            <div className="ldgr-bar-row is-opt">
              <span className="ldgr-bar-tag is-opt">+ Lean 4</span>
              <div className="ldgr-bar-track">
                <div
                  className={`ldgr-bar-fill ${variant === 'rust' ? 'is-opt-rust' : 'is-opt-c'}`}
                  style={{ width: `${item.optPct}%` }}
                />
                <div className="ldgr-bar-val">
                  <span>{item.optValue}</span>
                  <span>{item.optPct.toFixed(1).replace('.', ',')} %</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="ldgr-bench-foot">{footer}</div>
    </div>
  )
}

export default function LeanLedgerReportPage() {
  return (
    <article className="is-posts">
      <h1 className="title-display">Lean 4 Ledger</h1>

      <p>
        Montrer qu&apos;il est viable de réécrire un logiciel existant en Lean4 pour obtenir un
        binaire prouvé formellement, plus compact et plus rapide.
      </p>

      <h2 className="section-heading">1. Méthodologie et architecture</h2>
      <p>
        Côté temps humain, j&apos;ai passé environ <strong>1 h</strong> au départ pour cadrer le
        problème, poser les specs haut niveau et designer le pipeline (aidé par une connaissance de
        base de la stack Ledger), <strong>10 min</strong> hier soir pour débloquer un souci de
        routing d&apos;inférence, et <strong>1 h</strong> à la fin pour review et polir
        l&apos;ensemble. Tout le reste a tourné en autonomie.
      </p>
      <p>
        Ledger maintient deux apps Bitcoin aux toolchains très différentes : l&apos;app historique
        en C (
        <a
          href="https://github.com/LedgerHQ/app-bitcoin/tree/f010982d3050e02813cd7129bebd68cf2d1f2099"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>app-bitcoin@f010982d</code>
        </a>
        ), compilée nativement en ARM Thumb directement au-dessus de BOLOS, et la nouvelle V-App en
        Rust (
        <a
          href="https://github.com/LedgerHQ/vanadium/tree/ace8e96982408959dea9e7fbc59ee36e8c54e645"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>vanadium@ace8e969</code>
        </a>
        ), compilée en RISC-V 32-bit (<code>RV32IMAC</code>) puis exécutée par pages de 256 octets
        authentifiées par Merkle tree dans une VM tournant sur BOLOS.
      </p>
      <p>
        Plutôt que de toucher à l&apos;UI ou au transport APDU/ECALL (réécrire l&apos;UI en Lean 4
        aurait peu d&apos;intérêt), on a isolé un kernel commun zero-alloc pour la logique partagée
        (validation PSBT, accounting des montants, BIP-32, SegWit/Taproot, policies
        BIP-388/Miniscript, formatage division-free), qui concentre l&apos;essentiel de la surface
        d&apos;attaque, en gardant l&apos;UI et l&apos;IO d&apos;origine dans chaque app :
      </p>

      <Mermaid chart={MERMAID_ARCHITECTURE} />

      <h2 className="section-heading">2. Plan d&apos;exécution</h2>
      <ol>
        <li>
          <strong>Specs formelles et cross-backtesting</strong> : formalisation des BIPs en Lean 4
          à partir du cadrage haut niveau, puis implémentation du kernel exécutable en bouclant sur
          les test suites des deux repos (<code>ctest</code>/Ragger côté C,{' '}
          <code>cargo test</code>/Speculos côté Rust) pour affiner la spec jusqu&apos;à convergence.
        </li>
        <li>
          <strong>Backend LLVM 32-bit dans <code>turbo-lean</code></strong> : ajout du support
          freestanding 32-bit zero-alloc (<code>thumbv6m</code>, <code>thumbv8m.main</code>,{' '}
          <code>riscv32imac</code>) dans notre compilateur <code>turbo-lean</code>. Passer par LLVM
          IR plutôt que d&apos;émettre du bytecode ou de l&apos;assembleur direct est plus safe (la
          sémantique LLVM est déjà largement formalisée) et ne demandait qu&apos;un patch ciblé ;
          il reste encore de la marge d&apos;optimisation avec plus de compute.
        </li>
        <li>
          <strong>Intégration dans les deux apps</strong> : shim FFI minimal dans{' '}
          <code>app-bitcoin</code> et <code>vnd-bitcoin</code> conservant l&apos;UI/IO
          d&apos;origine et linkant les kernels Lean en LTO.
        </li>
        <li>
          <strong>Boucle d&apos;optimisation <code>maxwell</code></strong> : benchmarks
          reproductibles dans notre harness propriétaire <code>maxwell</code> sous contrainte de
          preuve (<code>0 sorryAx</code>, <code>2 405</code> théorèmes) et de 100 % des tests au
          vert, jusqu&apos;à passer sous les baselines Flash, RAM et latence sur les deux targets.
        </li>
      </ol>

      <h2 className="section-heading">3. Résultats et simulation</h2>
      <p>
        Sur les deux targets, le binaire patché avec Lean 4 est simultanément plus léger et plus
        rapide que la baseline non modifiée (chaque barre compare l&apos;original à{' '}
        <code>100 %</code> avec la version Lean 4) :
      </p>

      <div className="ldgr-bench-grid not-prose">
        <BenchmarkColumn
          title="Vanadium V-App (Rust → + Lean 4)"
          sub="RV32IMAC · Ledger Flex"
          items={RUST_BENCH_BARS}
          variant="rust"
          footer="176/176 tests unitaires & Speculos · 9 bugs fixés & prouvés"
        />
        <BenchmarkColumn
          title="BOLOS App (C → + Lean 4)"
          sub="ARM Thumb · Nano S+ / X"
          items={C_BENCH_BARS}
          variant="c"
          footer="31/31 ctest · 277/277 Ragger · 2 405 théorèmes (0 sorryAx)"
        />
      </div>

      <p>
        La simulation side-by-side ci-dessous compare notre V-App Rust patchée avec Lean 4 (à
        gauche) et la V-App de référence (à droite) sur Speculos Ledger Flex lors d&apos;un
        enregistrement de compte Taproot suivi d&apos;un signing PSBT, avec le profil RAM en bas :
      </p>

      <figure
        className="not-prose"
        style={{
          margin: '1.35rem 0 2rem 0',
          border: '1px solid var(--rule)',
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'var(--wash)'
        }}
      >
        <video
          src="/leanldgr/vanadium-side-by-side.mp4"
          poster="/leanldgr/vanadium-ram-poster.png"
          controls
          autoPlay
          loop
          muted
          playsInline
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
        <figcaption
          style={{
            padding: '0.6rem 0.9rem',
            fontSize: '0.78rem',
            color: 'var(--ink-muted)',
            borderTop: '1px solid var(--rule)'
          }}
        >
          Speculos Ledger Flex (<code>480×600</code>, slow-mo <code>0,3×</code>) :{' '}
          <code>vnd-bitcoin</code> + Lean 4 termine en <strong>2,02 s</strong> sous un footprint RAM
          divisé par deux (<strong>64,3 KiB</strong> vs <strong>128,3 KiB</strong> et{' '}
          <strong>2,61 s</strong> pour la baseline).
        </figcaption>
      </figure>

      <h2 className="section-heading">4. Bugs et anomalies trouvés dans Vanadium</h2>
      <p>
        La formalisation croisée entre <code>app-bitcoin</code> et <code>vanadium</code> a fait
        ressortir <strong>9 bugs et écarts de spec</strong> dans <code>LedgerHQ/vanadium</code> (
        <code>ace8e969</code>). <strong>7 sur 9 n&apos;étaient documentés nulle part</strong> (les 2
        autres n&apos;avaient qu&apos;un <code>TODO</code> ou <code>todo!()</code> partiel dans le
        code, et <code>0</code> issue GitHub ouverte). Nous n&apos;avons ouvert aucune issue
        publique ; tout est fixé dans le patch.
      </p>

      <div className="ldgr-issues-breakout not-prose">
        <div className="ldgr-issues-wrap">
          <table className="ldgr-issues-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Location</th>
                <th>Upstream status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {VANADIUM_ISSUES.map((issue) => (
                <tr key={issue.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <code>{issue.id}</code>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={sevClass(issue.severity)}>{issue.severityLabel}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <code>{issue.location}</code>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                    {issue.reportedStatus}
                  </td>
                  <td>{issue.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="section-heading">5. Résumé des ressources investies</h2>
      <p>
        L&apos;ensemble du run autonome (formalisation, patch compilateur <code>turbo-lean</code>,
        preuves des <code>2 405</code> théorèmes, intégration C/Rust et boucles{' '}
        <code>maxwell</code>) a tourné en <strong>19,9 h</strong> wall-clock (dont 2 h de pause
        nocturne) à travers <strong>30 agents actifs</strong> et <strong>25 microVMs cloud</strong>{' '}
        orchestrés dans <a href="https://github.com/th0rgal/orb">Orb</a> :
      </p>

      <div className="ldgr-res-kpis not-prose">
        <div className="ldgr-res-kpi">
          <div className="ldgr-res-kpi-val">379,0 CPU hours</div>
          <div className="ldgr-res-kpi-lbl">Compute cumulé</div>
          <div className="ldgr-res-kpi-sub">327,4 CPU-h Boat Zen 5 + 51,6 CPU-h ashur</div>
        </div>
        <div className="ldgr-res-kpi">
          <div className="ldgr-res-kpi-val">654,9 GB RAM hours</div>
          <div className="ldgr-res-kpi-lbl">Mémoire VMs dédiées</div>
          <div className="ldgr-res-kpi-sub">1 049,6 GB·h avec les tours actifs ashur</div>
        </div>
        <div className="ldgr-res-kpi">
          <div className="ldgr-res-kpi-val">23,2 M tok / agent</div>
          <div className="ldgr-res-kpi-lbl">Inférence moyenne</div>
          <div className="ldgr-res-kpi-sub">696,6 M tokens sur 30 agents actifs</div>
        </div>
      </div>

      <OrbResourcesEmbed />
    </article>
  )
}
