/** A faithful mock of Orb's live fleet on 2026-11-02 05:12 UTC, scoped to the
 *  evm.fast campaign (mission 9409f9a9) plus the rest of the fleet. Numbers
 *  come from Core's managed-machine ledger and the mission transcript; quota
 *  percentages are representative of the windows observed that morning. */

export const SNAPSHOT = "2026-11-02 05:12 UTC";

export type Level = "ok" | "warn" | "bad";

export interface Reservoir {
  id: string;
  name: string;
  kind: "subscription" | "credit" | "compute" | "local";
  /** Percent of the window still available. */
  stock: number;
  /** Net change of the stock per hour: regeneration minus nothing. */
  regenPerHour: number;
  /** Share of the window currently being consumed per hour. */
  burnPerHourPct: number;
  reset: string;
  cashPerHour: number;
  shadowPerHour: number;
  workers: number;
  note: string;
  level: Level;
  /** Served-model breakdown, as a share of this reservoir's flow. */
  models: { name: string; share: number; perHour: number }[];
}

export const RESERVOIRS: Reservoir[] = [
  {
    id: "agy-claude", name: "Antigravity · Claude", kind: "subscription",
    stock: 74, regenPerHour: 20, burnPerHourPct: 9, reset: "5h · 3h 40m",
    cashPerHour: 0, shadowPerHour: 3.1, workers: 14,
    note: "builtin/google-sonnet & google-opus. Separate pool from direct Anthropic — this is the one still open.",
    level: "ok",
    models: [
      { name: "google-sonnet", share: 0.62, perHour: 1.92 },
      { name: "google-opus", share: 0.38, perHour: 1.18 },
    ],
  },
  {
    id: "agy-gemini", name: "Antigravity · Gemini", kind: "subscription",
    stock: 61, regenPerHour: 20, burnPerHourPct: 14, reset: "5h · 3h 40m",
    cashPerHour: 0, shadowPerHour: 2.4, workers: 19,
    note: "gemini-4-argon & gemini-4-carbon. 13 silent safety-filter blocks overnight, no 429 raised.",
    level: "warn",
    models: [
      { name: "gemini-4-argon", share: 0.55, perHour: 1.32 },
      { name: "gemini-4-carbon", share: 0.45, perHour: 1.08 },
    ],
  },
  {
    id: "openai", name: "OpenAI · Codex", kind: "subscription",
    stock: 0, regenPerHour: 0, burnPerHourPct: 0, reset: "hard cap · Nov 4",
    cashPerHour: 0, shadowPerHour: 0, workers: 0,
    note: "gpt-6-astra and gpt-6.1-sol exhausted. 47 Boat forks were taken to rescue their unpushed proofs.",
    level: "bad",
    models: [],
  },
  {
    id: "anthropic", name: "Anthropic · direct", kind: "subscription",
    stock: 0, regenPerHour: 0, burnPerHourPct: 0, reset: "hard cap · Nov 4",
    cashPerHour: 0, shadowPerHour: 0, workers: 0,
    note: "opus-5.5, fable-5.1, sonnet via claudecode. Frozen since Oct 31 15:28Z — Antigravity Claude is unaffected.",
    level: "bad",
    models: [],
  },
  {
    id: "xai", name: "xAI · SuperGrok", kind: "credit",
    stock: 81, regenPerHour: 0, burnPerHourPct: 2, reset: "credits · 12d",
    cashPerHour: 0.3, shadowPerHour: 0, workers: 0,
    note: "Tried as a prover for four minutes, then dropped: too weak on Lean specs and tactics.",
    level: "ok",
    models: [{ name: "grok-4.7", share: 1, perHour: 0.3 }],
  },
  {
    id: "surplus", name: "Kimi · Z.AI · MiniMax", kind: "subscription",
    stock: 96, regenPerHour: 14, burnPerHourPct: 1, reset: "weekly · 4d",
    cashPerHour: 0, shadowPerHour: 0.15, workers: 1,
    note: "builtin/smart spillover. 96% full with days left — window is burning unused.",
    level: "warn",
    models: [{ name: "k3 / glm-5.3 / m3", share: 1, perHour: 0.15 }],
  },
  {
    id: "spark", name: "dgx-spark · local", kind: "local",
    stock: 100, regenPerHour: 0, burnPerHourPct: 0, reset: "always on",
    cashPerHour: 0, shadowPerHour: 0, workers: 2,
    note: "Zero marginal cost. Memory, leanstral and the micro-model lane.",
    level: "ok",
    models: [{ name: "qwen3.8 / leanstral", share: 1, perHour: 0 }],
  },
  {
    id: "boat", name: "Boat.dev · daily pool", kind: "compute",
    stock: 29, regenPerHour: 0, burnPerHourPct: 7.1, reset: "resets 00:00 UTC",
    cashPerHour: 3.55, shadowPerHour: 0, workers: 46,
    note: "$35.66 of a $50 cap spent yesterday. 58% of it went to idle drift and the 12h cap, not to proofs.",
    level: "warn",
    models: [
      { name: "large · 8 vCPU", share: 0.69, perHour: 2.45 },
      { name: "xlarge · 16 vCPU", share: 0.31, perHour: 1.1 },
    ],
  },
];

export interface MissionFlow {
  id: string;
  name: string;
  perHour: number;
  cash: number;
  shadow: number;
  share: number;
  warn?: boolean;
}

export const MISSIONS: MissionFlow[] = [
  { id: "workers", name: "evm.fast · 46 provers", perHour: 4.55, cash: 2.9, shadow: 1.65, share: 0.5 },
  { id: "coordinator", name: "evm.fast · coordinator", perHour: 3.1, cash: 0, shadow: 3.1, share: 0.34, warn: true },
  { id: "quorum", name: "evm.fast · quorums", perHour: 0.85, cash: 0, shadow: 0.85, share: 0.09 },
  { id: "other", name: "everything else", perHour: 0.6, cash: 0.45, shadow: 0.15, share: 0.07 },
];

export const BURN = {
  total: 9.1,
  cash: 3.85,
  shadow: 5.25,
  tokensPerMin: 14200,
  vcpu: 392,
  vms: 51,
  idlePct: 22,
};

/** Hourly stock of the two pools that actually moved, last 12 hours. */
export const STOCK_HISTORY = [
  { t: "18:00", claude: 96, gemini: 94, boat: 71 },
  { t: "19:00", claude: 91, gemini: 88, boat: 66 },
  { t: "20:00", claude: 86, gemini: 80, boat: 60 },
  { t: "21:00", claude: 84, gemini: 71, boat: 55 },
  { t: "22:00", claude: 83, gemini: 63, boat: 49 },
  { t: "23:00", claude: 86, gemini: 54, boat: 44 },
  { t: "00:00", claude: 90, gemini: 47, boat: 100 },
  { t: "01:00", claude: 88, gemini: 39, boat: 93 },
  { t: "02:00", claude: 84, gemini: 33, boat: 84 },
  { t: "03:00", claude: 80, gemini: 41, boat: 71 },
  { t: "04:00", claude: 77, gemini: 52, boat: 52 },
  { t: "05:00", claude: 74, gemini: 61, boat: 29 },
];

/** Where yesterday's $43.05 of Boat spend on 9409f9a9 actually went. */
export const WASTE = [
  { key: "active", label: "Proving & building", usd: 17.86, hours: 214 },
  { key: "ttl", label: "Hit the 12h cap", usd: 16.04, hours: 180 },
  { key: "idle", label: "Idle, then reaped", usd: 9.15, hours: 108 },
];

export const CLIFFS = [
  { name: "xlarge-a", detail: "warm snapshot builder", left: "3m", why: "no job attached · reap at 05:26" },
  { name: "large-14", detail: "C08 shard", left: "41m", why: "12h hard cap · proofs not pushed" },
  { name: "large-19", detail: "GuardedBody racer", left: "1h 12m", why: "12h hard cap · proofs not pushed" },
  { name: "wave8-r10-warm", detail: "snapshot", left: "36 MB", why: "source only · every boot rebuilds .olean" },
];

export interface TreeNode {
  name: string;
  usd: number;
  kind: "coordinator" | "active" | "quorum" | "idle" | "ttl";
  children?: TreeNode[];
}

export const TREE: TreeNode = {
  name: "evm.fast",
  usd: 168.3,
  kind: "active",
  children: [
    { name: "Coordinator", usd: 125.3, kind: "coordinator", children: [
      { name: "3 polling turns", usd: 99.3, kind: "coordinator" },
      { name: "the other 23", usd: 26.0, kind: "coordinator" },
    ] },
    { name: "Provers", usd: 31.4, kind: "active", children: [
      { name: "google-sonnet", usd: 14.2, kind: "active" },
      { name: "gemini-4-argon", usd: 9.6, kind: "active" },
      { name: "gemini-4-carbon", usd: 7.6, kind: "active" },
    ] },
    { name: "Quorums", usd: 11.6, kind: "quorum" },
    { name: "Boat · 172 VMs", usd: 43.1, kind: "active", children: [
      { name: "Proving & building", usd: 17.9, kind: "active" },
      { name: "12h cap, 15 VMs", usd: 16.0, kind: "ttl" },
      { name: "Idle reap, 38 VMs", usd: 9.2, kind: "idle" },
    ] },
  ],
};

export const OUTCOME_COLOR: Record<TreeNode["kind"], string> = {
  active: "var(--ok)",
  quorum: "var(--info)",
  coordinator: "var(--fg-4)",
  idle: "var(--warning)",
  ttl: "var(--danger)",
};

export const PALETTE = ["#3987e5", "#199e70", "#d95926", "#c98500", "#d55181", "#9085e9"];
