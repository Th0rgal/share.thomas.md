"use client";

import { useState } from "react";
import "./reservoirs.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { organicTube, centerCurve } from "../orb_resources/svgPaths";

interface Vessel {
  id: string;
  name: string;
  sub: string;
  cx: number;
  cy: number;
  r: number;
  fillPct: number;
  projPct: number;
  inflow: string;
  outflow: string;
  color: string;
  tone: "ok" | "warn" | "bad" | "surplus";
  note: string;
}

const VESSELS: Vessel[] = [
  {
    id: "v-claude", name: "AGY · Claude", sub: "google-sonnet · opus",
    cx: 158, cy: 170, r: 58, fillPct: 74, projPct: 86,
    inflow: "+20%/h", outflow: "−9%/h · $3.10/h", color: "#3586c4", tone: "ok",
    note: "Regenerating faster than burn (+11%/h net). Carries 14 active Lean provers & Opus quorums while direct Anthropic is capped.",
  },
  {
    id: "v-gemini", name: "AGY · Gemini", sub: "argon · carbon",
    cx: 158, cy: 332, r: 52, fillPct: 61, projPct: 78,
    inflow: "+20%/h", outflow: "−14%/h · $2.40/h", color: "#22a07f", tone: "warn",
    note: "19 active workers. Had 13 silent safety-filter blocks overnight (shown as the amber leak below).",
  },
  {
    id: "v-surplus", name: "Surplus Pools", sub: "Kimi · Z.AI · MiniMax",
    cx: 312, cy: 112, r: 38, fillPct: 96, projPct: 100,
    inflow: "+14%/h", outflow: "−1%/h · $0.15/h", color: "#4db8d8", tone: "surplus",
    note: "96% full! Rolling weekly tokens are evaporating over the spillway unused — prime candidate for leaf tactic races.",
  },
  {
    id: "v-capped", name: "OpenAI + Anthropic", sub: "direct OAuth pools",
    cx: 312, cy: 266, r: 40, fillPct: 2, projPct: 2,
    inflow: "0%/h", outflow: "VALVE SHUT", color: "#ef7f8b", tone: "bad",
    note: "gpt-6-astra, gpt-6.1-sol, opus-5.5 & fable-5.1 exhausted until Nov 4 UTC. Shutoff valve closed.",
  },
  {
    id: "v-boat", name: "Boat.dev Escrow", sub: "$50/d · 49 VMs live",
    cx: 166, cy: 520, r: 62, fillPct: 29, projPct: 0,
    inflow: "resets 00:00Z", outflow: "$3.55/h cash", color: "#467fa8", tone: "warn",
    note: "$14.34 left of $50 daily pool. At $3.55/h current burn, reaches 0% in ~4.0 hours (before midnight reset).",
  },
  {
    id: "v-spark", name: "Static + Spark", sub: "ashur · babylon · GB10",
    cx: 336, cy: 572, r: 40, fillPct: 84, projPct: 84,
    inflow: "owned hw", outflow: "$0.00/h cash", color: "#688296", tone: "ok",
    note: "4 static Lean workers + dgx-spark NVFP4 inference. Watch /dev/md2 disk headroom on ashur.",
  },
];

interface Stream {
  id: string;
  from: string;
  x0: number; y0: number; w0: number;
  cx0: number; cy0: number;
  cx1: number; cy1: number;
  x1: number; y1: number; w1: number;
  fill: string;
  particleColor: string;
  label: string;
  sub: string;
}

const STREAMS: Stream[] = [
  // Vessels -> Central Maxwell Gate Vortex (cx=636, cy=324)
  {
    id: "s-claude-gate", from: "v-claude",
    x0: 214, y0: 174, w0: 34, cx0: 410, cy0: 174, cx1: 490, cy1: 286, x1: 576, y1: 304, w1: 28,
    fill: "url(#wBlue)", particleColor: "#bfe6ff",
    label: "$3.10/h Claude stream", sub: "14 provers + Opus quorum",
  },
  {
    id: "s-gemini-gate", from: "v-gemini",
    x0: 208, y0: 326, w0: 26, cx0: 380, cy0: 326, cx1: 470, cy1: 322, x1: 576, y1: 326, w1: 22,
    fill: "url(#wTeal)", particleColor: "#b8f5e2",
    label: "$2.15/h Argon/Carbon", sub: "19 shard workers",
  },
  {
    id: "s-surplus-spill", from: "v-surplus",
    x0: 348, y0: 98, w0: 12, cx0: 440, cy0: 72, cx1: 520, cy1: 56, x1: 598, y1: 52, w1: 4,
    fill: "url(#wAmber)", particleColor: "#ffdca8",
    label: "Window evaporation", sub: "96% surplus expiring unused at reset",
  },
  {
    id: "s-boat-gate", from: "v-boat",
    x0: 226, y0: 502, w0: 38, cx0: 410, cy0: 484, cx1: 495, cy1: 356, x1: 578, y1: 346, w1: 26,
    fill: "url(#wSteel)", particleColor: "#cbe3f5",
    label: "$2.50/h Active Boat VMs", sub: "304 vCPU running warm turbo-lean",
  },
  {
    id: "s-spark-gate", from: "v-spark",
    x0: 374, y0: 558, w0: 14, cx0: 470, cy0: 520, cx1: 525, cy1: 378, x1: 584, y1: 360, w1: 12,
    fill: "url(#wTeal)", particleColor: "#b8f5e2",
    label: "Static + Spark ($0/h)", sub: "24 vCPU + local leanstral",
  },

  // Leaks & Drift pouring down into the Entropy Drain Basin (cx=985, cy=548)
  {
    id: "s-coord-leak", from: "v-claude",
    x0: 652, y0: 378, w0: 28, cx0: 710, cy0: 468, cx1: 810, cy1: 522, x1: 902, y1: 536, w1: 32,
    fill: "url(#wAmber)", particleColor: "#ffe0b2",
    label: "$3.10/h Coordinator context", sub: "159M cache-read polling ($125 campaign total)",
  },
  {
    id: "s-boat-leak", from: "v-boat",
    x0: 224, y0: 542, w0: 20, cx0: 480, cy0: 636, cx1: 720, cy1: 620, x1: 904, y1: 564, w1: 22,
    fill: "url(#wAmber)", particleColor: "#ffd099",
    label: "$1.05/h Idle reap + 12h TTL", sub: "15 VMs hit 720m cap ($16.04) · 38 VMs idle-reaped ($9.15)",
  },
  {
    id: "s-gemini-leak", from: "v-gemini",
    x0: 196, y0: 366, w0: 9, cx0: 350, cy0: 448, cx1: 690, cy1: 560, x1: 904, y1: 550, w1: 10,
    fill: "url(#wAmber)", particleColor: "#ffd099",
    label: "13 safety-filter blocks", sub: "6h silent overnight stall on agy-model-low",
  },

  // Maxwell Gate -> Certified Proof Basin (cx=1008, cy=224)
  {
    id: "s-gate-cert", from: "gate",
    x0: 696, y0: 312, w0: 44, cx0: 790, cy0: 292, cx1: 845, cy1: 232, x1: 924, y1: 224, w1: 48,
    fill: "url(#wBlueBright)", particleColor: "#ffffff",
    label: "$4.95/h Certified Proofs", sub: "262 0-sorryAx lemmas + 374-bit K_target",
  },
];

export function ReservoirsView() {
  const [horizon, setHorizon] = useState<boolean>(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);

  return (
    <OrbShell active="reservoirs" title="Hydraulic Watershed">
      <div className="orb-bar">
        <div className="orb-seg">
          <button className={horizon ? "on" : ""} onClick={() => setHorizon(true)}>Show +4h forecast waterline</button>
          <button className={!horizon ? "on" : ""} onClick={() => setHorizon(false)}>Current fill only</button>
        </div>
        {selected && (
          <button
            className="orb-seg"
            style={{ padding: "3px 9px", cursor: "pointer", color: "var(--fg-2)" }}
            onClick={() => setSelected(null)}
          >
            Clear vessel focus
          </button>
        )}
        <span className="orb-spacer" />
        <span className="orb-stamp">circular vessels = liquid stock · dashed rain = regeneration · animated tubes = burn speed</span>
      </div>

      <div className="wat-wrap flow-stage" onMouseLeave={() => setTip(null)}>
        <svg className="flow-canvas" viewBox="0 0 1200 660" role="img" aria-label="Hydraulic Reservoir Watershed">
          <defs>
            {VESSELS.map(v => (
              <clipPath id={`clip-${v.id}`} key={v.id}>
                <circle cx={v.cx} cy={v.cy} r={v.r - 3} />
              </clipPath>
            ))}
            <clipPath id="clip-cert">
              <circle cx="1008" cy="224" r="78" />
            </clipPath>
            <clipPath id="clip-drain">
              <circle cx="985" cy="548" r="64" />
            </clipPath>

            <linearGradient id="wBlue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3586c4" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#2ca298" stopOpacity="0.78" />
            </linearGradient>
            <linearGradient id="wBlueBright" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2ca298" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#3b97d6" stopOpacity="0.92" />
            </linearGradient>
            <linearGradient id="wTeal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22a07f" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#3586c4" stopOpacity="0.76" />
            </linearGradient>
            <linearGradient id="wSteel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#467fa8" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#2ca298" stopOpacity="0.78" />
            </linearGradient>
            <linearGradient id="wAmber" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#eb9b46" stopOpacity="0.84" />
              <stop offset="100%" stopColor="#cf5c24" stopOpacity="0.88" />
            </linearGradient>
            <radialGradient id="gateGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3ec6a8" stopOpacity="0.38" />
              <stop offset="70%" stopColor="#2f83bf" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#2f83bf" stopOpacity="0" />
            </radialGradient>
          </defs>

          <text x="36" y="28" className="title-label">HYDRAULIC QUOTA &amp; COMPUTE WATERSHED</text>
          <text x="1164" y="28" textAnchor="end" className="annot">
            inflow (regen) vs outflow (burn) · mission 9409f9a9
          </text>

          {/* Regeneration rain / top refill arcs into regenerating subscription tanks */}
          {[
            { x: 158, yTop: 46, yBot: 108, label: "+20%/h" },
            { x: 92, yTop: 248, yBot: 300, label: "+20%/h" },
            { x: 312, yTop: 34, yBot: 70, label: "+14%/h" },
          ].map((r, idx) => (
            <g key={idx}>
              <line x1={r.x - 10} y1={r.yTop} x2={r.x - 4} y2={r.yBot} stroke="#44d2a8" strokeWidth="2" className="rain-drops" />
              <line x1={r.x} y1={r.yTop - 6} x2={r.x} y2={r.yBot} stroke="#44d2a8" strokeWidth="2.4" className="rain-drops" />
              <line x1={r.x + 10} y1={r.yTop} x2={r.x + 4} y2={r.yBot} stroke="#44d2a8" strokeWidth="2" className="rain-drops" />
              <text x={r.x} y={r.yTop - 10} textAnchor="middle" fill="#44d2a8" style={{ fontSize: 10 }}>{r.label}</text>
            </g>
          ))}

          {/* Severed / shutoff pipe from Capped OpenAI + Anthropic */}
          <path d="M 352 266 L 448 266" stroke="#7a4248" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.55" />
          <g transform="translate(410, 266)">
            <circle r="11" fill="var(--bg-elev)" stroke="#ef7f8b" strokeWidth="2" />
            <line x1="-6" y1="-6" x2="6" y2="6" stroke="#ef7f8b" strokeWidth="2" />
            <line x1="-6" y1="6" x2="6" y2="-6" stroke="#ef7f8b" strokeWidth="2" />
          </g>
          <text x="410" y="292" textAnchor="middle" fill="#ef7f8b" style={{ fontSize: 9.8 }}>429 SHUT → NOV 4</text>

          {/* Organic curved fluid tubes + animated flow particles */}
          {STREAMS.map(s => {
            const dim = selected && selected !== s.from && selected !== s.id;
            const d = organicTube(s.x0, s.y0, s.w0, s.cx0, s.cy0, s.cx1, s.cy1, s.x1, s.y1, s.w1);
            const c = centerCurve(s.x0, s.y0, s.cx0, s.cy0, s.cx1, s.cy1, s.x1, s.y1);
            return (
              <g
                key={s.id}
                className={`ribbon ${dim ? "dim" : ""}`}
                onClick={() => setSelected(v => (v === s.id ? null : s.id))}
                onMouseMove={e => {
                  const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  setTip({
                    x: Math.min(r.width - 290, e.clientX - r.left + 14),
                    y: Math.max(12, e.clientY - r.top - 18),
                    title: s.label,
                    sub: s.sub,
                  });
                }}
              >
                <path d={d} fill={s.fill} />
                <path d={c} fill="none" stroke={s.particleColor} strokeWidth="2" strokeOpacity="0.65" className="flow-particles" />
              </g>
            );
          })}

          {/* Stream callout labels on key organic curves */}
          <text x="416" y="198" fill="#8cc8f0" style={{ fontSize: 10 }}>$3.10/h · 14 provers</text>
          <text x="518" y="46" fill="#f0a85c" style={{ fontSize: 9.8 }}>evaporating surplus</text>
          <text x="772" y="482" fill="#f0a85c" style={{ fontSize: 10 }}>coordinator ctx ($3.10/h)</text>
          <text x="565" y="618" fill="#f0a85c" style={{ fontSize: 10 }}>idle reap + 12h TTL ($1.05/h · 58% of Boat $)</text>
          <text x="815" y="250" fill="#8ce0cb" style={{ fontSize: 10.5 }}>$4.95/h certified</text>

          {/* Central Maxwell Gate Confluence Chamber */}
          <g
            style={{ cursor: "pointer" }}
            onMouseMove={e => {
              const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
              setTip({
                x: e.clientX - r.left + 14,
                y: e.clientY - r.top - 18,
                title: "The Maxwell Gate · Confluence",
                sub: "Couples 14.2k tok/min of raw inference with 392 vCPU of warm turbo-lean Zygotes (<2 ms check) and 3-model spec quorums.",
              });
            }}
          >
            <circle cx="636" cy="326" r="88" fill="url(#gateGlow)" />
            <circle cx="636" cy="326" r="62" fill="var(--bg-sb)" stroke="#3ec6a8" strokeWidth="2" />
            <circle cx="636" cy="326" r="52" fill="none" stroke="#3586c4" strokeWidth="1.2" strokeDasharray="5 4" />
            <text x="636" y="313" textAnchor="middle" fill="var(--fg-strong)" style={{ fontSize: 12, fontWeight: 600 }}>MAXWELL GATE</text>
            <text x="636" y="330" textAnchor="middle" fill="#44d2a8" style={{ fontSize: 10.5 }}>turbo-lean · 0.07ms</text>
            <text x="636" y="346" textAnchor="middle" className="annot">36 turns · 49 VMs</text>
          </g>

          {/* Left-hand Circular Liquid Stock Vessels */}
          {VESSELS.map(v => {
            const topY = v.cy + v.r - (2 * v.r * v.fillPct) / 100;
            const projY = v.cy + v.r - (2 * v.r * v.projPct) / 100;
            const wave = `M ${v.cx - v.r} ${topY} Q ${v.cx - v.r / 2} ${topY - 5}, ${v.cx} ${topY} T ${v.cx + v.r} ${topY} L ${v.cx + v.r} ${v.cy + v.r} L ${v.cx - v.r} ${v.cy + v.r} Z`;
            const borderCol = v.tone === "bad" ? "#ef7f8b" : v.tone === "warn" ? "#d9b23a" : v.tone === "surplus" ? "#4db8d8" : "rgba(255,255,255,0.22)";
            return (
              <g
                key={v.id}
                style={{ cursor: "pointer", opacity: selected && selected !== v.id ? 0.35 : 1 }}
                onClick={() => setSelected(cur => (cur === v.id ? null : v.id))}
                onMouseMove={e => {
                  const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  setTip({
                    x: Math.min(r.width - 290, e.clientX - r.left + 14),
                    y: Math.max(12, e.clientY - r.top - 18),
                    title: `${v.name} · ${v.fillPct}% stock`,
                    sub: v.note,
                  });
                }}
              >
                <circle cx={v.cx} cy={v.cy} r={v.r} fill="var(--bg-sb)" stroke={borderCol} strokeWidth="2" />
                <g clipPath={`url(#clip-${v.id})`}>
                  <path d={wave} fill={v.color} fillOpacity="0.62" />
                  {horizon && v.projPct !== v.fillPct && (
                    <line
                      x1={v.cx - v.r}
                      y1={projY}
                      x2={v.cx + v.r}
                      y2={projY}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      strokeOpacity="0.85"
                    />
                  )}
                </g>
                <text x={v.cx} y={v.cy - 6} textAnchor="middle" fill="#ffffff" style={{ fontSize: v.r > 48 ? 16 : 13, fontWeight: 600 }}>
                  {v.id === "v-boat" ? "$14.3" : `${v.fillPct}%`}
                </text>
                <text x={v.cx} y={v.cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.85)" style={{ fontSize: 10 }}>
                  {v.name}
                </text>
                <text x={v.cx} y={v.cy + v.r + 15} textAnchor="middle" className="annot">
                  {v.outflow}
                </text>
              </g>
            );
          })}

          {/* Right Top Basin: Certified Knowledge */}
          <g
            onMouseMove={e => {
              const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
              setTip({
                x: r.width - 300,
                y: e.clientY - r.top - 18,
                title: "Verified Proof Basin · evm.fast",
                sub: "Irreversible epistemic ratchet: 262 0-sorryAx theorems harvested, GuardedBody routers proved, 144 Fast-DAG obligations remaining.",
              });
            }}
          >
            <circle cx="1008" cy="224" r="82" fill="var(--bg-sb)" stroke="#3b97d6" strokeWidth="2.2" />
            <g clipPath="url(#clip-cert)">
              <path d="M 926 204 Q 967 197, 1008 204 T 1090 204 L 1090 306 L 926 306 Z" fill="#2b84c2" fillOpacity="0.68" />
            </g>
            <text x="1008" y="212" textAnchor="middle" fill="#ffffff" style={{ fontSize: 13, fontWeight: 600 }}>VERIFIED WORK</text>
            <text x="1008" y="231" textAnchor="middle" fill="#d8f3ff" style={{ fontSize: 15, fontWeight: 600 }}>$4.95/h</text>
            <text x="1008" y="249" textAnchor="middle" fill="rgba(255,255,255,0.8)" style={{ fontSize: 10 }}>262 0-sorryAx lemmas</text>
          </g>

          {/* Right Bottom Basin: Entropy / Waste Sink */}
          <g
            onMouseMove={e => {
              const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
              setTip({
                x: r.width - 300,
                y: e.clientY - r.top - 18,
                title: "Entropy & Lifecycle Sink ($4.15/h)",
                sub: "Coordinator trace re-reading ($3.10/h) + Boat 12h TTL caps ($16.04) + coordinator-owned idle reaps ($9.15) + 47 emergency VM forks.",
              });
            }}
          >
            <circle cx="985" cy="548" r="68" fill="var(--bg-sb)" stroke="#e28436" strokeWidth="2" />
            <g clipPath="url(#clip-drain)">
              <path d="M 917 536 Q 951 530, 985 536 T 1053 536 L 1053 616 L 917 616 Z" fill="#d96b27" fillOpacity="0.68" />
            </g>
            <text x="985" y="538" textAnchor="middle" fill="#ffffff" style={{ fontSize: 12, fontWeight: 600 }}>ENTROPY SINK</text>
            <text x="985" y="556" textAnchor="middle" fill="#ffe2c2" style={{ fontSize: 14, fontWeight: 600 }}>$4.15/h</text>
            <text x="985" y="572" textAnchor="middle" fill="rgba(255,255,255,0.8)" style={{ fontSize: 9.5 }}>ctx poll · idle · TTL</text>
          </g>
        </svg>

        {tip && (
          <div className="flow-tip" style={{ left: tip.x, top: tip.y }}>
            <b>{tip.title}</b>
            <span>{tip.sub}</span>
          </div>
        )}

        <div className="wat-foot">
          <div className="wat-legend">
            <span><i style={{ background: "#44d2a8" }} />Regeneration rain (+%/h)</span>
            <span><i style={{ background: "#3586c4" }} />Healthy reservoir &amp; flow</span>
            <span><i style={{ background: "#e28436" }} />Leakage / idle drift / polling</span>
            <span><i style={{ background: "#ef7f8b" }} />Hard-capped shutoff (429)</span>
            <span><i style={{ background: "#ffffff" }} />Dashed waterline = +4h forecast</span>
          </div>
          <span>Boat reaches $0 in 4.0h · xlarge-a idle-reaps in 3m · AGY Claude net +11%/h</span>
        </div>
      </div>
    </OrbShell>
  );
}
