export const PAGE_TITLE = 'Lean 4 Ledger'

export const REPO_URL = 'https://github.com/Th0rgal/lean-ledger-bitcoin'
export const BOLOS_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/bolos/patches/app-bitcoin-lean-opt.patch'
export const VANADIUM_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/vanadium/patches/vanadium-bitcoin-lean-opt.patch'
export const TURBO_LEAN_URL = 'https://github.com/Th0rgal/turbo-lean'

export const MERMAID_ARCHITECTURE = `flowchart TB
    subgraph Lean["lean-ledger-bitcoin (0 sorryAx)"]
        Spec["Spec.lean : 12 énoncés sur le noyau compilé"]
        Kernel["Noyaux freestanding zero-alloc<br/>BitcoinLedger/FreestandingKernels.lean<br/>(45 exports C-ABI · 0 import runtime · 0 allocation tas)"]
        Turbo["turbo-lean : Lean → LLVM IR 32-bit<br/>(thumbv6m, thumbv8m.main, riscv32imac)"]
        Spec -->|"preuves"| Kernel
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
    patchedRust: 'app 90/90 + common 85/85 + 11 correctifs'
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
    'Notre thèse est qu\'il est déjà viable aujourd\'hui de réécrire un logiciel existant en Lean4 pour obtenir un binaire prouvé formellement, plus compact et plus rapide. Hier, Vincent et Guillaume m\'ont proposé de commencer avec l\'application Bitcoin de Ledger, voici le résultat.',
    '',
    '**Important :** il s\'agit d\'une POC d\'une journée, les specs ne sont pas complètes, il y a d\'autres points importants qu\'il serait intéressant de vérifier formellement et cela demanderait davantage de review de notre côté en plus de la validation de nos choix de modélisation du vôtre.',
    '',
    '## 1. Méthodologie et architecture',
    '',
    'Côté temps humain, j\'avais déjà regardé un peu quand Charles m\'en avait parlé et j\'avais une idée de la stack Ledger : il m\'a donc fallu environ **1 h** au départ pour cadrer le problème, poser les specs haut niveau et designer le pipeline, **15 min** ce matin pour débloquer un souci de routing d\'inférence, et **1 h** à la fin pour review et polir l\'ensemble. Tout le reste a tourné en autonomie.',
    '',
    'Ledger maintient deux apps Bitcoin : l\'app historique en C (`LedgerHQ/app-bitcoin`), compilée nativement vers le jeu d\'instructions du microcontrôleur, au-dessus de BOLOS, et la nouvelle V-App en Rust (`LedgerHQ/vanadium`), compilée en RISC-V 32-bit (`RV32IMAC`) et exécutée dans une VM tournant sur BOLOS (pour streamer le code et les données de l\'app depuis le host, si j\'ai bien compris).',
    '',
    'Plutôt que de toucher à l\'UI ou au transport APDU/ECALL (réécrire l\'UI en Lean 4 aurait peu d\'intérêt), on a gardé l\'UI et l\'IO d\'origine dans chaque app et concentré l\'effort sur la logique partagée qui concentre l\'essentiel de la surface d\'attaque. Le résultat, [Th0rgal/lean-ledger-bitcoin](https://github.com/Th0rgal/lean-ledger-bitcoin), contient deux choses intéressantes pour vous :',
    '',
    '- **Un noyau Lean compilé dans les deux apps** ([`FreestandingKernels.lean`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/main/BitcoinLedger/FreestandingKernels.lean)) : c\'est le code Lean réellement exécuté sur l\'appareil. [`turbo-lean`](https://github.com/Th0rgal/turbo-lean) le compile en LLVM IR 32-bit et il remplace dans chaque app les chemins sensibles qu\'on a réécrits.',
    '- **Une spec courte sur ce noyau** ([`Spec.lean`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/main/Spec.lean), 12 énoncés) : chaque énoncé porte sur une fonction compilée, et sa preuve est vérifiée par Lean (`0 sorryAx`). Elle couvre pour l\'instant `17` des `45` fonctions du noyau.',
    '',
    'Les intégrations tiennent en deux patchs : [`app-bitcoin-lean-opt.patch`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/bolos/patches/app-bitcoin-lean-opt.patch) côté BOLOS et [`vanadium-bitcoin-lean-opt.patch`](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/752aa9a/ffi/vanadium/patches/vanadium-bitcoin-lean-opt.patch) côté Vanadium. Le C/Rust qui reste est le code d\'origine, légèrement patché (environ 200 lignes modifiées côté C et 700 côté Rust, hors tests). Il fait trois choses : appeler le noyau Lean à la place des vérifications d\'origine, parser les PSBT et les scripts, et parler au matériel (clés, crypto, écran et transport passent par les appels système de BOLOS). Pour cette partie, qui vient de l\'OS, ça n\'aurait pas de sens de faire du Lean ; par contre, pour les parseurs, je pense que ce serait une bonne idée. C\'est plus de travail, mais cela vaudrait le coût car ils se prêtent bien à la vérification formelle.',
    '',
    '```mermaid',
    MERMAID_ARCHITECTURE,
    '```',
    '',
    '## 2. Plan d\'exécution',
    '',
    '1) **Specs et tests croisés** : formalisation en Lean 4, puis noyau exécutable affiné en bouclant sur les suites de tests des deux repos.',
    '2) **Backend LLVM 32-bit dans [`turbo-lean`](https://github.com/Th0rgal/turbo-lean)** : support sans allocation pour `thumbv6m`, `thumbv8m.main` et `riscv32imac`. Passer par LLVM IR m\'a semblé plus sûr que d\'émettre de l\'assembleur. Cette chaîne de compilation n\'est pas encore prouvée de bout en bout (elle est contrôlée par tests différentiels). Ça coûterait relativement cher en inférence, mais ce serait un bon investissement car on n\'aurait à le faire qu\'une fois.',
    '3) **Intégration** : shim FFI minimal dans chaque app, UI et IO d\'origine conservées, noyau lié en LTO.',
    '4) **Boucle d\'optimisation `maxwell`** : itérations sur des benchmarks reproductibles, preuves et tests au vert, pour passer sous les baselines.',
    '',
    '## 3. Résultats',
    '',
    'Voici la spec. Elle ne correspond qu\'au code effectivement compilé dans les apps et n\'est pas complète, mais elle montre ce qu\'il est possible de faire (chaque point ouvre les lignes correspondantes) :',
    '',
    '- [Montants de la transaction : le noyau répond « valide » exactement quand le montant vaut au plus 21 millions de BTC. Pour une somme ou une différence, il répond « valide » exactement quand le vrai résultat reste entre 0 et ce plafond, et renvoie alors ce vrai résultat.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L32-L51)',
    '- [Affichage : le découpage d\'un montant en BTC et satoshis, fait sans division, est exact pour tout montant 64 bits.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L53-L57)',
    '- [Chemins de dérivation : le noyau classe un élément comme « hardened » exactement quand il vaut au moins 2^31, et refuse les chemins de plus de 10 éléments sur BOLOS, 16 sur Vanadium.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L61-L72)',
    '- [Adresses : le noyau répond « valide » pour un programme SegWit exactement dans les cas prévus, soit 20 ou 32 octets en version 0 et 2 à 40 octets en versions 1 à 16.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L76-L82)',
    '- [Types de signature demandés : le noyau répond « valide » exactement pour ALL, NONE et SINGLE, avec ou sans ANYONECANPAY, plus DEFAULT pour Taproot.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L93-L104)',
    '- [Lecture de la transaction : le noyau répond « valide » pour un préfixe de longueur (CompactSize) exactement quand c\'est celui de l\'encodage le plus court.](https://github.com/Th0rgal/lean-ledger-bitcoin/blob/a4ef3a2617e5c30eaa8d7842a981a26849c34910/Spec.lean#L108-L116)',
    '',
    'Chaque énoncé est un « si et seulement si » ou une égalité, avec un exemple accepté et un exemple refusé.',
    '',
    'Côté performances, on n\'a pas spécialement cherché à optimiser, d\'autant qu\'on passe par LLVM sans cibler directement le matériel final, mais on obtient quand même des résultats intéressants grâce à quelques itérations de mesure et de réglage. Le binaire patché avec Lean 4 est plus léger sur les deux targets et plus rapide sur Vanadium ; sur BOLOS la latence est inchangée sur Nano S+ et en hausse sur Nano X :',
    '',
    '| Métrique | Baseline C (`app-bitcoin`) | Lean 4 + C | Baseline Rust (`vanadium`) | Lean 4 + Rust |',
    '|---|---|---|---|---|',
    ...BENCHMARK_ROWS.map(
      (r) => `| **${r.metric}** | ${r.origC} | **${r.patchedC}** | ${r.origRust} | **${r.patchedRust}** |`
    ),
    '',
    'Ce qui nous semble le plus intéressant :',
    '',
    '- Le calcul du `nLockTime` selon `BIP-370`, là où Vanadium semble avoir un bug (à confirmer avec vous), a été prouvé conforme à la règle pour n\'importe quelle liste d\'inputs sans intervention de notre côté.',
    '- Un seul noyau Lean sert trois ISA et deux apps : il est émis en LLVM IR puis compilé avec les flags de chaque app, avec une frame de pile maximale de `96 B`.',
    '- Sur Vanadium, une signature exécute `14,6 %` d\'instructions RV32 en moins et charge `5 %` de pages en moins, à profil de compilation identique.',
    '- La formalisation croisée des deux apps a suffi à faire ressortir les 11 bugs de la section 4.',
    '',
    'Précisions de lecture. Mesures sous émulateur (Speculos), pas sur matériel. Sur Vanadium, la baisse de RAM et de taille de fichier vient surtout des réglages de build (budgets mémoire réduits, strip) ; le gain propre au code est de `4,55 %` sur le segment de code et de `14,6 %` sur les instructions exécutées. Sur BOLOS, tailles et latences viennent de deux builds successifs.',
    '',
    '## 4. Bugs et anomalies trouvés dans Vanadium',
    '',
    'En essayant de formaliser les implémentations C et Vanadium, on a repéré **11 bugs ou écarts de spec**. On ne les a pas vérifiés manuellement, mais ils semblent corrects, le bug étant du côté Vanadium à chaque fois.',
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
