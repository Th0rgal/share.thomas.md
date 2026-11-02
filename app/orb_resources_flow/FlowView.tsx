"use client";

import { useMemo, useState } from "react";
import "./flow.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { sankey, sankeyJustify, sankeyLinkHorizontal, type SankeyLink, type SankeyNode } from "d3-sankey";
import { area, curveMonotoneX, line } from "d3-shape";
import { RANGES, SCHEDULES, seriesFor, type GanttBar, type Range } from "./history";

type View = "flow" | "subagents";
type Lens = "inference" | "compute";

interface NodeDatum { id: string; label: string; sub: string; color: string; note: string }
interface LinkDatum { id: string; note: string }
type N = SankeyNode<NodeDatum, LinkDatum>;
type L = SankeyLink<NodeDatum, LinkDatum>;

const INFERENCE_NODES: NodeDatum[] = [
  { id: "agy-claude", label: "AGY · Claude", sub: "74% left · +20%/h", color: "#2f83bf", note: "google-sonnet & google-opus. Separate pool from direct Anthropic." },
  { id: "agy-gemini", label: "AGY · Gemini", sub: "61% left · +20%/h", color: "#1d9a78", note: "argon & carbon. Dipped overnight during 13 silent safety-filter blocks." },
  { id: "surplus", label: "Kimi · Z.AI · Grok", sub: "96% left", color: "#4da8c7", note: "Weekly surplus windows." },
  { id: "evm-provers", label: "evm.fast · provers", sub: "46 shards", color: "#2f83bf", note: "Leaf & cut-lemma workers closing the 144 Fast-DAG obligations." },
  { id: "evm-quorum", label: "evm.fast · quorums", sub: "3 models", color: "#6ebbf0", note: "Spec & counterexample consults." },
  { id: "evm-coord", label: "evm.fast · coordinator", sub: "159M cache", color: "#e28436", note: "Root agent context. Spiked hard at 22:29 UTC reading 300 raw events." },
  { id: "other-inf", label: "other missions", sub: "4 active", color: "#586978", note: "boost.ci, EthLib and assistant traffic." },
];

const INFERENCE_LINKS: Array<{ source: string; target: string; value: number } & LinkDatum> = [
  { id: "claude→provers", source: "agy-claude", target: "evm-provers", value: 6.4, note: "Sonnet provers on GuardedBody and ContractParts." },
  { id: "claude→quorum", source: "agy-claude", target: "evm-quorum", value: 1.7, note: "Opus seats in the spec quorum." },
  { id: "gemini→provers", source: "agy-gemini", target: "evm-provers", value: 4.1, note: "Argon & carbon shard racers." },
  { id: "gemini→quorum", source: "agy-gemini", target: "evm-quorum", value: 1.3, note: "Argon-high counterexample reviews." },
  { id: "claude→coord", source: "agy-claude", target: "evm-coord", value: 0.9, note: "Coordinator context." },
  { id: "surplus→other", source: "surplus", target: "other-inf", value: 0.7, note: "builtin/smart spillover." },
];

const COMPUTE_NODES: NodeDatum[] = [
  { id: "boat-large", label: "Boat · large", sub: "46 × 8 vCPU", color: "#3d7399", note: "$0.072/h each. Peaked at 53 VMs online at 08:24 UTC." },
  { id: "boat-xlarge", label: "Boat · xlarge", sub: "3 × 16 vCPU", color: "#2f83bf", note: "Warm snapshot builder, live integrator, C00 surgeon." },
  { id: "fleet", label: "Static fleet + Spark", sub: "4 hosts", color: "#586978", note: "ashur, babylon, nippur, uruk plus dgx-spark." },
  { id: "evm-proving", label: "evm.fast · proving", sub: "active checks", color: "#1d9a78", note: "Warm turbo-lean checks closing sorries." },
  { id: "evm-building", label: "evm.fast · warm build", sub: "snapshot", color: "#4da8c7", note: "xlarge-a packing wave8-fast-dag-warm." },
  { id: "evm-idle", label: "evm.fast · idle / stalled", sub: "reap risk", color: "#e28436", note: "VMs with no attached job, or stalled on a 429." },
  { id: "other-cpu", label: "other missions", sub: "2 hosts", color: "#586978", note: "Everything else on the static fleet." },
];

const COMPUTE_LINKS: Array<{ source: string; target: string; value: number } & LinkDatum> = [
  { id: "large→proving", source: "boat-large", target: "evm-proving", value: 304, note: "38 large VMs running live Lean checks." },
  { id: "large→idle", source: "boat-large", target: "evm-idle", value: 64, note: "8 large VMs idle — reap countdown running." },
  { id: "xlarge→build", source: "boat-xlarge", target: "evm-building", value: 16, note: "xlarge-a warm snapshot builder." },
  { id: "xlarge→proving", source: "boat-xlarge", target: "evm-proving", value: 32, note: "xlarge integrator and C00 surgeon." },
  { id: "fleet→proving", source: "fleet", target: "evm-proving", value: 16, note: "ashur + one Lean worker." },
  { id: "fleet→other", source: "fleet", target: "other-cpu", value: 24, note: "Remaining static capacity." },
];

interface Selection { id: string; label: string; value: number; color: string; note: string }

export function FlowView() {
  const [view, setView] = useState<View>("flow");
  const [lens, setLens] = useState<Lens>("inference");
  const [range, setRange] = useState<Range>("6h");
  const [sel, setSel] = useState<Selection | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [schedIdx, setSchedIdx] = useState(0);
  const [tip, setTip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);

  const nodes = lens === "inference" ? INFERENCE_NODES : COMPUTE_NODES;
  const links = lens === "inference" ? INFERENCE_LINKS : COMPUTE_LINKS;
  const unit = lens === "inference" ? "k tok/min" : "vCPU";
  const total = links.reduce((s, l) => s + l.value, 0);

  const graph = useMemo(() => {
    const layout = sankey<NodeDatum, LinkDatum>()
      .nodeId(d => d.id).nodeAlign(sankeyJustify).nodeWidth(15).nodePadding(22).nodeSort(null).linkSort(null)
      .extent([[165, 12], [1035, 348]]);
    return layout({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });
  }, [nodes, links]);
  const linkPath = useMemo(() => sankeyLinkHorizontal<NodeDatum, LinkDatum>(), []);

  const current: Selection = sel ?? {
    id: lens === "inference" ? "all-inference" : "all-compute",
    label: lens === "inference" ? "All inference" : "All compute",
    value: total,
    color: lens === "inference" ? "#2f83bf" : "#1d9a78",
    note: "Click any pool, ribbon or mission above to see its own curve.",
  };

  const curve = useMemo(() => {
    const pts = seriesFor(current.id, current.value, range);
    const hi = Math.max(...pts, 0.01) * 1.12;
    const x = (i: number) => 48 + (i / (pts.length - 1)) * 1112;
    const y = (v: number) => 14 + (1 - v / hi) * 138;
    const l = line<number>().x((_, i) => x(i)).y(d => y(d)).curve(curveMonotoneX)(pts) ?? "";
    const a = area<number>().x((_, i) => x(i)).y0(152).y1(d => y(d)).curve(curveMonotoneX)(pts) ?? "";
    return { pts, hi, x, y, l, a };
  }, [current.id, current.value, range]);

  const rangeMeta = RANGES.find(r => r.id === range)!;
  const scrubbed = hoverIdx !== null ? curve.pts[hoverIdx] : current.value;
  const fmt = (v: number) => (lens === "inference" ? v.toFixed(1) : String(Math.round(v)));

  return (
    <OrbShell title={view === "flow" ? "Flow" : "Subagents"}>
      <div className="orb-bar">
        <div className="orb-seg">
          <button className={view === "flow" ? "on" : ""} onClick={() => setView("flow")}>Flow</button>
          <button className={view === "subagents" ? "on" : ""} onClick={() => setView("subagents")}>Subagents</button>
        </div>

        {view === "flow" ? (
          <div className="orb-seg">
            <button className={lens === "inference" ? "on" : ""} onClick={() => { setLens("inference"); setSel(null); }}>Inference · tok/min</button>
            <button className={lens === "compute" ? "on" : ""} onClick={() => { setLens("compute"); setSel(null); }}>Compute · vCPU</button>
          </div>
        ) : (
          <div className="orb-seg">
            {SCHEDULES.map((s, i) => (
              <button key={s.id} className={schedIdx === i ? "on" : ""} onClick={() => setSchedIdx(i)}>
                {i === 0 ? "Fast-DAG v1 (6h)" : "Full 3.5d history"}
              </button>
            ))}
          </div>
        )}

        <span className="orb-spacer" />
        <span className="orb-stamp">
          {view === "flow" ? `${fmt(total)} ${unit} live` : SCHEDULES[schedIdx].subtitle}
        </span>
      </div>

      {view === "flow" ? (
        <>
          <div className="ref-wrap flow-stage" onMouseLeave={() => setTip(null)}>
            <svg className="flow-canvas" viewBox="0 0 1200 360" role="img" aria-label={`${lens} flow per mission`}>
              {graph.links.map((l, i) => {
                const s = l.source as N; const t = l.target as N;
                const on = sel?.id === l.id || sel?.id === s.id || sel?.id === t.id;
                const dim = sel !== null && !on;
                return (
                  <path
                    key={i}
                    d={linkPath(l) ?? ""}
                    fill="none"
                    stroke={t.color}
                    strokeWidth={Math.max(2, l.width ?? 2)}
                    strokeOpacity={dim ? 0.08 : on ? 0.8 : 0.52}
                    className="ribbon"
                    onClick={() => setSel(prev => prev?.id === l.id ? null : { id: l.id, label: `${s.label} → ${t.label}`, value: l.value, color: t.color, note: l.note })}
                    onMouseMove={e => {
                      const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                      setTip({ x: Math.min(r.width - 300, e.clientX - r.left + 14), y: Math.max(8, e.clientY - r.top - 16), title: `${s.label} → ${t.label} · ${fmt(l.value)} ${unit}`, sub: l.note });
                    }}
                  />
                );
              })}

              {graph.nodes.map(n => {
                const h = Math.max(2, (n.y1 ?? 0) - (n.y0 ?? 0));
                const onLeft = (n.depth ?? 0) === 0;
                const on = sel?.id === n.id;
                const dim = sel !== null && !on && !graph.links.some(l => l.id === sel.id && ((l.source as N).id === n.id || (l.target as N).id === n.id));
                return (
                  <g
                    key={n.id}
                    style={{ cursor: "pointer", opacity: dim ? 0.32 : 1 }}
                    onClick={() => setSel(prev => prev?.id === n.id ? null : { id: n.id, label: n.label, value: n.value ?? 0, color: n.color, note: n.note })}
                  >
                    <rect x={n.x0} y={n.y0} width={(n.x1 ?? 0) - (n.x0 ?? 0)} height={h} rx={3} fill={n.color} stroke={on ? "var(--fg-strong)" : "none"} strokeWidth={1.5} />
                    <text x={onLeft ? (n.x0 ?? 0) - 12 : (n.x1 ?? 0) + 12} y={(n.y0 ?? 0) + h / 2 - 2} textAnchor={onLeft ? "end" : "start"} fill="var(--fg-strong)" style={{ fontSize: 13, fontWeight: 500 }}>
                      {n.label}
                    </text>
                    <text x={onLeft ? (n.x0 ?? 0) - 12 : (n.x1 ?? 0) + 12} y={(n.y0 ?? 0) + h / 2 + 13} textAnchor={onLeft ? "end" : "start"} className="annot">
                      {n.sub} · {fmt(n.value ?? 0)} {unit}
                    </text>
                  </g>
                );
              })}
            </svg>

            {tip && <div className="flow-tip" style={{ left: tip.x, top: tip.y }}><b>{tip.title}</b><span>{tip.sub}</span></div>}
          </div>

          <div className="ref-sub">
            <div className="ref-sub-head">
              <span className="ref-sub-title">{current.label}</span>
              <span className="ref-sub-meta">{fmt(scrubbed)} {unit} · last {rangeMeta.label}</span>
              {sel && (
                <button className="orb-seg" style={{ padding: "2px 8px", fontSize: 11.5, color: "var(--fg-2)" }} onClick={() => setSel(null)}>
                  All {lens}
                </button>
              )}
              <span className="orb-spacer" />
              <div className="orb-seg">
                {RANGES.map(r => (
                  <button key={r.id} className={range === r.id ? "on" : ""} onClick={() => setRange(r.id)}>{r.label}</button>
                ))}
              </div>
            </div>

            <svg
              className="flow-canvas"
              viewBox="0 0 1200 176"
              role="img"
              aria-label={`${current.label} over the last ${rangeMeta.label}`}
              onMouseMove={e => {
                const r = e.currentTarget.getBoundingClientRect();
                const relX = ((e.clientX - r.left) / r.width) * 1200;
                setHoverIdx(Math.max(0, Math.min(curve.pts.length - 1, Math.round(((relX - 48) / 1112) * (curve.pts.length - 1)))));
              }}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {[0.5, 1].map(f => (
                <g key={f}>
                  <line x1="48" x2="1160" y1={curve.y(curve.hi * f)} y2={curve.y(curve.hi * f)} stroke="var(--stroke-soft)" />
                  <text x="40" y={curve.y(curve.hi * f) + 3} textAnchor="end" className="annot">{fmt(curve.hi * f)}</text>
                </g>
              ))}
              <line x1="48" x2="1160" y1="152" y2="152" stroke="var(--stroke-soft)" />

              <path d={curve.a} fill={current.color} fillOpacity={0.18} />
              <path d={curve.l} fill="none" stroke={current.color} strokeWidth={2} />

              {hoverIdx !== null && (
                <>
                  <line x1={curve.x(hoverIdx)} y1="14" x2={curve.x(hoverIdx)} y2="152" stroke="var(--fg-3)" strokeDasharray="3 3" />
                  <circle cx={curve.x(hoverIdx)} cy={curve.y(curve.pts[hoverIdx])} r={3.5} fill={current.color} />
                </>
              )}

              {rangeMeta.ticks.map((t, i) => (
                <text key={t} x={48 + (i / (rangeMeta.ticks.length - 1)) * 1112} y="170" textAnchor={i === 0 ? "start" : i === rangeMeta.ticks.length - 1 ? "end" : "middle"} className="annot">
                  {t}
                </text>
              ))}
            </svg>

            <div className="ref-foot">
              <span>{current.note}</span>
              <span>Peak {fmt(Math.max(...curve.pts))} {unit} · click above to switch series</span>
            </div>
          </div>
        </>
      ) : (
        <SubagentGantt schedule={SCHEDULES[schedIdx]} />
      )}
    </OrbShell>
  );
}

const BAR_COLOR: Record<GanttBar["state"], string> = {
  done: "#1d9a78",
  active: "#2f83bf",
  pending: "#485460",
  capped: "#e28436",
};

function SubagentGantt({ schedule }: { schedule: (typeof SCHEDULES)[number] }) {
  const [tip, setTip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);

  const x0 = 230, x1 = 1170, w = x1 - x0;
  const xAt = (m: number) => x0 + (m / schedule.spanMinutes) * w;

  // Lay out rows with subtle section headers when the track changes.
  const rows: { bar: GanttBar; y: number; header?: string }[] = [];
  let y = 42;
  let prev = "";
  for (const b of schedule.bars) {
    if (b.section !== prev) {
      y += prev ? 14 : 0;
      rows.push({ bar: b, y, header: b.section });
      prev = b.section;
    } else {
      rows.push({ bar: b, y });
    }
    y += 30;
  }
  const height = y + 28;
  const byId = new Map(rows.map(r => [r.bar.id, r]));

  const ticks = 6;
  const fmtTick = (m: number) => {
    if (schedule.spanMinutes <= 600) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(Math.round(m % 60)).padStart(2, "0");
      return `+${hh}:${mm}`;
    }
    return `+${Math.round(m / 60)}h`;
  };

  return (
    <div className="ref-wrap flow-stage" onMouseLeave={() => setTip(null)}>
      <svg className="flow-canvas" viewBox={`0 0 1200 ${height}`} role="img" aria-label={schedule.title}>
        <text x="12" y="20" className="title-label">{schedule.title.toUpperCase()}</text>

        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const m = (i / ticks) * schedule.spanMinutes;
          const x = xAt(m);
          return (
            <g key={i}>
              <line x1={x} y1="30" x2={x} y2={height - 22} stroke="var(--stroke-soft)" />
              <text x={x} y={height - 6} textAnchor="middle" className="annot">{fmtTick(m)}</text>
            </g>
          );
        })}

        {/* Dependency connectors (`after ...`) */}
        {rows.flatMap(({ bar, y: ty }) =>
          (bar.after ?? []).map(depId => {
            const dep = byId.get(depId);
            if (!dep) return null;
            const sx = xAt(dep.bar.start + dep.bar.dur);
            const sy = dep.y + 10;
            const tx = xAt(bar.start);
            const mid = (sx + tx) / 2;
            return (
              <path
                key={`${depId}-${bar.id}`}
                d={`M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ty + 10}, ${tx} ${ty + 10}`}
                fill="none"
                stroke="var(--stroke)"
                strokeWidth={1.2}
              />
            );
          }),
        )}

        {rows.map(({ bar, y: ry, header }) => {
          const bx = xAt(bar.start);
          const bw = Math.max(6, xAt(bar.start + bar.dur) - bx);
          return (
            <g key={bar.id}>
              {header && (
                <text x="12" y={ry + 14} fill="var(--fg-2)" style={{ fontSize: 11.5, fontWeight: 500 }}>
                  {header}
                </text>
              )}
              <rect
                x={bx}
                y={ry}
                width={bw}
                height={20}
                rx={4}
                fill={BAR_COLOR[bar.state]}
                fillOpacity={bar.state === "pending" ? 0.45 : 0.88}
                className="ribbon"
                onMouseMove={e => {
                  const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  setTip({
                    x: Math.min(r.width - 310, e.clientX - r.left + 14),
                    y: Math.max(8, e.clientY - r.top - 16),
                    title: `${bar.label} (${fmtTick(bar.start)} → ${fmtTick(bar.start + bar.dur)})`,
                    sub: `${bar.model} · ${bar.state}`,
                  });
                }}
              />
              <text
                x={bw > 170 ? bx + 8 : bx + bw + 7}
                y={ry + 14}
                fill={bw > 170 ? "#fff" : "var(--fg-2)"}
                style={{ fontSize: 11.5, pointerEvents: "none" }}
              >
                {bar.label}
              </text>
            </g>
          );
        })}

        {schedule.nowMinute < schedule.spanMinutes && (
          <g>
            <line x1={xAt(schedule.nowMinute)} y1="26" x2={xAt(schedule.nowMinute)} y2={height - 22} stroke="var(--warning)" strokeDasharray="4 3" />
            <text x={xAt(schedule.nowMinute) + 5} y="22" fill="var(--warning)" style={{ fontSize: 10 }}>now ({fmtTick(schedule.nowMinute)})</text>
          </g>
        )}
      </svg>

      {tip && <div className="flow-tip" style={{ left: tip.x, top: tip.y }}><b>{tip.title}</b><span>{tip.sub}</span></div>}

      <div className="ref-foot">
        <div className="gantt-legend">
          <span><i style={{ background: BAR_COLOR.done }} />Done</span>
          <span><i style={{ background: BAR_COLOR.active }} />Running</span>
          <span><i style={{ background: BAR_COLOR.capped }} />429 / filter stall</span>
          <span><i style={{ background: BAR_COLOR.pending }} />Queued on `after`</span>
        </div>
        <span>Hover a bar for its served model, VM tier and exact window</span>
      </div>
    </div>
  );
}
