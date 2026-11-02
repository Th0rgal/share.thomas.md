"use client";

import { useState } from "react";
import "./ledger.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { organicTube, centerCurve } from "../orb_resources/svgPaths";

type Lens = "all" | "productive" | "entropy";

interface Bubble {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  r: number;
  usd: string;
  fill: string;
  stroke: string;
  kind: "source" | "hub" | "productive" | "entropy";
  arcPct?: number;
  note: string;
}

const BUBBLES: Bubble[] = [
  // Outer left arc: Supply Sources
  {
    id: "b-claude", label: "AGY Claude", sub: "74% · +20%/h",
    x: 138, y: 158, r: 44, usd: "$98.4", fill: "#1f4e74", stroke: "#4aa3e0",
    kind: "source", arcPct: 0.74,
    note: "Primary subscription supply after direct Anthropic cap ($98.4 shadow value across coordinator + sonnet/opus provers).",
  },
  {
    id: "b-gemini", label: "AGY Gemini", sub: "61% · +20%/h",
    x: 106, y: 336, r: 40, usd: "$54.2", fill: "#19584a", stroke: "#38c69f",
    kind: "source", arcPct: 0.61,
    note: "Argon & Carbon bulk shard workers + R1–R10 quorums. Suffered 13 overnight filter blocks.",
  },
  {
    id: "b-boat", label: "Boat 172 VMs", sub: "$43.05 cash",
    x: 154, y: 514, r: 46, usd: "$43.1", fill: "#244761", stroke: "#629ec7",
    kind: "source", arcPct: 0.29,
    note: "146 large ($29.66) + 24 xlarge ($13.38) + 2 small. 502 total VM-hours; 29% of today's $50 cap left.",
  },
  {
    id: "b-capped", label: "OpenAI + Anth.", sub: "429 capped",
    x: 266, y: 88, r: 30, usd: "$15.7", fill: "#3d2226", stroke: "#ef7f8b",
    kind: "source", arcPct: 0.02,
    note: "Early Wave 8 Astra/Sol/Fable spend before hitting multi-day 429 limits until Nov 4 UTC.",
  },

  // Center Campaign Nucleus
  {
    id: "b-root", label: "evm.fast", sub: "9409f9a9 · 3.5d",
    x: 528, y: 334, r: 72, usd: "$211.4", fill: "#1b364d", stroke: "#5cb3f0",
    kind: "hub",
    note: "Campaign nucleus: $211.40 total ($43.05 metered Boat cash + $168.35 shadow subscription value) across 224 subagents & 172 VMs.",
  },

  // Productive Clusters (Upper-Right & Right)
  {
    id: "b-warm", label: "3 xlarge Surgeons", sub: "VM-1 · VM-2 · VM-3",
    x: 794, y: 126, r: 44, usd: "$14.8", fill: "#1b594b", stroke: "#3dd1a9",
    kind: "productive",
    note: "Warm Snapshot Builder (wave8-fast-dag-warm) + Live Integrator + C00 / pendingStageTransfer Surgeon.",
  },
  {
    id: "b-shards", label: "46 Prover Shards", sub: "262 0-sorry lemmas",
    x: 996, y: 222, r: 58, usd: "$34.5", fill: "#1d517a", stroke: "#4ea8e6",
    kind: "productive",
    note: "GuardedBody routers, MPT/PTX cut-lemma racers, and ContractParts C00..C21 shards closing Fast-DAG leaves.",
  },
  {
    id: "b-quorum", label: "10× Quorums", sub: "opus · argon · astra",
    x: 822, y: 294, r: 36, usd: "$11.6", fill: "#22496b", stroke: "#6ebbf0",
    kind: "productive",
    note: "11 rounds on turbo-lean PR #289 + 10 spec/counterexample rounds catching R9 K_pan overflow & R10 MarksOK bugs.",
  },

  // Entropy / Friction Satellites (Lower & Lower-Right)
  {
    id: "b-poll", label: "Coord. Context", sub: "3 turns = $99.3!",
    x: 744, y: 528, r: 64, usd: "$125.3", fill: "#593018", stroke: "#f09b46",
    kind: "entropy",
    note: "59% of the entire campaign's economic burn! 26 OpenCode turns ingested 159.6M cache-read tokens (seq 58169 alone = $56.90).",
  },
  {
    id: "b-ttl", label: "15× 12h TTL Cap", sub: "180 VM-hours",
    x: 982, y: 454, r: 42, usd: "$16.0", fill: "#592624", stroke: "#ef7f8b",
    kind: "entropy",
    note: "Workers stalled on Codex/Anthropic 429s with unpushed proofs on disk; VMs ran until Boat's hard 720-min ceiling.",
  },
  {
    id: "b-idle", label: "38× Idle Reap + 47 Forks", sub: "108 VM-h + rescues",
    x: 1054, y: 576, r: 38, usd: "$13.9", fill: "#543519", stroke: "#e39a44",
    kind: "entropy",
    note: "37/38 working_owner_idle reaps were coordinator-owned VMs (twice killing warm builds); 47 rescue forks triggered 14 boot 502s.",
  },
];

interface Tendril {
  id: string;
  from: string;
  to: string;
  x0: number; y0: number; w0: number;
  cx0: number; cy0: number;
  cx1: number; cy1: number;
  x1: number; y1: number; w1: number;
  grad: string;
  kind: "productive" | "entropy";
  label: string;
}

const TENDRILS: Tendril[] = [
  // Supply -> Nucleus
  {
    id: "t-claude", from: "b-claude", to: "b-root",
    x0: 180, y0: 174, w0: 34, cx0: 310, cy0: 195, cx1: 385, cy1: 285, x1: 462, y1: 308, w1: 30,
    grad: "url(#cBlue)", kind: "productive", label: "$98.4 AGY Claude",
  },
  {
    id: "t-gemini", from: "b-gemini", to: "b-root",
    x0: 146, y0: 336, w0: 24, cx0: 280, cy0: 336, cx1: 360, cy1: 334, x1: 456, y1: 334, w1: 22,
    grad: "url(#cTeal)", kind: "productive", label: "$54.2 AGY Gemini",
  },
  {
    id: "t-boat", from: "b-boat", to: "b-root",
    x0: 196, y0: 496, w0: 22, cx0: 320, cy0: 468, cx1: 390, cy1: 382, x1: 466, y1: 362, w1: 20,
    grad: "url(#cBlue)", kind: "productive", label: "$43.1 Boat compute",
  },
  {
    id: "t-capped", from: "b-capped", to: "b-root",
    x0: 290, y0: 108, w0: 10, cx0: 375, cy0: 162, cx1: 435, cy1: 235, x1: 484, y1: 276, w1: 8,
    grad: "url(#cDead)", kind: "entropy", label: "$15.7 pre-cap OpenAI/Anth.",
  },

  // Nucleus -> Productive Clusters
  {
    id: "t-warm", from: "b-root", to: "b-warm",
    x0: 578, y0: 282, w0: 16, cx0: 645, cy0: 204, cx1: 702, cy1: 148, x1: 752, y1: 134, w1: 14,
    grad: "url(#cTeal)", kind: "productive", label: "$14.8 xlarge surgeons & warm snapshot",
  },
  {
    id: "t-shards", from: "b-root", to: "b-shards",
    x0: 596, y0: 308, w0: 26, cx0: 740, cy0: 238, cx1: 840, cy1: 214, x1: 938, y1: 218, w1: 28,
    grad: "url(#cBlue)", kind: "productive", label: "$34.5 active shard provers",
  },
  {
    id: "t-quorum", from: "b-root", to: "b-quorum",
    x0: 600, y0: 328, w0: 12, cx0: 688, cy0: 318, cx1: 736, cy1: 302, x1: 786, y1: 296, w1: 11,
    grad: "url(#cBlue)", kind: "productive", label: "$11.6 3-model spec quorums",
  },
  // Warm snapshot -> Shards accelerator arc
  {
    id: "t-warm-shards", from: "b-warm", to: "b-shards",
    x0: 836, y0: 138, w0: 10, cx0: 892, cy0: 152, cx1: 924, cy1: 172, x1: 952, y1: 190, w1: 10,
    grad: "url(#cTeal)", kind: "productive", label: "wave8-fast-dag-warm snapshot fanout",
  },

  // Nucleus -> Entropy Satellites (Thick Orange/Coral Tendrils)
  {
    id: "t-poll", from: "b-root", to: "b-poll",
    x0: 572, y0: 390, w0: 44, cx0: 622, cy0: 458, cx1: 654, cy1: 494, x1: 686, y1: 510, w1: 48,
    grad: "url(#cAmber)", kind: "entropy", label: "$125.3 coordinator context burn (59%)",
  },
  {
    id: "t-ttl", from: "b-root", to: "b-ttl",
    x0: 594, y0: 362, w0: 18, cx0: 736, cy0: 398, cx1: 845, cy1: 432, x1: 940, y1: 448, w1: 18,
    grad: "url(#cAmber)", kind: "entropy", label: "$16.0 stalled to 720m TTL cap",
  },
  {
    id: "t-idle", from: "b-root", to: "b-idle",
    x0: 586, y0: 378, w0: 15, cx0: 760, cy0: 462, cx1: 896, cy1: 544, x1: 1016, y1: 568, w1: 15,
    grad: "url(#cAmber)", kind: "entropy", label: "$13.9 idle reaps + 47 emergency forks",
  },
];

function stockArcPath(cx: number, cy: number, r: number, frac: number): string {
  const clamped = Math.max(0.02, Math.min(0.999, frac));
  const a0 = -Math.PI / 2;
  const a1 = a0 + clamped * Math.PI * 2;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = clamped > 0.5 ? 1 : 0;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

export function LedgerView() {
  const [lens, setLens] = useState<Lens>("all");
  const [focus, setFocus] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);

  return (
    <OrbShell active="ledger" title="Mission Constellation · 9409f9a9">
      <div className="orb-bar">
        <div className="orb-seg">
          <button className={lens === "all" ? "on" : ""} onClick={() => setLens("all")}>Full organism ($211.4)</button>
          <button className={lens === "productive" ? "on" : ""} onClick={() => setLens("productive")}>Verified proof work ($60.9)</button>
          <button className={lens === "entropy" ? "on" : ""} onClick={() => setLens("entropy")}>Context &amp; VM entropy ($155.2)</button>
        </div>
        {focus && (
          <button
            className="orb-seg"
            style={{ padding: "3px 9px", cursor: "pointer", color: "var(--fg-2)" }}
            onClick={() => setFocus(null)}
          >
            Reset node focus
          </button>
        )}
        <span className="orb-spacer" />
        <span className="orb-stamp">circle area = USD · outer ring = remaining stock · tendril thickness = flow volume</span>
      </div>

      <div className="con-wrap flow-stage" onMouseLeave={() => setTip(null)}>
        <svg className="flow-canvas" viewBox="0 0 1200 660" role="img" aria-label="Mission 9409f9a9 Resource Constellation">
          <defs>
            <linearGradient id="cBlue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3586c4" stopOpacity="0.78" />
              <stop offset="100%" stopColor="#4ea8e6" stopOpacity="0.82" />
            </linearGradient>
            <linearGradient id="cTeal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22a07f" stopOpacity="0.80" />
              <stop offset="100%" stopColor="#3dd1a9" stopOpacity="0.82" />
            </linearGradient>
            <linearGradient id="cAmber" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e8943c" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#d65a24" stopOpacity="0.88" />
            </linearGradient>
            <linearGradient id="cDead" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#994852" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#5c3b46" stopOpacity="0.45" />
            </linearGradient>
            <radialGradient id="hubHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b97d6" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#3b97d6" stopOpacity="0" />
            </radialGradient>
          </defs>

          <text x="36" y="28" className="title-label">CAMPAIGN RESOURCE CONSTELLATION · EVM.FAST (9409F9A9)</text>
          <text x="1164" y="28" textAnchor="end" className="annot">
            3.5 days · 224 subagents · 172 Boat VMs · $211.40 total
          </text>

          {/* Subtle orbital field guides around the campaign nucleus */}
          <circle cx="528" cy="334" r="245" fill="none" stroke="var(--stroke)" strokeWidth="1" strokeDasharray="3 7" />
          <circle cx="528" cy="334" r="430" fill="none" stroke="var(--stroke-soft)" strokeWidth="1" strokeDasharray="3 9" />
          <circle cx="528" cy="334" r="118" fill="url(#hubHalo)" />

          {/* Organic curved tendrils */}
          {TENDRILS.map(t => {
            const lensDim = (lens === "productive" && t.kind !== "productive") || (lens === "entropy" && t.kind !== "entropy" && t.from !== "b-claude" && t.from !== "b-boat");
            const focusDim = focus && focus !== t.from && focus !== t.to && focus !== t.id;
            const dim = lensDim || focusDim;
            const d = organicTube(t.x0, t.y0, t.w0, t.cx0, t.cy0, t.cx1, t.cy1, t.x1, t.y1, t.w1);
            const c = centerCurve(t.x0, t.y0, t.cx0, t.cy0, t.cx1, t.cy1, t.x1, t.y1);
            return (
              <g
                key={t.id}
                className={`ribbon ${dim ? "dim" : ""}`}
                onClick={() => setFocus(v => (v === t.id ? null : t.id))}
                onMouseMove={e => {
                  const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  setTip({
                    x: Math.min(r.width - 290, e.clientX - r.left + 14),
                    y: Math.max(12, e.clientY - r.top - 18),
                    title: t.label,
                    sub: "Click to isolate this flow tendril",
                  });
                }}
              >
                <path d={d} fill={t.grad} />
                {!dim && (
                  <path
                    d={c}
                    fill="none"
                    stroke={t.kind === "entropy" ? "#ffe0b8" : "#d4f5ff"}
                    strokeWidth="1.8"
                    strokeOpacity="0.6"
                    className="orbit-stream"
                  />
                )}
              </g>
            );
          })}

          {/* Micro-swarm dots orbiting 46 Prover Shards to convey live subagent fanout */}
          {Array.from({ length: 18 }).map((_, i) => {
            const ang = (i / 18) * Math.PI * 2;
            const sx = 996 + Math.cos(ang) * 72;
            const sy = 222 + Math.sin(ang) * 72;
            return (
              <circle
                key={i}
                cx={sx}
                cy={sy}
                r={i % 3 === 0 ? 3.4 : 2.3}
                fill={i % 2 === 0 ? "#4ea8e6" : "#3dd1a9"}
                opacity={lens === "entropy" ? 0.18 : 0.85}
              />
            );
          })}

          {/* Constellation Nodes */}
          {BUBBLES.map(b => {
            const lensDim =
              (lens === "productive" && b.kind === "entropy") ||
              (lens === "entropy" && b.kind === "productive");
            const focusDim = focus && focus !== b.id;
            const dim = lensDim || focusDim;
            return (
              <g
                key={b.id}
                style={{ cursor: "pointer", opacity: dim ? 0.2 : 1, transition: "opacity 150ms ease" }}
                onClick={() => setFocus(v => (v === b.id ? null : b.id))}
                onMouseMove={e => {
                  const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  setTip({
                    x: Math.min(r.width - 290, e.clientX - r.left + 14),
                    y: Math.max(12, e.clientY - r.top - 18),
                    title: `${b.label} · ${b.usd}`,
                    sub: b.note,
                  });
                }}
              >
                {b.arcPct !== undefined && (
                  <>
                    <circle cx={b.x} cy={b.y} r={b.r + 6} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="3" />
                    <path
                      d={stockArcPath(b.x, b.y, b.r + 6, b.arcPct)}
                      fill="none"
                      stroke={b.stroke}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  </>
                )}
                <circle cx={b.x} cy={b.y} r={b.r} fill={b.fill} stroke={b.stroke} strokeWidth={b.kind === "hub" ? 2.4 : 1.6} />
                <text x={b.x} y={b.y - 6} textAnchor="middle" fill="#ffffff" style={{ fontSize: b.r >= 58 ? 16 : 13, fontWeight: 600 }}>
                  {b.usd}
                </text>
                <text x={b.x} y={b.y + 10} textAnchor="middle" fill="rgba(255,255,255,0.9)" style={{ fontSize: b.r < 36 ? 9.2 : 10.5 }}>
                  {b.label}
                </text>
                {b.r >= 40 && (
                  <text x={b.x} y={b.y + 23} textAnchor="middle" fill="rgba(255,255,255,0.62)" style={{ fontSize: 9 }}>
                    {b.sub}
                  </text>
                )}
              </g>
            );
          })}

          {/* Direct canvas annotations highlighting the unexpected insights */}
          <text x="612" y="592" fill="#f0a85c" style={{ fontSize: 10.5 }}>
            ↑ Coordinator context ($125.3) burned 3× more than all 172 Boat VMs ($43.1)
          </text>
          <text x="996" y="314" textAnchor="middle" fill="#7ec8f8" style={{ fontSize: 10 }}>
            46 live shard provers orbiting warm snapshot
          </text>
        </svg>

        {tip && (
          <div className="flow-tip" style={{ left: tip.x, top: tip.y }}>
            <b>{tip.title}</b>
            <span>{tip.sub}</span>
          </div>
        )}

        <div className="con-foot">
          <div className="con-legend">
            <span><i style={{ background: "#4aa3e0" }} />Supply reservoir (outer arc = stock %)</span>
            <span><i style={{ background: "#3dd1a9" }} />Warm compute &amp; verified proof clusters</span>
            <span><i style={{ background: "#f09b46" }} />Coordinator context &amp; VM lifecycle entropy</span>
            <span><i style={{ background: "#ef7f8b" }} />429 hard cap / 720m TTL cliff</span>
          </div>
          <span>Click any sphere or tendril to isolate its subgraph</span>
        </div>
      </div>
    </OrbShell>
  );
}
