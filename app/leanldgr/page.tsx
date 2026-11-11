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
          </div>
          <div className="ldgr-bars">
            <div className="ldgr-bar-row">
              <span className="ldgr-bar-tag">Baseline</span>
              <div className="ldgr-bar-track">
                <div className="ldgr-bar-fill is-orig" style={{ width: '100%' }} />
                <div className="ldgr-bar-val">
                  <span>{item.origValue}</span>
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
                  <span className="ldgr-bar-delta">{item.delta}</span>
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
    <article className="is-posts ldgr-article">
      <h1 className="title-display">Lean 4 Ledger</h1>

      <p>
        Notre thèse est qu&apos;il est déjà viable aujourd&apos;hui de réécrire un logiciel existant
        en Lean4 pour obtenir un binaire prouvé formellement, plus compact et plus rapide. Hier
        Charles m&apos;a proposé de commencer avec l&apos;application Bitcoin de Ledger, voici le
        résultat en une journée.
      </p>

      <div className="ldgr-callout" role="note">
        <strong>IMPORTANT :</strong> Il s&apos;agit d&apos;une POC réalisée en une journée, pas
        d&apos;un livrable prêt pour la production : une utilisation réelle demanderait davantage de
        review interne de notre côté ainsi que la confirmation de plusieurs choix de modélisation et
        d&apos;intégration avec un expert du domaine.
      </div>

      <h2 className="section-heading">1. Méthodologie et architecture</h2>
      <p>
        Côté temps humain, j&apos;ai passé environ <strong>1 h</strong> au départ pour cadrer le
        problème, poser les specs haut niveau et designer le pipeline (j&apos;avais déjà une idée de
        la stack Ledger donc j&apos;ai gagné un peu de temps), <strong>15 min</strong> ce matin pour
        débloquer un souci de routing d&apos;inférence, et <strong>1 h</strong> à la fin pour review
        et polir l&apos;ensemble. Tout le reste a tourné en autonomie.
      </p>
      <p>
        Ledger maintient deux apps Bitcoin : l&apos;app historique en C (
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
        ), compilée en RISC-V 32-bit (<code>RV32IMAC</code>) et exécutée dans une VM tournant sur
        BOLOS (pour déléguer une partie de l&apos;exécution au PC host si je comprends bien).
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
          IR plutôt que d&apos;émettre du bytecode ou de l&apos;assembleur direct m&apos;a semblé
          plus sûr (la sémantique LLVM est déjà largement formalisée) et ne demandait qu&apos;un
          patch ciblé. Notez qu&apos;il reste donc encore de la marge d&apos;optimisation avec plus
          de compute.
        </li>
        <li>
          <strong>Intégration dans les deux apps</strong> : shim FFI minimal dans{' '}
          <code>app-bitcoin</code> et <code>vnd-bitcoin</code> conservant l&apos;UI/IO
          d&apos;origine et linkant les kernels Lean en LTO.
        </li>
        <li>
          <strong>Boucle d&apos;optimisation <code>maxwell</code></strong> : itérations pilotées
          selon notre méthodologie <code>maxwell</code> avec des scripts de benchmark
          reproductibles (<code>bolos_benchmark.sh</code>, <code>vanadium_benchmark.sh</code>) sous
          contrainte stricte du noyau Lean (<code>0 sorryAx</code>, <code>2 494</code> théorèmes) et
          de 100 % des tests au vert, jusqu&apos;à passer sous les baselines Flash, RAM et latence
          sur les deux targets.
        </li>
      </ol>

      <h2 className="section-heading">3. Résultats et simulation</h2>
      <p>
        Sur les deux targets, le binaire patché avec Lean 4 est simultanément plus léger et plus
        rapide que la baseline non modifiée :
      </p>

      <div className="ldgr-bench-breakout not-prose">
        <div className="ldgr-bench-grid">
          <BenchmarkColumn
            title="Vanadium V-App (Rust → + Lean 4)"
            sub="RV32IMAC · Ledger Flex"
            items={RUST_BENCH_BARS}
            variant="rust"
            footer="176/176 tests workspace (+16 C-ABI) · 9 bugs fixés & prouvés"
          />
          <BenchmarkColumn
            title="BOLOS App (C → + Lean 4)"
            sub="ARM Thumb · Nano S+ / X"
            items={C_BENCH_BARS}
            variant="c"
            footer="31/31 ctest · 277/277 Ragger · 2 494 théorèmes (0 sorryAx)"
          />
        </div>
      </div>

      <p>
        La simulation side-by-side ci-dessous compare notre V-App Rust patchée avec Lean 4 (à
        gauche) et la V-App de référence (à droite) sur Speculos Ledger Flex lors d&apos;un
        enregistrement de compte Taproot suivi d&apos;un signing PSBT, avec le profil RAM en bas :
      </p>

      <figure className="ldgr-video-figure not-prose">
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
        <figcaption className="ldgr-video-caption">
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
                  <td>
                    <div className="ldgr-loc-list">
                      {issue.locations.map((loc) => (
                        <a
                          key={loc.url}
                          href={loc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ldgr-loc-link"
                        >
                          <code>{loc.label}</code>
                        </a>
                      ))}
                    </div>
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
        preuves des <code>2 494</code> théorèmes, intégration C/Rust et boucles{' '}
        <code>maxwell</code>) a tourné en <strong>19,9 h</strong> wall-clock sur la fenêtre capturée
        ci-dessous jusqu&apos;au merge du repo principal (dont 2 heures de pause à cause d&apos;un
        problème d&apos;approvisionnement d&apos;inférence que j&apos;ai réglé à la main) à travers{' '}
        <strong>30 agents actifs</strong> et <strong>25 microVMs cloud</strong> orchestrés dans{' '}
        <a href="https://github.com/th0rgal/orb">Orb</a> :
      </p>

      <ul>
        <li>
          <strong>379,0 CPU hours</strong> de compute cumulé (<code>327,4 CPU-h</code> sur 25
          microVMs cloud éphémères AMD Zen + <code>51,6 CPU-h</code> sur notre serveur dédié{' '}
          <code>ashur</code> pendant les tours actifs).
        </li>
        <li>
          <strong>654,9 GB RAM hours</strong> sur les VMs cloud éphémères (
          <code>1 049,6 GB RAM-h</code> en comptant la RAM réservée sur <code>ashur</code> durant
          les tours actifs).
        </li>
        <li>
          <strong>23,2 M tokens / agent</strong> en moyenne (<code>696,6 M</code> tokens cumulés sur{' '}
          <code>30</code> agents actifs : <code>1</code> coordinateur + <code>29</code> subagents).
        </li>
      </ul>

      <p>
        En valorisant ce run aux tarifs publics les plus élevés (inférence à l&apos;API Google
        Gemini Pro au palier haut <code>&gt;&nbsp;200k</code> de contexte : <code>$4,00/M</code> en
        entrée hors cache, <code>$0,40/M</code> en lecture de cache et <code>$18,00/M</code> en
        sortie ; location des 25 VMs éphémères en AWS EC2 On-Demand <code>c7a</code> AMD EPYC),
        l&apos;ensemble revient à environ <strong>~$535 d&apos;API Google</strong> pour les{' '}
        <code>696,6 M</code> tokens avec ~91,5 % de lecture de cache (<code>~$163,40</code> sur le
        coordinateur pour <code>141,0 M</code> tokens et <code>~$372,00</code> sur les 29 subagents
        pour <code>555,6 M</code> tokens) et <strong>~$16,80 sur AWS</strong> pour les 25 VMs (
        <code>$7,06</code> pour <code>8,6 h</code> en <code>c7a.4xlarge</code> 16 vCPU / 32 GiB à{' '}
        <code>$0,821/h</code>, <code>$9,72</code> pour <code>23,7 h</code> en{' '}
        <code>c7a.2xlarge</code> 8 vCPU / 16 GiB à <code>$0,411/h</code> et <code>$0,02</code> en{' '}
        <code>c7a.xlarge</code>), soit <strong>~$552 au total</strong>. Cette estimation exclut
        notre infrastructure personnelle (le nœud dédié <code>ashur</code>, ainsi que nos GPUs
        utilisés en amont pour d&apos;éventuels entraînements de modèles visant à optimiser le
        compilateur), dont la part amortie sur ce run reste relativement négligeable.
      </p>

      <OrbResourcesEmbed />
    </article>
  )
}
