/** Deterministic series + subagent Gantt schedules for the two Resources views. */

export type Range = "30m" | "1h" | "6h" | "24h" | "7d";
export const RANGES: { id: Range; label: string; minutes: number; ticks: string[] }[] = [
  { id: "30m", label: "30m", minutes: 30, ticks: ["−30m", "−20m", "−10m", "now"] },
  { id: "1h", label: "1h", minutes: 60, ticks: ["−60m", "−40m", "−20m", "now"] },
  { id: "6h", label: "6h", minutes: 360, ticks: ["23:00", "01:00", "03:00", "05:00"] },
  { id: "24h", label: "24h", minutes: 1440, ticks: ["06:00", "12:00", "18:00", "00:00", "05:00"] },
  { id: "7d", label: "7d", minutes: 10080, ticks: ["Oct 27", "Oct 29", "Oct 31", "Nov 02"] },
];

/** 48 points over the requested window, shaped per node so every selection tells
 *  its own story (the overnight Gemini stall, the 22:29 coordinator spike, the
 *  08:24 53-VM burst, etc.) while ending near `now`. */
export function seriesFor(id: string, now: number, range: Range): number[] {
  const n = 48;
  const seed = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1); // 0 → 1 (now)
    let f = 0.72 + 0.22 * Math.sin(u * 6.2 + seed) + 0.1 * Math.cos(u * 13 + seed * 0.3);
    if (id.includes("gemini") && (range === "6h" || range === "24h")) {
      const dip = range === "6h" ? 0.25 : 0.75;
      f *= 1 - 0.82 * Math.exp(-Math.pow((u - dip) / 0.12, 2));
    }
    if (id.includes("coord") && (range === "24h" || range === "7d")) {
      const spike = range === "24h" ? 0.68 : 0.82;
      f += 2.6 * Math.exp(-Math.pow((u - spike) / 0.045, 2));
    }
    if (id.includes("boat") && range === "24h") {
      f += 0.55 * Math.exp(-Math.pow((u - 0.12) / 0.08, 2));
    }
    if (range === "7d" && u < 0.45) f *= 0.25 + u;
    out.push(Math.max(0, now * f));
  }
  out[n - 1] = now;
  return out;
}

export interface GanttBar {
  id: string;
  section: string;
  label: string;
  model: string;
  /** Offset and duration in minutes from the start of the wave. */
  start: number;
  dur: number;
  state: "done" | "active" | "pending" | "capped";
  after?: string[];
}

export interface MissionSchedule {
  id: string;
  title: string;
  subtitle: string;
  spanMinutes: number;
  nowMinute: number;
  bars: GanttBar[];
}

export const SCHEDULES: MissionSchedule[] = [
  {
    id: "9409f9a9-fast-dag",
    title: "evm.fast · Fast-DAG Finite-K v1",
    subtitle: "relative hours · 51 subagents across 6 tracks",
    spanMinutes: 360,
    nowMinute: 125,
    bars: [
      { id: "b1", section: "Bootstrap", label: "Verify r11_full & spawn VM1", model: "agy-model-low · xlarge-a", start: 0, dur: 20, state: "done" },
      { id: "b2", section: "Bootstrap", label: "Overlay repo, warm cache & snapshot", model: "xlarge-a · wave8-fast-dag-warm", start: 20, dur: 25, state: "done", after: ["b1"] },

      { id: "s1", section: "StageTransfer", label: "Compiler eqs, FullMakeInit, FrontendRel", model: "google-sonnet · xlarge-c", start: 45, dur: 120, state: "active", after: ["b2"] },
      { id: "s2", section: "StageTransfer", label: "Affine clock ≤ K_target (k ≤ K_pan)", model: "google-opus", start: 165, dur: 60, state: "pending", after: ["s1"] },

      { id: "m1", section: "MemoryViews & Specs", label: "MemoryViews 3-pt R11 surgery + build", model: "google-opus + argon quorum", start: 45, dur: 50, state: "done", after: ["b2"] },
      { id: "m2", section: "MemoryViews & Specs", label: "Close C00 frame/mpt specs on new views", model: "google-sonnet · xlarge-b", start: 95, dur: 120, state: "active", after: ["m1"] },

      { id: "g1", section: "GBody & Routers", label: "Cycle-safe router wiring (4 routers)", model: "gemini-4-argon", start: 95, dur: 60, state: "done", after: ["m1"] },
      { id: "g2", section: "GBody & Routers", label: "Prove 16 missing gbody theorems", model: "16 × large Boat VMs", start: 155, dur: 140, state: "pending", after: ["g1"] },

      { id: "p1", section: "PrimitivesProved", label: "Wire 308 existing 0-sorry theorems", model: "gemini-4-argon-low", start: 45, dur: 60, state: "done", after: ["b2"] },
      { id: "p2", section: "PrimitivesProved", label: "Prove remaining wk (64) + fb (30) + misc", model: "30 × large Boat VMs", start: 95, dur: 185, state: "active", after: ["m1"] },
      { id: "p3", section: "PrimitivesProved", label: "Assemble 0-sorry PrimitivesProved.lean", model: "google-sonnet", start: 295, dur: 40, state: "pending", after: ["g2", "p2"] },

      { id: "v1", section: "Gate & Submit", label: "Worker INIT_E_VERIFICATION=build", model: "turbo-lean pr-verify", start: 335, dur: 18, state: "pending", after: ["s2", "p3"] },
      { id: "v2", section: "Gate & Submit", label: "Ashur Yukon v1 submit", model: "coordinator", start: 353, dur: 7, state: "pending", after: ["v1"] },
    ],
  },
  {
    id: "9409f9a9-history",
    title: "evm.fast · Full 3.5-day subagent history",
    subtitle: "224 subagents · where the 429 cliff & 47 VM forks happened",
    spanMinutes: 4800,
    nowMinute: 4800,
    bars: [
      { id: "h1", section: "Phase 1 · Oct 30", label: "turbo-lean PR #289 · 11 × 3-model quorums", model: "astra + fable + carbon (33 runs)", start: 0, dur: 980, state: "done" },
      { id: "h2", section: "Phase 1 · Oct 30", label: "GuestInv Rev 2 → Rev 7 + arith/rlp/htab leaves", model: "claudecode", start: 240, dur: 1020, state: "done" },
      { id: "h3", section: "Phase 2 · Oct 31", label: "15 fb_* shards + 30 C00..C08 micro-shards", model: "static fleet · 45 subagents", start: 1260, dur: 480, state: "done", after: ["h2"] },
      { id: "h4", section: "Phase 3 · Nov 01", label: "agy-model-low 13 safety-filter blocks", model: "6h overnight stall", start: 1920, dur: 360, state: "capped", after: ["h3"] },
      { id: "h5", section: "Phase 3 · Nov 01", label: "5 xlarge surgeons + 49-VM wave8-r10-warm blitz", model: "peak 53 Boat VMs ($4.33/h)", start: 2280, dur: 320, state: "done", after: ["h4"] },
      { id: "h6", section: "Phase 4 · Nov 01", label: "Codex + Anthropic 429 cliff → 47 rescue forks", model: "fork_managed_machine × 47", start: 2600, dur: 1380, state: "capped", after: ["h5"] },
      { id: "h7", section: "Phase 5 · Nov 02", label: "Fast-DAG decoupling + Antigravity Sonnet/Argon pivot", model: "google-sonnet + argon", start: 3980, dur: 820, state: "active", after: ["h6"] },
    ],
  },
];
