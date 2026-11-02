"use client";

import { useMemo, useState } from "react";
import "./reservoirs.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { CLIFFS, RESERVOIRS, STOCK_HISTORY, type Reservoir } from "../orb_resources/data";

type Sort = "cliff" | "burn" | "surplus";

function hoursToEmpty(r: Reservoir): number {
  const net = r.burnPerHourPct - r.regenPerHour;
  if (r.stock <= 0) return 0;
  if (net <= 0) return 999;
  return r.stock / net;
}

/** Projected stock at the end of a 4-hour horizon, clamped to 0..100. */
function projected(r: Reservoir): number {
  return Math.max(0, Math.min(100, r.stock + (r.regenPerHour - r.burnPerHourPct) * 4));
}

export function ReservoirsView() {
  const [sort, setSort] = useState<Sort>("cliff");

  const list = useMemo(() => {
    const copy = [...RESERVOIRS];
    if (sort === "cliff") return copy.sort((a, b) => hoursToEmpty(a) - hoursToEmpty(b));
    if (sort === "burn") return copy.sort((a, b) => (b.cashPerHour + b.shadowPerHour) - (a.cashPerHour + a.shadowPerHour));
    return copy.sort((a, b) => b.stock - a.stock);
  }, [sort]);

  const points = (pick: (p: typeof STOCK_HISTORY[number]) => number) =>
    STOCK_HISTORY.map((p, i) => `${(i / (STOCK_HISTORY.length - 1)) * 600},${110 - pick(p) * 1.0}`).join(" ");

  return (
    <OrbShell active="reservoirs" title="Reservoirs">
      <div className="orb-bar">
        <span style={{ color: "var(--fg-3)", fontSize: 12 }}>Order by</span>
        <div className="orb-seg">
          <button className={sort === "cliff" ? "on" : ""} onClick={() => setSort("cliff")}>Time to cliff</button>
          <button className={sort === "burn" ? "on" : ""} onClick={() => setSort("burn")}>Dollar burn</button>
          <button className={sort === "surplus" ? "on" : ""} onClick={() => setSort("surplus")}>Unused surplus</button>
        </div>
        <span className="orb-spacer" />
        <span className="orb-stamp">tick mark = projected stock in 4h</span>
      </div>

      <div className="res-grid">
        {list.map(r => {
          const eta = hoursToEmpty(r);
          const proj = projected(r);
          const total = r.cashPerHour + r.shadowPerHour;
          return (
            <div key={r.id} className="res-card" data-level={r.level}>
              <div className="res-head">
                <span className="res-name">{r.name}</span>
                <span className="res-stock">
                  {r.kind === "compute" ? `$${((r.stock / 100) * 50).toFixed(2)} left` : `${r.stock}%`}
                </span>
              </div>
              <div className="res-gauge" title={`Now ${r.stock}% · in 4h ${Math.round(proj)}%`}>
                <div className="res-fill" style={{ width: `${r.stock}%` }} />
                {r.stock > 0 && r.stock < 100 && <span className="res-mark" style={{ left: `${proj}%` }} />}
              </div>
              <div className="res-vectors">
                {r.regenPerHour > 0 && <span className="in">+{r.regenPerHour}%/h regen</span>}
                {r.burnPerHourPct > 0 && <span className="out">−{r.burnPerHourPct}%/h burn</span>}
                {total > 0 && <span className="out">${total.toFixed(2)}/h</span>}
                <span>{r.workers} active</span>
                <span>{eta === 0 ? r.reset : eta < 100 ? `empty in ${eta.toFixed(1)}h` : r.reset}</span>
              </div>
              <p className="res-note">{r.note}</p>
            </div>
          );
        })}
      </div>

      <div className="orb-card">
        <div className="orb-card-h">
          <h3>Stock over the last 12 hours</h3>
          <span>Boat resets at 00:00 UTC · Gemini recovered after the overnight stall</span>
        </div>
        <svg className="spark-chart" viewBox="0 0 600 124" preserveAspectRatio="none">
          <polyline fill="none" stroke="#3987e5" strokeWidth="1.8" points={points(p => p.claude)} />
          <polyline fill="none" stroke="#199e70" strokeWidth="1.8" points={points(p => p.gemini)} />
          <polyline fill="none" stroke="#d9b23a" strokeWidth="1.8" points={points(p => p.boat)} />
          {STOCK_HISTORY.filter((_, i) => i % 2 === 0).map((p, i) => (
            <text key={p.t} x={i * 2 * (600 / (STOCK_HISTORY.length - 1))} y="122" fill="var(--fg-3)" fontSize="9">{p.t}</text>
          ))}
        </svg>
        <div className="spark-legend">
          <span><i style={{ background: "#3987e5" }} />Antigravity · Claude</span>
          <span><i style={{ background: "#199e70" }} />Antigravity · Gemini</span>
          <span><i style={{ background: "#d9b23a" }} />Boat daily budget</span>
        </div>
      </div>

      <div className="orb-card">
        <div className="orb-card-h">
          <h3>Cliffs &amp; traps</h3>
          <span>things that quietly burned money or work in 9409f9a9</span>
        </div>
        <table className="orb-table">
          <thead>
            <tr><th>Target</th><th>Role</th><th>Why it matters</th><th className="num">Horizon</th></tr>
          </thead>
          <tbody>
            {CLIFFS.map(c => (
              <tr key={c.name}>
                <td style={{ color: "var(--fg)" }}>{c.name}</td>
                <td>{c.detail}</td>
                <td>{c.why}</td>
                <td className="num"><span className="orb-pill" data-tone="warn">{c.left}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OrbShell>
  );
}
