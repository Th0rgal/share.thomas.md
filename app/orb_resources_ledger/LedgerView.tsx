"use client";

import { useState } from "react";
import "./ledger.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { OUTCOME_COLOR, TREE, WASTE, type TreeNode } from "../orb_resources/data";

type ColorBy = "outcome" | "flat";

const WASTE_COLOR: Record<string, string> = {
  active: "var(--ok)",
  ttl: "var(--danger)",
  idle: "var(--warning)",
};

/** Mission-scoped view: a three-level flame of where the campaign's dollars
 *  actually went, plus the Boat active-vs-waste split. */
export function LedgerView() {
  const [colorBy, setColorBy] = useState<ColorBy>("outcome");
  const [zoom, setZoom] = useState<TreeNode>(TREE);

  const rootTotal = zoom.children?.reduce((s, c) => s + c.usd, 0) ?? zoom.usd;
  const wasteTotal = WASTE.reduce((s, w) => s + w.usd, 0);

  const tint = (k: TreeNode["kind"]) =>
    colorBy === "flat" ? "var(--bg-active)" : `color-mix(in srgb, ${OUTCOME_COLOR[k]} 24%, var(--bg-active))`;

  return (
    <OrbShell active="ledger" title="Mission ledger · 9409f9a9">
      <div className="orb-bar">
        <div className="orb-seg">
          <button className={zoom === TREE ? "on" : ""} onClick={() => setZoom(TREE)}>evm.fast · $211.4 total</button>
          {zoom !== TREE && <button className="on">{zoom.name} · ${zoom.usd.toFixed(1)}</button>}
        </div>
        <div className="orb-seg">
          <button className={colorBy === "outcome" ? "on" : ""} onClick={() => setColorBy("outcome")}>Color by outcome</button>
          <button className={colorBy === "flat" ? "on" : ""} onClick={() => setColorBy("flat")}>Monochrome</button>
        </div>
        <span className="orb-spacer" />
        <span className="orb-stamp">click a bar to zoom · click root chip to reset</span>
      </div>

      <div className="orb-tiles">
        <div className="orb-tile">
          <div className="orb-tile-k">Campaign total · 3.5d</div>
          <div className="orb-tile-v">$211.40</div>
          <div className="orb-tile-s">$43.05 cash · $168.35 shadow</div>
        </div>
        <div className="orb-tile" data-tone="warn">
          <div className="orb-tile-k">Coordinator alone</div>
          <div className="orb-tile-v">$125.29<small>59%</small></div>
          <div className="orb-tile-s">3 trace-polling turns = $99.28</div>
        </div>
        <div className="orb-tile">
          <div className="orb-tile-k">Provers + quorums</div>
          <div className="orb-tile-v">$43.00<small>20%</small></div>
          <div className="orb-tile-s">220+ subagents across 10 rounds</div>
        </div>
        <div className="orb-tile" data-tone="bad">
          <div className="orb-tile-k">Boat waste</div>
          <div className="orb-tile-v">$25.19<small>58% of VM $</small></div>
          <div className="orb-tile-s">15 hit 12h cap · 38 idle-reaped</div>
        </div>
      </div>

      <div className="orb-card">
        <div className="orb-card-h">
          <h3>Where the campaign&apos;s $211.40 went</h3>
          <span>width is share of spend · conserved across every level</span>
        </div>
        <div className="flame">
          <div className="flame-row">
            <div className="flame-cell" style={{ flex: 1, background: tint(zoom.kind) }} onClick={() => setZoom(TREE)}>
              <span>{zoom.name}</span><span>${rootTotal.toFixed(1)}</span>
            </div>
          </div>
          {zoom.children && (
            <div className="flame-row">
              {zoom.children.map(c => (
                <div
                  key={c.name}
                  className="flame-cell"
                  style={{ flex: c.usd, background: tint(c.kind) }}
                  onClick={() => c.children && setZoom(c)}
                  title={`${c.name}: $${c.usd.toFixed(2)}`}
                >
                  <span>{c.name}</span><span>${c.usd.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
          {zoom.children && (
            <div className="flame-row">
              {zoom.children.flatMap(c =>
                (c.children ?? [{ ...c, children: undefined }]).map(leaf => (
                  <div
                    key={`${c.name}-${leaf.name}`}
                    className="flame-cell"
                    style={{ flex: leaf.usd, background: tint(leaf.kind) }}
                    title={`${leaf.name}: $${leaf.usd.toFixed(2)}`}
                  >
                    <span>{leaf.name}</span><span>${leaf.usd.toFixed(1)}</span>
                  </div>
                )),
              )}
            </div>
          )}
        </div>
        <div className="waste-legend">
          <span><b style={{ background: "var(--ok)" }} />Proving &amp; building</span>
          <span><b style={{ background: "var(--info)" }} />Quorum review</span>
          <span><b style={{ background: "var(--fg-4)" }} />Coordinator context</span>
          <span><b style={{ background: "var(--warning)" }} />Idle before reap</span>
          <span><b style={{ background: "var(--danger)" }} />Stalled to 12h cap</span>
        </div>
      </div>

      <div className="orb-card">
        <div className="orb-card-h">
          <h3>172 Boat VMs · $43.05 · 502 VM-hours</h3>
          <span>only 41.5% went to active Lean checks</span>
        </div>
        <div className="waste-bar">
          {WASTE.map(w => (
            <i key={w.key} style={{ flex: w.usd, background: WASTE_COLOR[w.key] }} title={`${w.label}: $${w.usd.toFixed(2)} (${w.hours} VM-h)`} />
          ))}
        </div>
        <div className="waste-legend">
          {WASTE.map(w => (
            <span key={w.key}>
              <b style={{ background: WASTE_COLOR[w.key] }} />
              {w.label} · ${w.usd.toFixed(2)} ({Math.round((w.usd / wasteTotal) * 100)}%, {w.hours}h)
            </span>
          ))}
        </div>
      </div>

      <div className="orb-card">
        <div className="orb-card-h">
          <h3>Biggest single spenders in 9409f9a9</h3>
          <span>the rows that surprised you when we pulled the logs</span>
        </div>
        <table className="orb-table">
          <thead>
            <tr><th>Source</th><th>What happened</th><th className="num">Tokens / hours</th><th className="num">USD</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ color: "var(--fg)" }}>Coordinator turn seq 58169</td>
              <td>Read 300 raw events into context, filled /dev/md2 on ashur, crashed SQLite</td>
              <td className="num">60.9M cache + 15.2M in</td>
              <td className="num" style={{ color: "var(--warning)" }}>$56.90</td>
            </tr>
            <tr>
              <td style={{ color: "var(--fg)" }}>Coordinator turns 23855 &amp; 40010</td>
              <td>Two marathon polling turns before schedule_wakeup discipline</td>
              <td className="num">51.4M cache</td>
              <td className="num">$42.38</td>
            </tr>
            <tr>
              <td style={{ color: "var(--fg)" }}>15 Boat VMs · ttl_expired</td>
              <td>Workers stalled on Codex/Anthropic 429s; VMs ran the full 720m ceiling</td>
              <td className="num">180.0 VM-h</td>
              <td className="num" style={{ color: "var(--danger)" }}>$16.04</td>
            </tr>
            <tr>
              <td style={{ color: "var(--fg)" }}>38 Boat VMs · working_owner_idle</td>
              <td>Coordinator-owned VMs reaped idle — twice eating a warm snapshot build</td>
              <td className="num">107.9 VM-h</td>
              <td className="num" style={{ color: "var(--warning)" }}>$9.15</td>
            </tr>
            <tr>
              <td style={{ color: "var(--fg)" }}>47 emergency VM forks</td>
              <td>Disk rescues because workers had writer=false; triggered 14 of 23 boot 502s</td>
              <td className="num">47 forks</td>
              <td className="num">$4.80</td>
            </tr>
          </tbody>
        </table>
      </div>
    </OrbShell>
  );
}
