export const PAGE_TITLE = 'Lean 4 Ledger'

export const REPO_URL = 'https://github.com/Th0rgal/lean-ledger-bitcoin'
export const BOLOS_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/bolos/patches/app-bitcoin-lean-opt.patch'
export const VANADIUM_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/vanadium/patches/vanadium-bitcoin-lean-opt.patch'
export const TURBO_LEAN_URL = 'https://github.com/Th0rgal/turbo-lean'

export const MERMAID_ARCHITECTURE = `flowchart TB
    subgraph Lean["lean-ledger-bitcoin (0 sorryAx)"]
        Spec["Spec.lean: 12 statements on the compiled kernel"]
        Kernel["Zero-alloc freestanding kernels<br/>BitcoinLedger/FreestandingKernels.lean<br/>(45 C-ABI exports · 0 runtime imports · 0 heap allocations)"]
        Turbo["turbo-lean: Lean → 32-bit LLVM IR<br/>(thumbv6m, thumbv8m.main, riscv32imac)"]
        Spec -->|"proofs"| Kernel
        Kernel --> Turbo
    end

    subgraph Bolos["Legacy C App (LedgerHQ/app-bitcoin)"]
        BUI["NBGL UI + APDU transport + BOLOS syscalls<br/>(kept in C)"]
        BELF["Clang / LLD LTO (-Oz -fropi -frwpi)<br/>Native ARM Thumb ELF (Nano S+ / Nano X)"]
        BUI --> BELF
    end

    subgraph Vanadium["New Rust V-App (LedgerHQ/vanadium)"]
        VUI["Ledger Flex UI + client ECALLs<br/>(kept in Rust)"]
        VELF["rustc + LLD (riscv32imac-unknown-none-elf)<br/>Encrypted / authenticated 256 B paged ELF (Merkle tree)"]
        VVM["app-vanadium RISC-V VM in the Secure Element<br/>(paged memory offloaded to the host)"]
        VUI --> VELF --> VVM
    end

    Turbo -->|"LLVM IR ARMv6-M / ARMv8-M"| BELF
    Turbo -->|"LLVM IR RV32IMAC"| VELF`

export interface BenchmarkChartItem {
  label: string
  origValue: string
  optValue: string
  optPct: number
  delta: string
}

export const RUST_BENCH_BARS: BenchmarkChartItem[] = [
  {
    label: 'Flash / code (PT_LOAD RX)',
    origValue: '299.3 KiB (1,198 pages)',
    optValue: '261.7 KiB (1,047 pages)',
    optPct: 87.42,
    delta: '-12.58%'
  },
  {
    label: 'Reserved RAM (static RW + stack budget)',
    origValue: '128.3 KiB (514 pages)',
    optValue: '64.3 KiB (258 pages)',
    optPct: 50.12,
    delta: '-49.88%'
  },
  {
    label: 'ELF binary size',
    origValue: '529.8 KiB',
    optValue: '262.1 KiB',
    optPct: 49.47,
    delta: '-50.53%'
  },
  {
    label: 'Executed instructions (RV32 · signing)',
    origValue: '234.2k insns',
    optValue: '200.0k insns',
    optPct: 85.4,
    delta: '-14.60%'
  },
  {
    label: 'PSBT signing latency (Flex · median)',
    origValue: '4,976 ms (1,325 page_loads)',
    optValue: '4,249 ms (1,232 page_loads)',
    optPct: 85.39,
    delta: '-14.61%'
  }
]

export const C_BENCH_BARS: BenchmarkChartItem[] = [
  {
    label: 'Flash / code (PT_LOAD RX · Nano S+)',
    origValue: '89.1 KiB (91,231 B)',
    optValue: '87.6 KiB (89,695 B)',
    optPct: 98.32,
    delta: '-1.68%'
  },
  {
    label: 'Static RAM (.bss + .data · Nano S+)',
    origValue: '6,376 B',
    optValue: '6,232 B',
    optPct: 97.74,
    delta: '-2.26%'
  },
  {
    label: 'Total RAM (RW + worst-case stack · Nano S+)',
    origValue: '18,872 B',
    optValue: '18,728 B (0 recursion)',
    optPct: 99.24,
    delta: '-0.76%'
  },
  {
    label: 'Emitted ARM Thumb instructions (Nano S+)',
    origValue: '30,364 insns',
    optValue: '29,898 insns',
    optPct: 98.47,
    delta: '-1.53%'
  },
  {
    label: 'Taproot PSBT latency (Nano S+ · ARMv8-M · median)',
    origValue: '2,436 ms',
    optValue: '2,435 ms',
    optPct: 99.96,
    delta: '-0.04%'
  },
  {
    label: 'Taproot PSBT latency (Nano X · ARMv6-M · median)',
    origValue: '2,438 ms',
    optValue: '2,592 ms',
    optPct: 106.34,
    delta: '+6.34%'
  }
]

export interface BenchmarkRow {
  metric: string
  origC: string
  patchedC: string
  origRust: string
  patchedRust: string
}

export const BENCHMARK_ROWS: BenchmarkRow[] = [
  {
    metric: 'Target / runtime',
    origC: 'Native BOLOS ARM Thumb (Nano S+ / X)',
    patchedC: 'Native BOLOS ARM Thumb (Nano S+ / X)',
    origRust: 'Vanadium RV32IMAC VM (Flex)',
    patchedRust: 'Vanadium RV32IMAC VM (Flex)'
  },
  {
    metric: 'Flash / code (PT_LOAD RX)',
    origC: '91,231 B (89.1 KiB · Nano S+)',
    patchedC: '89,695 B (87.6 KiB, -1.68% · Nano S+)',
    origRust: '306,522 B (299.3 KiB, 1,198 pages)',
    patchedRust: '267,954 B (261.7 KiB, -12.58%, 1,047 pages)'
  },
  {
    metric: 'ELF file size',
    origC: '158,004 B (154.3 KiB, stripped)',
    patchedC: '156,468 B (152.8 KiB, -0.97%)',
    origRust: '542,552 B (529.8 KiB)',
    patchedRust: '268,384 B (262.1 KiB, -50.53%)'
  },
  {
    metric: 'Static RAM (.bss + .data)',
    origC: '6,376 B (Nano S+)',
    patchedC: '6,232 B (-2.26% · Nano S+)',
    origRust: '65,836 B (64.3 KiB, 64 KiB heap)',
    patchedRust: '33,076 B (32.3 KiB, -49.76%, 32 KiB heap)'
  },
  {
    metric: 'Stack',
    origC: '12,496 B max (recursive qsort)',
    patchedC: '12,496 B max (0 recursion)',
    origRust: '65,536 B (64 KiB) allocated',
    patchedRust: '32,768 B (32 KiB) allocated (-50%)'
  },
  {
    metric: 'Total reserved RAM (static RW + stack budget)',
    origC: '18,872 B (Nano S+)',
    patchedC: '18,728 B (-0.76% · Nano S+)',
    origRust: '131,372 B (128.3 KiB, 514 pages)',
    patchedRust: '65,844 B (64.3 KiB, -49.88%, 258 pages)'
  },
  {
    metric: 'Peak heap allocation (peak_heap_bytes · signing)',
    origC: '—',
    patchedC: '—',
    origRust: 'not measured',
    patchedRust: '5,318 B'
  },
  {
    metric: 'Committed VM pages (vm_page_commits · signing)',
    origC: '—',
    patchedC: '—',
    origRust: '169',
    patchedRust: '155 (-8.28%)'
  },
  {
    metric: 'Instructions',
    origC: '30,364 emitted ARM insns',
    patchedC: '29,898 ARM insns (-1.53%)',
    origRust: '234,214 executed RV32 insns',
    patchedRust: '200,029 RV32 insns (-14.60%)'
  },
  {
    metric: 'Median Taproot signing latency (Speculos)',
    origC: '2,436 ms (Nano S+) / 2,438 ms (Nano X)',
    patchedC: '2,435 ms (-0.04%) / 2,592 ms (+6.34%)',
    origRust: '4,976 ms (1,325 page_loads)',
    patchedRust: '4,249 ms (-14.61%, 1,232 page_loads)'
  },
  {
    metric: 'Median SIGN_PSBT multisig wsh(3-of-5) latency (3 in, Speculos)',
    origC: '7,304 ms (Nano S+) / 7,944 ms (Nano X)',
    patchedC: '7,598 ms (+4.03%) / 8,065 ms (+1.52%)',
    origRust: '—',
    patchedRust: '—'
  },
  {
    metric: 'Test suites & proofs',
    origC: '30 ctest + Ragger',
    patchedC: '31/31 ctest + mainnet 2/2 + testnet suite (282 tests) running',
    origRust: '—',
    patchedRust: 'app 90/90 + common 85/85 + 11 fixes'
  }
]

export interface IssueLocation {
  label: string
  url: string
}

export interface VanadiumIssue {
  id: string
  severity: 'High' | 'Medium' | 'Low'
  severityLabel: string
  locations: IssueLocation[]
  reportedStatus: string
  description: string
}

const VANADIUM_BLOB =
  'https://github.com/LedgerHQ/vanadium/blob/ace8e96982408959dea9e7fbc59ee36e8c54e645'
const BIP388_BLOB =
  'https://github.com/bigspider/bip388/blob/c19282ad0fac28e9206436a2b44b9f44f5c59b4d'

export const VANADIUM_ISSUES: VanadiumIssue[] = [
  {
    id: 'VND-01',
    severity: 'High',
    severityLabel: 'High',
    locations: [
      {
        label: 'common/src/script.rs:367',
        url: `${VANADIUM_BLOB}/apps/bitcoin/common/src/script.rs#L367-L373`
      }
    ],
    reportedStatus: 'Unreported',
    description:
      'andor(X, Y, Z) is compiled as [X] OP_NOTIF [Y] OP_ELSE [Z] OP_ENDIF instead of the BIP-379 [X] OP_NOTIF [Z] OP_ELSE [Y] OP_ENDIF. The device derives a different script and address than Bitcoin Core and app-bitcoin for the same policy, and the spending branches are swapped.'
  },
  {
    id: 'VND-02',
    severity: 'Low',
    severityLabel: 'Low',
    locations: [
      {
        label: 'fastpsbt.rs:1052',
        url: `${VANADIUM_BLOB}/apps/bitcoin/common/src/fastpsbt.rs#L1052-L1054`
      },
      {
        label: 'analyze.rs:434',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/handlers/sign_psbt/analyze.rs#L433-L470`
      }
    ],
    reportedStatus: 'Unreported · fixed upstream since (PR #301)',
    description:
      'Unbounded u64 satoshi sums (missing MAX_MONEY bounds) and unchecked u64 as i64 casts on per-account balances — a defense-in-depth / specification gap reachable under a malformed host PSBT, now bounded in the patched kernel.'
  },
  {
    id: 'VND-03',
    severity: 'High',
    severityLabel: 'High',
    locations: [
      {
        label: 'analyze.rs:153',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/handlers/sign_psbt/analyze.rs#L153-L172`
      },
      {
        label: 'analyze.rs:223',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/handlers/sign_psbt/analyze.rs#L223-L253`
      }
    ],
    reportedStatus: 'Unreported',
    description:
      'For SegWit v0 inputs carrying both non_witness_utxo and witness_utxo, only the txid is checked: the witness_utxo amount and script are never compared with the referenced output (CVE-2020-14199 class), unlike app-bitcoin. Taproot inputs are unaffected.'
  },
  {
    id: 'VND-04',
    severity: 'Medium',
    severityLabel: 'Medium',
    locations: [
      {
        label: 'common/src/fastpsbt.rs:602',
        url: `${VANADIUM_BLOB}/apps/bitcoin/common/src/fastpsbt.rs#L602-L633`
      }
    ],
    reportedStatus: 'Unreported',
    description:
      'Non-compliant BIP-370 nLockTime computation: accepts zero height locks, rejects dual-locked inputs, and lets fallback_locktime overwrite a block-height lock into a timestamp. Impact is interoperability, not loss of funds.'
  },
  {
    id: 'VND-05',
    severity: 'Medium',
    severityLabel: 'Medium',
    locations: [
      {
        label: 'common/src/script.rs:145',
        url: `${VANADIUM_BLOB}/apps/bitcoin/common/src/script.rs#L145-L170`
      }
    ],
    reportedStatus: 'Unreported',
    description:
      'sh(wsh(...)) policies succeed during register_account, then unconditionally fail during address derivation and PSBT signing.'
  },
  {
    id: 'VND-06',
    severity: 'Medium',
    severityLabel: 'Medium',
    locations: [
      {
        label: 'bip388/src/lib.rs:5',
        url: `${BIP388_BLOB}/src/lib.rs#L5-L8`
      }
    ],
    reportedStatus: 'Known gap (upstream TODO)',
    description:
      'Missing BIP-379 Miniscript B/V/K/W typechecking, non-malleability enforcement, height/time timelock mixing checks, and BIP-68 older(n) flag masking — now fully enforced in the patched V-App via llb_miniscript_check_postfix.'
  },
  {
    id: 'VND-07',
    severity: 'Low',
    severityLabel: 'Low',
    locations: [
      {
        label: 'get_extended_pubkey.rs:138',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/handlers/get_extended_pubkey.rs#L138-L140`
      },
      {
        label: 'get_extended_pubkey.rs:161',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/handlers/get_extended_pubkey.rs#L161`
      }
    ],
    reportedStatus: 'Unreported · fixed upstream since (PR #301)',
    description:
      'Off-by-one len() > 256 guard followed by u8 cast: a 256-step BIP-32 path wraps to depth = 0 in the serialized xpub.'
  },
  {
    id: 'VND-08',
    severity: 'Low',
    severityLabel: 'Low',
    locations: [
      {
        label: 'musig_signing.rs:463',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/handlers/musig_signing.rs#L463-L466`
      }
    ],
    reportedStatus: 'Unreported · fixed upstream since (PR #301)',
    description:
      'In MuSig2 Round 2, the recomputed local pubnonce is not verified against PSBT_IN_MUSIG2_PUB_NONCE before emitting a partial signature.'
  },
  {
    id: 'VND-09',
    severity: 'Low',
    severityLabel: 'Low',
    locations: [
      {
        label: 'main.rs:26',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/main.rs#L26`
      }
    ],
    reportedStatus: 'todo!() in code · fixed upstream since (PR #301)',
    description:
      'Request::GetVersion panics via todo!(): a host can crash the app with a single request.'
  },
  {
    id: 'VND-10',
    severity: 'Low',
    severityLabel: 'Low',
    locations: [
      {
        label: 'display.rs:167',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/handlers/sign_psbt/display.rs#L167`
      }
    ],
    reportedStatus: 'Unreported',
    description:
      'Any PSBT with an OP_RETURN output is rejected during display, so such transactions cannot be signed.'
  },
  {
    id: 'VND-11',
    severity: 'Low',
    severityLabel: 'Low',
    locations: [
      {
        label: 'fastpsbt.rs:231',
        url: `${VANADIUM_BLOB}/apps/bitcoin/common/src/fastpsbt.rs#L231-L250`
      }
    ],
    reportedStatus: 'Unreported · fixed upstream since (PR #301)',
    description:
      'Non-canonical CompactSize encodings are accepted by the PSBT parser.'
  }
]

export function renderMarkdown(): string {
  const lines: string[] = [
    '# Lean 4 Ledger',
    '',
    'Our thesis is that it is already viable today to rewrite existing software in Lean 4 to obtain a formally proved binary that is both more compact and faster. Yesterday, Vincent and Guillaume suggested starting with Ledger\'s Bitcoin application; here is the result.',
    '',
    '**Important:** this is a one-day POC—the specs are not complete, there are other important properties worth formally verifying, and this would require more review on our side as well as validation of our modeling choices on yours.',
    '',
    '## 1. Methodology and Architecture',
    '',
    'In terms of human time, I had already looked into it a bit when Charles mentioned it to me and had a rough idea of the Ledger stack: it took me about **1 h** upfront to frame the problem, lay down the high-level specs, and design the pipeline, **15 min** this morning to unblock an inference routing issue, and **1 h** at the end to review and polish everything. Everything else ran autonomously.',
    '',
    'Ledger maintains two Bitcoin apps: the legacy C app (`LedgerHQ/app-bitcoin`), compiled natively to the microcontroller\'s instruction set on top of BOLOS, and the new Rust V-App (`LedgerHQ/vanadium`), compiled to 32-bit RISC-V (`RV32IMAC`) and executed inside a VM running on BOLOS (to stream the app\'s code and data from the host, if I understood correctly).',
    '',
    'Rather than touching the UI or APDU/ECALL transport (rewriting the UI in Lean 4 would have little value), we kept the original UI and I/O in each app and focused the effort on the shared logic where most of the attack surface lives. The result, [Th0rgal/lean-ledger-bitcoin](https://github.com/Th0rgal/lean-ledger-bitcoin), contains two things of interest for you:',
    '',
    '- **A Lean kernel compiled into both apps** ([`FreestandingKernels.lean`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/main/BitcoinLedger/FreestandingKernels.lean)): this is the Lean code actually executed on the device. [`turbo-lean`](https://github.com/Th0rgal/turbo-lean) compiles it to 32-bit LLVM IR, replacing the sensitive paths we rewrote in each app.',
    '- **A short spec on this kernel** ([`Spec.lean`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/main/Spec.lean), 12 statements): each statement targets a compiled function, and its proof is checked by Lean (`0 sorryAx`). It currently covers `17` of the kernel\'s `45` functions.',
    '',
    'The integrations fit into two patches: [`app-bitcoin-lean-opt.patch`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/bolos/patches/app-bitcoin-lean-opt.patch) on the BOLOS side and [`vanadium-bitcoin-lean-opt.patch`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/vanadium/patches/vanadium-bitcoin-lean-opt.patch) on the Vanadium side. The remaining C/Rust is the original code, lightly patched (around 200 lines modified on the C side and 700 on the Rust side, excluding tests). It does three things: calls the Lean kernel in place of the original checks, parses PSBTs and scripts, and talks to the hardware (keys, crypto, screen, and transport go through BOLOS syscalls). For that OS-facing part, using Lean wouldn\'t make sense; for the parsers, however, I think it would be a good idea. It\'s more work, but it would be worth it since they lend themselves well to formal verification.',
    '',
    '```mermaid',
    MERMAID_ARCHITECTURE,
    '```',
    '',
    '## 2. Execution Plan',
    '',
    '1) **Specs and cross-testing**: formalization in Lean 4, followed by an executable kernel refined in a loop against both repos\' test suites.',
    '2) **32-bit LLVM backend in [`turbo-lean`](https://github.com/Th0rgal/turbo-lean)**: allocation-free support for `thumbv6m`, `thumbv8m.main`, and `riscv32imac`. Going through LLVM IR felt safer than emitting assembly directly. This compilation chain is not yet proved end-to-end (it is checked via differential testing). Proving it would be relatively expensive in inference, but it would be a good investment since it only needs to be done once.',
    '3) **Integration**: minimal FFI shim in each app, original UI and I/O preserved, kernel linked with LTO.',
    '4) **`maxwell` optimization loop**: iterations on reproducible benchmarks, with proofs and tests green, to get below the baselines.',
    '',
    '## 3. Results',
    '',
    'Here is the spec. It only covers code actually compiled into the apps and is not complete, but it illustrates what is possible:',
    '',
    '- [Transaction amounts: the kernel returns "valid" if and only if the amount is at most 21 million BTC. For a sum or difference, it returns "valid" if and only if the exact mathematical result stays between 0 and this cap, and in that case returns the exact result.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L32-L51)',
    '- [Display: splitting an amount into BTC and satoshis without division is exact for every 64-bit amount.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L53-L57)',
    '- [Derivation paths: the kernel classifies a path element as "hardened" if and only if it is at least 2^31, and rejects paths longer than 10 elements on BOLOS or 16 on Vanadium.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L61-L72)',
    '- [Addresses: the kernel returns "valid" for a SegWit program in the exact allowed cases—20 or 32 bytes for version 0, and 2 to 40 bytes for versions 1 through 16.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L76-L82)',
    '- [Requested signature types: the kernel returns "valid" if and only if the sighash is ALL, NONE, or SINGLE, with or without ANYONECANPAY, plus DEFAULT for Taproot.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L93-L104)',
    '- [Transaction parsing: the kernel returns "valid" for a length prefix (CompactSize) if and only if it uses the shortest canonical encoding.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/85ea35961b919bf1e2ff90644b5d0e6f858e5e74/Spec.lean#L108-L116)',
    '',
    'Each statement is an "if and only if" or an equality, paired with one accepted example and one rejected example.',
    '',
    'On the performance side, we didn\'t go out of our way to optimize—especially since we go through LLVM rather than targeting the final hardware directly—yet we still get interesting numbers thanks to a few measurement and tuning iterations. The Lean 4 patched binary is smaller on both targets and faster on Vanadium; on BOLOS, latency is unchanged on Nano S+ and higher on Nano X:',
    '',
    '| Metric | Baseline C (`app-bitcoin`) | Lean 4 + C | Baseline Rust (`vanadium`) | Lean 4 + Rust |',
    '|---|---|---|---|---|',
    ...BENCHMARK_ROWS.map(
      (r) => `| **${r.metric}** | ${r.origC} | **${r.patchedC}** | ${r.origRust} | **${r.patchedRust}** |`
    ),
    '',
    'What stands out to us:',
    '',
    '- The `BIP-370` `nLockTime` computation—where Vanadium appears to have a bug (to be confirmed with you)—was proved compliant with the rule for any list of inputs without intervention on our part.',
    '- A single Lean kernel serves three ISAs and two apps: it is emitted as LLVM IR and compiled with each app\'s flags, with a maximum stack frame of `96 B`.',
    '- On Vanadium, signing executes `14.6%` fewer RV32 instructions and loads `5%` fewer pages under an identical compiler profile.',
    '- Cross-formalizing both apps was enough to surface the 11 bugs in Section 4.',
    '',
    'Reading notes. Measurements were taken under an emulator (Speculos), not on hardware. On Vanadium, the RAM and file-size reductions come mostly from build settings; the gain attributable to the code itself is `14.6%` on executed instructions. On BOLOS, sizes and latencies were measured on two different builds: we are re-running a full benchmark to remove any ambiguity.',
    '',
    'Video (a Taproot signature on Speculos Flex, cumulative executed RV32 instructions: 234,214 vs. 200,692, −14.3%): https://share.thomas.md/leanldgr/vanadium-trace-v2.mp4',
    '',
    '## 4. Bugs and Anomalies Found in Vanadium',
    '',
    'While formalizing the C and Vanadium implementations, we spotted **11 bugs or spec divergences**. We haven\'t manually verified all of them, but they look solid—with the bug on the Vanadium side every time.',
    '',
    '| ID | Severity | Location | Upstream status | Description |',
    '|---|---|---|---|---|',
    ...VANADIUM_ISSUES.map((i) => {
      const locs = i.locations.map((l) => `[\`${l.label}\`](${l.url})`).join(' · ')
      return `| \`${i.id}\` | ${i.severityLabel} | ${locs} | ${i.reportedStatus} | ${i.description} |`
    }),
    '',
    '## 5. Summary of Resources Invested (Initial Run)',
    '',
    'The entire autonomous run (formalization, `turbo-lean` compiler patch, proofs of `2,494` theorems, C/Rust integration, and `maxwell` loops) ran in **19.9 h** wall-clock over the window captured below up to the main repo merge (including a 2-hour pause caused by an inference provisioning issue that I fixed manually) across **30 active agents** and **25 microVMs**:',
    '',
    '- **379.0 CPU hours** of cumulative compute (`327.4 CPU-h` across 25 ephemeral AMD Zen cloud microVMs + `51.6 CPU-h` on our dedicated server during active turns).',
    '- **654.9 GB RAM hours** on ephemeral cloud VMs (`1,049.6 GB RAM-h` when including RAM reserved on our dedicated server during active turns).',
    '- **23.2M tokens / agent** on average (`696.6M` cumulative tokens across `30` active agents: `1` coordinator + `29` subagents).',
    '',
    'At public Google API and OrcaRouter (for `GLM 5.3 uncensored`) rates on the inference side, and AWS EC2 On-Demand rates for VM rental, this run would cost roughly **~$520 + ~$17** (about **~$537** total), excluding personal infrastructure (our dedicated server and upstream training GPUs used to optimize the compiler, whose amortized share for this run remains negligible).',
    ''
  ]
  return lines.join('\n')
}
