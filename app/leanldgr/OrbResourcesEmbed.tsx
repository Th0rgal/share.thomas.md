'use client'

import { useMemo, useState } from 'react'
import {
  sankey,
  sankeyJustify,
  sankeyLinkHorizontal,
  type SankeyLink,
  type SankeyNode
} from 'd3-sankey'
import { area, curveMonotoneX, line } from 'd3-shape'
import {
  BUCKET_MINUTES,
  COMPUTE_LINKS,
  COMPUTE_NODES,
  COMPUTE_SERIES,
  DAG_AGENTS,
  DAG_VMS,
  INFERENCE_LINKS,
  INFERENCE_NODES,
  INFERENCE_SERIES,
  MISSION_SPAN_MINUTES,
  type OrbLinkDatum,
  type OrbNodeDatum
} from './resourcesData'

type Lens = 'inference' | 'compute'
type Submode = 'flow' | 'dag'

type SNode = SankeyNode<OrbNodeDatum, OrbLinkDatum>
type SLink = SankeyLink<OrbNodeDatum, OrbLinkDatum>

interface IsolatedTarget {
  id: string
  label: string
  value: number
  costLabel: string
  color: string
  note: string
}

const WAVE_LABELS: Record<string, string> = {
  w1: 'Wave 1 · Specs & turbo-lean',
  w15: 'Wave 1.5 · Audit & remédiation',
  w2: 'Wave 2 · Noyaux Lean & preuves',
  w3: 'Wave 3 · Link C/Rust & tests',
  w4: 'Wave 4 · Boucle maxwell'
}

function formatClockAtBucket(idx: number): string {
  // Bucket 0 starts at 15:15 UTC on Nov 10
  const totalMin = 15 * 60 + 15 + idx * BUCKET_MINUTES
  const hh = Math.floor(totalMin / 60) % 24
  const mm = totalMin % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} UTC`
}

function fmtFr(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',')
}

export default function OrbResourcesEmbed() {
  const [lens, setLens] = useState<Lens>('inference')
  const [submode, setSubmode] = useState<Submode>('flow')
  const [isolated, setIsolated] = useState<IsolatedTarget | null>(null)
  const [hoverText, setHoverText] = useState<string | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const nodes = lens === 'inference' ? INFERENCE_NODES : COMPUTE_NODES
  const links = lens === 'inference' ? INFERENCE_LINKS : COMPUTE_LINKS
  const seriesMap = lens === 'inference' ? INFERENCE_SERIES : COMPUTE_SERIES

  const totalVal = useMemo(
    () => links.reduce((acc, l) => acc + l.value, 0),
    [links]
  )

  const graph = useMemo(() => {
    const layout = sankey<OrbNodeDatum, OrbLinkDatum>()
      .nodeId((d) => d.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(14)
      .nodePadding(18)
      .nodeSort(null)
      .linkSort(null)
      .extent([
        [218, 14],
        [726, 316]
      ])

    return layout({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l }))
    })
  }, [nodes, links])

  const linkPath = useMemo(
    () => sankeyLinkHorizontal<OrbNodeDatum, OrbLinkDatum>(),
    []
  )

  const activeSeriesKey = isolated ? isolated.id : 'all'
  const activeColor = isolated
    ? isolated.color
    : lens === 'inference'
      ? 'var(--purple)'
      : 'var(--blue)'

  const curve = useMemo(() => {
    const pts = seriesMap[activeSeriesKey] ?? seriesMap.all
    const peak = Math.max(...pts, 0.1)
    const hi = peak * 1.14
    const W = 960
    const padL = 42
    const padR = 14
    const plotW = W - padL - padR
    const topY = 10
    const baseY = 92
    const x = (i: number) => padL + (i / (pts.length - 1)) * plotW
    const y = (v: number) => topY + (1 - v / hi) * (baseY - topY)
    const linePath =
      line<number>()
        .x((_, i) => x(i))
        .y((d) => y(d))
        .curve(curveMonotoneX)(pts) ?? ''
    const areaPath =
      area<number>()
        .x((_, i) => x(i))
        .y0(baseY)
        .y1((d) => y(d))
        .curve(curveMonotoneX)(pts) ?? ''
    return { pts, peak, hi, W, padL, padR, plotW, baseY, x, y, linePath, areaPath }
  }, [seriesMap, activeSeriesKey])

  const unitTotal = lens === 'inference' ? 'M tok' : 'CPU-h'
  const unitRate = lens === 'inference' ? 'M tok/h' : 'vCPU'

  const switchLens = (next: Lens) => {
    setLens(next)
    setIsolated(null)
    setHoverText(null)
  }

  return (
    <div className="ldgr-orb-breakout not-prose">
      <div className="ldgr-orb">
        {/* Orb Topbar */}
        <div className="ldgr-orb-topbar">
          <div className="ldgr-orb-topbar-left">
            <div className="ldgr-orb-crumb">
              <span className="ldgr-orb-dot" />
              <span className="ldgr-orb-crumb-title">lean-ledger-bitcoin</span>
            </div>

            <div className="ldgr-orb-seg" role="group" aria-label="View mode">
              <button
                type="button"
                className={`ldgr-orb-seg-btn ${submode === 'flow' ? 'is-active' : ''}`}
                onClick={() => setSubmode('flow')}
              >
                Flow
              </button>
              <button
                type="button"
                className={`ldgr-orb-seg-btn ${submode === 'dag' ? 'is-active' : ''}`}
                onClick={() => setSubmode('dag')}
              >
                {lens === 'inference' ? 'DAG · Subagents (30)' : 'DAG · VMs cloud (25)'}
              </button>
            </div>

            <div className="ldgr-orb-seg" role="group" aria-label="Resource lens">
              <button
                type="button"
                className={`ldgr-orb-seg-btn ${lens === 'inference' ? 'is-active' : ''}`}
                onClick={() => switchLens('inference')}
              >
                Inference
              </button>
              <button
                type="button"
                className={`ldgr-orb-seg-btn ${lens === 'compute' ? 'is-active' : ''}`}
                onClick={() => switchLens('compute')}
              >
                Compute
              </button>
            </div>
          </div>

          <div className="ldgr-orb-topbar-right">
            <span className="ldgr-orb-stamp">
              {lens === 'inference' ? (
                <>
                  <strong>{fmtFr(totalVal, 1)}M tok</strong>
                  <span>·</span>
                  <strong>~$520 API</strong>
                  <span>·</span>
                  <span>pic {fmtFr(curve.peak, 1)} M tok/h</span>
                </>
              ) : (
                <>
                  <strong>{fmtFr(totalVal, 1)} CPU-h</strong>
                  <span>·</span>
                  <strong>~$17 AWS</strong>
                  <span>(hors serveur dédié)</span>
                  <span>·</span>
                  <span>pic {fmtFr(curve.peak, 0)} vCPU</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Main Card: Sankey Flow or Execution DAG */}
        <div className="ldgr-orb-card">
          <div className="ldgr-orb-card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ldgr-orb-col-title">
                {submode === 'flow'
                  ? lens === 'inference'
                    ? 'Inference Flow · Model Pools → Execution Waves'
                    : 'Compute Flow · Cloud VMs & Host → Execution Waves'
                  : lens === 'inference'
                    ? 'Subagent Execution DAG · 1 coordinateur + 29 workers actifs'
                    : 'Cloud MicroVM Leases · 25 machines éphémères (eq. AWS c7a)'}
              </span>
              {isolated && submode === 'flow' && (
                <button
                  type="button"
                  className="ldgr-orb-filter-chip"
                  onClick={() => setIsolated(null)}
                >
                  <span>{isolated.label}</span>
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </div>

            <div>
              {hoverText ? (
                <span className="ldgr-orb-hover-pill">{hoverText}</span>
              ) : (
                <span>
                  {submode === 'flow'
                    ? 'Cliquer sur un pool, un ruban ou une wave pour isoler sa courbe'
                    : 'Survoler une barre pour inspecter sa fenêtre et sa consommation'}
                </span>
              )}
            </div>
          </div>

          {submode === 'flow' ? (
            <div
              className="ldgr-orb-sankey-wrap"
              onMouseLeave={() => setHoverText(null)}
            >
              <svg
                className="ldgr-orb-svg"
                viewBox="0 0 960 330"
                role="img"
                aria-label={
                  lens === 'inference'
                    ? 'Diagramme Sankey Inference par modèle et par vague'
                    : 'Diagramme Sankey Compute par taille de VM et par vague'
                }
              >
                <g>
                  {graph.links.map((l) => {
                    const s = l.source as SNode
                    const t = l.target as SNode
                    const isMatch =
                      isolated?.id === l.id ||
                      isolated?.id === s.id ||
                      isolated?.id === t.id
                    const dimmed = isolated !== null && !isMatch
                    return (
                      <path
                        key={l.id}
                        d={linkPath(l) ?? ''}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={Math.max(2, l.width ?? 2)}
                        strokeOpacity={dimmed ? 0.08 : isMatch ? 0.78 : 0.44}
                        className="ldgr-orb-ribbon"
                        onMouseEnter={() =>
                          setHoverText(
                            `${s.label} → ${t.label} · ${fmtFr(l.value, 1)} ${unitTotal} · ${l.costLabel}`
                          )
                        }
                        onClick={() =>
                          setIsolated((prev) =>
                            prev?.id === l.id
                              ? null
                              : {
                                  id: l.id,
                                  label: `${s.label} → ${t.label}`,
                                  value: l.value,
                                  costLabel: l.costLabel,
                                  color: s.color,
                                  note: l.note
                                }
                          )
                        }
                      />
                    )
                  })}
                </g>

                <g>
                  {graph.nodes.map((n) => {
                    const h = Math.max(3, (n.y1 ?? 0) - (n.y0 ?? 0))
                    const isLeft = (n.x0 ?? 0) < 400
                    const isMatch =
                      isolated?.id === n.id ||
                      graph.links.some(
                        (l) =>
                          l.id === isolated?.id &&
                          ((l.source as SNode).id === n.id ||
                            (l.target as SNode).id === n.id)
                      )
                    const dimmed = isolated !== null && !isMatch
                    const cy = (n.y0 ?? 0) + h / 2
                    return (
                      <g
                        key={n.id}
                        className="ldgr-orb-node"
                        style={{ opacity: dimmed ? 0.32 : 1 }}
                        onMouseEnter={() =>
                          setHoverText(
                            `${n.label} · ${fmtFr(n.value ?? 0, 1)} ${unitTotal} · ${n.costLabel}`
                          )
                        }
                        onClick={() =>
                          setIsolated((prev) =>
                            prev?.id === n.id
                              ? null
                              : {
                                  id: n.id,
                                  label: n.label,
                                  value: n.value ?? 0,
                                  costLabel: n.costLabel,
                                  color: n.color,
                                  note: n.note
                                }
                          )
                        }
                      >
                        <rect
                          x={n.x0}
                          y={n.y0}
                          width={(n.x1 ?? 0) - (n.x0 ?? 0)}
                          height={h}
                          rx={3}
                          fill={n.color}
                          stroke={isolated?.id === n.id ? 'var(--fg-strong)' : 'none'}
                          strokeWidth={1.5}
                        />
                        <text
                          className="ldgr-orb-node-lbl"
                          x={isLeft ? (n.x0 ?? 0) - 10 : (n.x1 ?? 0) + 10}
                          y={cy - 4}
                          textAnchor={isLeft ? 'end' : 'start'}
                        >
                          {n.label}
                        </text>
                        <text
                          className="ldgr-orb-node-sub"
                          x={isLeft ? (n.x0 ?? 0) - 10 : (n.x1 ?? 0) + 10}
                          y={cy + 9}
                          textAnchor={isLeft ? 'end' : 'start'}
                        >
                          {fmtFr(n.value ?? 0, 1)} {unitTotal} · {n.sub}
                        </text>
                      </g>
                    )
                  })}
                </g>
              </svg>
            </div>
          ) : (
            <DagTimeline
              lens={lens}
              hoverIdx={hoverIdx}
              onHoverIdx={setHoverIdx}
              onHoverText={setHoverText}
            />
          )}
        </div>

        {/* Synchronized Consumption Curve Card */}
        <div className="ldgr-orb-curve-card">
          <div className="ldgr-orb-curve-head">
            <span className="ldgr-orb-col-title">
              {isolated ? isolated.label : lens === 'inference' ? 'All Inference' : 'All Compute'}{' '}
              · {lens === 'inference' ? 'Débit (M tokens / h)' : 'Charge active (vCPU)'}
            </span>
            <span className="ldgr-orb-curve-meta">
              {hoverIdx !== null ? (
                <>
                  {formatClockAtBucket(hoverIdx)} ·{' '}
                  <strong style={{ color: 'var(--fg-strong)' }}>
                    {fmtFr(curve.pts[hoverIdx], 1)} {unitRate}
                  </strong>
                </>
              ) : (
                <>
                  Pic {fmtFr(curve.peak, 1)} {unitRate} · Total{' '}
                  {fmtFr(isolated ? isolated.value : totalVal, 1)} {unitTotal} ·{' '}
                  {isolated
                    ? isolated.costLabel
                    : lens === 'inference'
                      ? '~$520 eq. API Google + OrcaRouter'
                      : '~$17 eq. AWS (hors serveur dédié)'}
                </>
              )}
            </span>
          </div>

          <svg
            className="ldgr-orb-svg"
            viewBox={`0 0 ${curve.W} 112`}
            role="img"
            aria-label="Courbe temporelle synchronisée sur les 20 heures de la mission"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              const relX = ((e.clientX - r.left) / r.width) * curve.W
              const frac = (relX - curve.padL) / curve.plotW
              const idx = Math.max(
                0,
                Math.min(curve.pts.length - 1, Math.round(frac * (curve.pts.length - 1)))
              )
              setHoverIdx(idx)
            }}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id={`ldgrOrbGrad-${lens}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={activeColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {[0.5, 1].map((f) => {
              const yv = curve.y(curve.hi * f)
              return (
                <g key={f}>
                  <line
                    x1={curve.padL}
                    x2={curve.W - curve.padR}
                    y1={yv}
                    y2={yv}
                    stroke="var(--stroke-soft)"
                    strokeWidth={1}
                  />
                  <text
                    x={curve.padL - 6}
                    y={yv + 3}
                    textAnchor="end"
                    className="ldgr-orb-node-sub"
                  >
                    {Math.round(curve.hi * f)}
                  </text>
                </g>
              )
            })}

            <line
              x1={curve.padL}
              x2={curve.W - curve.padR}
              y1={curve.baseY}
              y2={curve.baseY}
              stroke="var(--stroke)"
              strokeWidth={1}
            />

            <path d={curve.areaPath} fill={`url(#ldgrOrbGrad-${lens})`} />
            <path
              d={curve.linePath}
              fill="none"
              stroke={activeColor}
              strokeWidth={1.9}
            />

            {hoverIdx !== null && (
              <g>
                <line
                  x1={curve.x(hoverIdx)}
                  y1={8}
                  x2={curve.x(hoverIdx)}
                  y2={curve.baseY}
                  stroke="var(--fg-strong)"
                  strokeOpacity={0.45}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={curve.x(hoverIdx)}
                  cy={curve.y(curve.pts[hoverIdx])}
                  r={3.5}
                  fill={activeColor}
                />
              </g>
            )}

            {[
              { idx: 0, lbl: '15:15 UTC' },
              { idx: 19, lbl: '20:00' },
              { idx: 39, lbl: '01:00' },
              { idx: 56, lbl: 'pause inférence (04:06–06:09)' },
              { idx: 79, lbl: '11:15 UTC' }
            ].map((tk, i, arr) => (
              <text
                key={tk.lbl}
                x={curve.x(tk.idx)}
                y={108}
                textAnchor={
                  i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'
                }
                className="ldgr-orb-node-sub"
              >
                {tk.lbl}
              </text>
            ))}
          </svg>
        </div>

        {/* Bottom Timeline Bar */}
        <div className="ldgr-orb-foot">
          <span>
            {isolated
              ? isolated.note
              : "Fenêtre complète (19,9 h wall-clock dont 2 heures de pause à cause d'un problème d'approvisionnement d'inférence réglé à la main)"}
          </span>
          <span className="ldgr-orb-foot-mono">
            Inférence : ~$520 (API Google + OrcaRouter) · Compute : ~$17 AWS (hors serveur dédié)
          </span>
        </div>
      </div>
    </div>
  )
}

function DagTimeline({
  lens,
  hoverIdx,
  onHoverIdx,
  onHoverText
}: {
  lens: Lens
  hoverIdx: number | null
  onHoverIdx: (idx: number | null) => void
  onHoverText: (txt: string | null) => void
}) {
  const x0 = 248
  const x1 = 946
  const plotW = x1 - x0
  const xAt = (min: number) => x0 + (min / MISSION_SPAN_MINUTES) * plotW

  const rows = useMemo(() => {
    if (lens === 'inference') {
      const out: Array<{
        id: string
        label: string
        wave: string
        header?: string
        startMin: number
        durMin: number
        color: string
        detail: string
        y: number
      }> = []
      let y = 18
      out.push({
        id: '734c3bb7',
        label: 'root · coordinateur (smart)',
        wave: 'coord',
        header: 'Orchestration',
        startMin: 0,
        durMin: 1195,
        color: '#cf6a2d',
        detail: 'Coordinateur racine (serveur dédié) · 141,0M tok · ~$163,36 eq. API Google (201 tours)',
        y: (y += 16)
      })
      y += 22
      let prevWave = ''
      for (const a of DAG_AGENTS) {
        let header: string | undefined
        if (a.wave !== prevWave) {
          y += 12
          header = WAVE_LABELS[a.wave] ?? a.wave
          prevWave = a.wave
          y += 14
        }
        const color =
          a.pool === 'carbon-4'
            ? '#2d7ec7'
            : a.pool === 'glm-5.3'
              ? '#627eea'
              : '#129690'
        const stateNote =
          a.state === 'capped' ? ' · budget de tour atteint, relayé' : ''
        out.push({
          id: a.id,
          label: `${a.id.slice(0, 6)} · ${a.title.replace(/^Wave \d(\.\d)?\s*/i, '')}`,
          wave: a.wave,
          header,
          startMin: a.startMin,
          durMin: a.durMin,
          color,
          detail: `${a.title} · ${fmtFr(a.tokensM, 1)}M tok · ~$${fmtFr(a.apiEqUsd, 2)} eq. ${a.pool === 'carbon-4' ? 'API Google' : 'OrcaRouter'} (${a.pool}, ${a.durMin} min)${stateNote}`,
          y
        })
        y += 21
      }
      return { items: out, height: y + 22 }
    } else {
      const out: Array<{
        id: string
        label: string
        wave: string
        header?: string
        startMin: number
        durMin: number
        color: string
        detail: string
        y: number
      }> = []
      let y = 18
      let prevTrack = ''
      const sorted = [...DAG_VMS].sort((a, b) => {
        const order = ['w1', 'w15', 'w2', 'w3', 'w4']
        const d = order.indexOf(a.track) - order.indexOf(b.track)
        return d !== 0 ? d : a.startMin - b.startMin
      })
      for (const v of sorted) {
        let header: string | undefined
        if (v.track !== prevTrack) {
          if (prevTrack) y += 12
          header = WAVE_LABELS[v.track] ?? v.track
          prevTrack = v.track
          y += 14
        }
        const color =
          v.size === 'xlarge'
            ? '#1d9a78'
            : v.size === 'large'
              ? '#2f83bf'
              : '#627eea'
        const vmCostStr =
          v.costUsd < 0.01 ? `<$0,01` : `~$${fmtFr(v.costUsd, 2)}`
        out.push({
          id: `${v.id}-${v.startMin}`,
          label: `${v.name} (${v.cpu}c/${v.ramGb}G · ${vmCostStr})`,
          wave: v.track,
          header,
          startMin: v.startMin,
          durMin: v.durMin,
          color,
          detail: `${v.name} (${v.cpu} vCPU / ${v.ramGb} GiB) · ~$${fmtFr(v.costUsd, 2)} eq. AWS c7a · ${fmtFr(v.cpuH, 1)} CPU-h · ${fmtFr(v.ramGh, 1)} GB·h — ${v.reason}`,
          y
        })
        y += 21
      }
      return { items: out, height: y + 22 }
    }
  }, [lens])

  return (
    <div
      className="ldgr-orb-dag-scroll"
      onMouseLeave={() => {
        onHoverText(null)
        onHoverIdx(null)
      }}
    >
      <svg
        className="ldgr-orb-svg"
        viewBox={`0 0 960 ${rows.height}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const relX = ((e.clientX - r.left) / r.width) * 960
          if (relX >= x0 && relX <= x1) {
            const frac = (relX - x0) / plotW
            onHoverIdx(Math.max(0, Math.min(79, Math.round(frac * 79))))
          }
        }}
      >
        {[0, 300, 600, 900, 1200].map((m) => {
          const gx = xAt(m)
          return (
            <g key={m}>
              <line
                x1={gx}
                y1={8}
                x2={gx}
                y2={rows.height - 16}
                stroke="var(--stroke-soft)"
                strokeWidth={1}
              />
              <text
                x={gx}
                y={rows.height - 4}
                textAnchor={m === 0 ? 'start' : m === 1200 ? 'end' : 'middle'}
                className="ldgr-orb-node-sub"
              >
                +{Math.round(m / 60)}h
              </text>
            </g>
          )
        })}

        {rows.items.map((rw) => {
          const bx = xAt(rw.startMin)
          const bw = Math.max(5, xAt(rw.startMin + rw.durMin) - bx)
          const shortLbl =
            rw.label.length > 34 ? `${rw.label.slice(0, 33)}…` : rw.label
          return (
            <g
              key={rw.id}
              onMouseEnter={() => onHoverText(rw.detail)}
              style={{ cursor: 'pointer' }}
            >
              {rw.header && (
                <text
                  x={6}
                  y={rw.y - 4}
                  style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fill: 'var(--fg-3)'
                  }}
                >
                  {rw.header}
                </text>
              )}
              <text
                x={x0 - 8}
                y={rw.y + 11}
                textAnchor="end"
                style={{ fontSize: 10.5, fill: 'var(--fg-2)' }}
              >
                {shortLbl}
              </text>
              <rect
                x={bx}
                y={rw.y}
                width={bw}
                height={15}
                rx={3.5}
                fill={rw.color}
                fillOpacity={rw.id === '734c3bb7' ? 0.35 : 0.86}
              />
            </g>
          )
        })}

        {hoverIdx !== null && (
          <line
            x1={x0 + (hoverIdx / 79) * plotW}
            y1={8}
            x2={x0 + (hoverIdx / 79) * plotW}
            y2={rows.height - 16}
            stroke="var(--fg-strong)"
            strokeOpacity={0.45}
            strokeDasharray="3 3"
          />
        )}
      </svg>
    </div>
  )
}
