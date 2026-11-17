import type { GlamsterdamRouteMeta, GlamsterdamPageId } from './types'

export const EELS_BLOB =
  'https://github.com/ethereum/execution-specs/blob/16898000911c1e3caa57be08509536c10ae92d3e'
export const GLOAS_BLOB =
  'https://github.com/ethereum/consensus-specs/blob/aa16bb4c156184e9548a997d53efaf2a228a6304'

export const ROUTES: Record<GlamsterdamPageId, GlamsterdamRouteMeta> = {
  overview: {
    id: 'overview',
    tabLabel: 'Overview',
    href: '/glamsterdam',
    rawMdHref: '/glamsterdam.md',
    title: 'Glamsterdam in Lean 4',
    metaTitle: 'Glamsterdam in Lean 4',
    description:
      'Lean 4 formal verification of Ethereum Glamsterdam executable specs (EIP-8037/8038/2780/7778, EIP-8246, and Gloas EIP-7732/8282): methodology, guarantees, findings, and open questions.',
    subtitleSummary: '60 kernel-checked guarantees · 10 edge-case refuters'
  },
  gas: {
    id: 'gas',
    tabLabel: '2D Gas',
    href: '/glamsterdam_gas',
    rawMdHref: '/glamsterdam_gas.md',
    title: '2D State Gas in Lean 4',
    metaTitle: 'Glamsterdam Gas Track · 2D State Gas in Lean 4',
    description:
      'Lean 4 verification of EIP-8037/8038/2780/7778 two-dimensional gas (execution gas + state gas reservoir), the #12581/#12582 refill variants, and the Nethermind #15187 DELEGATECALL divergence.',
    subtitleSummary: '21 ledger + 14 #12582 theorems (+11 shared EL)'
  },
  eip8246: {
    id: 'eip8246',
    tabLabel: 'EIP-8246',
    href: '/glamsterdam_8246',
    rawMdHref: '/glamsterdam_8246.md',
    title: 'EIP-8246 Cleanup & ETH Conservation in Lean 4',
    metaTitle: 'Glamsterdam 8246 Track · EIP-8246 Cleanup & ETH Conservation',
    description:
      'Lean 4 verification of EIP-8246 account cleanup and ETH conservation, the EIP-7928 Block Access List desync, and the two-line patched update_builder_from_tx.',
    subtitleSummary: '11 guarantees (+11 shared EL core)'
  },
  epbs: {
    id: 'epbs',
    tabLabel: 'ePBS',
    href: '/glamsterdam_epbs',
    rawMdHref: '/glamsterdam_epbs.md',
    title: 'ePBS & Builder Queues in Lean 4',
    metaTitle: 'Glamsterdam ePBS Track · EIP-7732 + EIP-8282 in Lean 4',
    description:
      'Lean 4 verification of Gloas EIP-7732 ePBS builder payments and EIP-8282 builder deposits/exits against the five core consensus invariants, plus five pyspec edge cases.',
    subtitleSummary: '17 guarantees · 5 pyspec edge cases'
  }
}

export const TRUST_FACTS = [
  {
    label: '60',
    sub: 'guarantees ledger-checked (51 positive invariants + 9 refuter entries)'
  },
  {
    label: '10',
    sub: 'edge-case refuters: 8 upstream spec findings + 2 mutation kill-tests'
  },
  {
    label: '61',
    sub: 'Lean defs SHA256-mapped to upstream file/line slices (source-map.yaml)'
  },
  {
    label: '21',
    sub: 'exported via C-ABI (@[export]) for differential testing vs Python'
  }
] as const

export const METHODOLOGY_TRUST =
  'Of the 60 ledger entries, 51 are positive invariants (t_* theorems) and 9 are refuter entries whose Lean declaration is itself the counterexample witness. Only 13 entries carry an optional kill-line or witness meta-gate (12 kill_line, 1 meta_gate); the remaining 47 have neither, so the ledger does not yet uniformly enforce non-vacuity. Where a guarantee relies on such a gate, the entry below names it explicitly.'
