import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import {
  AUDIT_FINDINGS,
  EELS_BLOB,
  GLOAS_BLOB,
  MERMAID_PIPELINE,
  OPEN_QUESTIONS,
  PAGE_TITLE,
  TRACK_SUMMARIES,
  VARIANT_ROWS
} from './data'
import './glamsterdam.css'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    'Lean 4.31 formal verification of Ethereum Glamsterdam executable specs (EIP-8037/8038/2780/7778, EIP-8246, and Gloas EIP-7732/8282): methodology, variant comparison, findings, and open questions.',
  alternates: {
    canonical: 'https://share.thomas.md/glamsterdam'
  },
  robots: { index: false },
  openGraph: {
    title: PAGE_TITLE,
    description:
      'What we modeled in Lean 4 across Glamsterdam gas repricing, EIP-8246, and ePBS, what surfaced along the way, and what we still need to verify next.',
    url: 'https://share.thomas.md/glamsterdam',
    type: 'article'
  }
}

function sevClass(sev: 'High' | 'Medium' | 'Low'): string {
  if (sev === 'High') return 'sev-badge sev-high'
  if (sev === 'Medium') return 'sev-badge sev-medium'
  return 'sev-badge sev-low'
}

export default function GlamsterdamReportPage() {
  return (
    <article className="is-posts glam-article">
      <h1 className="title-display">{PAGE_TITLE}</h1>

      <div className="report-subtitle not-prose">
        <span>Lean 4.31 + turbo-lean</span>
        {' · '}
        <span>60 guarantees · 10 spec refuters · 0 sorryAx</span>
        {' · '}
        <a href="/glamsterdam.md">Raw .md</a>
      </div>

      <p>
        Across our three Glamsterdam formal verification tracks with Ethereum Foundation leads—
        <strong>2D state gas</strong> (<code>EIP-8037 / 8038 / 2780 / 7778</code>),{' '}
        <strong>account cleanup &amp; ETH conservation</strong> (<code>EIP-8246</code>), and{' '}
        <strong>ePBS + builder queues</strong> (<code>Gloas EIP-7732 / 8282</code>)—we built a
        unified Lean 4.31 model to machine-check core invariants, stress-test competing spec PRs,
        and surface edge-case interactions early.
      </p>

      <p>
        <strong>Important:</strong> our role here is Lean 4 proof engineering and AI-assisted
        formalization, not Ethereum protocol design. Every theorem below is proved relative to the
        pinned specs and explicit assumptions—validating with EF authors that those statements match
        what Ethereum actually needs is the part human review cannot skip.
      </p>

      <h2 className="section-heading">1. What we modeled in Lean 4 (and how)</h2>

      <p>
        A frequent failure mode in formal verification is proving theorems over a clean hand-written
        abstraction that quietly diverges from the real spec. Rather than modeling prose EIPs in
        isolation, we translated the <strong>executable Python reference specifications</strong>{' '}
        function-by-function into Lean 4, and treated the prose EIPs as the normative intent to
        check against:
      </p>

      <ul>
        <li>
          <strong>Execution Layer (executable Python code):</strong>{' '}
          <a href={`${EELS_BLOB}/src/ethereum/forks/amsterdam`} target="_blank" rel="noopener noreferrer">
            <code>ethereum/execution-specs@16898000</code>
          </a>{' '}
          (<code>vm/gas.py</code>, <code>state_tracker.py</code>, <code>vm/interpreter.py</code>,{' '}
          <code>vm/instructions/storage.py</code>, <code>vm/instructions/system.py</code>,{' '}
          <code>vm/eoa_delegation.py</code>, <code>block_access_lists.py</code>,{' '}
          <code>fork.py</code>), extended with a fork-parameterized multi-frame call-tree model
          comparing <code>Osaka</code>, <code>Amsterdam D0</code>,{' '}
          <a href="https://github.com/ethereum/EIPs/pull/12581" target="_blank" rel="noopener noreferrer">
            <code>EIPs#12581</code>
          </a>{' '}
          (<code>D1..D13R</code>),{' '}
          <a href="https://github.com/ethereum/EIPs/pull/12582" target="_blank" rel="noopener noreferrer">
            <code>EIPs#12582</code>
          </a>{' '}
          (<code>D13S / D13A</code>), and Nethermind’s C# prototype PRs (
          <code>#15186 / #15187 / #15203</code>).
        </li>
        <li>
          <strong>Consensus Layer (executable <code>pyspec</code> blocks):</strong>{' '}
          <a href={`${GLOAS_BLOB}/specs/gloas`} target="_blank" rel="noopener noreferrer">
            <code>ethereum/consensus-specs@aa16bb4c</code>
          </a>{' '}
          (<code>v1.7.0-beta.4</code>, <code>specs/gloas/beacon-chain.md</code> and{' '}
          <code>specs/gloas/fork.md</code>; <code>fork-choice.md</code> and P2P gossip are
          explicitly out of scope).
        </li>
        <li>
          <strong>Two-way trust gates in <code>turbo-lean</code>:</strong> downward to Python,{' '}
          <code>61/61</code> Lean definitions are SHA256-locked to upstream file/line slices,
          exported via C-ABI (<code>@[export]</code>), and differentially tested against
          AST-extracted upstream Python (<code>pytest</code>); upward to theorems, every guarantee
          requires positive/negative witnesses and a 1-line bug mutation kill-test (
          <code>WitnessRefuter</code>) so a mis-stated theorem cannot pass vacuously.
        </li>
      </ul>

      <Mermaid chart={MERMAID_PIPELINE} />

      <h2 className="section-heading">2. Verification scope across the three tracks</h2>

      <p>
        Following feedback from EF leads in late October—Maria’s scoping answers on 2D gas and
        7702/7778, Paweł and Benjamin’s discussion on 8246 storage cleanup, and Potuz’s push to
        anchor ePBS around supply neutrality and preservation of pre-existing CL guarantees rather
        than isolated bug cases—the closure splits across three tracks:
      </p>

      <div className="glam-wide-breakout not-prose">
        <div className="glam-tracks-grid">
          {TRACK_SUMMARIES.map((t) => (
            <div key={t.id} className="glam-track-card">
              <div className="glam-track-head">
                <div className="glam-track-title-row">
                  <span className="glam-track-title">{t.title}</span>
                  <span className="glam-track-pill">{t.guaranteesCount}</span>
                </div>
                <span className="glam-track-sub">{t.sub}</span>
              </div>

              <div className="glam-track-meta">
                <div>
                  <strong>Contacts:</strong> {t.lead}
                </div>
                <div>
                  <strong>Source:</strong> <code>{t.sourceTarget}</code>
                </div>
              </div>

              <ul className="glam-track-list">
                {t.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>

              <div className="glam-track-foot">{t.footer}</div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="section-heading">3. What the proofs surfaced along the way</h2>

      <h3 className="subsection-heading">3.1 Comparing EIP-8037 / 8038 refill variants in Lean</h3>
      <p>
        With Glamsterdam paused while ACD evaluates options for <code>EIP-8037 / 8038</code> (
        <a
          href="https://blog.ethereum.org/2026/11/06/glamsterdam-8037-8038"
          target="_blank"
          rel="noopener noreferrer"
        >
          6 Nov EF update
        </a>{' '}
        and{' '}
        <a
          href="https://github.com/ethereum/glamsterdam-gas-invariants"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>glamsterdam-gas-invariants</code>
        </a>
        ), the most immediately useful part of the Gas model is putting <code>D0</code>,{' '}
        <code>#12581</code>, and <code>#12582</code> side by side on the exact multi-frame call
        trees where silent child failure or <code>gasleft()</code> jumps appear:
      </p>

      <div className="glam-wide-breakout not-prose">
        <div className="glam-table-wrap">
          <table className="glam-table">
            <thead>
              <tr>
                <th>Variant</th>
                <th>Set-Call-Clear (T2)</th>
                <th>Pre-Call Clear (T1) / CREATE</th>
                <th>Sibling gasleft()</th>
                <th>Callee / DELEGATECALL Reservoir</th>
                <th>Takeaway</th>
              </tr>
            </thead>
            <tbody>
              {VARIANT_ROWS.map((row) => (
                <tr key={row.variant}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <strong>{row.variant}</strong>
                    <div className="glam-thm">{row.source}</div>
                  </td>
                  <td>{row.setCallClearT2}</td>
                  <td>{row.preCallClearT1}</td>
                  <td>{row.siblingGasLeft}</td>
                  <td>{row.delegateCallAllowance}</td>
                  <td>{row.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="subsection-heading">3.2 Spec &amp; prototype edge cases (unshipped Glamsterdam targets)</h3>
      <p>
        Translating the pinned Python specs and candidate C# prototype into Lean surfaced{' '}
        <strong>10 concrete edge cases and cross-EIP interactions</strong>—each backed by an
        in-kernel counterexample witness (and a <code>pyspec</code> test for the Gloas slashing
        case). None affect live mainnet; all sit on unshipped Glamsterdam branches:
      </p>

      <div className="glam-wide-breakout not-prose">
        <div className="glam-table-wrap">
          <table className="glam-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Track</th>
                <th>Severity</th>
                <th>Upstream Location</th>
                <th>Description &amp; Formal Witness</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_FINDINGS.map((f) => (
                <tr key={f.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <code>{f.id}</code>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
                    {f.track}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={sevClass(f.severity)}>{f.severityLabel}</span>
                  </td>
                  <td>
                    <div className="glam-loc-list">
                      {f.locations.map((loc) => (
                        <a
                          key={loc.url}
                          href={loc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glam-loc-link"
                        >
                          <code>{loc.label}</code>
                        </a>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div>{f.description}</div>
                    <div className="glam-thm">{f.theorem}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="section-heading">4. Remaining gaps &amp; what we still need from EF</h2>

      <p>
        To keep trust high, we want to be equally explicit about what our 60 theorems do{' '}
        <strong>not</strong> cover yet:
      </p>

      <ul>
        <li>
          <strong>Off-chain <code>eth_estimateGas</code> / 4337 simulation above <code>2^24</code>:</strong>{' '}
          estimators that binary-search on <code>gasleft()</code> deltas miss state-gas reservoir
          draws once <code>tx.gas &gt; 16,777,216</code>, and a fixed-budget subcall (such as the
          Uniswap v4 <code>notifyUnsubscribe&#123;gas: 150_000&#125;</code> repro) can fail below{' '}
          <code>2^24</code> yet succeed above it. This RPC/estimator layer is not yet a Lean theorem.
        </li>
        <li>
          <strong>Full <code>INV-8</code> 7702 replay trace:</strong> we proved the empty-leaf{' '}
          <code>account_exists == is_account_alive</code> equivalence and pre-dispatch OOG ordering,
          not yet the full end-to-end trace where a 7702 delegation OOGs inside a mined transaction
          and the signed authorization is replayed.
        </li>
        <li>
          <strong>Deployed-bytecode blast radius:</strong> scanning mainnet/L2 contracts belongs to
          the ongoing ChainSecurity, Dedaub, and app-team audits (plus EF’s repricing tool); our
          lever is proving protocol-level invariants and fast candidate fixes.
        </li>
      </ul>

      <p>
        Before locking the next verification pass—or verifying draft patches ahead of{' '}
        <strong>ACDT #103 (16 Nov)</strong> and <strong>ACDE (19 Nov)</strong>—here is the concrete
        input we need from each group:
      </p>

      <div className="glam-questions-grid not-prose">
        {OPEN_QUESTIONS.map((q) => (
          <div key={q.group} className="glam-q-card">
            <div className="glam-q-head">
              <span className="glam-q-title">{q.group}</span>
              <span className="glam-q-contacts">{q.contacts}</span>
            </div>
            <ul className="glam-q-list">
              {q.questions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  )
}
