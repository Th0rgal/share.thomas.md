export const PAGE_TITLE = 'Lean 4 Ledger'

export const REPO_URL = 'https://github.com/Th0rgal/lean-ledger-bitcoin'
export const BOLOS_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/bolos/patches/app-bitcoin-lean-opt.patch'
export const VANADIUM_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/vanadium/patches/vanadium-bitcoin-lean-opt.patch'
export const TURBO_LEAN_URL = 'https://github.com/Th0rgal/turbo-lean'

export const MERMAID_ARCHITECTURE = `flowchart TB
    subgraph Lean["lean-ledger-bitcoin (0 sorryAx)"]
        Spec["Jumeau formel Lean 4 : specs BIP-32 / 67 / 143 / 327 / 341 / 352 / 370 / 379 / 388<br/>+ machines d'état BOLOS & Vanadium"]
        Kernel["Noyaux freestanding zero-alloc<br/>BitcoinLedger/FreestandingKernels.lean<br/>(45 exports C-ABI · 0 import runtime · 0 allocation tas)"]
        Turbo["turbo-lean : Lean → LLVM IR 32-bit<br/>(thumbv6m, thumbv8m.main, riscv32imac)"]
        Spec -->|"preuves / oracle différentiel"| Kernel
        Kernel --> Turbo
    end

    subgraph Bolos["App historique C (LedgerHQ/app-bitcoin)"]
        BUI["UI NBGL + transport APDU + syscalls BOLOS<br/>(conservés en C)"]
        BELF["Clang / LLD LTO (-Oz -fropi -frwpi)<br/>ELF natif ARM Thumb (Nano S+ / Nano X)"]
        BUI --> BELF
    end

    subgraph Vanadium["Nouvelle V-App Rust (LedgerHQ/vanadium)"]
        VUI["UI Ledger Flex + client ECALLs<br/>(conservés en Rust)"]
        VELF["rustc + LLD (riscv32imac-unknown-none-elf)<br/>ELF en pages de 256 B chiffrées / authentifiées (arbre de Merkle)"]
        VVM["VM RISC-V app-vanadium dans le Secure Element<br/>(mémoire paginée déportée sur le host)"]
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
    origValue: '299,3 KiB (1 198 pages)',
    optValue: '261,7 KiB (1 047 pages)',
    optPct: 87.42,
    delta: '-12,58 %'
  },
  {
    label: 'RAM réservée (budget statique RW + stack)',
    origValue: '128,3 KiB (514 pages)',
    optValue: '64,3 KiB (258 pages)',
    optPct: 50.12,
    delta: '-49,88 %'
  },
  {
    label: 'Taille du binaire ELF',
    origValue: '529,8 KiB',
    optValue: '262,1 KiB',
    optPct: 49.47,
    delta: '-50,53 %'
  },
  {
    label: 'Instructions exécutées (RV32 · signature)',
    origValue: '234,2 k insns',
    optValue: '200,0 k insns',
    optPct: 85.4,
    delta: '-14,60 %'
  },
  {
    label: 'Latence signature PSBT (Flex · médiane)',
    origValue: '4 976 ms (1 325 page_loads)',
    optValue: '4 249 ms (1 232 page_loads)',
    optPct: 85.39,
    delta: '-14,61 %'
  }
]

export const C_BENCH_BARS: BenchmarkChartItem[] = [
  {
    label: 'Flash / code (PT_LOAD RX · Nano S+)',
    origValue: '89,1 KiB (91 231 B)',
    optValue: '87,6 KiB (89 695 B)',
    optPct: 98.32,
    delta: '-1,68 %'
  },
  {
    label: 'RAM statique (.bss + .data · Nano S+)',
    origValue: '6 376 B',
    optValue: '6 232 B',
    optPct: 97.74,
    delta: '-2,26 %'
  },
  {
    label: 'RAM totale (RW + worst-case stack · Nano S+)',
    origValue: '18 872 B',
    optValue: '18 728 B (0 récursion)',
    optPct: 99.24,
    delta: '-0,76 %'
  },
  {
    label: 'Instructions ARM Thumb émises (Nano S+)',
    origValue: '30 364 insns',
    optValue: '29 898 insns',
    optPct: 98.47,
    delta: '-1,53 %'
  },
  {
    label: 'Latence PSBT Taproot (Nano S+ · ARMv8-M · médiane)',
    origValue: '2 436 ms',
    optValue: '2 435 ms',
    optPct: 99.96,
    delta: '-0,04 %'
  },
  {
    label: 'Latence PSBT Taproot (Nano X · ARMv6-M · médiane)',
    origValue: '2 438 ms',
    optValue: '2 592 ms',
    optPct: 106.34,
    delta: '+6,34 %'
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
    origC: '91 231 B (89,1 KiB · Nano S+)',
    patchedC: '89 695 B (87,6 KiB, -1,68 % · Nano S+)',
    origRust: '306 522 B (299,3 KiB, 1 198 pages)',
    patchedRust: '267 954 B (261,7 KiB, -12,58 %, 1 047 pages)'
  },
  {
    metric: 'Taille du fichier ELF',
    origC: '158 004 B (154,3 KiB, stripped)',
    patchedC: '156 468 B (152,8 KiB, -0,97 %)',
    origRust: '542 552 B (529,8 KiB)',
    patchedRust: '268 384 B (262,1 KiB, -50,53 %)'
  },
  {
    metric: 'RAM statique (.bss + .data)',
    origC: '6 376 B (Nano S+)',
    patchedC: '6 232 B (-2,26 % · Nano S+)',
    origRust: '65 836 B (64,3 KiB, heap 64 KiB)',
    patchedRust: '33 076 B (32,3 KiB, -49,76 %, heap 32 KiB)'
  },
  {
    metric: 'Stack',
    origC: '12 496 B max (qsort récursif)',
    patchedC: '12 496 B max (0 récursion)',
    origRust: '65 536 B (64 KiB) alloués',
    patchedRust: '32 768 B (32 KiB) alloués (-50 %)'
  },
  {
    metric: 'RAM totale réservée (budget statique RW + stack)',
    origC: '18 872 B (Nano S+)',
    patchedC: '18 728 B (-0,76 % · Nano S+)',
    origRust: '131 372 B (128,3 KiB, 514 pages)',
    patchedRust: '65 844 B (64,3 KiB, -49,88 %, 258 pages)'
  },
  {
    metric: 'Pic d’allocation heap (peak_heap_bytes · signature)',
    origC: '—',
    patchedC: '—',
    origRust: 'non mesuré',
    patchedRust: '5 318 B'
  },
  {
    metric: 'Pages VM commitées (vm_page_commits · signature)',
    origC: '—',
    patchedC: '—',
    origRust: '169',
    patchedRust: '155 (-8,28 %)'
  },
  {
    metric: 'Instructions',
    origC: '30 364 insns ARM émises',
    patchedC: '29 898 insns ARM (-1,53 %)',
    origRust: '234 214 insns RV32 exécutées',
    patchedRust: '200 029 insns RV32 (-14,60 %)'
  },
  {
    metric: 'Latence médiane signature Taproot (Speculos)',
    origC: '2 436 ms (Nano S+) / 2 438 ms (Nano X)',
    patchedC: '2 435 ms (-0,04 %) / 2 592 ms (+6,34 %)',
    origRust: '4 976 ms (1 325 page_loads)',
    patchedRust: '4 249 ms (-14,61 %, 1 232 page_loads)'
  },
  {
    metric: 'Latence médiane SIGN_PSBT multisig wsh(3-of-5) (3 in, Speculos)',
    origC: '7 304 ms (Nano S+) / 7 944 ms (Nano X)',
    patchedC: '7 598 ms (+4,03 %) / 8 065 ms (+1,52 %)',
    origRust: '—',
    patchedRust: '—'
  },
  {
    metric: 'Test suites & preuves',
    origC: '30 ctest + Ragger',
    patchedC: '31/31 ctest + mainnet 2/2 + suite testnet (282 tests) en cours',
    origRust: '—',
    patchedRust: 'app 90/90 + common 85/85 + 9 correctifs'
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
      'andor(X, Y, Z) compiles to OP_NOTIF [Y] OP_ELSE [Z] OP_ENDIF instead of [Z] then [Y] (BIP-379), inverting the true/false spending branches relative to Bitcoin Core and app-bitcoin — a wrong-script / funds-locking consensus bug.'
  },
  {
    id: 'VND-02',
    severity: 'Medium',
    severityLabel: 'Medium',
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
      'When both non_witness_utxo and witness_utxo are supplied on an input, their prevout equality is never checked (CVE-2020-14199 class), unlike app-bitcoin.'
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
      'Missing BIP-379 Miniscript B/V/K/W typechecking, non-malleability enforcement, height/time timelock mixing checks, and BIP-68 older(n) flag masking — now fully enforced in the patched V-App via llb_miniscript_check_postfix.'
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
    'Notre thèse est qu\'il est déjà viable aujourd\'hui de réécrire un logiciel existant en Lean4 pour obtenir un binaire prouvé formellement, plus compact et plus rapide. Hier Charles m\'a proposé de commencer avec l\'application Bitcoin de Ledger, voici le résultat.',
    '',
    '**Important :** il s\'agit d\'une POC de quelques jours, un déploiement demanderait davantage de review de notre côté et la validation des choix de modélisation du vôtre.',
    '',
    '## 1. Méthodologie et architecture',
    '',
    'Côté temps humain, j\'ai passé environ **1 h** au départ pour cadrer le problème, poser les specs haut niveau et designer le pipeline (j\'avais déjà une idée de la stack Ledger donc j\'ai gagné un peu de temps), **15 min** ce matin pour débloquer un souci de routing d\'inférence, et **1 h** à la fin pour review et polir l\'ensemble. Tout le reste a tourné en autonomie.',
    '',
    'Ledger maintient deux apps Bitcoin : l\'app historique en C (`LedgerHQ/app-bitcoin@f010982d`), compilée nativement en ARM Thumb directement au-dessus de BOLOS, et la nouvelle V-App en Rust (`LedgerHQ/vanadium@ace8e969`), compilée en RISC-V 32-bit (`RV32IMAC`) et exécutée par la VM `app-vanadium` : 100 % de l\'exécution RISC-V reste confinée dans le Secure Element, seule la mémoire paginée — code et données en pages de `256 B` chiffrées et authentifiées par arbre de Merkle — est déportée sur le host, pour dépasser la limite de RAM/Flash interne du SE.',
    '',
    'Plutôt que de toucher à l\'UI ou au transport APDU/ECALL (réécrire l\'UI en Lean 4 aurait peu d\'intérêt), on a gardé l\'UI et l\'IO d\'origine dans chaque app et concentré l\'effort sur la logique partagée qui concentre l\'essentiel de la surface d\'attaque. Le résultat, [Th0rgal/lean-ledger-bitcoin](https://github.com/Th0rgal/lean-ledger-bitcoin), combine deux livrables :',
    '',
    '- **Un jumeau formel en Lean 4** des specs `BIP-32/67/143/327/341/352/370/379/388` et des deux machines d\'état BOLOS/Vanadium, prouvé avec `0 sorryAx`. Il tourne sur l\'hôte, pas dans le binaire : il sert d\'oracle différentiel sur les suites de tests des deux repos.',
    '- **Un noyau freestanding zero-alloc** (`BitcoinLedger/FreestandingKernels.lean` : `45` exports C-ABI, `0` import runtime, `0` allocation tas), compilé par `turbo-lean` en LLVM IR 32-bit (`thumbv6m`, `thumbv8m.main`, `riscv32imac`) et lié en LTO dans les deux binaires pour exécuter directement les vérifications critiques : typechecker Miniscript `BIP-379/BIP-388` en postfixe, machine d\'état `nLockTime` `BIP-370`, égalité Dual-UTXO et bornes `MAX_MONEY`, validation de chemins `BIP-32`, `CompactSize` canonique, tri lexicographique `O(1)`-stack des clés publiques MuSig2/`sortedmulti`, et formatage ASCII des montants sans division. Les parseurs PSBT/Script, la crypto et l\'UI restent en C/Rust.',
    '',
    'Les intégrations sont des patchs minimalistes : [`app-bitcoin-lean-opt.patch`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/bolos/patches/app-bitcoin-lean-opt.patch) côté BOLOS et [`vanadium-bitcoin-lean-opt.patch`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/vanadium/patches/vanadium-bitcoin-lean-opt.patch) côté Vanadium.',
    '',
    '```mermaid',
    MERMAID_ARCHITECTURE,
    '```',
    '',
    '## 2. Plan d\'exécution',
    '',
    '1) **Specs formelles et cross-backtesting** : formalisation des BIPs en Lean 4 à partir du cadrage haut niveau, puis implémentation du kernel exécutable en bouclant sur les test suites des deux repos (`ctest`/Ragger côté C, `cargo test`/Speculos côté Rust) pour affiner la spec jusqu\'à convergence.',
    '2) **Backend LLVM 32-bit dans `turbo-lean`** : ajout du support freestanding 32-bit zero-alloc (`thumbv6m`, `thumbv8m.main`, `riscv32imac`) dans notre compilateur [`turbo-lean`](https://github.com/Th0rgal/turbo-lean). Passer par LLVM IR plutôt que d\'émettre du bytecode ou de l\'assembleur direct m\'a semblé plus sûr (la sémantique LLVM est déjà largement formalisée) et ne demandait qu\'un patch ciblé. Notez qu\'il reste donc encore de la marge d\'optimisation avec plus de compute. Transparence sur la TCB : les théorèmes de préservation sémantique couvrent les passes IR de `turbo-lean`, tandis que le front-end d\'extraction LCNF et `clang`/`lld` restent dans la TCB de compilation, auditée par tests différentiels C-ABI, contrôle d\'absence de symboles indéfinis (`llvm-nm`) et bornage statique des frames de pile (`.su`).',
    '3) **Intégration dans les deux apps** : shim FFI minimal dans `app-bitcoin` et `vnd-bitcoin` conservant l\'UI/IO d\'origine et linkant les kernels Lean en LTO.',
    '4) **Boucle d\'optimisation `maxwell`** : itérations pilotées selon notre méthodologie `maxwell` avec des scripts de benchmark reproductibles (`bolos_benchmark.sh`, `vanadium_benchmark.sh`) sous contrainte stricte du noyau Lean (`0 sorryAx`) et des tests au vert, pour passer sous les baselines Flash, RAM et latence : c\'est acquis sur Vanadium, et sur BOLOS pour la taille seulement.',
    '',
    '## 3. Résultats',
    '',
    'Le binaire patché avec Lean 4 est plus léger sur les deux targets. Il est plus rapide sur Vanadium ; sur BOLOS la latence est inchangée sur Nano S+ et en hausse sur Nano X :',
    '',
    '| Métrique | Baseline C (`app-bitcoin`) | Lean 4 + C | Baseline Rust (`vanadium`) | Lean 4 + Rust |',
    '|---|---|---|---|---|',
    ...BENCHMARK_ROWS.map(
      (r) => `| **${r.metric}** | ${r.origC} | **${r.patchedC}** | ${r.origRust} | **${r.patchedRust}** |`
    ),
    '',
    'Précisions de lecture. Mesures sous Speculos, référence et variante sur le même hôte ; pas de mesure sur matériel. **Vanadium** : la « RAM réservée » est un budget statique, réduit de `64+64 KiB` à `32+32 KiB`, pas un pic mesuré (pic heap mesuré côté Lean : `5 318 B` sur une signature). À profil Cargo identique, le code baisse de `4,55 %` et les instructions exécutées de `14,6 %` ; le reste du gain de taille vient du profil de link (LTO, `panic = "abort"`, strip). **BOLOS** : tailles mesurées sur le dernier build (cycle 1 T7, encore expérimental), latences sur le build précédent (T6).',
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
    '## 5. Résumé des ressources investies (run initial)',
    '',
    'L\'ensemble du run autonome (formalisation, patch compilateur `turbo-lean`, preuves des `2 494` théorèmes, intégration C/Rust et boucles `maxwell`) a tourné en **19,9 h** wall-clock sur la fenêtre capturée ci-dessous jusqu\'au merge du repo principal (dont 2 heures de pause à cause d\'un problème d\'approvisionnement d\'inférence que j\'ai réglé à la main) à travers **30 agents actifs** et **25 microVMs** :',
    '',
    '- **379,0 CPU hours** de compute cumulé (`327,4 CPU-h` sur 25 microVMs cloud éphémères AMD Zen + `51,6 CPU-h` sur notre serveur dédié pendant les tours actifs).',
    '- **654,9 GB RAM hours** sur les VMs cloud éphémères (`1 049,6 GB RAM-h` en comptant la RAM réservée sur notre serveur dédié durant les tours actifs).',
    '- **23,2 M tokens / agent** en moyenne (`696,6 M` tokens cumulés sur `30` agents actifs : `1` coordinateur + `29` subagents).',
    '',
    'Aux tarifs publics de l\'API Google et d\'OrcaRouter (pour `GLM 5.3 uncensored`) côté inférence, et d\'AWS EC2 On-Demand côté location des VMs, ce run reviendrait à environ **~$520 + ~$17** (soit **~$537** au total), hors infrastructure personnelle (notre serveur dédié et nos GPUs d\'entraînement amont pour optimiser le compilateur, dont la part amortie sur ce run reste relativement négligeable).',
    ''
  ]
  return lines.join('\n')
}
