import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import OrbResourcesEmbed from './OrbResourcesEmbed'
import {
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
    'POC Lean 4 sur les apps Bitcoin C (BOLOS) et Rust (Vanadium) de Ledger : noyau prouvé lié dans les deux binaires, mesures de taille et de latence.',
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
                <div className="ldgr-bar-fill is-orig" style={{ width: `${(100 / Math.max(100, item.optPct)) * 100}%` }} />
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
                  style={{ width: `${(item.optPct / Math.max(100, item.optPct)) * 100}%` }}
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
        en Lean4 pour obtenir un binaire prouvé formellement, plus compact et plus rapide. Hier,
        Vincent et Guillaume m&apos;ont proposé de commencer avec l&apos;application Bitcoin de
        Ledger, voici le résultat.
      </p>

      <p>
        <strong>Important :</strong> il s&apos;agit d&apos;une POC d&apos;une journée, les
        specs ne sont pas complètes, il y a d&apos;autres points importants qu&apos;il serait
        intéressant de vérifier formellement et cela demanderait davantage de review de notre côté
        en plus de la validation de nos choix de modélisation du vôtre.
      </p>

      <h2 className="section-heading">1. Méthodologie et architecture</h2>
      <p>
        Côté temps humain, j&apos;avais déjà regardé un peu quand Charles m&apos;en avait parlé et
        j&apos;avais une idée de la stack Ledger : il m&apos;a donc fallu environ{' '}
        <strong>1 h</strong> au départ pour cadrer le problème, poser les specs haut niveau et
        designer le pipeline, <strong>15 min</strong> ce matin pour
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
          <code>app-bitcoin</code>
        </a>
        ), compilée nativement vers le jeu d&apos;instructions du microcontrôleur, au-dessus de BOLOS, et la nouvelle V-App en
        Rust (
        <a
          href="https://github.com/LedgerHQ/vanadium/tree/ace8e96982408959dea9e7fbc59ee36e8c54e645"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>vanadium</code>
        </a>
        ), compilée en RISC-V 32-bit (<code>RV32IMAC</code>) et exécutée dans une VM
        tournant sur BOLOS (pour streamer le code et les données de
        l&apos;app depuis le host, si j&apos;ai bien compris).
      </p>
      <p>
        Plutôt que de toucher à l&apos;UI ou au transport APDU/ECALL (réécrire l&apos;UI en Lean 4
        aurait peu d&apos;intérêt), on a gardé l&apos;UI et l&apos;IO d&apos;origine dans chaque app
        et concentré l&apos;effort sur la logique partagée qui concentre l&apos;essentiel de la
        surface d&apos;attaque. Le résultat,{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <code>Th0rgal/lean-ledger-bitcoin</code>
        </a>
        , contient deux choses intéressantes pour vous :
      </p>
      <ul>
        <li>
          <strong>Un noyau Lean compilé dans les deux apps</strong> (
          <a href={`${REPO_URL}/blob/main/BitcoinLedger/FreestandingKernels.lean`} target="_blank" rel="noopener noreferrer">
            <code>FreestandingKernels.lean</code>
          </a>
          ) : c&apos;est le code Lean réellement exécuté sur l&apos;appareil.{' '}
          <a href={TURBO_LEAN_URL} target="_blank" rel="noopener noreferrer">
            <code>turbo-lean</code>
          </a>{' '}
          le compile en LLVM IR 32-bit et il remplace dans chaque app les chemins sensibles
          qu&apos;on a réécrits.
        </li>
        <li>
          <strong>Une spec courte sur ce noyau</strong> (
          <a href={`${REPO_URL}/blob/main/Spec.lean`} target="_blank" rel="noopener noreferrer">
            <code>Spec.lean</code>
          </a>
          , 12 énoncés) : chaque énoncé porte sur une fonction compilée, et sa preuve est vérifiée
          par Lean (<code>0 sorryAx</code>). Elle couvre pour l&apos;instant <code>17</code> des{' '}
          <code>45</code> fonctions du noyau.
        </li>
      </ul>
      <p>
        Les intégrations tiennent en deux patchs :{' '}
        <a href={BOLOS_PATCH_URL} target="_blank" rel="noopener noreferrer">
          <code>app-bitcoin-lean-opt.patch</code>
        </a>{' '}
        côté BOLOS et{' '}
        <a href={VANADIUM_PATCH_URL} target="_blank" rel="noopener noreferrer">
          <code>vanadium-bitcoin-lean-opt.patch</code>
        </a>{' '}
        côté Vanadium. Le C/Rust qui reste est le code d&apos;origine, légèrement patché (environ 200 lignes
        modifiées côté C et 700 côté Rust, hors tests). Il fait trois choses : appeler le noyau Lean à la place des
        vérifications d&apos;origine, parser les PSBT et les scripts, et parler au matériel (clés,
        crypto, écran et transport passent par les appels système de BOLOS). Pour cette partie, qui
        vient de l&apos;OS, ça n&apos;aurait pas de sens de faire du Lean ; par contre, pour les
        parseurs, je pense que ce serait une bonne idée. C&apos;est plus de travail, mais cela
        vaudrait le coût car ils se prêtent bien à la vérification formelle.
      </p>

      <Mermaid chart={MERMAID_ARCHITECTURE} />

      <h2 className="section-heading">2. Plan d&apos;exécution</h2>
      <ol>
        <li>
          <strong>Specs et tests croisés</strong> : formalisation en Lean 4, puis noyau exécutable
          affiné en bouclant sur les suites de tests des deux repos.
        </li>
        <li>
          <strong>Backend LLVM 32-bit dans{' '}
          <a href={TURBO_LEAN_URL} target="_blank" rel="noopener noreferrer">
            <code>turbo-lean</code>
          </a></strong>{' '}
          : support sans allocation pour <code>thumbv6m</code>, <code>thumbv8m.main</code> et{' '}
          <code>riscv32imac</code>. Passer par LLVM IR m&apos;a semblé plus sûr que d&apos;émettre
          de l&apos;assembleur. Cette chaîne de compilation n&apos;est pas encore prouvée de bout
          en bout (elle est contrôlée par tests différentiels). Ça coûterait relativement cher en
          inférence, mais ce serait un bon investissement car on n&apos;aurait à le faire
          qu&apos;une fois.
        </li>
        <li>
          <strong>Intégration</strong> : shim FFI minimal dans chaque app, UI et IO d&apos;origine
          conservées, noyau lié en LTO.
        </li>
        <li>
          <strong>Boucle d&apos;optimisation <code>maxwell</code></strong> : itérations sur des
          benchmarks reproductibles, preuves et tests au vert, pour passer sous les baselines.
        </li>
      </ol>

      <h2 className="section-heading">3. Résultats</h2>
      <p>
        Voici la spec. Elle ne correspond qu&apos;au code effectivement compilé dans les apps et
        n&apos;est pas complète, mais elle montre ce qu&apos;il est possible de faire (chaque point
        ouvre les lignes correspondantes) :
      </p>
      <ul>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L32-L51" target="_blank" rel="noopener noreferrer">
            Montants de la transaction : le noyau répond « valide » exactement quand le montant vaut au plus 21 millions de BTC. Pour une somme ou une différence, il répond « valide » exactement quand le vrai résultat reste entre 0 et ce plafond, et renvoie alors ce vrai résultat.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L53-L57" target="_blank" rel="noopener noreferrer">
            Affichage : le découpage d&apos;un montant en BTC et satoshis, fait sans division, est exact pour tout montant 64 bits.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L61-L72" target="_blank" rel="noopener noreferrer">
            Chemins de dérivation : le noyau classe un élément comme « hardened » exactement quand il vaut au moins 2<sup>31</sup>, et refuse les chemins de plus de 10 éléments sur BOLOS, 16 sur Vanadium.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L76-L82" target="_blank" rel="noopener noreferrer">
            Adresses : le noyau répond « valide » pour un programme SegWit exactement dans les cas prévus, soit 20 ou 32 octets en version 0 et 2 à 40 octets en versions 1 à 16.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L93-L104" target="_blank" rel="noopener noreferrer">
            Types de signature demandés : le noyau répond « valide » exactement pour ALL, NONE et SINGLE, avec ou sans ANYONECANPAY, plus DEFAULT pour Taproot.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L108-L116" target="_blank" rel="noopener noreferrer">
            Lecture de la transaction : le noyau répond « valide » pour un préfixe de longueur (CompactSize) exactement quand c&apos;est celui de l&apos;encodage le plus court.
          </a>
        </li>
      </ul>
      <p>
        Chaque énoncé est un « si et seulement si » ou une égalité, avec un exemple accepté et un
        exemple refusé.
      </p>

      <p>
        Côté performances, on n&apos;a pas spécialement cherché à optimiser, d&apos;autant qu&apos;on
        passe par LLVM sans cibler directement le matériel final, mais on obtient quand même des
        résultats intéressants grâce à quelques itérations de mesure et de réglage. Le binaire patché avec Lean 4 est plus léger sur les deux targets
        et plus rapide sur Vanadium ; sur BOLOS la latence est inchangée sur Nano S+ et en hausse
        sur Nano X :
      </p>

      <div className="ldgr-bench-breakout not-prose">
        <div className="ldgr-bench-grid">
          <BenchmarkColumn
            title="Vanadium V-App (Rust → + Lean 4)"
            sub="RV32IMAC · Ledger Flex"
            items={RUST_BENCH_BARS}
            variant="rust"
            footer="Tests app 90/90 · common 85/85 · 11 bugs corrigés"
          />
          <BenchmarkColumn
            title="BOLOS App (C → + Lean 4)"
            sub="ARM Thumb · Nano S+ / X"
            items={C_BENCH_BARS}
            variant="c"
            footer="31/31 ctest · mainnet 2/2 · suite testnet (282 tests) en cours · 0 sorryAx"
          />
        </div>
      </div>

      <figure className="not-prose" style={{ margin: '1.75rem 0 2.2rem 0' }}>
        <video
          src="/leanldgr/vanadium-trace.mp4"
          poster="/leanldgr/vanadium-trace-poster.png"
          controls
          loop
          muted
          playsInline
          style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 6 }}
        />
        <figcaption style={{ padding: '0.7rem 0', fontSize: '0.8rem', lineHeight: 1.45, opacity: 0.75 }}>
          Une signature Taproot sur Vanadium (Speculos Flex), référence à gauche, variante Lean à
          droite. En bas, les instructions RV32 exécutées, cumulées, un point par échange APDU :
          234 214 contre 200 692 (−14,3 %), et 1 307 chargements de page contre 1 240. Tout est
          mesuré ; les runs sont instrumentés et en auto-approbation, donc la durée affichée
          n&apos;est pas une latence.
        </figcaption>
      </figure>

      <p>Ce qui nous semble le plus intéressant :</p>
      <ul>
        <li>
          Le calcul du <code>nLockTime</code> selon <code>BIP-370</code>, là où Vanadium semble
          avoir un bug (à confirmer avec vous), a été prouvé conforme à la règle pour n&apos;importe
          quelle liste d&apos;inputs sans intervention de notre côté.
        </li>
        <li>
          Un seul noyau Lean sert trois ISA et deux apps : il est émis en LLVM IR puis compilé avec
          les flags de chaque app, avec une frame de pile maximale de <code>96 B</code>.
        </li>
        <li>
          Sur Vanadium, une signature exécute <code>14,6 %</code> d&apos;instructions RV32 en moins
          et charge <code>5 %</code> de pages en moins, à profil de compilation identique.
        </li>
        <li>
          La formalisation croisée des deux apps a suffi à faire ressortir les 11 bugs de la section
          4.
        </li>
      </ul>

      <p>
        Précisions de lecture. Mesures sous émulateur (Speculos), pas sur matériel. Sur Vanadium,
        la baisse de RAM et de taille de fichier vient surtout des réglages de build ; le gain
        propre au code est de <code>14,6 %</code> sur les instructions exécutées. Sur BOLOS,
        tailles et latences ont été mesurées sur deux builds différents : on relance un benchmark
        complet pour lever l&apos;ambiguïté.
      </p>

      <h2 className="section-heading">4. Bugs et anomalies trouvés dans Vanadium</h2>
      <p>
        En essayant de formaliser les implémentations C et Vanadium, on a repéré{' '}
        <strong>11 bugs ou écarts de spec</strong>. On ne les a pas vérifiés manuellement, mais ils
        semblent corrects, le bug étant du côté Vanadium à chaque fois.
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

      <h2 className="section-heading">5. Résumé des ressources investies (run initial)</h2>
      <p>
        L&apos;ensemble du run autonome (formalisation, patch compilateur <code>turbo-lean</code>,
        preuves des <code>2 494</code> théorèmes, intégration C/Rust et boucles{' '}
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
    </article>
  )
}
