"use client";

import { useState, type ReactNode } from "react";
import "./orb.css";
import { SNAPSHOT } from "./data";

export type TemplateId = "flow" | "reservoirs" | "ledger";

const TEMPLATES: { id: TemplateId; label: string; href: string }[] = [
  { id: "flow", label: "1 · Flow", href: "/orb_resources_flow" },
  { id: "reservoirs", label: "2 · Reservoirs", href: "/orb_resources_reservoirs" },
  { id: "ledger", label: "3 · Ledger", href: "/orb_resources_ledger" },
];

const Icon = ({ d }: { d: string }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export function OrbShell({ active, title, children }: { active: TemplateId; title: string; children: ReactNode }) {
  const [light, setLight] = useState(false);

  return (
    <div className="orb-mock" data-orb-theme={light ? "light" : "dark"}>
      <aside className="orb-sb">
        <div className="orb-traffic"><i /><i /><i /></div>
        <span className="orb-row"><Icon d="M2.5 3h11L9.5 8.2V13l-3-1.6V8.2z" />New Agent<kbd>⌘1</kbd></span>
        <span className="orb-row"><Icon d="M2.2 9.2 3.7 3.5h8.6l1.5 5.7v3.3H2.2zM2.3 9.3h3.4l.9 1.5h2.8l.9-1.5h3.4" />Inbox<kbd>⌘I</kbd></span>
        <span className="orb-row"><Icon d="M4.5 11.5h7a2.5 2.5 0 0 0 .4-5A3.8 3.8 0 0 0 4.6 5a2.8 2.8 0 0 0-.1 6.5z" />Cloud agent<kbd>⌘2</kbd></span>
        <span className="orb-row"><Icon d="M2 2.4h12v8.2H2zM8 10.6v2.8M5.2 13.6h5.6" />Machines<kbd>⌘3</kbd></span>
        <span className="orb-row"><Icon d="M8 2.4 13.4 5.4v5.2L8 13.6 2.6 10.6V5.4zM2.6 5.4 8 8.4l5.4-3M8 8.4v5.2" />Inference<kbd>⌘4</kbd></span>
        <span className="orb-row on"><Icon d="M2.5 4.5h4.2l2.6 7h4.2M2.5 11.5h4.2l2.6-7h4.2" />Resources<kbd>⌘5</kbd></span>

        <div className="orb-sec">Projects</div>
        <span className="orb-row" style={{ color: "var(--fg)" }}>verity-core</span>
        <span className="orb-row" style={{ paddingLeft: 22, fontSize: 12 }}>evm.fast (claude takeover)</span>
        <span className="orb-row">boost.ci</span>
        <span className="orb-row">maxwell</span>

        <div className="orb-sb-foot">
          <div className="orb-sec" style={{ paddingTop: 4 }}>Compare templates</div>
          {TEMPLATES.map(t => (
            <a key={t.id} href={t.href} className={`orb-switch-link ${t.id === active ? "here" : ""}`}>
              <span>{t.label}</span>
              {t.id === active && <span>●</span>}
            </a>
          ))}
        </div>
      </aside>

      <header className="orb-tb">
        <span>Resources · <span style={{ color: "var(--fg-3)" }}>{title}</span></span>
        <div className="orb-tb-right">
          <div className="orb-seg">
            {TEMPLATES.map(t => (
              <a key={t.id} href={t.href} className={t.id === active ? "on" : ""}>{t.label}</a>
            ))}
          </div>
          <button
            type="button"
            className="orb-seg"
            style={{ padding: "3px 9px", cursor: "pointer", color: "var(--fg-2)", border: 0 }}
            onClick={() => setLight(v => !v)}
          >
            {light ? "Dark" : "Light"}
          </button>
          <span className="orb-stamp">{SNAPSHOT}</span>
        </div>
      </header>

      <div className="orb-main">{children}</div>
    </div>
  );
}
