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
        specs ne sont pas complètes et cela demanderait davantage de review de notre côté en plus de
        la validation de nos choix de modélisation du vôtre.
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
          <code>app-bitcoin@f010982d</code>
        </a>
        ), compilée nativement en ARM Thumb (le jeu d&apos;instructions compact des microcontrôleurs
        ARM) directement au-dessus de BOLOS, l&apos;OS du Secure Element, et la nouvelle V-App en
        Rust (
        <a
          href="https://github.com/LedgerHQ/vanadium/tree/ace8e96982408959dea9e7fbc59ee36e8c54e645"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>vanadium@ace8e969</code>
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
        , combine deux livrables :
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
          le compile en LLVM IR 32-bit et il remplace dans chaque app les vérifications sensibles :
          policies Miniscript, <code>nLockTime</code>, montants, chemins <code>BIP-32</code>, tri
          des clés et formatage des montants.
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
        crypto, écran et transport passent par les appels système de BOLOS). Cette dernière partie
        ne peut pas être du Lean : elle est fournie par l&apos;OS du Secure Element. Les parseurs,
        eux, pourraient l&apos;être ; c&apos;est la suite logique, ils manipulent des buffers que
        notre backend ne sait pas encore couvrir par des preuves.
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
          d&apos;optimisation avec plus de compute. Transparence sur la TCB : les théorèmes de
          préservation sémantique couvrent les passes IR de <code>turbo-lean</code>, tandis que le
          front-end d&apos;extraction LCNF et <code>clang</code>/<code>lld</code> restent dans la
          TCB de compilation, auditée par tests différentiels C-ABI, contrôle d&apos;absence de
          symboles indéfinis (<code>llvm-nm</code>) et bornage statique des frames de pile (
          <code>.su</code>).
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
          contrainte stricte du noyau Lean (<code>0 sorryAx</code>) et des tests au vert, pour
          passer sous les baselines Flash, RAM et latence : c&apos;est acquis sur Vanadium, et sur
          BOLOS pour la taille seulement.
        </li>
      </ol>

      <h2 className="section-heading">3. Résultats</h2>
      <p>
        D&apos;abord la spec. Elle ne parle que du code compilé dans les apps, et dit en clair :
      </p>
      <ul>
        <li>
          Un montant est accepté exactement quand il vaut au plus 21 millions de BTC. Une somme ou
          une différence est acceptée exactement quand le vrai résultat reste entre 0 et ce
          plafond, et la valeur renvoyée est alors le vrai résultat.
        </li>
        <li>
          Le découpage BTC / satoshis, fait sans division, est exact pour tout montant 64 bits.
        </li>
        <li>
          Un élément de chemin <code>BIP-32</code> est « hardened » exactement quand il vaut au
          moins 2<sup>31</sup> ; la profondeur est limitée à 10 sur BOLOS et 16 sur Vanadium.
        </li>
        <li>
          Un programme SegWit est accepté exactement dans les cas prévus : 20 ou 32 octets en
          version 0, 2 à 40 octets en versions 1 à 16.
        </li>
        <li>
          Les types de sighash acceptés sont exactement ALL, NONE et SINGLE, avec ou sans
          ANYONECANPAY, plus DEFAULT pour Taproot.
        </li>
        <li>
          Un préfixe CompactSize est accepté exactement quand c&apos;est celui de
          l&apos;encodage le plus court.
        </li>
      </ul>
      <p>
        Chaque énoncé est un « si et seulement si » ou une égalité, donc un code qui refuserait
        tout ne le satisfait pas, et il vient avec un exemple accepté et un exemple refusé. Ce
        qui n&apos;est pas encore couvert : les fonctions qui lisent ou écrivent un buffer
        (contrôle Miniscript, tris, formatage), faute de modèle mémoire, et la machine{' '}
        <code>nLockTime</code>, prouvée seulement contre un modèle Lean des apps. La compilation
        par <code>turbo-lean</code> et clang reste de confiance. Ce modèle Lean des deux apps
        sert par ailleurs d&apos;oracle de test ; il ne tourne pas sur l&apos;appareil.
      </p>

      <p>
        Ensuite l&apos;optimisation. Le binaire patché avec Lean 4 est plus léger sur les deux targets. Il est plus rapide sur
        Vanadium ; sur BOLOS la latence est inchangée sur Nano S+ et en hausse sur Nano X :
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

      <p>Ce qui nous semble le plus intéressant :</p>
      <ul>
        <li>
          La machine d&apos;état <code>nLockTime</code> <code>BIP-370</code> tient dans un seul{' '}
          <code>u64</code> et est prouvée égale à la règle du modèle, pour toute liste
          d&apos;inputs.
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
        Précisions de lecture. Mesures sous Speculos, référence et variante sur le même hôte ; pas
        de mesure sur matériel. <strong>Vanadium</strong> : la « RAM réservée » est un budget
        statique, réduit de <code>64+64 KiB</code> à <code>32+32 KiB</code>, pas un pic mesuré
        (pic heap mesuré côté Lean : <code>5 318 B</code> sur une signature). À profil Cargo
        identique, le segment de code baisse de <code>4,55 %</code> (moins de chaînes de panic et de tables
        d&apos;unwind ; le <code>.text</code> lui-même grossit de <code>6 KiB</code>) et les
        instructions exécutées de <code>14,6 %</code>, gain partagé entre le code Lean et des
        réécritures Rust faites en même temps ; le reste du gain de taille vient du profil de link
        (LTO, <code>panic = &quot;abort&quot;</code>, strip). <strong>BOLOS</strong> : tailles mesurées
        sur le dernier build (cycle 1 T7, encore expérimental), latences sur le build précédent
        (T6).
      </p>

      <h2 className="section-heading">4. Bugs et anomalies trouvés dans Vanadium</h2>
      <p>
        La formalisation croisée entre <code>app-bitcoin</code> et <code>vanadium</code> a fait
        ressortir <strong>11 bugs et écarts de spec</strong> dans <code>LedgerHQ/vanadium</code> (
        <code>ace8e969</code>). Chacun a été revérifié dans le code upstream. Aucune issue
        publique n&apos;existait ; deux étaient signalés par un <code>TODO</code> ou un{' '}
        <code>todo!()</code> dans le code. Depuis, la{' '}
        <a href="https://github.com/LedgerHQ/vanadium/pull/301" target="_blank" rel="noopener noreferrer">
          PR upstream #301
        </a>{' '}
        du 13 novembre en corrige cinq (montants, profondeur xpub, pubnonce MuSig2, GetVersion,
        CompactSize) ; <code>andor</code>, double UTXO, <code>nLockTime</code>,{' '}
        <code>sh(wsh)</code>, les contrôles Miniscript et <code>OP_RETURN</code> restent ouverts. Notre patch les corrige
        tous.
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
