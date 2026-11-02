"use client";

import { useMemo, useState } from "react";
import "./ledger.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { sankey, sankeyJustify, sankeyLinkHorizontal, type SankeyLink, type SankeyNode } from "d3-sankey";
import { curveMonotoneX, line } from "d3-shape";

interface NodeDatum { id: string; label: string; color: string }
interface LinkDatum { note: string }
type N = SankeyNode<NodeDatum, LinkDatum>;
type L = SankeyLink<NodeDatum, LinkDatum>;

const NODES: NodeDatum[] = [
  { id: "agy-claude", label: "AGY · Claude", color: "#2f83bf" },
  { id: "agy-gemini", label: "AGY · Gemini", color: "#1d9a78" },
  { id: "boat", label: "Boat.dev", color: "#3d7399" },
  { id: "provers", label: "evm.fast · provers", color: "#2f83bf" },
  { id: "coord", label: "evm.fast · coordinator", color: "#e28436" },
  { id: "other", label: "other missions", color: "#586978" },
];

/** Inference half, in k tok/min. */
const INFERENCE: Array<{ source: string; target: string; value: number } & LinkDatum> = [
  { source: "agy-claude", target: "provers", value: 6.4, note: "Sonnet provers." },
  { source: "agy-claude", target: "coord", value: 2.6, note: "Coordinator context on Antigravity Claude." },
  { source: "agy-gemini", target: "provers", value: 4.1, note: "Argon & carbon shard racers." },
  { source: "agy-gemini", target: "other", value: 1.1, note: "Gemini spillover to other missions." },
];

/** Compute half, in vCPU. */
const COMPUTE: Array<{ source: string; target: string; value: number } & LinkDatum> = [
  { source: "boat", target: "provers", value: 336, note: "42 VMs running live Lean checks." },
  { source: "boat", target: "coord", value: 48, note: "Warm builder plus idle coordinator-owned VMs." },
  { source: "boat", target: "other", value: 8, note: "One large VM on another mission." },
];

/** Stock remaining, % of window, last 12 hours. */
const STOCK = [
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

const CURVES = [
  { key: "claude", label: "AGY · Claude", color: "#2f83bf" },
  { key: "gemini", label: "AGY · Gemini", color: "#1d9a78" },
  { key: "boat", label: "Boat daily budget", color: "#e28436" },
] as const;

function Half({ title, unit, nodes, links, height }: {
  title: string; unit: string; height: number;
  nodes: NodeDatum[];
  links: Array<{ source: string; target: string; value: number } & LinkDatum>;
}) {
  const graph = useMemo(() => {
    const layout = sankey<NodeDatum, LinkDatum>()
      .nodeId(d => d.id).nodeAlign(sankeyJustify).nodeWidth(14).nodePadding(18).nodeSort(null).linkSort(null)
      .extent([[130, 28], [1070, height - 8]]);
    return layout({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });
  }, [nodes, links, height]);
  const linkPath = useMemo(() => sankeyLinkHorizontal<NodeDatum, LinkDatum>(), []);
  const [tip, setTip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);

  return (
    <div className="flow-stage" onMouseLeave={() => setTip(null)}>
      <svg className="flow-canvas" viewBox={`0 0 1200 ${height}`} role="img" aria-label={title}>
        <text x="130" y="16" className="title-label">{title}</text>
        {graph.links.map((l, i) => {
          const s = l.source as N; const t = l.target as N;
          return (
            <path key={i} d={linkPath(l) ?? ""} fill="none" stroke={t.color} strokeWidth={Math.max(2, l.width ?? 2)} strokeOpacity={0.55} className="ribbon"
              onMouseMove={e => {
                const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                setTip({ x: Math.min(r.width - 300, e.clientX - r.left + 12), y: e.clientY - r.top + 12, title: `${s.label} → ${t.label} · ${l.value} ${unit}`, sub: l.note });
              }} />
          );
        })}
        {graph.nodes.map(n => {
          const h = Math.max(1, (n.y1 ?? 0) - (n.y0 ?? 0));
          const onLeft = (n.depth ?? 0) === 0;
          return (
            <g key={n.id}>
              <rect x={n.x0} y={n.y0} width={(n.x1 ?? 0) - (n.x0 ?? 0)} height={h} rx={3} fill={n.color} />
              <text x={onLeft ? (n.x0 ?? 0) - 10 : (n.x1 ?? 0) + 10} y={(n.y0 ?? 0) + h / 2 + 4} textAnchor={onLeft ? "end" : "start"} fill="var(--fg-strong)" style={{ fontSize: 12.5 }}>{n.label}</text>
            </g>
          );
        })}
      </svg>
      {tip && <div className="flow-tip" style={{ left: tip.x, top: tip.y }}><b>{tip.title}</b><span>{tip.sub}</span></div>}
    </div>
  );
}

export function LedgerView() {
  const stock = useMemo(() => {
    const x = (i: number) => 56 + (i / (STOCK.length - 1)) * 1090;
    const y = (v: number) => 36 + (1 - v / 100) * 150;
    const gen = line<typeof STOCK[number]>().x((_, i) => x(i)).curve(curveMonotoneX);
    return { x, y, curves: CURVES.map(c => ({ ...c, d: gen.y(d => y(d[c.key]))(STOCK) ?? "" })) };
  }, []);

  return (
    <OrbShell active="ledger" title="Both flows, plus the stock curve">
      <div className="con-wrap" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Half title="INFERENCE · K TOK/MIN PER MISSION" unit="k tok/min" nodes={NODES.filter(n => n.id !== "boat")} links={INFERENCE} height={250} />
        <Half title="COMPUTE · VCPU PER MISSION" unit="vCPU" nodes={NODES.filter(n => n.id !== "agy-claude" && n.id !== "agy-gemini")} links={COMPUTE} height={230} />

        <svg className="flow-canvas" viewBox="0 0 1200 220" role="img" aria-label="Stock remaining over 12 hours">
          <text x="56" y="16" className="title-label">STOCK REMAINING · % OF WINDOW, LAST 12H</text>
          {[0, 50, 100].map(v => (
            <g key={v}>
              <line x1="56" x2="1146" y1={stock.y(v)} y2={stock.y(v)} stroke="var(--stroke-soft)" />
              <text x="48" y={stock.y(v) + 3} textAnchor="end" className="annot">{v}%</text>
            </g>
          ))}
          {stock.curves.map(c => <path key={c.key} d={c.d} fill="none" stroke={c.color} strokeWidth={1.8} />)}
          {STOCK.map((d, i) => i % 2 === 0 && <text key={d.t} x={stock.x(i)} y="206" textAnchor="middle" className="annot">{d.t}</text>)}
        </svg>

        <div className="con-foot">
          <div className="con-legend">
            {CURVES.map(c => <span key={c.key}><i style={{ background: c.color }} />{c.label}</span>)}
          </div>
          <span>Boat refills at 00:00 UTC · Gemini dipped to 33% during the overnight filter stall</span>
        </div>
      </div>
    </OrbShell>
  );
}
