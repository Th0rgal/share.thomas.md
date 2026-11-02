"use client";

import { useState } from "react";
import "./flow.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { sankeyRibbon, feedbackRibbon } from "../orb_resources/svgPaths";

type Scope = "fleet" | "mission";
type Unit = "usd" | "cash" | "physical";

interface NodeSpec {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stockPct?: number;
  regen?: string;
  blocked?: boolean;
  note: string;
}

interface LinkSpec {
  id: string;
  from: string;
  to: string;
  x0: number;
  y0a: number;
  y0b: number;
  x1: number;
  y1a: number;
  y1b: number;
  grad: string;
  label: string;
  rateUsd: number;
  rateCash: number;
  ratePhys: string;
  detail: string;
  callX?: number;
  callY?: number;
}

const NODES: NodeSpec[] = [
  // Stage 1: Raw Stock & Regenerating Pools (x = 42, w = 24)
  {
    id: "agy-claude", label: "AGY · CLAUDE", sub: "74% · +20%/h",
    x: 42, y: 84, w: 24, h: 124, fill: "url(#barBlue)", stockPct: 74, regen: "+20%/h",
    note: "Antigravity Claude 5h pool (google-sonnet & google-opus). Healthy & regenerating; unaffected by direct Anthropic cap.",
  },
  {
    id: "agy-gemini", label: "AGY · GEMINI", sub: "61% · +20%/h",
    x: 42, y: 222, w: 24, h: 96, fill: "url(#barTeal)", stockPct: 61, regen: "+20%/h",
    note: "Antigravity Gemini 5h pool (argon & carbon). 13 silent safety-filter blocks overnight without raising HTTP 429.",
  },
  {
    id: "surplus", label: "SURPLUS", sub: "96%",
    x: 42, y: 332, w: 24, h: 36, fill: "url(#barCyan)", stockPct: 96, regen: "+14%/h",
    note: "Kimi · Z.AI · MiniMax weekly windows sitting at 96% — unspent tokens evaporate at reset.",
  },
  {
    id: "capped", label: "OPENAI + ANTHROPIC", sub: "0% · 429 → Nov 4",
    x: 42, y: 382, w: 24, h: 64, fill: "url(#barDead)", stockPct: 0, blocked: true,
    note: "Direct gpt-6-astra, gpt-6.1-sol, opus-5.5 & fable-5.1 hard-capped until Nov 4 UTC.",
  },
  {
    id: "boat", label: "BOAT.DEV POOL", sub: "$14.3 left / $50",
    x: 42, y: 462, w: 24, h: 142, fill: "url(#barSteel)", stockPct: 29, regen: "00:00Z",
    note: "$35.66 spent yesterday across 172 VMs (peaking at 53 online = $4.33/h). Resets at midnight UTC.",
  },
  {
    id: "local", label: "FLEET + SPARK", sub: "$0/h",
    x: 42, y: 616, w: 24, h: 46, fill: "url(#barSlate)", stockPct: 100,
    note: "ashur, babylon, nippur, uruk + dgx-spark NVFP4 local inference ($0 marginal cash).",
  },

  // Stage 2: Router & Compute Provisioner (x = 292, w = 24)
  {
    id: "router", label: "MODEL ROUTER", sub: "smart · chains",
    x: 292, y: 102, w: 24, h: 228, fill: "url(#barBlue)",
    note: "CLIProxyAPI + fallback chains spilling away from capped OpenAI/Anthropic into Antigravity & Kimi.",
  },
  {
    id: "prov", label: "VM PROVISIONER", sub: "46 large · 3 xlarge",
    x: 292, y: 446, w: 24, h: 196, fill: "url(#barSteel)",
    note: "51 active machines (392 vCPU): 49 Boat VMs + static Lean hosts + dgx-spark.",
  },

  // Stage 3: Refining Chambers (x = 568, w = 26)
  {
    id: "quorum", label: "QUORUM", sub: "3-model",
    x: 568, y: 74, w: 26, h: 68, fill: "url(#barBlue)",
    note: "Read-only spec & counterexample quorums (google-opus + gemini-4-argon-high).",
  },
  {
    id: "refinery", label: "MAXWELL REFINERY · PROVERS", sub: "turbo-lean · 46 shards",
    x: 568, y: 164, w: 26, h: 256, fill: "url(#barTeal)",
    note: "Couples raw token streams with warm Boat VMs + turbo-lean Zygote (<2 ms check) to close 144 Fast-DAG sorries.",
  },
  {
    id: "coord", label: "COORDINATOR", sub: "$3.10/h ctx",
    x: 568, y: 454, w: 26, h: 122, fill: "url(#barAmber)",
    note: "Mission 9409f9a9 root agent: $125.29 across 26 turns (3× the entire 172-VM Boat compute bill).",
  },

  // Stage 4: Campaign & Fleet Allocation (x = 842, w = 24)
  {
    id: "evmfast", label: "EVM.FAST · 9409F9A9", sub: "$8.50/h · 224 children",
    x: 842, y: 88, w: 24, h: 318, fill: "url(#barBlue)",
    note: "verity-core Flagship Yukon campaign: R11 Fast-DAG closure toward InitE.Certificate (.finite K).",
  },
  {
    id: "other-m", label: "OTHER MISSIONS", sub: "$0.60/h",
    x: 842, y: 422, w: 24, h: 42, fill: "url(#barSlate)",
    note: "All other concurrent Orb missions across boost.ci, EthLib, and assistant.",
  },

  // Stage 5: Thermodynamic Output — Work vs Entropy (x = 1126, w = 26)
  {
    id: "verified", label: "VERIFIED PROOF WORK", sub: "$4.95/h · 262 lemmas",
    x: 1126, y: 76, w: 26, h: 288, fill: "url(#barBlueDark)",
    note: "0-sorryAx .olean theorems, tightened 374-bit K_target, and certified cut-lemma splits.",
  },
  {
    id: "entropy", label: "ENTROPY · DRIFT · POLLING", sub: "$4.15/h lost",
    x: 1126, y: 438, w: 26, h: 204, fill: "url(#barAmberDark)",
    note: "Coordinator context polling ($3.10/h) + 15 VMs hitting 720m cap + 38 VMs idle-reaped + 13 safety blocks.",
  },
];

const LINKS: LinkSpec[] = [
  // Stage 1 -> 2
  {
    id: "l-claude-rt", from: "agy-claude", to: "router",
    x0: 66, y0a: 84, y0b: 208, x1: 292, y1a: 102, y1b: 226,
    grad: "url(#ribBlue)", label: "google-sonnet + opus", rateUsd: 3.10, rateCash: 0, ratePhys: "8.1k tok/m",
    detail: "$3.10/h shadow · 14 active workers on Antigravity Claude",
  },
  {
    id: "l-gemini-rt", from: "agy-gemini", to: "router",
    x0: 66, y0a: 222, y0b: 304, x1: 292, y1a: 226, y1b: 308,
    grad: "url(#ribTeal)", label: "argon + carbon", rateUsd: 2.15, rateCash: 0, ratePhys: "5.4k tok/m",
    detail: "$2.15/h shadow · 19 workers on Gemini 4 Argon/Carbon",
  },
  {
    id: "l-gemini-blk", from: "agy-gemini", to: "entropy",
    x0: 66, y0a: 304, y0b: 318, x1: 1126, y1a: 438, y1b: 454,
    grad: "url(#ribAmber)", label: "13 safety-filter stalls", rateUsd: 0.25, rateCash: 0, ratePhys: "6h stall",
    detail: "Silent overnight Gemini filter blocks on agy-model-low (00:00–05:51 UTC)",
    callX: 430, callY: 386,
  },
  {
    id: "l-surplus-rt", from: "surplus", to: "router",
    x0: 66, y0a: 332, y0b: 354, x1: 292, y1a: 308, y1b: 330,
    grad: "url(#ribCyan)", label: "smart spillover", rateUsd: 0.45, rateCash: 0.30, ratePhys: "0.7k tok/m",
    detail: "Kimi / Z.AI / Grok fallback traffic ($0.30/h cash + $0.15/h shadow)",
  },
  {
    id: "l-boat-prov", from: "boat", to: "prov",
    x0: 66, y0a: 462, y0b: 604, x1: 292, y1a: 446, y1b: 588,
    grad: "url(#ribSteel)", label: "49 Boat VMs", rateUsd: 3.55, rateCash: 3.55, ratePhys: "368 vCPU",
    detail: "$3.55/h metered cash · 46 large ($0.072/h) + 3 xlarge ($0.20/h)",
  },
  {
    id: "l-local-prov", from: "local", to: "prov",
    x0: 66, y0a: 616, y0b: 662, x1: 292, y1a: 596, y1b: 642,
    grad: "url(#ribSlate)", label: "static + spark", rateUsd: 0, rateCash: 0, ratePhys: "24 vCPU + GB10",
    detail: "ashur, babylon, nippur, uruk + dgx-spark ($0/h marginal)",
  },

  // Stage 2 -> 3
  {
    id: "l-rt-quorum", from: "router", to: "quorum",
    x0: 316, y0a: 102, y0b: 146, x1: 568, y1a: 74, y1b: 142,
    grad: "url(#ribBlue)", label: "spec quorums", rateUsd: 0.85, rateCash: 0, ratePhys: "3 models",
    detail: "$0.85/h · R11 MemoryViews + pendingStageTransfer 3-model consults",
  },
  {
    id: "l-rt-refinery", from: "router", to: "refinery",
    x0: 316, y0a: 146, y0b: 256, x1: 568, y1a: 164, y1b: 294,
    grad: "url(#ribTeal)", label: "prover tokens", rateUsd: 1.75, rateCash: 0.30, ratePhys: "9.8k tok/m",
    detail: "$1.75/h · parallel leaf & cut-lemma provers",
  },
  {
    id: "l-rt-coord", from: "router", to: "coord",
    x0: 316, y0a: 256, y0b: 330, x1: 568, y1a: 454, y1b: 576,
    grad: "url(#ribAmber)", label: "coordinator context ($125 total!)", rateUsd: 3.10, rateCash: 0, ratePhys: "159M cache",
    detail: "$3.10/h · bloated trace-reading & polling turns (3 turns alone = $99.28)",
    callX: 438, callY: 422,
  },
  {
    id: "l-prov-refinery", from: "prov", to: "refinery",
    x0: 316, y0a: 446, y0b: 564, x1: 568, y1a: 294, y1b: 420,
    grad: "url(#ribSteel)", label: "active Lean checks", rateUsd: 2.50, rateCash: 2.50, ratePhys: "304 vCPU",
    detail: "$2.50/h cash · warm turbo-lean & cone builds on Boat + static fleet",
  },
  {
    id: "l-prov-waste", from: "prov", to: "entropy",
    x0: 316, y0a: 564, y0b: 642, x1: 1126, y1a: 560, y1b: 642,
    grad: "url(#ribAmber)", label: "idle reap + 720m TTL drift (58% of Boat $)", rateUsd: 1.05, rateCash: 1.05, ratePhys: "88 vCPU idle",
    detail: "$25.19 yesterday: 15 VMs stalled to 12h cap ($16.04) + 38 coordinator VMs reaped idle ($9.15)",
    callX: 720, callY: 616,
  },

  // Stage 3 -> 4
  {
    id: "l-quorum-evm", from: "quorum", to: "evmfast",
    x0: 594, y0a: 74, y0b: 142, x1: 842, y1a: 88, y1b: 154,
    grad: "url(#ribBlue)", label: "quorum gates", rateUsd: 0.85, rateCash: 0, ratePhys: "10 rounds",
    detail: "Converged spec & bridge reviews feeding evm.fast",
  },
  {
    id: "l-ref-evm", from: "refinery", to: "evmfast",
    x0: 594, y0a: 164, y0b: 392, x1: 842, y1a: 154, y1b: 382,
    grad: "url(#ribTeal)", label: "46 shard workers", rateUsd: 3.95, rateCash: 2.50, ratePhys: "262 proved",
    detail: "Proved GuardedBody routers, MPT cuts, and harvested R10/R11 shards",
  },
  {
    id: "l-ref-other", from: "refinery", to: "other-m",
    x0: 594, y0a: 392, y0b: 420, x1: 842, y1a: 422, y1b: 464,
    grad: "url(#ribSlate)", label: "other", rateUsd: 0.60, rateCash: 0.45, ratePhys: "4 missions",
    detail: "Other active fleet missions ($0.60/h)",
  },
  {
    id: "l-coord-evm", from: "coord", to: "evmfast",
    x0: 594, y0a: 454, y0b: 478, x1: 842, y1a: 382, y1b: 406,
    grad: "url(#ribBlue)", label: "useful steering", rateUsd: 0.30, rateCash: 0, ratePhys: "DAG dispatch",
    detail: "Wave orchestration, git bundle staging & durable wakeups",
  },
  {
    id: "l-coord-waste", from: "coord", to: "entropy",
    x0: 594, y0a: 478, y0b: 576, x1: 1126, y1a: 454, y1b: 560,
    grad: "url(#ribAmber)", label: "context re-ingestion ($3.10/h)", rateUsd: 2.80, rateCash: 0, ratePhys: "60M cache/turn",
    detail: "Reading 300-event raw traces & base64 chunks into LLM context",
    callX: 860, callY: 525,
  },

  // Stage 4 -> 5
  {
    id: "l-evm-ver", from: "evmfast", to: "verified",
    x0: 866, y0a: 88, y0b: 376, x1: 1126, y1a: 76, y1b: 334,
    grad: "url(#ribBlue)", label: "certified .olean + finite K", rateUsd: 4.50, rateCash: 2.50, ratePhys: "0 sorryAx",
    detail: "Verified Lean 4 proofs & wave8/e2e-fast-dag commits",
  },
  {
    id: "l-evm-race", from: "evmfast", to: "entropy",
    x0: 866, y0a: 376, y0b: 406, x1: 1126, y1a: 454, y1b: 480,
    grad: "url(#ribAmber)", label: "R10→R11 split-brain & 47 forks", rateUsd: 0.60, rateCash: 0.40, ratePhys: "47 rescues",
    detail: "Unpushed worker disks rescued via fork_managed_machine when R10 spec changed",
  },
  {
    id: "l-other-ver", from: "other-m", to: "verified",
    x0: 866, y0a: 422, y0b: 464, x1: 1126, y1a: 334, y1b: 364,
    grad: "url(#ribSlate)", label: "fleet output", rateUsd: 0.45, rateCash: 0.35, ratePhys: "PRs",
    detail: "Verified deliverables on sibling projects",
  },
];

export function FlowView() {
  const [scope, setScope] = useState<Scope>("fleet");
  const [unit, setUnit] = useState<Unit>("usd");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);

  const fmtRate = (l: LinkSpec) => {
    if (unit === "physical") return l.ratePhys;
    const v = unit === "cash" ? l.rateCash : l.rateUsd;
    return `$${v.toFixed(2)}/h`;
  };

  const isRelated = (l: LinkSpec) => {
    if (!activeId) return true;
    if (activeId === l.id || activeId === l.from || activeId === l.to) return true;
    if (scope === "mission" && (l.from === "other-m" || l.to === "other-m")) return false;
    return false;
  };

  return (
    <OrbShell active="flow" title="Refinery Flow">
      <div className="orb-bar">
        <div className="orb-seg">
          <button className={scope === "fleet" ? "on" : ""} onClick={() => { setScope("fleet"); setActiveId(null); }}>All Fleet · $9.10/h</button>
          <button className={scope === "mission" ? "on" : ""} onClick={() => { setScope("mission"); setActiveId("evmfast"); }}>Mission · evm.fast (9409f9a9)</button>
        </div>
        <div className="orb-seg">
          <button className={unit === "usd" ? "on" : ""} onClick={() => setUnit("usd")}>Blended $/h</button>
          <button className={unit === "cash" ? "on" : ""} onClick={() => setUnit("cash")}>Cash $/h</button>
          <button className={unit === "physical" ? "on" : ""} onClick={() => setUnit("physical")}>Tokens &amp; vCPU</button>
        </div>
        {activeId && (
          <button
            className="orb-seg"
            style={{ padding: "3px 9px", cursor: "pointer", color: "var(--fg-2)" }}
            onClick={() => setActiveId(null)}
          >
            Reset focus
          </button>
        )}
        <span className="orb-spacer" />
        <span className="orb-stamp">hover or click any stream or pillar</span>
      </div>

      <div className="ref-wrap flow-stage" onMouseLeave={() => setTip(null)}>
        <svg className="flow-canvas" viewBox="0 0 1200 690" role="img" aria-label="Intelligence and Compute Refinery Flow">
          <defs>
            <linearGradient id="ribBlue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2f83bf" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#469ad4" stopOpacity="0.68" />
            </linearGradient>
            <linearGradient id="ribTeal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1d9a78" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#3586b8" stopOpacity="0.72" />
            </linearGradient>
            <linearGradient id="ribCyan" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4da8c7" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#3882b4" stopOpacity="0.64" />
            </linearGradient>
            <linearGradient id="ribSteel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3d7399" stopOpacity="0.80" />
              <stop offset="100%" stopColor="#28897b" stopOpacity="0.72" />
            </linearGradient>
            <linearGradient id="ribSlate" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#586978" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#497794" stopOpacity="0.58" />
            </linearGradient>
            <linearGradient id="ribAmber" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#eb9b46" stopOpacity="0.86" />
              <stop offset="100%" stopColor="#d86c2c" stopOpacity="0.86" />
            </linearGradient>
            <linearGradient id="ribRegen" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#30b888" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#3ec6a8" stopOpacity="0.52" />
              <stop offset="100%" stopColor="#2f83bf" stopOpacity="0.58" />
            </linearGradient>

            <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b97d6" />
              <stop offset="100%" stopColor="#1e5c8a" />
            </linearGradient>
            <linearGradient id="barBlueDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2c7fb8" />
              <stop offset="100%" stopColor="#15476b" />
            </linearGradient>
            <linearGradient id="barTeal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#28b08a" />
              <stop offset="100%" stopColor="#176e5a" />
            </linearGradient>
            <linearGradient id="barCyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5bc0de" />
              <stop offset="100%" stopColor="#2b7da0" />
            </linearGradient>
            <linearGradient id="barSteel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f8ab3" />
              <stop offset="100%" stopColor="#294e69" />
            </linearGradient>
            <linearGradient id="barSlate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c7f8e" />
              <stop offset="100%" stopColor="#3e4b56" />
            </linearGradient>
            <linearGradient id="barAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0a24b" />
              <stop offset="100%" stopColor="#bd5822" />
            </linearGradient>
            <linearGradient id="barAmberDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e28436" />
              <stop offset="100%" stopColor="#9e3d16" />
            </linearGradient>
            <linearGradient id="barDead" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a4248" />
              <stop offset="100%" stopColor="#4a262a" />
            </linearGradient>
          </defs>

          {/* Header title directly inside canvas like the reference */}
          <text x="42" y="28" className="title-label">INTELLIGENCE &amp; COMPUTE REFINERY FLOW</text>
          <text x="1152" y="28" textAnchor="end" className="annot">
            {unit === "physical" ? "14.2k tok/m · 392 vCPU" : unit === "cash" ? "$3.85/h cash burn" : "$9.10/h total ($3.85 cash + $5.25 shadow)"}
          </text>

          {/* Top sweeping regeneration return arc: Rolling 5h window replenishment */}
          <path
            d={feedbackRibbon(580, 74, 54, 84, 36, 13)}
            fill="url(#ribRegen)"
            className={`ribbon ${activeId && activeId !== "agy-claude" && activeId !== "agy-gemini" ? "dim" : ""}`}
            onMouseMove={e => {
              const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
              setTip({ x: e.clientX - r.left + 12, y: e.clientY - r.top + 12, title: "Rolling 5h Quota Regeneration (+20%/h)", sub: "Subscription windows continuously replenish left-hand stock as 5h-old turns age out." });
            }}
          />
          <path
            d="M 580 68 C 580 36, 317 36, 317 36 C 317 36, 54 36, 54 78"
            fill="none"
            stroke="#5ce0b8"
            strokeWidth="1.5"
            strokeOpacity="0.65"
            className="regen-pulse"
          />
          <text x="318" y="29" textAnchor="middle" fill="#4bc49d" style={{ fontSize: 10 }}>
            ↺ ROLLING 5H QUOTA REGENERATION (+20%/H REFILL)
          </text>

          {/* Severed stub for hard-capped OpenAI + Direct Anthropic */}
          <path
            d={sankeyRibbon(66, 396, 432, 168, 396, 422)}
            fill="#c95460"
            fillOpacity="0.28"
          />
          <line x1="168" y1="388" x2="168" y2="430" stroke="#ef7f8b" strokeWidth="2.5" strokeDasharray="4 3" />
          <text x="176" y="407" fill="#ef7f8b" style={{ fontSize: 10 }}>429 HARD CAP → NOV 4</text>
          <text x="176" y="420" className="annot">rerouted to AGY Claude &amp; Argon</text>

          {/* Main Sankey ribbons (productive blue/teal + entropic orange/amber) */}
          {LINKS.map(l => {
            const dim = !isRelated(l) || (scope === "mission" && (l.from === "other-m" || l.to === "other-m"));
            const path = sankeyRibbon(l.x0, l.y0a, l.y0b, l.x1, l.y1a, l.y1b);
            return (
              <g key={l.id}>
                <path
                  d={path}
                  fill={l.grad}
                  className={`ribbon ${dim ? "dim" : ""} ${activeId === l.id ? "on" : ""}`}
                  onClick={() => setActiveId(v => (v === l.id ? null : l.id))}
                  onMouseMove={e => {
                    const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                    setTip({
                      x: Math.min(r.width - 290, e.clientX - r.left + 14),
                      y: Math.max(12, e.clientY - r.top - 18),
                      title: `${l.label} · ${fmtRate(l)}`,
                      sub: l.detail,
                    });
                  }}
                />
                {l.callX && l.callY && !dim && (
                  <text x={l.callX} y={l.callY} textAnchor="middle" fill="#f0a85c" style={{ fontSize: 10, pointerEvents: "none" }}>
                    {l.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Warm snapshot cache recycle loop from Verified Proof Work back into Provisioner */}
          <path
            d={feedbackRibbon(1139, 364, 304, 642, 672, 10)}
            fill="url(#ribTeal)"
            fillOpacity="0.45"
          />
          <text x="720" y="681" textAnchor="middle" fill="#4fa8c7" style={{ fontSize: 9.8 }}>
            ↺ WARM SNAPSHOT &amp; .OLEAN CAS RECYCLE (orb-snap-verity-core-wave8 → 0s cold rebuild)
          </text>

          {/* Vertical pillar nodes with internal stock fill & rotated typography */}
          {NODES.map(n => {
            const dim = scope === "mission" && n.id === "other-m";
            const cx = n.x + n.w / 2;
            const cy = n.y + n.h / 2;
            return (
              <g
                key={n.id}
                style={{ cursor: "pointer", opacity: dim ? 0.22 : 1 }}
                onClick={() => setActiveId(v => (v === n.id ? null : n.id))}
                onMouseMove={e => {
                  const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  setTip({
                    x: Math.min(r.width - 290, e.clientX - r.left + 14),
                    y: Math.max(12, e.clientY - r.top - 18),
                    title: `${n.label} (${n.sub})`,
                    sub: n.note,
                  });
                }}
              >
                {/* Background empty tank when stockPct < 100 */}
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={4} fill="var(--bg-active)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                {/* Filled portion (bottom-up tank for Stage 1 reservoirs, full pillar for stages 2..5) */}
                {n.stockPct !== undefined ? (
                  n.stockPct > 0 && (
                    <rect
                      x={n.x}
                      y={n.y + n.h * (1 - n.stockPct / 100)}
                      width={n.w}
                      height={n.h * (n.stockPct / 100)}
                      rx={3}
                      fill={n.fill}
                    />
                  )
                ) : (
                  <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={4} fill={n.fill} />
                )}

                {/* Vertical rotated label inside tall pillars, or compact side tag for short ones */}
                {n.h >= 62 ? (
                  <text
                    x={cx + 3.5}
                    y={cy}
                    textAnchor="middle"
                    transform={`rotate(-90 ${cx + 3.5} ${cy})`}
                    className="node-label"
                    style={{ fontSize: n.h < 90 ? 9.5 : 10.5, letterSpacing: "0.06em" }}
                  >
                    {n.label}
                  </text>
                ) : (
                  <text x={n.x + n.w + 7} y={cy + 3} className="annot" style={{ fill: "var(--fg-2)" }}>
                    {n.label} · {n.sub}
                  </text>
                )}

                {/* Stock / rate badge above or beside Stage 1 & Stage 5 pillars */}
                {n.x < 100 && n.h >= 62 && (
                  <text x={n.x - 6} y={cy + 3} textAnchor="end" className="annot">
                    {n.stockPct}%
                  </text>
                )}
                {n.x > 1050 && (
                  <text x={n.x - 8} y={n.y + 14} textAnchor="end" style={{ fontSize: 11, fill: n.id === "entropy" ? "var(--warning)" : "var(--fg)" }}>
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {tip && (
          <div className="flow-tip" style={{ left: tip.x, top: tip.y }}>
            <b>{tip.title}</b>
            <span>{tip.sub}</span>
          </div>
        )}

        <div className="ref-foot">
          <div className="ref-key">
            <span><i style={{ background: "#3586c4" }} />Productive intelligence &amp; proof flow ($4.95/h)</span>
            <span><i style={{ background: "#259b7d" }} />Compute-coupled Maxwell refinery</span>
            <span><i style={{ background: "#e28436" }} />Entropy: context polling, idle reap &amp; 12h TTL drift ($4.15/h)</span>
            <span><i style={{ background: "#3ec6a8" }} />Quota regeneration &amp; warm snapshot loops</span>
          </div>
          <span>Conservation holds at every stage: $9.10/h in = $4.95/h verified + $4.15/h entropy</span>
        </div>
      </div>
    </OrbShell>
  );
}
