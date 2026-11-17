import type {
  AuditFinding,
  GlamsterdamPageId,
  GuaranteeCluster,
  ScopeBoundaryItem,
  TrackDecisionBox
} from './types'
import { ROUTES, METHODOLOGY_TRUST } from './routes'
import { AUDIT_FINDINGS, findingsForTrack } from './findingsData'
import {
  MERMAID_PIPELINE,
  OVERVIEW_SCOPE_GAPS,
  TRACK_CARDS
} from './overviewData'
import {
  GAS_DECISIONS,
  GAS_EF_INVARIANTS,
  GAS_GUARANTEE_CLUSTERS,
  GAS_SCOPE_BOUNDARIES,
  GAS_VARIANT_ROWS
} from './gasData'
import {
  EIP8246_DECISIONS,
  EIP8246_GUARANTEE_CLUSTERS,
  EIP8246_SCOPE_BOUNDARIES
} from './eip8246Data'
import {
  EPBS_DECISIONS,
  EPBS_GUARANTEE_CLUSTERS,
  EPBS_SCOPE_BOUNDARIES
} from './epbsData'

function formatDecisionBoxMd(box: TrackDecisionBox): string[] {
  return [
    `## ${box.eyebrow}`,
    '',
    `**Contacts:** ${box.contacts}`,
    '',
    box.bottomLine,
    '',
    ...box.questions.map((q, i) => `${i + 1}. **${q.prompt}** ${q.detail}`),
    ''
  ]
}

function formatFindingsMd(findings: AuditFinding[]): string[] {
  return findings.flatMap((f) => {
    const locs = f.locations.map((l) => `[\`${l.label}\`](${l.url})`).join(' · ')
    const lines = [
      `### \`${f.id}\` (${f.severityLabel}) — ${f.title}`,
      `- **Upstream:** ${locs}`,
      `- **Lean declarations:** \`${f.leanSymbols.join('`, `')}\``,
      `- **Summary:** ${f.summary}`,
      `- **Impact:** ${f.impact}`
    ]
    if (f.fixNote) {
      lines.push(`- **Candidate fix / status:** ${f.fixNote}`)
    }
    lines.push('')
    return lines
  })
}

function formatClustersMd(clusters: GuaranteeCluster[]): string[] {
  return clusters.flatMap((c) => {
    const lines = [
      `### ${c.title} (${c.badge})`,
      '',
      c.summary,
      '',
      ...c.theorems.map(
        (t) => `- \`${t.name}\` (\`${t.file}\`): ${t.statement}`
      ),
      '',
      `> **Model boundary:** ${c.scopeNote}${
        c.assumptions && c.assumptions.length > 0
          ? ` ${c.assumptions.join(' ')}`
          : ''
      }`,
      ''
    ]
    return lines
  })
}

function formatBoundariesMd(items: ScopeBoundaryItem[]): string[] {
  return items.map((item) => `- **${item.label}:** ${item.detail}`)
}

function formatSuiteLinksMd(currentId: GlamsterdamPageId): string[] {
  const ordered: GlamsterdamPageId[] = ['overview', 'gas', 'eip8246', 'epbs']
  return [
    '---',
    '',
    '**Glamsterdam Lean 4 notes:** ' +
      ordered
        .map((id) => {
          const r = ROUTES[id]
          return id === currentId
            ? `**${r.tabLabel}** (\`${r.href}\`)`
            : `[${r.tabLabel}](https://share.thomas.md${r.href})`
        })
        .join(' · ')
  ]
}

export function renderGlamsterdamMarkdown(pageId: GlamsterdamPageId): string {
  const route = ROUTES[pageId]

  if (pageId === 'overview') {
    return [
      `# ${route.title}`,
      '',
      `_${route.subtitleSummary} · Lean 4.31_`,
      '',
      'Across our three Glamsterdam formal verification tracks with Ethereum Foundation leads—**2D state gas** ([`/glamsterdam_gas`](https://share.thomas.md/glamsterdam_gas)), **EIP-8246 cleanup & ETH conservation** ([`/glamsterdam_8246`](https://share.thomas.md/glamsterdam_8246)), and **Gloas ePBS + builder queues** ([`/glamsterdam_epbs`](https://share.thomas.md/glamsterdam_epbs))—we translated the pinned Python executable specifications into Lean 4.31 to verify core invariants, compare competing 2D gas PRs, and catch boundary bugs early.',
      '',
      '**Scope & role:** our job here is Lean 4 proof engineering and AI-assisted formalization, not protocol design. Every theorem holds relative to pinned upstream commits and explicit model boundaries; human review by EF spec leads is what confirms those statements match Ethereum’s intended design.',
      '',
      '## 1. Tracks at a glance',
      '',
      ...TRACK_CARDS.flatMap((t) => [
        `### [${t.title}](https://share.thomas.md${t.href}) (${t.sub})`,
        `- **Contacts:** ${t.contacts}`,
        `- **Pinned target:** \`${t.sourceTarget}\``,
        `- **Coverage:** ${t.coverageBadge}`,
        `- **Bottom line:** ${t.bottomLine}`,
        ...t.highlights.map((h) => `  - ${h}`),
        ''
      ]),
      '## 2. How the Lean 4 model connects to upstream specs',
      '',
      '- **Execution Layer (`ethereum/execution-specs@16898000`):** `amsterdam/vm/{gas,interpreter,eoa_delegation}.py`, `instructions/{storage,system}.py`, `state_tracker.py`, `block_access_lists.py`, and `fork.py`, plus `ethereum/EIPs#12581` (`D1..D13R`), `ethereum/EIPs#12582` (`D13S / D13A`), and Nethermind `#15187`.',
      '- **Consensus Layer (`ethereum/consensus-specs@aa16bb4c`, `v1.7.0-beta.4`):** executable `pyspec` functions in `specs/gloas/beacon-chain.md` and `specs/gloas/fork.md` (`fork-choice.md` and P2P gossip excluded).',
      `- **Audit ledger & gates:** ${METHODOLOGY_TRUST} In \`source-map.yaml\`, \`61\` Lean definitions are mapped to \`23\` SHA256-locked upstream files, and \`21\` core transition gates carry \`@[export]\` C-ABI bindings differentially tested against Python.`,
      '',
      '```mermaid',
      MERMAID_PIPELINE,
      '```',
      '',
      '## 3. Summary of all 10 spec & prototype edge cases (unshipped Glamsterdam targets)',
      '',
      '| ID | Track | Severity | Upstream Location | Summary |',
      '|---|---|---|---|---|',
      ...AUDIT_FINDINGS.map((f) => {
        const locs = f.locations.map((l) => `[\`${l.label}\`](${l.url})`).join(' · ')
        return `| \`${f.id}\` | ${f.trackLabel} | ${f.severityLabel} | ${locs} | ${f.summary} ${f.impact} |`
      }),
      '',
      '## 4. Known unmodeled boundaries',
      '',
      ...formatBoundariesMd(OVERVIEW_SCOPE_GAPS),
      '',
      ...formatSuiteLinksMd('overview')
    ].join('\n')
  }

  if (pageId === 'gas') {
    const gasFindings = findingsForTrack('gas')
    return [
      `# ${route.title}`,
      '',
      `_${route.subtitleSummary} · Lean 4.31_`,
      '',
      ...formatDecisionBoxMd(GAS_DECISIONS),
      '## 1. Comparing EIP-8037 / 8038 refill & ceiling variants in Lean',
      '',
      '| Variant | Source | Set-Call-Clear | Pre-Call Clear / CREATE | Sibling `gasleft()` | Callee / DELEGATECALL Reservoir | Takeaway |',
      '|---|---|---|---|---|---|---|',
      ...GAS_VARIANT_ROWS.map(
        (r) =>
          `| **${r.variant}** | \`${r.source}\` | ${r.setCallClear} | ${r.preCallClearOrCreate} | ${r.siblingGasLeft} | ${r.calleeReservoir} | ${r.verdict} |`
      ),
      '',
      '## 2. Spec & prototype edge cases in the Gas track',
      '',
      ...formatFindingsMd(gasFindings),
      '## 3. Coverage against EF’s 8 Glamsterdam gas invariants',
      '',
      '| Invariant | Status | Property | Lean Coverage & Boundary |',
      '|---|---|---|---|',
      ...GAS_EF_INVARIANTS.map(
        (row) =>
          `| \`${row.id}\` | ${row.status} | ${row.property} | ${row.boundaryNote} (\`${row.theorems.join('`, `')}\`) |`
      ),
      '',
      '## 4. Kernel-checked guarantee clusters',
      '',
      ...formatClustersMd(GAS_GUARANTEE_CLUSTERS),
      '## 5. Explicit scope boundaries & remaining gaps',
      '',
      ...formatBoundariesMd(GAS_SCOPE_BOUNDARIES),
      '',
      ...formatSuiteLinksMd('gas')
    ].join('\n')
  }

  if (pageId === 'eip8246') {
    const f8246 = findingsForTrack('eip8246')
    return [
      `# ${route.title}`,
      '',
      `_${route.subtitleSummary} · Lean 4.31_`,
      '',
      ...formatDecisionBoxMd(EIP8246_DECISIONS),
      '## 1. Spec edge cases in EIP-8246 × EIP-7928',
      '',
      ...formatFindingsMd(f8246),
      '## 2. Kernel-checked guarantee clusters',
      '',
      ...formatClustersMd(EIP8246_GUARANTEE_CLUSTERS),
      '## 3. Explicit scope boundaries',
      '',
      ...formatBoundariesMd(EIP8246_SCOPE_BOUNDARIES),
      '',
      ...formatSuiteLinksMd('eip8246')
    ].join('\n')
  }

  const epbsFindings = findingsForTrack('epbs')
  return [
    `# ${route.title}`,
    '',
    `_${route.subtitleSummary} · Lean 4.31_`,
    '',
    ...formatDecisionBoxMd(EPBS_DECISIONS),
    '## 1. Kernel-checked consensus invariant clusters (EIP-7732 + EIP-8282)',
    '',
    ...formatClustersMd(EPBS_GUARANTEE_CLUSTERS),
    '## 2. Gloas v1.7.0-beta.4 pyspec edge cases surfaced along the way',
    '',
    ...formatFindingsMd(epbsFindings),
    '## 3. Explicit scope boundaries',
    '',
    ...formatBoundariesMd(EPBS_SCOPE_BOUNDARIES),
    '',
    ...formatSuiteLinksMd('epbs')
  ].join('\n')
}

export function createMarkdownRoute(pageId: GlamsterdamPageId) {
  return async function GET() {
    return new Response(renderGlamsterdamMarkdown(pageId), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    })
  }
}
