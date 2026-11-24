import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import OrbResourcesEmbed from './OrbResourcesEmbed'
import {
  BOLOS_PATCH_URL,
  C_BENCH_BARS,
  MERMAID_ARCHITECTURE,
  PAGE_TITLE,
  REPO_URL,
  RUST_BENCH_BARS,
  TURBO_LEAN_URL,
  VANADIUM_ISSUES,
  VANADIUM_PATCH_URL,
  type BenchmarkChartItem
} from './data'
import './leanldgr.css'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    'Lean 4 POC on Ledger’s C (BOLOS) and Rust (Vanadium) Bitcoin apps: a formally proved kernel linked into both binaries, with size and latency measurements.',
  alternates: {
    canonical: 'https://share.thomas.md/leanldgr'
  },
  robots: { index: false },
  openGraph: {
    title: PAGE_TITLE,
    description:
      'Lean 4 formal verification and binary optimization on Ledger app-bitcoin (C) and Vanadium (Rust).',
    url: 'https://share.thomas.md/leanldgr',
    type: 'article'
  }
}

function sevClass(sev: 'High' | 'Medium' | 'Low'): string {
  if (sev === 'High') return 'sev-badge sev-high'
  if (sev === 'Medium') return 'sev-badge sev-medium'
  return 'sev-badge sev-low'
}

function BenchmarkColumn({
  title,
  sub,
  items,
  variant,
  footer
}: {
  title: string
  sub: string
  items: BenchmarkChartItem[]
  variant: 'rust' | 'c'
  footer: string
}) {
  return (
    <div className="ldgr-bench-col">
      <div className="ldgr-bench-col-head">
        <span className="ldgr-bench-col-title">{title}</span>
        <span className="ldgr-bench-col-sub">{sub}</span>
      </div>

      {items.map((item) => (
        <div key={item.label} className="ldgr-metric">
          <div className="ldgr-metric-head">
            <span className="ldgr-metric-name">{item.label}</span>
          </div>
          <div className="ldgr-bars">
            <div className="ldgr-bar-row">
              <span className="ldgr-bar-tag">Baseline</span>
              <div className="ldgr-bar-track">
                <div className="ldgr-bar-fill is-orig" style={{ width: `${(100 / Math.max(100, item.optPct)) * 100}%` }} />
                <div className="ldgr-bar-val">
                  <span>{item.origValue}</span>
                </div>
              </div>
            </div>
            <div className="ldgr-bar-row is-opt">
              <span className="ldgr-bar-tag is-opt">+ Lean 4</span>
              <div className="ldgr-bar-track">
                <div
                  className={`ldgr-bar-fill ${variant === 'rust' ? 'is-opt-rust' : 'is-opt-c'}`}
                  style={{ width: `${(item.optPct / Math.max(100, item.optPct)) * 100}%` }}
                />
                <div className="ldgr-bar-val">
                  <span>{item.optValue}</span>
                  <span className="ldgr-bar-delta">{item.delta}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="ldgr-bench-foot">{footer}</div>
    </div>
  )
}

export default function LeanLedgerReportPage() {
  return (
    <article className="is-posts ldgr-article">
      <h1 className="title-display">Lean 4 Ledger</h1>

      <p>
        Our thesis is that it is already viable today to rewrite existing software in Lean 4 to
        obtain a formally proved binary that is both more compact and faster. Yesterday, Vincent and
        Guillaume suggested starting with Ledger&apos;s Bitcoin application; here is the result.
      </p>

      <p>
        <strong>Important:</strong> this is a one-day POC—the specs are not complete, there are
        other important properties worth formally verifying, and this would require more review on
        our side as well as validation of our modeling choices on yours.
      </p>

      <h2 className="section-heading">1. Methodology and Architecture</h2>
      <p>
        In terms of human time, I had already looked into it a bit when Charles mentioned it to me
        and had a rough idea of the Ledger stack: it took me about <strong>1 h</strong> upfront to
        frame the problem, lay down the high-level specs, and design the pipeline,{' '}
        <strong>15 min</strong> this morning to unblock an inference routing issue, and{' '}
        <strong>1 h</strong> at the end to review and polish everything. Everything else ran
        autonomously.
      </p>
      <p>
        Ledger maintains two Bitcoin apps: the legacy C app (
        <a
          href="https://github.com/LedgerHQ/app-bitcoin/tree/f010982d3050e02813cd7129bebd68cf2d1f2099"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>app-bitcoin</code>
        </a>
        ), compiled natively to the microcontroller&apos;s instruction set on top of BOLOS, and the
        new Rust V-App (
        <a
          href="https://github.com/LedgerHQ/vanadium/tree/ace8e96982408959dea9e7fbc59ee36e8c54e645"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>vanadium</code>
        </a>
        ), compiled to 32-bit RISC-V (<code>RV32IMAC</code>) and executed inside a VM running on
        BOLOS (to stream the app&apos;s code and data from the host, if I understood correctly).
      </p>
      <p>
        Rather than touching the UI or APDU/ECALL transport (rewriting the UI in Lean 4 would have
        little value), we kept the original UI and I/O in each app and focused the effort on the
        shared logic where most of the attack surface lives. The result,{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <code>Th0rgal/lean-ledger-bitcoin</code>
        </a>
        , contains two things of interest for you:
      </p>
      <ul>
        <li>
          <strong>A Lean kernel compiled into both apps</strong> (
          <a href={`${REPO_URL}/blob/main/BitcoinLedger/FreestandingKernels.lean`} target="_blank" rel="noopener noreferrer">
            <code>FreestandingKernels.lean</code>
          </a>
          ): this is the Lean code actually executed on the device.{' '}
          <a href={TURBO_LEAN_URL} target="_blank" rel="noopener noreferrer">
            <code>turbo-lean</code>
          </a>{' '}
          compiles it to 32-bit LLVM IR, replacing the sensitive paths we rewrote in each app.
        </li>
        <li>
          <strong>A short spec on this kernel</strong> (
          <a href={`${REPO_URL}/blob/main/Spec.lean`} target="_blank" rel="noopener noreferrer">
            <code>Spec.lean</code>
          </a>
          , 12 statements): each statement targets a compiled function, and its proof is checked by
          Lean (<code>0 sorryAx</code>). It currently covers <code>17</code> of the kernel&apos;s{' '}
          <code>45</code> functions.
        </li>
      </ul>
      <p>
        The integrations fit into two patches:{' '}
        <a href={BOLOS_PATCH_URL} target="_blank" rel="noopener noreferrer">
          <code>app-bitcoin-lean-opt.patch</code>
        </a>{' '}
        on the BOLOS side and{' '}
        <a href={VANADIUM_PATCH_URL} target="_blank" rel="noopener noreferrer">
          <code>vanadium-bitcoin-lean-opt.patch</code>
        </a>{' '}
        on the Vanadium side. The remaining C/Rust is the original code, lightly patched (around 200
        lines modified on the C side and 700 on the Rust side, excluding tests). It does three
        things: calls the Lean kernel in place of the original checks, parses PSBTs and scripts, and
        talks to the hardware (keys, crypto, screen, and transport go through BOLOS syscalls). For
        that OS-facing part, using Lean wouldn&apos;t make sense; for the parsers, however, I think
        it would be a good idea. It&apos;s more work, but it would be worth it since they lend
        themselves well to formal verification.
      </p>

      <Mermaid chart={MERMAID_ARCHITECTURE} />

      <h2 className="section-heading">2. Execution Plan</h2>
      <ol>
        <li>
          <strong>Specs and cross-testing</strong>: formalization in Lean 4, followed by an
          executable kernel refined in a loop against both repos&apos; test suites.
        </li>
        <li>
          <strong>32-bit LLVM backend in{' '}
          <a href={TURBO_LEAN_URL} target="_blank" rel="noopener noreferrer">
            <code>turbo-lean</code>
          </a></strong>
          : allocation-free support for <code>thumbv6m</code>, <code>thumbv8m.main</code>, and{' '}
          <code>riscv32imac</code>. Going through LLVM IR felt safer than emitting assembly
          directly. This compilation chain is not yet proved end-to-end (it is checked via
          differential testing). Proving it would be relatively expensive in inference, but it would
          be a good investment since it only needs to be done once.
        </li>
        <li>
          <strong>Integration</strong>: minimal FFI shim in each app, original UI and I/O preserved,
          kernel linked with LTO.
        </li>
        <li>
          <strong><code>maxwell</code> optimization loop</strong>: iterations on reproducible
          benchmarks, with proofs and tests green, to get below the baselines.
        </li>
      </ol>

      <h2 className="section-heading">3. Results</h2>
      <p>
        Here is the spec. It only covers code actually compiled into the apps and is not complete,
        but it illustrates what is possible:
      </p>
      <ul>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L32-L51" target="_blank" rel="noopener noreferrer">
            Transaction amounts: the kernel returns &ldquo;valid&rdquo; if and only if the amount is at most 21 million BTC. For a sum or difference, it returns &ldquo;valid&rdquo; if and only if the exact mathematical result stays between 0 and this cap, and in that case returns the exact result.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L53-L57" target="_blank" rel="noopener noreferrer">
            Display: splitting an amount into BTC and satoshis without division is exact for every 64-bit amount.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L61-L72" target="_blank" rel="noopener noreferrer">
            Derivation paths: the kernel classifies a path element as &ldquo;hardened&rdquo; if and only if it is at least 2<sup>31</sup>, and rejects paths longer than 10 elements on BOLOS or 16 on Vanadium.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L76-L82" target="_blank" rel="noopener noreferrer">
            Addresses: the kernel returns &ldquo;valid&rdquo; for a SegWit program in the exact allowed cases—20 or 32 bytes for version 0, and 2 to 40 bytes for versions 1 through 16.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L93-L104" target="_blank" rel="noopener noreferrer">
            Requested signature types: the kernel returns &ldquo;valid&rdquo; if and only if the sighash is ALL, NONE, or SINGLE, with or without ANYONECANPAY, plus DEFAULT for Taproot.
          </a>
        </li>
        <li>
          <a href="https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L108-L116" target="_blank" rel="noopener noreferrer">
            Transaction parsing: the kernel returns &ldquo;valid&rdquo; for a length prefix (CompactSize) if and only if it uses the shortest canonical encoding.
          </a>
        </li>
      </ul>
      <p>
        Each statement is an &ldquo;if and only if&rdquo; or an equality, paired with one accepted
        example and one rejected example.
      </p>

      <p>
        On the performance side, we didn&apos;t go out of our way to optimize—especially since we
        go through LLVM rather than targeting the final hardware directly—yet we still get
        interesting numbers thanks to a few measurement and tuning iterations. The Lean 4 patched
        binary is smaller on both targets and faster on Vanadium; on BOLOS, latency is unchanged on
        Nano S+ and higher on Nano X:
      </p>

      <div className="ldgr-bench-breakout not-prose">
        <div className="ldgr-bench-grid">
          <BenchmarkColumn
            title="Vanadium V-App (Rust → + Lean 4)"
            sub="RV32IMAC · Ledger Flex"
            items={RUST_BENCH_BARS}
            variant="rust"
            footer="App tests 90/90 · common 85/85 · 11 bugs fixed"
          />
          <BenchmarkColumn
            title="BOLOS App (C → + Lean 4)"
            sub="ARM Thumb · Nano S+ / X"
            items={C_BENCH_BARS}
            variant="c"
            footer="31/31 ctest · mainnet 2/2 · testnet suite (282 tests) running · 0 sorryAx"
          />
        </div>
      </div>

      <figure className="not-prose" style={{ margin: '1.75rem 0 2.2rem 0' }}>
        <img
          src="/leanldgr/vanadium-trace.webp"
          alt="Taproot signing on Vanadium: baseline and Lean variant side by side, with cumulative executed instructions"
          width={960}
          height={840}
          style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 6 }}
        />
        <figcaption style={{ padding: '0.7rem 0', fontSize: '0.8rem', lineHeight: 1.45, opacity: 0.75 }}>
          A Taproot signature on Vanadium (Speculos Flex), baseline on the left, Lean variant on
          the right. At the bottom, cumulative executed RV32 instructions, one point per APDU
          exchange: 234,214 vs. 200,692 (−14.3%), and 1,307 page loads vs. 1,240. Everything is
          measured; runs are instrumented with auto-approval, so the displayed duration is not a
          real-world latency (
          <a href="/leanldgr/vanadium-trace-v2.mp4">mp4 version</a>).
        </figcaption>
      </figure>

      <p>What stands out to us:</p>
      <ul>
        <li>
          The <code>BIP-370</code> <code>nLockTime</code> computation—where Vanadium appears to
          have a bug (to be confirmed with you)—was proved compliant with the rule for any list of
          inputs without intervention on our part.
        </li>
        <li>
          A single Lean kernel serves three ISAs and two apps: it is emitted as LLVM IR and
          compiled with each app&apos;s flags, with a maximum stack frame of <code>96 B</code>.
        </li>
        <li>
          On Vanadium, signing executes <code>14.6%</code> fewer RV32 instructions and loads{' '}
          <code>5%</code> fewer pages under an identical compiler profile.
        </li>
        <li>
          Cross-formalizing both apps was enough to surface the 11 bugs in Section 4.
        </li>
      </ul>

      <p>
        Reading notes. Measurements were taken under an emulator (Speculos), not on hardware. On
        Vanadium, the RAM and file-size reductions come mostly from build settings; the gain
        attributable to the code itself is <code>14.6%</code> on executed instructions. On BOLOS,
        sizes and latencies were measured on two different builds: we are re-running a full
        benchmark to remove any ambiguity.
      </p>

      <h2 className="section-heading">4. Bugs and Anomalies Found in Vanadium</h2>
      <p>
        While formalizing the C and Vanadium implementations, we spotted{' '}
        <strong>11 bugs or spec divergences</strong>. We haven&apos;t manually verified all of
        them, but they look solid—with the bug on the Vanadium side every time.
      </p>

      <div className="ldgr-issues-breakout not-prose">
        <div className="ldgr-issues-wrap">
          <table className="ldgr-issues-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Location</th>
                <th>Upstream status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {VANADIUM_ISSUES.map((issue) => (
                <tr key={issue.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <code>{issue.id}</code>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={sevClass(issue.severity)}>{issue.severityLabel}</span>
                  </td>
                  <td>
                    <div className="ldgr-loc-list">
                      {issue.locations.map((loc) => (
                        <a
                          key={loc.url}
                          href={loc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ldgr-loc-link"
                        >
                          <code>{loc.label}</code>
                        </a>
                      ))}
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                    {issue.reportedStatus}
                  </td>
                  <td>{issue.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="section-heading">5. Summary of Resources Invested (Initial Run)</h2>
      <p>
        The entire autonomous run (formalization, <code>turbo-lean</code> compiler patch, proofs of{' '}
        <code>2,494</code> theorems, C/Rust integration, and <code>maxwell</code> loops) ran in{' '}
        <strong>19.9 h</strong> wall-clock over the window captured below up to the main repo merge
        (including a 2-hour pause caused by an inference provisioning issue that I fixed manually)
        across <strong>30 active agents</strong> and <strong>25 microVMs</strong>:
      </p>

      <ul>
        <li>
          <strong>379.0 CPU hours</strong> of cumulative compute (<code>327.4 CPU-h</code> across
          25 ephemeral AMD Zen cloud microVMs + <code>51.6 CPU-h</code> on our dedicated server
          during active turns).
        </li>
        <li>
          <strong>654.9 GB RAM hours</strong> on ephemeral cloud VMs (<code>1,049.6 GB RAM-h</code>{' '}
          when including RAM reserved on our dedicated server during active turns).
        </li>
        <li>
          <strong>23.2M tokens / agent</strong> on average (<code>696.6M</code> cumulative tokens
          across <code>30</code> active agents: <code>1</code> coordinator + <code>29</code>{' '}
          subagents).
        </li>
      </ul>

      <p>
        At public Google API and OrcaRouter (for <code>GLM 5.3 uncensored</code>) rates on the
        inference side, and AWS EC2 On-Demand rates for VM rental, this run would cost roughly{' '}
        <strong>~$520 + ~$17</strong> (about <strong>~$537</strong> total), excluding personal
        infrastructure (our dedicated server and upstream training GPUs used to optimize the
        compiler, whose amortized share for this run remains negligible).
      </p>

      <OrbResourcesEmbed />
    </article>
  )
}
