"use client";

import { useMemo, useState } from "react";
import "./reservoirs.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { area, curveMonotoneX, line, stack, stackOffsetNone } from "d3-shape";

type Lens = "inference" | "compute";

interface Hour { t: string; proving: number; quorum: number; coordinator: number; other: number }

/** Inference throughput, k tokens/min, per mission role. Nov 1 06:00 → Nov 2 05:00. */
const INFERENCE: Hour[] = [
  { t: "06:00", proving: 4.2, quorum: 1.1, coordinator: 0.6, other: 0.4 },
  { t: "07:00", proving: 6.8, quorum: 1.4, coordinator: 0.8, other: 0.4 },
  { t: "08:00", proving: 11.4, quorum: 2.1, coordinator: 1.4, other: 0.5 },
  { t: "09:00", proving: 10.9, quorum: 1.9, coordinator: 1.8, other: 0.5 },
  { t: "10:00", proving: 7.6, quorum: 1.2, coordinator: 4.4, other: 0.4 },
  { t: "11:00", proving: 6.1, quorum: 0.9, coordinator: 2.0, other: 0.4 },
  { t: "12:00", proving: 6.4, quorum: 1.0, coordinator: 1.6, other: 0.4 },
  { t: "13:00", proving: 6.2, quorum: 1.1, coordinator: 1.4, other: 0.4 },
  { t: "14:00", proving: 5.9, quorum: 1.0, coordinator: 1.2, other: 0.4 },
  { t: "15:00", proving: 6.0, quorum: 1.1, coordinator: 1.5, other: 0.4 },
  { t: "16:00", proving: 6.3, quorum: 1.2, coordinator: 1.7, other: 0.4 },
  { t: "17:00", proving: 6.1, quorum: 1.1, coordinator: 1.9, other: 0.4 },
  { t: "18:00", proving: 5.8, quorum: 1.0, coordinator: 2.1, other: 0.4 },
  { t: "19:00", proving: 5.4, quorum: 0.9, coordinator: 2.4, other: 0.4 },
  { t: "20:00", proving: 4.9, quorum: 0.8, coordinator: 3.3, other: 0.3 },
  { t: "21:00", proving: 4.4, quorum: 0.7, coordinator: 4.7, other: 0.3 },
  { t: "22:00", proving: 3.6, quorum: 0.5, coordinator: 10.8, other: 0.3 },
  { t: "23:00", proving: 2.8, quorum: 0.4, coordinator: 1.8, other: 0.3 },
  { t: "00:00", proving: 1.1, quorum: 0.2, coordinator: 0.7, other: 0.3 },
  { t: "01:00", proving: 0.8, quorum: 0.1, coordinator: 0.5, other: 0.3 },
  { t: "02:00", proving: 2.2, quorum: 0.4, coordinator: 1.1, other: 0.3 },
  { t: "03:00", proving: 4.6, quorum: 0.9, coordinator: 1.6, other: 0.4 },
  { t: "04:00", proving: 6.9, quorum: 1.4, coordinator: 2.1, other: 0.4 },
  { t: "05:00", proving: 8.1, quorum: 1.6, coordinator: 2.4, other: 0.5 },
];

/** Compute, vCPU, per mission role. */
const COMPUTE: Hour[] = [
  { t: "06:00", proving: 96, quorum: 0, coordinator: 16, other: 24 },
  { t: "07:00", proving: 168, quorum: 0, coordinator: 16, other: 24 },
  { t: "08:00", proving: 368, quorum: 0, coordinator: 32, other: 24 },
  { t: "09:00", proving: 344, quorum: 0, coordinator: 32, other: 24 },
  { t: "10:00", proving: 256, quorum: 0, coordinator: 48, other: 24 },
  { t: "11:00", proving: 224, quorum: 0, coordinator: 48, other: 24 },
  { t: "12:00", proving: 232, quorum: 0, coordinator: 32, other: 24 },
  { t: "13:00", proving: 216, quorum: 0, coordinator: 32, other: 24 },
  { t: "14:00", proving: 208, quorum: 0, coordinator: 32, other: 24 },
  { t: "15:00", proving: 200, quorum: 0, coordinator: 32, other: 24 },
  { t: "16:00", proving: 208, quorum: 0, coordinator: 32, other: 24 },
  { t: "17:00", proving: 200, quorum: 0, coordinator: 32, other: 24 },
  { t: "18:00", proving: 184, quorum: 0, coordinator: 32, other: 24 },
  { t: "19:00", proving: 168, quorum: 0, coordinator: 48, other: 24 },
  { t: "20:00", proving: 152, quorum: 0, coordinator: 64, other: 24 },
  { t: "21:00", proving: 136, quorum: 0, coordinator: 64, other: 24 },
  { t: "22:00", proving: 112, quorum: 0, coordinator: 80, other: 24 },
  { t: "23:00", proving: 96, quorum: 0, coordinator: 48, other: 24 },
  { t: "00:00", proving: 64, quorum: 0, coordinator: 32, other: 24 },
  { t: "01:00", proving: 48, quorum: 0, coordinator: 16, other: 24 },
  { t: "02:00", proving: 96, quorum: 0, coordinator: 32, other: 24 },
  { t: "03:00", proving: 160, quorum: 0, coordinator: 32, other: 24 },
  { t: "04:00", proving: 224, quorum: 0, coordinator: 48, other: 24 },
  { t: "05:00", proving: 304, quorum: 0, coordinator: 48, other: 24 },
];

const LAYERS = [
  { key: "proving", label: "Proving", color: "#2f83bf" },
  { key: "quorum", label: "Quorums", color: "#6ebbf0" },
  { key: "coordinator", label: "Coordinator", color: "#e28436" },
  { key: "other", label: "Other missions", color: "#586978" },
] as const;

type Key = (typeof LAYERS)[number]["key"];

export function ReservoirsView() {
  const [lens, setLens] = useState<Lens>("inference");
  const [hover, setHover] = useState<number | null>(null);

  const data = lens === "inference" ? INFERENCE : COMPUTE;
  const unit = lens === "inference" ? "k tok/min" : "vCPU";

  const chart = useMemo(() => {
    const gen = stack<Hour, Key>().keys(LAYERS.map(l => l.key)).offset(stackOffsetNone);
    const series = gen(data);
    const hi = Math.max(...series.flatMap(s => s.map(p => p[1])));
    const x = (i: number) => 56 + (i / (data.length - 1)) * 1090;
    const y = (v: number) => 40 + (1 - v / hi) * 470;
    const areaGen = area<[number, number]>().x((_, i) => x(i)).y0(d => y(d[0])).y1(d => y(d[1])).curve(curveMonotoneX);
    const totalLine = line<Hour>().x((_, i) => x(i)).y(d => y(d.proving + d.quorum + d.coordinator + d.other)).curve(curveMonotoneX);
    return { series: series.map((s, i) => ({ meta: LAYERS[i], path: areaGen(s as unknown as [number, number][]) ?? "" })), total: totalLine(data) ?? "", x, y, hi };
  }, [data]);

  const idx = hover ?? data.length - 1;
  const row = data[idx];
  const total = row.proving + row.quorum + row.coordinator + row.other;

  return (
    <OrbShell active="reservoirs" title="Rate over time, per mission">
      <div className="orb-bar">
        <div className="orb-seg">
          <button className={lens === "inference" ? "on" : ""} onClick={() => { setLens("inference"); setHover(null); }}>Inference · k tok/min</button>
          <button className={lens === "compute" ? "on" : ""} onClick={() => { setLens("compute"); setHover(null); }}>Compute · vCPU</button>
        </div>
        <span className="orb-spacer" />
        <span className="orb-stamp">{row.t} UTC · {lens === "inference" ? total.toFixed(1) : Math.round(total)} {unit}</span>
      </div>

      <div className="wat-wrap flow-stage">
        <svg className="flow-canvas" viewBox="0 0 1200 560" role="img" aria-label={`${lens} rate over 24 hours`}
          onMouseMove={e => {
            const r = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - r.left) / r.width) * 1200;
            setHover(Math.max(0, Math.min(data.length - 1, Math.round(((relX - 56) / 1090) * (data.length - 1)))));
          }}
          onMouseLeave={() => setHover(null)}
        >
          {[0.25, 0.5, 0.75, 1].map(f => (
            <g key={f}>
              <line x1="56" x2="1146" y1={chart.y(chart.hi * f)} y2={chart.y(chart.hi * f)} stroke="var(--stroke-soft)" />
              <text x="48" y={chart.y(chart.hi * f) + 3} textAnchor="end" className="annot">{Math.round(chart.hi * f)}</text>
            </g>
          ))}

          {chart.series.map(s => <path key={s.meta.key} d={s.path} fill={s.meta.color} fillOpacity={0.85} />)}
          <path d={chart.total} fill="none" stroke="var(--fg-strong)" strokeWidth={1.4} strokeOpacity={0.7} />

          <line x1={chart.x(idx)} y1="40" x2={chart.x(idx)} y2="510" stroke="var(--fg-3)" strokeDasharray="3 3" />

          {data.map((d, i) => i % 3 === 0 && (
            <text key={d.t} x={chart.x(i)} y="532" textAnchor="middle" className="annot">{d.t}</text>
          ))}
        </svg>

        <div className="wat-foot">
          <div className="wat-legend">
            {LAYERS.filter(l => lens === "inference" || l.key !== "quorum").map(l => (
              <span key={l.key}><i style={{ background: l.color }} />{l.label} · {lens === "inference" ? row[l.key].toFixed(1) : Math.round(row[l.key])} {unit}</span>
            ))}
          </div>
          <span>Hover to scrub the 24h · line is the total rate</span>
        </div>
      </div>
    </OrbShell>
  );
}
