import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import OrbResourcesEmbed from './OrbResourcesEmbed'
import {
  BENCHMARK_CONCLUSIONS,
  CANDIDATE_A_READING,
  CANDIDATE_A_SOURCE_URL,
  BENCHMARK_ROWS,
  MEASUREMENT_TABLES,
  formatMeasurement,
  BENCHMARK_READING,
  BENCHMARK_STATUS,
  C_TEST_HISTORY,
  PROOF_SCOPE,
  RUST_TEST_HISTORY,
  TCB_SCOPE,
  RAM_CURVE_NOTICE,
  BOLOS_PATCH_URL,
  C_BENCH_BARS,
  MERMAID_ARCHITECTURE,
  PAGE_TITLE,
  REPO_URL,
  RUST_BENCH_BARS,
  TURBO_LEAN_URL,
  VANADIUM_ISSUES,
  VANADIUM_PATCH_URL,
  type BenchmarkChartItem
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
                <div className="ldgr-bar-fill is-orig" style={{ width: `${100 / Math.max(100, item.optPct) * 100}%` }} />
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

      <p>
        <strong>Important :</strong> il s&apos;agit d&apos;une POC d&apos;une journée, un
        déploiement demanderait davantage de review de notre côté et la validation des choix de
        modélisation du vôtre.
      </p>

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
        ), compilée en RISC-V 32-bit (<code>RV32IMAC</code>) et exécutée par la VM{' '}
        <code>app-vanadium</code> : 100 % de l&apos;exécution RISC-V reste confinée dans le Secure
        Element, seule la mémoire paginée — code et données en pages de <code>256 B</code> chiffrées
        et authentifiées par arbre de Merkle — est déportée sur le host non fiable, utilisé comme
        stockage et non comme moteur de calcul, pour dépasser la limite de RAM/Flash interne du SE.
      </p>
      <p>
        Plutôt que de toucher à l&apos;UI ou au transport APDU/ECALL (réécrire l&apos;UI en Lean 4
        aurait peu d&apos;intérêt), on a gardé le décodage bas niveau des flux, l&apos;UI et
        l&apos;IO d&apos;origine dans chaque app et concentré l&apos;effort sur des vérifications
        ciblées de la logique partagée. Le résultat,{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <code>Th0rgal/lean-ledger-bitcoin</code>
        </a>
        , combine deux livrables :
      </p>
      <ul>
        <li>
          <strong>Un jumeau formel en Lean 4</strong> des specs{' '}
          <code>BIP-32/67/143/327/341/352/370/379/388</code> et des machines d&apos;état
          BOLOS/Vanadium, avec <code>0 sorryAx</code>, utilisé comme oracle différentiel.{' '}
          {PROOF_SCOPE}
        </li>
        <li>
          <strong>Un sous-ensemble exécutable freestanding sur slices zero-copy</strong> (
          <code>BitcoinLedger/FreestandingKernels.lean</code>), compilé via{' '}
          <a href={TURBO_LEAN_URL} target="_blank" rel="noopener noreferrer">
            <code>turbo-lean</code>
          </a>{' '}
          (<code>emit-freestanding-c-lib</code>, garde <code>codeHasHeapOps=false</code>) en LLVM IR
          32-bit (<code>thumbv6m</code>, <code>thumbv8m.main</code>, <code>riscv32imac</code>) et
          lié en LTO via <code>45</code> exports ABI <code>llb_*</code> (distincts des symboles
          internes et du jumeau formel complet) pour les vérifications ciblées : typechecker
          Miniscript <code>BIP-379/BIP-388</code> en postfixe, machine d&apos;état{' '}
          <code>nLockTime</code> <code>BIP-370</code>, égalité Dual-UTXO et bornes{' '}
          <code>MAX_MONEY</code>, validation de chemins <code>BIP-32</code>,{' '}
          <code>CompactSize</code> canonique, tri lexicographique sans récursion des clés publiques
          MuSig2/<code>sortedmulti</code>, et formatage ASCII des montants sans division.
        </li>
      </ul>
      <p>
        Les intégrations sont des patchs sources épinglés sur <code>96deef7</code> :{' '}
        <a href={BOLOS_PATCH_URL} target="_blank" rel="noopener noreferrer">
          <code>app-bitcoin-lean-opt.patch</code>
        </a>{' '}
        côté BOLOS et{' '}
        <a href={VANADIUM_PATCH_URL} target="_blank" rel="noopener noreferrer">
          <code>vanadium-bitcoin-lean-opt.patch</code>
        </a>{' '}
        côté Vanadium.
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
          <code>riscv32imac</code>) dans notre compilateur{' '}
          <a href={TURBO_LEAN_URL} target="_blank" rel="noopener noreferrer">
            <code>turbo-lean</code>
          </a>
          . Passer par LLVM IR plutôt que d&apos;émettre du bytecode ou de l&apos;assembleur direct
          m&apos;a semblé plus sûr (la sémantique LLVM est déjà largement formalisée) et ne
          demandait qu&apos;un patch ciblé. Notez qu&apos;il reste donc encore de la marge
          d&apos;optimisation avec plus de compute. {TCB_SCOPE}
        </li>
        <li>
          <strong>Intégration dans les deux apps</strong> : shim FFI minimal dans{' '}
          <code>app-bitcoin</code> et <code>vnd-bitcoin</code> conservant l&apos;UI/IO
          d&apos;origine et linkant les kernels Lean en LTO.
        </li>
        <li>
          <strong>Boucle d&apos;optimisation <code>maxwell</code></strong> : itérations avec les
          scripts reproductibles <code>bolos_benchmark.sh</code> et{' '}
          <code>vanadium_benchmark.sh</code>, en contrôlant les invariants formels et les
            régressions. Les JSON publiés pour T6 documentent gains et régressions ; ils ne
            remplacent pas une validation de déploiement sur matériel physique.
        </li>
      </ol>

      <h2 className="section-heading">3. Résultats et limites des mesures</h2>
      <p>{BENCHMARK_STATUS}</p>
      <h3>T7 · delta candidat A contre baseline Lean · VM Boat large</h3>
      <p>{CANDIDATE_A_READING}</p>
      <p><a href={CANDIDATE_A_SOURCE_URL}>Source JSON épinglée · résultats Boat du candidat A</a></p>

      <div className="ldgr-bench-breakout not-prose">
        <div className="ldgr-bench-grid">
          <BenchmarkColumn
            title="Vanadium V-App (Rust → + Lean 4)"
            sub="RV32IMAC · Flex · T6"
            items={RUST_BENCH_BARS}
            variant="rust"
            footer={RUST_TEST_HISTORY}
          />
          <BenchmarkColumn
            title="BOLOS App (C → + Lean 4)"
            sub="ARM Thumb · Nano S+ / X · tailles cycle 1 T7, latences T6"
            items={C_BENCH_BARS}
            variant="c"
            footer={C_TEST_HISTORY}
          />
        </div>
      </div>

      <p>Échelle commune à chaque paire : la plus grande valeur occupe toute la largeur, sans troncature. Un delta positif signifie une augmentation, pas un gain.</p>
      <p>{BENCHMARK_READING}</p>
      <p>{BENCHMARK_CONCLUSIONS}</p>

      <div className="ldgr-measures-breakout not-prose">
        <div className="ldgr-measures-scroll">
          <table className="ldgr-issues-table">
            <caption>Synthèse T6 / cycle 1 T7 · BOLOS Nano S+ mainnet et Vanadium plain, sauf scénario indiqué</caption>
            <thead>
              <tr>
                <th>Métrique</th><th>Référence C</th><th>Lean + C</th><th>Référence Rust</th><th>Lean + Rust</th><th>Contrôle Rust same_profile_lean</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK_ROWS.map((row) => (
                <tr key={row.metric}>
                  {[row.metric, row.origC, row.patchedC, row.origRust, row.patchedRust, row.sameProfileRust ?? 'Voir les contrôles détaillés ci-dessous'].map((cell, index) => <td key={index}>{formatMeasurement(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {MEASUREMENT_TABLES.map((table) => (
          <div className="ldgr-measures-scroll" key={table.title}>
            <table className="ldgr-issues-table">
              <caption>{table.title}</caption>
              <thead><tr>{table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>{row.map((cell, index) => <td key={index}>{formatMeasurement(cell, table.headers[index])}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <p>{RAM_CURVE_NOTICE}</p>

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
        preuves et vérifications Lean 4 (<code>2 585</code> constantes <code>.thmInfo</code> dont{' '}
        <code>879</code> dans <code>Proofs.*</code>, <code>0 sorryAx</code>), intégration C/Rust et boucles{' '}
        <code>maxwell</code>) a tourné en <strong>19,9 h</strong> wall-clock sur la fenêtre capturée
        ci-dessous jusqu&apos;au merge du repo principal (dont 2 heures de pause à cause d&apos;un
        problème d&apos;approvisionnement d&apos;inférence que j&apos;ai réglé à la main) à travers{' '}
        <strong>30 agents actifs</strong> et <strong>25 microVMs</strong> :
      </p>

      <ul>
        <li>
          <strong>379,0 CPU hours</strong> de compute cumulé (<code>327,4 CPU-h</code> sur 25
          microVMs cloud éphémères AMD Zen + <code>51,6 CPU-h</code> sur notre serveur dédié pendant
          les tours actifs).
        </li>
        <li>
          <strong>654,9 GB RAM hours</strong> sur les VMs cloud éphémères (
          <code>1 049,6 GB RAM-h</code> en comptant la RAM réservée sur notre serveur dédié durant
          les tours actifs).
        </li>
        <li>
          <strong>23,2 M tokens / agent</strong> en moyenne (<code>696,6 M</code> tokens cumulés sur{' '}
          <code>30</code> agents actifs : <code>1</code> coordinateur + <code>29</code> subagents).
        </li>
      </ul>

      <p>
        Aux tarifs publics de l&apos;API Google et d&apos;OrcaRouter (pour{' '}
        <code>GLM 5.3 uncensored</code>) côté inférence, et d&apos;AWS EC2 On-Demand côté location
        des VMs, ce run reviendrait à environ <strong>~$520 + ~$17</strong> (soit{' '}
        <strong>~$537</strong> au total), hors infrastructure personnelle (notre serveur dédié et
        nos GPUs d&apos;entraînement amont pour optimiser le compilateur, dont la part amortie sur
        ce run reste relativement négligeable).
      </p>

      <OrbResourcesEmbed />

      <h2 className="section-heading">6. Prochaines étapes</h2>
      <p>
        Dans cette POC, toutes les portes de validation métier, le typechecking BIP-379/388, le tri
        MuSig2 et le formatage des montants sont compilés depuis Lean 4 en zero-alloc, tandis que la
        désérialisation bas niveau des flux (parcours clé-valeur PSBT, lecture des transactions
        brutes et lexing des descripteurs) reste assurée par le code C et Rust existant (
        <code>fastpsbt</code>, <code>bip388</code>) et que l&apos;émission C99/LLVM de{' '}
        <code>turbo-lean</code> fait encore partie de la TCB de compilation.
      </p>
      <p>
        L&apos;étape naturelle suivante consisterait à compiler également l&apos;intégralité des
        parseurs streaming et des machines d&apos;état depuis Lean 4 pour ne laisser en C et en Rust
        qu&apos;une coquille minimale de syscalls matériels (crypto <code>cx_*</code> /{' '}
        <code>ecall_*</code>, transport APDU et écrans NBGL), tout en refermant la TCB du
        compilateur :
      </p>
      <ul>
        <li>
          <strong>Parseurs streaming zero-copy et sighash en Lean 4</strong> : compiler directement
          sur slices plates le lecteur streaming BIP-174/370 (PSBT et transactions sérialisées), le
          générateur streaming des préimages de sighash BIP-143 et BIP-341 (pilotant le SHA-256
          matériel via de simples callbacks C/ECALL), le parseur binaire Script / Tapscript /
          BIP-388 et l&apos;automate de session APDU, avec preuves d&apos;absence totale de lecture
          hors-bornes, de terminaison bornée et de raffinement exact vis-à-vis de <code>Spec/</code>
          .
        </li>
        <li>
          <strong>Fermeture de la TCB freestanding de <code>turbo-lean</code></strong> : étendre les
          théorèmes de préservation sémantique de <code>LeanNative</code> jusqu&apos;aux accès
          mémoire bornés sur slices plates et aux boucles bornées, avec émission directe et
          validation de traduction LLVM IR / LTO sur les trois cibles 32 bits (<code>thumbv6m</code>
          , <code>thumbv8m.main</code>, <code>riscv32imac</code>).
        </li>
      </ul>
      <p>
        En termes d&apos;effort, compter environ <strong>24 à 36 h</strong> de run autonome
        supplémentaire sur le même pipeline (soit du même ordre de grandeur que cette POC) pour la
        compilation et les preuves de bout en bout, couplées à une revue conjointe des hypothèses de
        modélisation et des frontières matérielles avec les équipes Ledger.
      </p>
    </article>
  )
}
