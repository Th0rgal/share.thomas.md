import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import {
  BENCHMARK_ROWS,
  MERMAID_ARCHITECTURE,
  PAGE_TITLE,
  VANADIUM_ISSUES
} from './data'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    'POC Lean 4 sur les applications Bitcoin C (BOLOS) et Rust (Vanadium) de Ledger : preuves formelles, empreinte memoire reduite et execution plus rapide.',
  alternates: {
    canonical: 'https://share.thomas.md/leanldgr'
  },
  robots: { index: false },
  openGraph: {
    title: PAGE_TITLE,
    description:
      'Verification formelle Lean 4 et optimisation binaire sur Ledger app-bitcoin (C) et Vanadium (Rust).',
    url: 'https://share.thomas.md/leanldgr',
    type: 'article'
  }
}

function sevClass(sev: 'High' | 'Medium' | 'Low'): string {
  if (sev === 'High') return 'sev-badge sev-high'
  if (sev === 'Medium') return 'sev-badge sev-medium'
  return 'sev-badge sev-low'
}

export default function LeanLedgerReportPage() {
  return (
    <article className="is-posts">
      <h1 className="title-display">Lean 4 pour Ledger Bitcoin</h1>

      <div className="report-subtitle not-prose">
        <span>
          Cibles :{' '}
          <a
            href="https://github.com/LedgerHQ/app-bitcoin/tree/f010982d3050e02813cd7129bebd68cf2d1f2099"
            target="_blank"
            rel="noopener noreferrer"
          >
            LedgerHQ/app-bitcoin@f010982d
          </a>
          {' · '}
          <a
            href="https://github.com/LedgerHQ/vanadium/tree/ace8e96982408959dea9e7fbc59ee36e8c54e645"
            target="_blank"
            rel="noopener noreferrer"
          >
            LedgerHQ/vanadium@ace8e969
          </a>
        </span>
        {' · '}
        <span>
          Preuves : <code>0 sorryAx</code> (<code>2 405</code> théorèmes)
        </span>
        {' · '}
        <a href="/leanldgr.md">Raw .md</a>
      </div>

      <div className="stats-grid not-prose">
        <div className="stat-card">
          <div className="stat-value">-49,9 %</div>
          <div className="stat-label">RAM V-App (Rust)</div>
          <div className="stat-sub">128,3 KiB → 64,3 KiB sur Flex</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">-20,2 %</div>
          <div className="stat-label">Code V-App (Rust)</div>
          <div className="stat-sub">306,0 KiB → 244,4 KiB (-241 pages)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">-22,5 %</div>
          <div className="stat-label">Signature PSBT (Flex)</div>
          <div className="stat-sub">2,61 s → 2,02 s sur Speculos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">9</div>
          <div className="stat-label">Anomalies Vanadium</div>
          <div className="stat-sub">7/9 non signalées (0 issue ouverte)</div>
        </div>
      </div>

      <h2 className="section-heading">1. Résumé du Challenge de Charles</h2>
      <p>
        Montrer qu&apos;il est viable de réécrire un logiciel existant en Lean4 pour obtenir un
        binaire prouvé formellement, plus compact et plus rapide.
      </p>

      <h2 className="section-heading">2. Méthodologie et architecture</h2>
      <p>
        Côté temps humain, il m&apos;a fallu environ <strong>1 h</strong> au départ pour cadrer le
        problème, poser les spécifications haut niveau et concevoir le pipeline (aidé par une
        connaissance de base du fonctionnement de Ledger), environ <strong>10 min</strong>{' '}
        d&apos;intervention manuelle hier soir pour régler un souci d&apos;inférence, et{' '}
        <strong>1 h</strong> à la fin pour relire et polir l&apos;ensemble. Tout le reste a tourné
        en autonomie.
      </p>
      <p>
        Ledger maintient deux applications Bitcoin dont la chaîne de compilation diffère :
        l&apos;application historique en C (<code>app-bitcoin</code>), compilée nativement en ARM
        Thumb directement au-dessus de BOLOS, et la nouvelle V-App en Rust (<code>vanadium</code>),
        compilée en RISC-V 32 bits (<code>RV32IMAC</code>) puis exécutée par pages de 256 octets
        authentifiées par arbre de Merkle dans une VM tournant sur BOLOS.
      </p>
      <p>
        Plutôt que de toucher à l&apos;interface graphique ou au transport APDU/ECALL (réécrire
        l&apos;UI en Lean 4 serait pénible et peu utile), nous avons isolé un noyau commun pour la
        logique partagée (validation PSBT, montants, BIP-32, SegWit/Taproot, politiques
        BIP-388/Miniscript, formatage sans division), qui concentre l&apos;essentiel de la surface
        d&apos;attaque, en gardant l&apos;UI et l&apos;IO existantes dans chaque application :
      </p>

      <Mermaid chart={MERMAID_ARCHITECTURE} />

      <h2 className="section-heading">3. Plan d&apos;exécution</h2>
      <ol>
        <li>
          <strong>Spécifications formelles et backtesting croisé</strong> : formalisation des BIPs
          en Lean 4 à partir du cadrage haut niveau, puis implémentation du noyau exécutable en
          bouclant sur les suites de tests des deux dépôts (<code>ctest</code>/Ragger côté C,{' '}
          <code>cargo test</code>/Speculos côté Rust) pour affiner la spec jusqu&apos;à convergence.
        </li>
        <li>
          <strong>Backend LLVM 32 bits dans <code>turbo-lean</code></strong> : ajout du support
          32 bits sans runtime ni allocation (<code>thumbv6m</code>, <code>thumbv8m.main</code>,{' '}
          <code>riscv32imac</code>) dans notre compilateur <code>turbo-lean</code>. Passer par LLVM
          IR plutôt que d&apos;émettre du bytecode ou de l&apos;assembleur direct m&apos;a semblé
          plus sûr (la sémantique LLVM est déjà largement formalisée) et demandait une modification
          mineure ; il reste de la marge d&apos;optimisation avec davantage de ressources.
        </li>
        <li>
          <strong>Intégration dans les deux apps</strong> : patch minimal de{' '}
          <code>app-bitcoin</code> et de <code>vnd-bitcoin</code> conservant l&apos;UI/IO d&apos;origine
          et liant les noyaux Lean en LTO.
        </li>
        <li>
          <strong>Boucle d&apos;optimisation <code>maxwell</code></strong> : exécution de benchmarks
          reproductibles dans notre boucle propriétaire <code>maxwell</code> sous contrainte de
          preuve (<code>0 sorryAx</code>) et de passage intégral des tests, jusqu&apos;à réduire la
          Flash, la RAM et le temps d&apos;exécution sous les deux références.
        </li>
      </ol>

      <h2 className="section-heading">4. Résultats et simulation</h2>
      <p>
        Sur les deux cibles, la version patchée avec Lean 4 est simultanément plus légère et plus
        rapide que l&apos;original non modifié, tout en passant 100 % des suites de tests :
      </p>

      <div className="coverage-table-wrap not-prose">
        <table className="coverage-table">
          <thead>
            <tr>
              <th>Métrique</th>
              <th>Original C</th>
              <th>Patched C (Lean 4)</th>
              <th>Original Rust</th>
              <th>Patched Rust (Lean 4)</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARK_ROWS.map((row) => (
              <tr key={row.metric}>
                <td>
                  <strong>{row.metric}</strong>
                </td>
                <td>{row.origC}</td>
                <td>
                  <strong>{row.patchedC}</strong>
                </td>
                <td>{row.origRust}</td>
                <td>
                  <strong>{row.patchedRust}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        La simulation ci-dessous compare côte à côte notre V-App Rust patchée avec Lean 4 (à
        gauche) et la V-App Rust de référence (à droite) sur Speculos Ledger Flex lors d&apos;un
        enregistrement de compte Taproot suivi d&apos;une signature PSBT, avec l&apos;empreinte RAM
        en bas :
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
          Speculos Ledger Flex (<code>480×600</code>, ralenti <code>0,3×</code>) :{' '}
          <code>vnd-bitcoin</code> patché Lean 4 termine en <strong>2,02 s</strong> sous un budget
          RAM divisé par deux (<strong>64,3 KiB</strong> contre <strong>128,3 KiB</strong> et{' '}
          <strong>2,61 s</strong> pour la référence).
        </figcaption>
      </figure>

      <h2 className="section-heading">5. Anomalies trouvées dans Vanadium</h2>
      <p>
        La formalisation croisée entre <code>app-bitcoin</code> et <code>vanadium</code> a fait
        ressortir <strong>9 anomalies</strong> dans <code>LedgerHQ/vanadium</code> (commit{' '}
        <code>ace8e969</code>). <strong>7 sur 9 n&apos;étaient signalées nulle part</strong> (les 2
        autres n&apos;avaient qu&apos;un commentaire <code>TODO</code> ou <code>todo!()</code>{' '}
        partiel dans le code, et <code>0</code> issue GitHub ouverte). Nous n&apos;avons ouvert
        aucune issue publique sur GitHub ; toutes sont corrigées dans le patch.
      </p>

      <div className="coverage-table-wrap not-prose">
        <table className="coverage-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Niveau</th>
              <th>Emplacement</th>
              <th>Statut amont</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {VANADIUM_ISSUES.map((issue) => (
              <tr key={issue.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <code>{issue.id}</code>
                </td>
                <td>
                  <span className={sevClass(issue.severity)}>{issue.severityLabel}</span>
                </td>
                <td>
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
    </article>
  )
}
