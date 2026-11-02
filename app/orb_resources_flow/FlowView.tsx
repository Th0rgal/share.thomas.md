"use client";

import { useMemo, useState } from "react";
import "./flow.css";
import { OrbShell } from "../orb_resources/OrbShell";
import { BURN, MISSIONS, PALETTE, RESERVOIRS, type Reservoir } from "../orb_resources/data";

type Unit = "blended" | "cash" | "tokens";

const usd = (n: number) => `$${n.toFixed(2)}`;

/** Three columns: reservoirs, the models and machines they flow through, and
 *  the missions they land in. Ribbon width is the live burn. */
export function FlowView() {
  const [unit, setUnit] = useState<Unit>("blended");
  const [scope, setScope] = useState<"fleet" | "mission">("fleet");
  const [picked, setPicked] = useState<string | null>(null);

  const value = (r: Reservoir) => (unit === "cash" ? r.cashPerHour : r.cashPerHour + r.shadowPerHour);
  const scale = scope === "mission" ? 0.93 : 1;

  const flowing = useMemo(
    () => RESERVOIRS.map(r => ({ r, v: value(r) * scale })).filter(x => x.v > 0.05).sort((a, b) => b.v - a.v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit, scope],
  );
  const blocked = RESERVOIRS.filter(r => r.level === "bad");
  const total = flowing.reduce((s, x) => s + x.v, 0) || 1;

  const models = useMemo(() => {
    const acc = new Map<string, { name: string; v: number; from: string }>();
    for (const { r, v } of flowing) {
      for (const m of r.models) {
        const key = m.name;
        const prev = acc.get(key) ?? { name: key, v: 0, from: r.name };
        prev.v += v * m.share;
        acc.set(key, prev);
      }
    }
    return [...acc.values()].sort((a, b) => b.v - a.v);
  }, [flowing]);

  const shown = picked ? flowing.filter(x => x.r.id === picked) : flowing;
  const max = Math.max(...shown.map(x => x.v), 0.01);

  return (
    <OrbShell active="flow" title="Flow">
      <div className="orb-bar">
        <div className="orb-seg">
          <button className={scope === "fleet" ? "on" : ""} onClick={() => setScope("fleet")}>Fleet</button>
          <button className={scope === "mission" ? "on" : ""} onClick={() => setScope("mission")}>evm.fast + 224 subagents</button>
        </div>
        <div className="orb-seg">
          <button className={unit === "blended" ? "on" : ""} onClick={() => setUnit("blended")}>Cash + shadow</button>
          <button className={unit === "cash" ? "on" : ""} onClick={() => setUnit("cash")}>Cash only</button>
          <button className={unit === "tokens" ? "on" : ""} onClick={() => setUnit("tokens")}>Tokens</button>
        </div>
        <span className="orb-spacer" />
        <span className="orb-stamp">{picked ? "filtered to one reservoir · click again to clear" : "width = live burn"}</span>
      </div>

      <div className="orb-tiles">
        <div className="orb-tile">
          <div className="orb-tile-k">Burn, right now</div>
          <div className="orb-tile-v">{unit === "tokens" ? "14.2k" : usd(BURN.total * scale)}<small>{unit === "tokens" ? "tok/min" : "/h"}</small></div>
          <div className="orb-tile-s">{usd(BURN.cash * scale)} cash · {usd(BURN.shadow * scale)} shadow</div>
        </div>
        <div className="orb-tile">
          <div className="orb-tile-k">Inference</div>
          <div className="orb-tile-v">{(BURN.tokensPerMin / 1000).toFixed(1)}k<small>tok/min</small></div>
          <div className="orb-tile-s">36 turns in flight</div>
        </div>
        <div className="orb-tile">
          <div className="orb-tile-k">Compute</div>
          <div className="orb-tile-v">{BURN.vcpu}<small>vCPU</small></div>
          <div className="orb-tile-s">{BURN.vms} machines · {BURN.idlePct}% idle</div>
        </div>
        <div className="orb-tile" data-tone="warn">
          <div className="orb-tile-k">Reservoirs</div>
          <div className="orb-tile-v">2<small>hard capped</small></div>
          <div className="orb-tile-s">1 pool expires unused</div>
        </div>
      </div>

      <div className="flow-grid">
        <Column title="Stock" hint="fill · regen">
          {RESERVOIRS.map(r => (
            <button key={r.id} className={`flow-node ${picked === r.id ? "sel" : ""}`} onClick={() => setPicked(p => (p === r.id ? null : r.id))}>
              <div className="flow-node-top">
                <span className={`dot ${r.level}`} />
                <span className="flow-node-name">{r.name}</span>
                <span className="flow-node-num">{r.kind === "compute" ? `$${((1 - r.stock / 100) * 50).toFixed(0)}` : `${r.stock}%`}</span>
              </div>
              <div className="tank"><i className={r.level} style={{ width: `${r.stock}%` }} /></div>
              <div className="flow-node-sub">
                {r.level === "bad"
                  ? r.reset
                  : r.kind === "compute"
                    ? `${usd(r.cashPerHour)}/h · cap in ${Math.round(r.stock / r.burnPerHourPct)}h`
                    : `+${r.regenPerHour}%/h · −${r.burnPerHourPct}%/h`}
              </div>
            </button>
          ))}
        </Column>

        <Column title="Through" hint="model · machine">
          {models.map((m, i) => (
            <div key={m.name} className="flow-node static">
              <div className="flow-node-top">
                <span className="swatch" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="flow-node-name">{m.name}</span>
                <span className="flow-node-num">{unit === "tokens" ? "" : usd(m.v) + "/h"}</span>
              </div>
              <div className="ribbon"><i style={{ width: `${(m.v / (models[0]?.v || 1)) * 100}%`, background: PALETTE[i % PALETTE.length] }} /></div>
              <div className="flow-node-sub">{m.from}</div>
            </div>
          ))}
          {blocked.length > 0 && (
            <div className="flow-blocked">
              {blocked.map(b => <div key={b.id}>{b.name} · blocked, {b.reset}</div>)}
            </div>
          )}
        </Column>

        <Column title="Into" hint="mission">
          {MISSIONS.map(m => (
            <div key={m.id} className={`flow-node static ${m.warn ? "warn" : ""}`}>
              <div className="flow-node-top">
                <span className="flow-node-name">{m.name}</span>
                <span className="flow-node-num">{usd(m.perHour * scale)}/h</span>
              </div>
              <div className="ribbon"><i className={m.warn ? "warn" : ""} style={{ width: `${m.share * 100 / 0.5}%` }} /></div>
              <div className="flow-node-sub">{usd(m.cash * scale)} cash · {usd(m.shadow * scale)} shadow</div>
            </div>
          ))}
        </Column>
      </div>

      <div className="orb-card" style={{ marginTop: 14 }}>
        <div className="orb-card-h">
          <h3>{picked ? RESERVOIRS.find(r => r.id === picked)?.name : "Live flow"}</h3>
          <span>{usd(total)}/h across {flowing.length} open reservoirs</span>
        </div>
        <div className="lanes">
          {shown.map(({ r, v }, i) => (
            <div key={r.id} className="lane">
              <span className="lane-name">{r.name}</span>
              <span className="lane-bar"><i style={{ width: `${(v / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} /></span>
              <span className="lane-num">{usd(v)}/h</span>
            </div>
          ))}
        </div>
        {picked && <p className="flow-note">{RESERVOIRS.find(r => r.id === picked)?.note}</p>}
      </div>
    </OrbShell>
  );
}

function Column({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flow-col">
      <div className="flow-col-h"><span>{title}</span><span>{hint}</span></div>
      {children}
    </div>
  );
}
