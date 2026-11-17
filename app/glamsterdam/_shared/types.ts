export type GlamsterdamPageId = 'overview' | 'gas' | 'eip8246' | 'epbs'

export type Severity = 'High' | 'Medium' | 'Low'

export interface GlamsterdamRouteMeta {
  id: GlamsterdamPageId
  tabLabel: string
  href: string
  rawMdHref: string
  title: string
  metaTitle: string
  description: string
  subtitleSummary: string
}

export interface UpstreamLocation {
  label: string
  url: string
}

export interface AuditFinding {
  id: string
  track: 'gas' | 'eip8246' | 'epbs'
  trackLabel: 'Gas' | '8246' | 'ePBS'
  severity: Severity
  severityLabel: string
  title: string
  locations: UpstreamLocation[]
  leanSymbols: string[]
  summary: string
  impact: string
  fixNote?: string
}

export interface DecisionQuestion {
  prompt: string
  detail: string
}

export interface TrackDecisionBox {
  eyebrow: string
  contacts: string
  bottomLine: string
  questions: DecisionQuestion[]
}

export interface GuaranteeCluster {
  id: string
  title: string
  badge: string
  summary: string
  scopeNote: string
  theorems: {
    name: string
    file: string
    statement: string
  }[]
  assumptions?: string[]
  upstreamRefs?: UpstreamLocation[]
}

export interface VariantComparisonRow {
  variant: string
  source: string
  setCallClear: string
  preCallClearOrCreate: string
  siblingGasLeft: string
  calleeReservoir: string
  verdict: string
}

export interface EfInvariantRow {
  id: string
  property: string
  status: 'Proved' | 'Partial'
  theorems: string[]
  boundaryNote: string
}

export interface TrackCardSummary {
  id: Exclude<GlamsterdamPageId, 'overview'>
  href: string
  title: string
  sub: string
  contacts: string
  sourceTarget: string
  coverageBadge: string
  bottomLine: string
  highlights: string[]
  edgeCasesLine: string
}

export interface ScopeBoundaryItem {
  label: string
  detail: string
}
