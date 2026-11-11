export const PAGE_TITLE = 'Lean 4 Ledger'

export const MERMAID_ARCHITECTURE = `flowchart TB
    subgraph Lean["Kernel commun en Lean 4 (0 sorryAx)"]
        Spec["Specs unifiées BIP-32 / 143 / 341 / 370 / 379 / 388"]
        Kernel["Kernel freestanding zero-alloc<br/>BitcoinLedger/FreestandingKernels.lean"]
        Turbo["turbo-lean (backend LLVM 32-bit)"]
        Spec --> Kernel --> Turbo
    end

    subgraph Bolos["App historique C (LedgerHQ/app-bitcoin)"]
        BUI["UI NBGL + transport APDU + syscalls BOLOS<br/>(conservés en C)"]
        BELF["Clang / LLD LTO (-Oz -fropi -frwpi)<br/>ELF natif ARM Thumb (Nano S+ / Nano X)"]
        BUI --> BELF
    end

    subgraph Vanadium["Nouvelle V-App Rust (LedgerHQ/vanadium)"]
        VUI["UI Ledger Flex + client ECALLs<br/>(conservés en Rust)"]
        VELF["rustc + LLD (riscv32imac-unknown-none-elf)<br/>ELF paginé 256 B (Merkle tree)"]
        VVM["VM RISC-V app-vanadium sur BOLOS"]
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
    origValue: '306,0 KiB (1 196 pages)',
    optValue: '244,4 KiB (955 pages)',
    optPct: 79.85,
    delta: '-20,2 %'
  },
  {
    label: 'RAM totale (RW + stack)',
    origValue: '128,3 KiB (514 pages)',
    optValue: '64,3 KiB (258 pages)',
    optPct: 50.11,
    delta: '-49,9 %'
  },
  {
    label: 'Taille du binaire ELF',
    origValue: '529,4 KiB',
    optValue: '239,0 KiB',
    optPct: 45.15,
    delta: '-54,9 %'
  },
  {
    label: 'Instructions exécutées (RV32)',
    origValue: '234,2 k insns',
    optValue: '192,6 k insns',
    optPct: 82.24,
    delta: '-17,8 %'
  },
  {
    label: 'Latence signature PSBT (Flex)',
    origValue: '2 605 ms (1 384 page_loads)',
    optValue: '2 019 ms (1 085 page_loads)',
    optPct: 77.5,
    delta: '-22,5 %'
  }
]

export const C_BENCH_BARS: BenchmarkChartItem[] = [
  {
    label: 'Flash / code (PT_LOAD RX)',
    origValue: '89,1 KiB (91 231 B)',
    optValue: '87,6 KiB (89 695 B)',
    optPct: 98.32,
    delta: '-1,7 %'
  },
  {
    label: 'RAM statique (.bss + .data)',
    origValue: '6 376 B',
    optValue: '6 232 B',
    optPct: 97.74,
    delta: '-2,3 %'
  },
  {
    label: 'RAM totale (RW + worst-case stack)',
    origValue: '18 872 B',
    optValue: '18 728 B (0 récursion)',
    optPct: 99.24,
    delta: '-0,8 %'
  },
  {
    label: 'Instructions ARM Thumb émises',
    origValue: '30 364 insns',
    optValue: '29 729 insns',
    optPct: 97.91,
    delta: '-2,1 %'
  },
  {
    label: 'Latence PSBT (Nano X / Nano S+)',
    origValue: '2 824 ms / 4 680 ms',
    optValue: '2 180 ms / 4 039 ms',
    optPct: 77.2,
    delta: '-22,8 %'
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
    origC: 'BOLOS natif ARM Thumb (Nano S+ / X)',
    patchedC: 'BOLOS natif ARM Thumb (Nano S+ / X)',
    origRust: 'VM Vanadium RV32IMAC (Flex)',
    patchedRust: 'VM Vanadium RV32IMAC (Flex)'
  },
  {
    metric: 'Flash / code (PT_LOAD RX)',
    origC: '91 231 B',
    patchedC: '89 695 B (-1,68 %)',
    origRust: '306 008 B (1 196 pages, depth 11)',
    patchedRust: '244 350 B (-20,15 %, 955 pages, depth 10)'
  },
  {
    metric: 'Taille du fichier ELF',
    origC: '158 004 B (stripped)',
    patchedC: '156 468 B (-1,54 KiB)',
    origRust: '542 092 B',
    patchedRust: '244 780 B (-54,85 %)'
  },
  {
    metric: 'RAM statique (.bss + .data)',
    origC: '6 376 B',
    patchedC: '6 232 B (-144 B / -2,26 %)',
    origRust: '65 836 B (heap 64 KiB)',
    patchedRust: '33 068 B (-49,77 %, heap 32 KiB)'
  },
  {
    metric: 'Stack',
    origC: '12 496 B max (qsort récursif)',
    patchedC: '12 496 B max (0 récursion, -256 B register_wallet)',
    origRust: '65 536 B alloués',
    patchedRust: '32 768 B alloués (-50 %, 0 B stack frame Lean)'
  },
  {
    metric: 'RAM totale réservée (RW + stack)',
    origC: '18 872 B',
    patchedC: '18 728 B (-144 B, stack bornée)',
    origRust: '131 372 B (514 pages)',
    patchedRust: '65 836 B (-49,89 %, 258 pages)'
  },
  {
    metric: 'Instructions',
    origC: '30 364 insns ARM émises',
    patchedC: '29 729 insns ARM (-2,09 %)',
    origRust: '234 238 insns RV32 exécutées',
    patchedRust: '192 632 insns RV32 (-17,76 %)'
  },
  {
    metric: 'Latence signature Taproot PSBT (Speculos)',
    origC: '4 680 ms (Nano S+) / 2 824 ms (Nano X)',
    patchedC: '4 039 ms (-13,7 %) / 2 180 ms (-22,8 %)',
    origRust: '2 605 ms (1 384 page_loads)',
    patchedRust: '2 019 ms (-22,52 %, 1 085 page_loads)'
  },
  {
    metric: 'Test suites & preuves',
    origC: '30 ctest + 277 Ragger',
    patchedC: '31/31 ctest + 277/277 Ragger + 2 405 théorèmes',
    origRust: '166 tests (unit + Speculos)',
    patchedRust: '176/176 tests + 9 fixes prouvés'
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
    severityLabel: 'Critical',
    locations: [
      {
        label: 'common/src/script.rs:367',
        url: `${VANADIUM_BLOB}/apps/bitcoin/common/src/script.rs#L367-L373`
      }
    ],
    reportedStatus: 'Unreported',
    description:
      'andor(X, Y, Z) compiles to OP_NOTIF [Y] OP_ELSE [Z] OP_ENDIF instead of [Z] then [Y] (BIP-379), inverting the true/false spending branches relative to Bitcoin Core and app-bitcoin.'
  },
  {
    id: 'VND-02',
    severity: 'High',
    severityLabel: 'Critical',
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
    reportedStatus: 'Unreported',
    description:
      'Unbounded u64 satoshi sums (missing MAX_MONEY bounds) and unchecked u64 as i64 casts on per-account balances allow integer overflow and sign flips.'
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
      'When both non_witness_utxo and witness_utxo are supplied on an input, their prevout equality is never checked (CVE-2020-14199 class), unlike app-bitcoin.'
  },
  {
    id: 'VND-04',
    severity: 'High',
    severityLabel: 'High',
    locations: [
      {
        label: 'common/src/fastpsbt.rs:602',
        url: `${VANADIUM_BLOB}/apps/bitcoin/common/src/fastpsbt.rs#L602-L633`
      }
    ],
    reportedStatus: 'Unreported',
    description:
      'Non-compliant BIP-370 nLockTime computation: accepts zero height locks, rejects dual-locked inputs, and lets fallback_locktime overwrite a block-height lock into a timestamp.'
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
      },
      {
        label: 'register_account.rs:189',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/handlers/register_account.rs#L189-L190`
      }
    ],
    reportedStatus: 'Partial TODO (0 issues)',
    description:
      'Missing Miniscript B/V/K/W typechecking, non-malleability enforcement, height/time timelock mixing checks, and BIP-68 older(n) flag masking.'
  },
  {
    id: 'VND-07',
    severity: 'Medium',
    severityLabel: 'Medium',
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
    reportedStatus: 'Unreported',
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
    reportedStatus: 'Unreported',
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
      },
      {
        label: 'display.rs:167',
        url: `${VANADIUM_BLOB}/apps/bitcoin/app/src/handlers/sign_psbt/display.rs#L167`
      },
      {
        label: 'fastpsbt.rs:231',
        url: `${VANADIUM_BLOB}/apps/bitcoin/common/src/fastpsbt.rs#L231-L250`
      },
      {
        label: 'fastpsbt.rs:1046',
        url: `${VANADIUM_BLOB}/apps/bitcoin/common/src/fastpsbt.rs#L1046-L1048`
      }
    ],
    reportedStatus: 'todo!() on GetVersion (0 issues)',
    description:
      'Request::GetVersion panics via todo!(), OP_RETURN outputs are rejected during display, non-canonical CompactSize encodings are accepted, and witness_utxo scripts > 252 B fail.'
  }
]

export function renderMarkdown(): string {
  const lines: string[] = [
    '# Lean 4 Ledger',
    '',
    'Notre thèse est qu\'il est déjà viable aujourd\'hui de réécrire un logiciel existant en Lean4 pour obtenir un binaire prouvé formellement, plus compact et plus rapide. Hier Charles m\'a proposé de commencer avec l\'application Bitcoin de Ledger, voici le résultat en une journée.',
    '',
    '## 1. Méthodologie et architecture',
    '',
    'Côté temps humain, j\'ai passé environ **1 h** au départ pour cadrer le problème, poser les specs haut niveau et designer le pipeline (j\'avais déjà une idée de la stack Ledger donc j\'ai gagné un peu de temps), **15 min** ce matin pour débloquer un souci de routing d\'inférence, et **1 h** à la fin pour review et polir l\'ensemble. Tout le reste a tourné en autonomie.',
    '',
    'Ledger maintient deux apps Bitcoin : l\'app historique en C (`LedgerHQ/app-bitcoin@f010982d`), compilée nativement en ARM Thumb directement au-dessus de BOLOS, et la nouvelle V-App en Rust (`LedgerHQ/vanadium@ace8e969`), compilée en RISC-V 32-bit (`RV32IMAC`) et exécutée dans une VM tournant sur BOLOS (pour déléguer une partie de l\'exécution au PC host si je comprends bien).',
    '',
    'Plutôt que de toucher à l\'UI ou au transport APDU/ECALL (réécrire l\'UI en Lean 4 aurait peu d\'intérêt), on a isolé un kernel commun zero-alloc pour la logique partagée (validation PSBT, accounting des montants, BIP-32, SegWit/Taproot, policies BIP-388/Miniscript, formatage division-free), qui concentre l\'essentiel de la surface d\'attaque, en gardant l\'UI et l\'IO d\'origine dans chaque app :',
    '',
    '```mermaid',
    MERMAID_ARCHITECTURE,
    '```',
    '',
    '## 2. Plan d\'exécution',
    '',
    '1) **Specs formelles et cross-backtesting** : formalisation des BIPs en Lean 4 à partir du cadrage haut niveau, puis implémentation du kernel exécutable en bouclant sur les test suites des deux repos (`ctest`/Ragger côté C, `cargo test`/Speculos côté Rust) pour affiner la spec jusqu\'à convergence.',
    '2) **Backend LLVM 32-bit dans `turbo-lean`** : ajout du support freestanding 32-bit zero-alloc (`thumbv6m`, `thumbv8m.main`, `riscv32imac`) dans notre compilateur `turbo-lean`. Passer par LLVM IR plutôt que d\'émettre du bytecode ou de l\'assembleur direct m\'a semblé plus sûr (la sémantique LLVM est déjà largement formalisée) et ne demandait qu\'un patch ciblé ; il reste encore de la marge d\'optimisation avec plus de compute.',
    '3) **Intégration dans les deux apps** : shim FFI minimal dans `app-bitcoin` et `vnd-bitcoin` conservant l\'UI/IO d\'origine et linkant les kernels Lean en LTO.',
    '4) **Boucle d\'optimisation `maxwell`** : benchmarks reproductibles dans notre harness propriétaire `maxwell` sous contrainte de preuve (`0 sorryAx`, 2 405 théorèmes) et de 100 % des tests au vert, jusqu\'à passer sous les baselines Flash, RAM et latence sur les deux targets.',
    '',
    '## 3. Résultats et simulation',
    '',
    '| Métrique | Baseline C (`app-bitcoin`) | Lean 4 + C | Baseline Rust (`vanadium`) | Lean 4 + Rust |',
    '|---|---|---|---|---|',
    ...BENCHMARK_ROWS.map(
      (r) => `| **${r.metric}** | ${r.origC} | **${r.patchedC}** | ${r.origRust} | **${r.patchedRust}** |`
    ),
    '',
    'Vidéo de simulation side-by-side (Speculos Ledger Flex) : https://share.thomas.md/leanldgr/vanadium-side-by-side.mp4',
    '',
    '## 4. Bugs et anomalies trouvés dans Vanadium',
    '',
    'La formalisation croisée entre `app-bitcoin` et `vanadium` a fait ressortir **9 bugs et écarts de spec** dans `LedgerHQ/vanadium` (`ace8e969`). **7 sur 9 n\'étaient documentés nulle part** (les 2 autres n\'avaient qu\'un `TODO` ou `todo!()` partiel dans le code, et `0` issue GitHub ouverte). Nous n\'avons ouvert aucune issue publique ; tout est fixé dans le patch.',
    '',
    '| ID | Severity | Location | Upstream status | Description |',
    '|---|---|---|---|---|',
    ...VANADIUM_ISSUES.map((i) => {
      const locs = i.locations.map((l) => `[\`${l.label}\`](${l.url})`).join(' · ')
      return `| \`${i.id}\` | ${i.severityLabel} | ${locs} | ${i.reportedStatus} | ${i.description} |`
    }),
    '',
    '## 5. Résumé des ressources investies',
    '',
    'L\'ensemble du run autonome (formalisation, patch compilateur `turbo-lean`, preuves des `2 405` théorèmes, intégration C/Rust et boucles `maxwell`) a tourné en **19,9 h** wall-clock (dont 2 heures de pause à cause d\'un problème d\'approvisionnement d\'inférence que j\'ai réglé à la main) à travers **30 agents actifs** et **25 microVMs cloud** orchestrés dans [Orb](https://github.com/th0rgal/orb) :',
    '',
    '- **379,0 CPU hours** de compute cumulé (`327,4 CPU-h` sur 25 microVMs cloud Boat AMD Zen 5 + `51,6 CPU-h` sur `ashur` pendant les tours actifs).',
    '- **654,9 GB RAM hours** sur les VMs cloud dédiées (`1 049,6 GB RAM-h` en comptant la RAM réservée sur `ashur` durant les tours actifs).',
    '- **23,2 M tokens / agent** en moyenne (`696,6 M` tokens cumulés sur `30` agents actifs : `1` coordinateur + `29` subagents).',
    '',
    'Côté coût estimé, le compute cloud a été facturé **$3,42** au total sur les 25 microVMs éphémères Boat (`$1,72` sur 4 VMs `xlarge` à `$0,20/h`, `$1,70` sur 20 VMs `large` à `$0,072/h` et `< $0,01` sur 1 VM `default`), plus le nœud dédié `ashur` déjà provisionné (`$0` marginal, `~$0,46` d\'équivalent cloud). L\'inférence n\'a entraîné **$0 de surcoût marginal** (couverte par nos forfaits Antigravity et les endpoints mis à disposition par l\'Ethereum Foundation), mais représente environ **~$298 en équivalent API public** aux tarifs standards par token grâce à ~90 % de lecture de cache (`~$116,00` sur Gemini Carbon 4 pour `472,0 M` tokens à 94,7 % de cache hit, `~$106,50` sur GLM-5.3 sans cache pour `74,6 M` tokens, `~$71,30` sur le coordinateur `builtin/smart` pour `141,0 M` tokens et `~$3,84` sur Qwen3.8-27B), soit **~$301** d\'équivalent cloud + API tout compris.',
    ''
  ]
  return lines.join('\n')
}
