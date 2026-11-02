"use client";

import { useMemo, useState } from "react";
import "./flow.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { sankey, sankeyJustify, sankeyLinkHorizontal, type SankeyLink, type SankeyNode } from "d3-sankey";

type Lens = "inference" | "compute";

interface NodeDatum { id: string; label: string; sub: string; color: string; note: string }
interface LinkDatum { note: string }

/** Inference throughput in tokens per minute, per mission, right now. */
const INFERENCE_NODES: NodeDatum[] = [
  { id: "agy-claude", label: "AGY · Claude", sub: "74% left", color: "#2f83bf", note: "google-sonnet & google-opus. Regenerating at +20%/h, unaffected by the direct Anthropic cap." },
  { id: "agy-gemini", label: "AGY · Gemini", sub: "61% left", color: "#1d9a78", note: "argon & carbon. 13 silent safety-filter blocks overnight, no 429 raised." },
  { id: "surplus", label: "Kimi · Z.AI · Grok", sub: "96% left", color: "#4da8c7", note: "Weekly surplus windows. Almost untouched — tokens evaporate at reset." },
  { id: "evm-provers", label: "evm.fast · provers", sub: "46 shards", color: "#2f83bf", note: "Leaf & cut-lemma workers closing the 144 Fast-DAG obligations." },
  { id: "evm-quorum", label: "evm.fast · quorums", sub: "3 models", color: "#6ebbf0", note: "Spec & counterexample consults on MemoryViews and pendingStageTransfer." },
  { id: "evm-coord", label: "evm.fast · coordinator", sub: "159M cache", color: "#e28436", note: "The root agent re-reading its own traces. $125.29 across 26 turns." },
  { id: "other", label: "other missions", sub: "4 active", color: "#586978", note: "boost.ci, EthLib and assistant traffic." },
];

const INFERENCE_LINKS: Array<{ source: string; target: string; value: number } & LinkDatum> = [
  { source: "agy-claude", target: "evm-provers", value: 6.4, note: "Sonnet provers on GuardedBody and ContractParts shards." },
  { source: "agy-claude", target: "evm-quorum", value: 1.7, note: "Opus seats in the spec quorum." },
  { source: "agy-gemini", target: "evm-provers", value: 4.1, note: "Argon & carbon shard racers." },
  { source: "agy-gemini", target: "evm-quorum", value: 1.3, note: "Argon-high counterexample reviews." },
  { source: "agy-claude", target: "evm-coord", value: 0.9, note: "Coordinator context served by Antigravity Claude." },
  { source: "surplus", target: "other", value: 0.7, note: "builtin/smart spillover on non-proof work." },
];

/** Compute in vCPU, per mission, right now. */
const COMPUTE_NODES: NodeDatum[] = [
  { id: "boat-large", label: "Boat · large", sub: "46 × 8 vCPU", color: "#3d7399", note: "$0.072/h each. The bulk of the proving fleet." },
  { id: "boat-xlarge", label: "Boat · xlarge", sub: "3 × 16 vCPU", color: "#2f83bf", note: "Warm snapshot builder, live integrator, C00 surgeon. $0.20/h each." },
  { id: "fleet", label: "Static fleet + Spark", sub: "4 hosts", color: "#586978", note: "ashur, babylon, nippur, uruk plus dgx-spark. $0 marginal." },
  { id: "evm-proving", label: "evm.fast · proving", sub: "active checks", color: "#1d9a78", note: "Warm turbo-lean checks actually closing sorries." },
  { id: "evm-building", label: "evm.fast · warm build", sub: "snapshot", color: "#4da8c7", note: "xlarge-a packing wave8-fast-dag-warm." },
  { id: "evm-idle", label: "evm.fast · idle / stalled", sub: "reap risk", color: "#e28436", note: "Coordinator-owned VMs with no job attached, plus shards waiting on a 429." },
  { id: "other-compute", label: "other missions", sub: "2 hosts", color: "#586978", note: "Everything else on the static fleet." },
];

const COMPUTE_LINKS: Array<{ source: string; target: string; value: number } & LinkDatum> = [
  { source: "boat-large", target: "evm-proving", value: 304, note: "38 large VMs running live Lean checks." },
  { source: "boat-large", target: "evm-idle", value: 64, note: "8 large VMs with no attached job — idle-reap countdown running." },
  { source: "boat-xlarge", target: "evm-building", value: 16, note: "xlarge-a, the warm snapshot builder." },
  { source: "boat-xlarge", target: "evm-proving", value: 32, note: "xlarge integrator and the C00 surgeon." },
  { source: "fleet", target: "evm-proving", value: 16, note: "Coordinator host ashur plus one Lean worker." },
  { source: "fleet", target: "other-compute", value: 24, note: "Remaining static capacity." },
];

type N = SankeyNode<NodeDatum, LinkDatum>;
type L = SankeyLink<NodeDatum, LinkDatum>;

function useSankey(nodes: NodeDatum[], links: Array<{ source: string; target: string; value: number } & LinkDatum>, height: number) {
  return useMemo(() => {
    const layout = sankey<NodeDatum, LinkDatum>()
      .nodeId(d => d.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(16)
      .nodePadding(26)
      .nodeSort(null)
      .linkSort(null)
      .extent([[150, 16], [1050, height - 16]]);
    return layout({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });
  }, [nodes, links, height]);
}

export function FlowView() {
  const [lens, setLens] = useState<Lens>("inference");
  const [focus, setFocus] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);

  const inference = useSankey(INFERENCE_NODES, INFERENCE_LINKS, 560);
  const compute = useSankey(COMPUTE_NODES, COMPUTE_LINKS, 560);
  const graph = lens === "inference" ? inference : compute;
  const linkPath = useMemo(() => sankeyLinkHorizontal<NodeDatum, LinkDatum>(), []);

  const unit = lens === "inference" ? "k tok/min" : "vCPU";
  const total = (lens === "inference" ? INFERENCE_LINKS : COMPUTE_LINKS).reduce((s, l) => s + l.value, 0);

  return (
    <OrbShell active="flow" title="One diagram at a time">
      <div className="orb-bar">
        <div className="orb-seg">
          <button className={lens === "inference" ? "on" : ""} onClick={() => { setLens("inference"); setFocus(null); }}>Inference · tokens/min</button>
          <button className={lens === "compute" ? "on" : ""} onClick={() => { setLens("compute"); setFocus(null); }}>Compute · vCPU</button>
        </div>
        {focus && (
          <button className="orb-seg" style={{ padding: "3px 9px", cursor: "pointer", color: "var(--fg-2)" }} onClick={() => setFocus(null)}>Clear focus</button>
        )}
        <span className="orb-spacer" />
        <span className="orb-stamp">{total.toLocaleString()} {unit} flowing right now · per mission</span>
      </div>

      <div className="ref-wrap flow-stage" onMouseLeave={() => setTip(null)}>
        <svg className="flow-canvas" viewBox="0 0 1200 560" role="img" aria-label={`${lens} flow per mission`}>
          <text x="150" y="0" className="title-label" dy="0" />
          {graph.links.map((l, i) => {
            const s = l.source as N;
            const t = l.target as N;
            const dim = focus !== null && focus !== s.id && focus !== t.id;
            return (
              <path
                key={i}
                d={linkPath(l) ?? ""}
                fill="none"
                stroke={t.color}
                strokeWidth={Math.max(2, l.width ?? 2)}
                strokeOpacity={dim ? 0.07 : 0.55}
                className="ribbon"
                onClick={() => setFocus(f => (f === t.id ? null : t.id))}
                onMouseMove={e => {
                  const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  setTip({
                    x: Math.min(r.width - 320, e.clientX - r.left + 14),
                    y: Math.max(12, e.clientY - r.top - 18),
                    title: `${s.label} → ${t.label} · ${l.value} ${unit}`,
                    sub: l.note,
                  });
                }}
              />
            );
          })}

          {graph.nodes.map(n => {
            const h = Math.max(1, (n.y1 ?? 0) - (n.y0 ?? 0));
            const dim = focus !== null && focus !== n.id;
            const onLeft = (n.depth ?? 0) === 0;
            return (
              <g key={n.id} style={{ cursor: "pointer", opacity: dim ? 0.35 : 1 }} onClick={() => setFocus(f => (f === n.id ? null : n.id))}>
                <rect x={n.x0} y={n.y0} width={(n.x1 ?? 0) - (n.x0 ?? 0)} height={h} rx={3} fill={n.color} />
                <text x={onLeft ? (n.x0 ?? 0) - 12 : (n.x1 ?? 0) + 12} y={(n.y0 ?? 0) + h / 2 - 2} textAnchor={onLeft ? "end" : "start"} fill="var(--fg-strong)" style={{ fontSize: 13, fontWeight: 500 }}>
                  {n.label}
                </text>
                <text x={onLeft ? (n.x0 ?? 0) - 12 : (n.x1 ?? 0) + 12} y={(n.y0 ?? 0) + h / 2 + 13} textAnchor={onLeft ? "end" : "start"} className="annot">
                  {n.sub}
                </text>
                <title>{n.note}</title>
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
          <span>{lens === "inference"
            ? "One resource only: inference throughput. Pools on the left, missions on the right."
            : "One resource only: compute. Machine tiers on the left, what each mission is doing with them on the right."}</span>
          <span>Width is exactly proportional · click a mission to isolate it</span>
        </div>
      </div>
    </OrbShell>
  );
}
