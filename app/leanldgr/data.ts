export const PAGE_TITLE = 'Lean 4 Ledger'

export const REPO_URL = 'https://github.com/Th0rgal/lean-ledger-bitcoin'
export const BOLOS_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/96deef7c795358b82a37831bf3b1ace2741cbf24/ffi/bolos/patches/app-bitcoin-lean-opt.patch'
export const VANADIUM_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/96deef7c795358b82a37831bf3b1ace2741cbf24/ffi/vanadium/patches/vanadium-bitcoin-lean-opt.patch'
export const TURBO_LEAN_URL = 'https://github.com/Th0rgal/turbo-lean'

export const PROOF_SCOPE = 'Les audits formels (relancés en T7 sur 752aa9a et turbo-lean@8c3503f) rapportent 0 sorryAx, 0 Classical.choice et zéro axiome non standard (seuls propext et Quot.sound autorisés). On compte 2 585 constantes .thmInfo au total (253 Spec dont 53 thm, 6 564 InternalSpec dont 1 653 thm, 1 089 Proofs dont 879 thm), déclarations générées incluses : ce total ne désigne pas autant de preuves indépendantes écrites à la main. Le jumeau formel complet est distinct du sous-ensemble exécutable : 45 exports ABI llb_*, à ne pas confondre avec les symboles internes émis par le compilateur.'
export const TCB_SCOPE = 'Transparence sur la TCB : lowerModuleForTarget_sound porte sur la transformation de LLVMAst, pas sur une preuve de bout en bout du binaire. La commande emit-freestanding-c-lib impose le garde codeHasHeapOps=false ; ce contrôle exclut les opérations de tas reconnues dans ce périmètre, sans prouver une pile nulle ni l’absence de heap dans toute l’application. L’extraction LCNF et les frontières clang/rustc/lld restent non vérifiées dans la TCB. Les tests différentiels C-ABI, llvm-nm et les rapports de pile .su apportent des contrôles complémentaires, non une preuve de ces frontières. Absence de récursion ne signifie pas absence de frames de pile : l’audit build-freestanding.sh mesure une frame kernel maximale de 96 B sur RV32, 176 B sur thumbv6m (Nano X) et 136 B sur thumbv8m.main (Nano S+), toutes sous la borne de 1 024 B, sans borner toute l’application.'
export const BENCHMARK_STATUS = 'T6 / T7 — baseline publiée dans benchmarks/bolos_results.json (commit 222e139) et benchmarks/vanadium_results.json (commit 90ba9da), complétée par la campagne d’optimisation T7 (commits 8c3503f sur turbo-lean et 752aa9a sur lean-ledger-bitcoin, artefact benchmarks/t7-cycle1.pinned-complete.experimental.json). Provenance T6 Option2 : serveur dédié de la flotte, même hôte pour référence et Lean. Provenance cycle 1 T7 : hôte partagé CPU0, distinct de la campagne candidat A sur VM Boat large. Le cycle 1 T7 (suppression de !llvm.loop sur .seqFor en embarqué et préservation de minsize/optsize en LTO) réduit la Flash BOLOS sous la référence C (Nano S+ 91 231 → 89 695 B, soit -1 536 B / -1,68 % vs réf. et -4 096 B vs baseline T6 93 791 B ; Nano X 91 231 → 90 463 B, soit -768 B / -0,84 % vs réf. et -4 096 B vs T6 94 559 B) ainsi que les instructions ARM Thumb émises (30 364 → 29 898 sur Nano S+, 30 460 → 30 205 sur Nano X). Les cycles 2 et 3 n’apportant aucun gain Flash (0 B puis +512/+768 B) ont été annulés et documentés séparément. Les liens de patchs restent épinglés sur 96deef7 ; leurs versions synchronisées T7 sont sur 752aa9a.'
export const BENCHMARK_READING = 'Précisions de lecture. Les tailles de sections et comptes statiques ARM sont déterministes pour ces artefacts ; les instructions ARM émises ne sont pas des instructions exécutées. Les compteurs RV32, pages et échanges VM décrivent le travail exécuté du scénario, pas sa durée. Le wall-clock Speculos dépend du bruit hôte, du transport et du scénario, sans mesure sur matériel physique. BOLOS : contrôle lean_sameflags séparé du patch lean_opt, Nano S+ ARMv8-M et Nano X thumbv6m selon les cibles publiées (l’étiquette statique API_LEVEL 22 sur Nano X diffère d’API 27 détecté au runtime par Speculos). Vanadium : plain (production) et autoapprove (E2E) ne sont pas interchangeables. Le profil Cargo/link optimisé inclut LTO, panic = "abort" (arrêt sans déroulement de pile), retrait de .eh_frame et stripping ; réduire le fichier ELF ne signifie pas réduire autant le code chargé RX. Le contrôle same_profile_lean conserve panic = "unwind", strip = "none" et les budgets heap/stack de 64+64 KiB, contre 32+32 KiB optimisés. RW + pile est une réservation statique (514 → 258 pages de 256 B), pas peak_heap_bytes. Le pic heap Lean est instrumenté ; la référence ne fournit aucun pic heap, donc aucun pourcentage de gain heap ne peut être calculé. Les latences Vanadium référence/optimisé suivent ABBA : une paire de chauffe exclue, 5 cycles, 10 échantillons par variante et workload ; les durées same-profile sont des observations uniques, pas une comparaison ABBA équivalente. Les cycles RDTSCP et nanosecondes hôte restent des mesures empiriques, pas des cycles ARM/RV32 déterministes. La frame kernel maximale mesurée par build-freestanding.sh est de 96 B sur RV32, 176 B sur thumbv6m et 136 B sur thumbv8m.main ; ce n’est pas la pile maximale de l’application ni une chaîne d’appels complète.'
export const RUST_TEST_HISTORY = 'Validé en T7 : 176 tests workspace en série (app 90/90 dont bug_006, common 81/81 + 4 doc/int, client 5/5), Speculos E2E 4/4, FFI Rust 2/2 et différentiel Vanadium 15/15.'
export const C_TEST_HISTORY = 'Validé en T7 : ctest 31/31 (réf. 30/30), FFI C 129/129 et différentiel BOLOS 9/9 (1 561 décl.). Historique Ragger non relancé : Nano S+ 277 passed, 5 skipped ; Nano X 53 passed, 2 skipped.'
export const CANDIDATE_A_READING = "T7 · candidat A contre baseline Lean — amélioration statique uniquement, validée pour Fable (claude-fable-5-2). Source : benchmarks/t7-candidate-a.boat-large.experimental.json, dont le statut reste experimental_nonvalidated. Provenance : VM Boat large (8 vCPU, 16 GiB), même VM pour les 16 ELF appariés et les mesures Speculos ; les références C héritées du cycle 1 ne sont pas reconstruites sur cette VM. Baseline Lean f68864d1f2af8fd9f2ca26acddb5f0abd3e80bcb ; candidat A : cette baseline + candidate.patch (SHA-256 77996b8d3bb47cd5619a5a2b2e6affca61fc8a5506755c5b14f502b5dd3a6662), noyau identique à 6518e152d7fe3a9af980714ced46c536e4090bf3 ; turbo-lean 8c3503fa0df74fafcd7a3b91e4319606985b7198. Le changement remplace trois decide (x ≠ 0) par bnot (decide (x = 0)) dans le formatage des montants. Les deltas ci-dessous comparent A à Lean, pas à C, sur les quatre variantes de chaque cible. Les instructions ARM Thumb sont émises, pas exécutées. La baisse de .text ne se traduit pas nécessairement en baisse de Flash chargée, en raison de l’alignement. RAM statique et pile maximale globale analysée inchangées : 12 496 B sur Nano S+, 11 248 B sur Nano X. Le sous-arbre format_sats_amount reste à 124 B sur Nano S+ mais augmente de 132 à 140 B (+8 B) sur Nano X ; ce n’est pas une hausse de la pile globale. Vitesse : 6 cycles A/A et ABBA/BAAB, 672 échantillons Speculos sur testnet-perf, |t| ≤ 1,61 ; aucune différence statistiquement significative, aucun gain ni régression de vitesse revendiqués. Le bruit hôte est élevé (CV 8–44 %, deltas médians A/A de −10,7 % à +14,2 %) et de petites différences ne sont pas exclues. Aucune mesure sur matériel physique, ni mesure d’énergie ou de coût pour cette campagne. Les mesures T6 et cycle 1 T7 ci-dessous conservent leur provenance historique distincte."

export const RAM_CURVE_NOTICE = 'La courbe RAM a été retirée faute de compteurs réels comparables entre référence et Lean. Les JSON ne fournissent pas de pic heap pour la référence ; RW + pile décrit une réservation statique, pas une consommation RAM observée au cours du temps. Aucune courbe ni vidéo synthétique ne remplace ces mesures manquantes.'

export const MERMAID_ARCHITECTURE = `flowchart TB
    subgraph Lean["lean-ledger-bitcoin (audit T2 : 2 585 constantes .thmInfo dont générées, 879 Proofs.*)"]
        Spec["Jumeau formel Lean 4 : specs BIP-32 / 67 / 143 / 327 / 341 / 352 / 370 / 379 / 388<br/>+ machines d'état BOLOS & Vanadium"]
        Kernel["Noyaux freestanding : 45 exports ABI llb_*<br/>BitcoinLedger/FreestandingKernels.lean<br/>codeHasHeapOps=false · frame kernel max publiée 96 B RV32"]
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
        VVM["VM RISC-V app-vanadium dans le Secure Element<br/>(host non fiable : stockage des pages, pas de calcul)"]
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

function measure(label: string, reference: number, lean: number, unit: string): BenchmarkChartItem {
  const format = (value: number) => formatMeasurement(`${value.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} ${unit}`)
  const delta = (lean / reference - 1) * 100
  return {
    label,
    origValue: format(reference),
    optValue: format(lean),
    optPct: lean / reference * 100,
    delta: `${delta > 0 ? '+' : ''}${delta.toFixed(2).replace('.', ',')} %`
  }
}

export const RUST_BENCH_BARS: BenchmarkChartItem[] = [
  measure('Code chargé RX · plain', 306522, 267954, 'B'),
  measure('RAM réservée RW + pile · plain', 131372, 65844, 'B'),
  measure('Fichier ELF · plain', 542552, 268384, 'B'),
  measure('Instructions RV32 exécutées · sign_transaction', 234214, 200029, 'insns'),
  measure('Latence médiane · sign_transaction · Flex', 4976.32, 4249.16, 'ms'),
  measure('Latence médiane · get_fingerprint · Flex', 950.66, 952.26, 'ms')
]

export const C_BENCH_BARS: BenchmarkChartItem[] = [
  measure('Flash chargée · Nano S+ mainnet', 91231, 89695, 'B'),
  measure('RAM statique · Nano S+ mainnet', 6376, 6232, 'B'),
  measure('RAM statique + pile maximale analysée · Nano S+', 18872, 18728, 'B'),
  measure('Instructions ARM Thumb émises · Nano S+', 30364, 29898, 'insns'),
  measure('Latence médiane · SIGN_PSBT_TR_3IN · Nano S+', 2436.324, 2435.271, 'ms'),
  measure('Latence médiane · SIGN_PSBT_TR_3IN · Nano X', 2437.73, 2592.269, 'ms'),
  measure('Latence médiane · WSH3OF5_3IN · Nano S+', 7304.089, 7598.486, 'ms'),
  measure('Latence médiane · WSH3OF5_3IN · Nano X', 7944.3, 8065.09, 'ms')
]

export interface BenchmarkRow {
  metric: string
  origC: string
  patchedC: string
  origRust: string
  patchedRust: string
  sameProfileRust?: string
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
    origC: '91 231 B (89,1 KiB · Nano S+ / X)',
    patchedC: '89 695 B (-1,68 % · Nano S+ ; Nano X : 90 463 B / -0,84 % ; baseline T6 : 93 791 / 94 559 B)',
    origRust: '306 522 B (plain, 1 198 pages, depth 11)',
    patchedRust: '267 954 B (-12,58 %, plain, 1 047 pages, depth 11)',
    sameProfileRust: '292 560 B (-4,55 %, plain, 1 143 pages, depth 11)'
  },
  {
    metric: 'Taille du fichier ELF',
    origC: '158 004 B (154,3 KiB, stripped · Nano S+)',
    patchedC: '156 468 B (-1 536 B / -0,97 %, stripped · Nano S+ ; Nano X : 157 232 B)',
    origRust: '542 552 B (plain)',
    patchedRust: '268 384 B (-50,53 %, plain)',
    sameProfileRust: '538 860 B (-0,68 %, plain)'
  },
  {
    metric: 'RAM statique (.bss + .data)',
    origC: '6 376 B (Nano S+)',
    patchedC: '6 232 B (-144 B / -2,26 % · Nano S+)',
    origRust: '65 836 B (64,3 KiB, heap 64 KiB)',
    patchedRust: '33 076 B (-49,76 %, budget heap 32 KiB)',
    sameProfileRust: '65 844 B (+8 B, budget heap 64 KiB)'
  },
  {
    metric: 'Stack',
    origC: '12 496 B max Nano S+ / 11 248 B Nano X (qsort récursif)',
    patchedC: '12 496 B max Nano S+ / 11 248 B Nano X (qsort récursif absent ; frame kernel max 136 B S+ / 176 B X)',
    origRust: '65 536 B (64 KiB) alloués',
    patchedRust: '32 768 B réservés ; frame kernel max 96 B RV32, pas une borne de chaîne complète',
    sameProfileRust: '65 536 B réservés'
  },
  {
    metric: 'RAM totale réservée (budget statique RW + stack)',
    origC: '18 872 B (Nano S+)',
    patchedC: '18 728 B (-144 B, stack bornée · Nano S+)',
    origRust: '131 372 B (128,3 KiB, 514 pages)',
    patchedRust: '65 844 B (-49,88 %, 258 pages)',
    sameProfileRust: '131 380 B (+8 B, 514 pages)'
  },
  {
    metric: 'Pic d\u2019allocation heap (peak_heap_bytes)',
    origC: '—',
    patchedC: '—',
    origRust: 'absent du JSON, non instrumenté',
    patchedRust: '5 318 B sur sign_transaction (pas de delta heap calculable)',
    sameProfileRust: '5 318 B sur sign_transaction (référence absente)'
  },
  {
    metric: 'Pages VM commitées (sign_transaction)',
    origC: '—',
    patchedC: '—',
    origRust: '169',
    patchedRust: '155',
    sameProfileRust: '154'
  },
  {
    metric: 'Instructions',
    origC: '30 364 insns ARM émises (Nano S+)',
    patchedC: '29 898 insns ARM émises (-1,53 % · Nano S+ ; Nano X : 30 205 / -0,84 %)',
    origRust: '234 214 insns RV32 exécutées (sign_transaction)',
    patchedRust: '200 029 insns RV32 (-14,60 %)',
    sameProfileRust: '199 963 insns RV32 (sign_transaction)'
  },
  {
    metric: 'Latence médiane Speculos (BOLOS TR_3IN ; Vanadium sign_transaction)',
    origC: '2 436,324 ms (Nano S+) / 2 437,730 ms (Nano X)',
    patchedC: '2 435,271 ms (-0,04 %) / 2 592,269 ms (+6,34 %) [T6 ; cycle 1 T7 : 2 912,530 ms S+ / 2 797,147 ms X]',
    origRust: '4 976,32 ms (1 325 page_loads)',
    patchedRust: '4 249,16 ms (-14,61 %, 1 232 page_loads)',
    sameProfileRust: '4 099,36 ms (1 observation, 1 258 page_loads ; pas un ABBA équivalent)'
  },
  {
    metric: 'Latence médiane SIGN_PSBT_WSH3OF5_3IN · Nano S+ (Speculos)',
    origC: '7 304,089 ms',
    patchedC: '7 598,486 ms (+4,03 % · T6 ; cycle 1 T7 : 8 203,392 ms vs réf. 8 706,171 ms / -5,77 %)',
    origRust: 'scénario absent du JSON Vanadium',
    patchedRust: 'non mesuré, ne pas substituer sign_transaction'
  },
  {
    metric: 'Latence médiane SIGN_PSBT_WSH3OF5_3IN · Nano X (Speculos)',
    origC: '7 944,300 ms',
    patchedC: '8 065,090 ms (+1,52 % · T6 ; cycle 1 T7 : 8 064,053 ms vs réf. 10 168,386 ms / -20,69 %)',
    origRust: 'scénario absent du JSON Vanadium',
    patchedRust: 'non mesuré, ne pas substituer sign_transaction'
  },
  {
    metric: 'Test suites & preuves',
    origC: '30/30 ctest hôte ; Ragger historique non relancé',
    patchedC:
      'Validé en T7 : 31/31 ctest, FFI C 129/129, diff BOLOS 9/9 (1 561 décl.), 2 585 .thmInfo (879 Proofs.*, 0 sorryAx, 0 Classical.choice) ; Ragger historique : S+ 277/5, X 53/2',
    origRust: 'Historique : 166 tests workspace',
    patchedRust:
      'Validé en T7 : 176 tests workspace (app 90/90 dont bug_006, common 81/81 + 4, client 5/5), Speculos E2E 4/4, FFI Rust 2/2, diff Vanadium 15/15'
  }
]

export interface MeasurementTable {
  title: string
  headers: string[]
  rows: (string | number)[][]
}

export const MEASUREMENT_TABLES: MeasurementTable[] = [
  {
    title: 'T7 · candidat A − baseline Lean · VM Boat large · deltas statiques',
    headers: ['Cible / variantes', 'Δ .text B', 'Δ instructions Thumb émises', 'Δ load_flash_bytes B', 'Δ RAM statique B', 'Δ pile globale B', 'Sous-arbre format_sats_amount B'],
    rows: [
      ['Nano S+ · mainnet, mainnet-sameflags, testnet', -228, -79, 0, 0, 0, '124 → 124 (0)'],
      ['Nano S+ · testnet-perf', -228, -79, -512, 0, 0, '124 → 124 (0)'],
      ['Nano X · mainnet, mainnet-sameflags, testnet, testnet-perf', -270, -89, -256, 0, 0, '132 → 140 (+8)']
    ]
  },
  {
    title: 'BOLOS · mainnet · T7 cycle 1 et baseline T6 · contrôle lean_sameflags distinct de lean_opt',
    headers: ['Cible / variante', 'Flash B', 'ELF stripped B', 'RAM statique B', 'Pile max analysée B', 'ARM émises'],
    rows: [
      ['Nano S+ référence', 91231, 158004, 6376, 12496, 30364],
      ['Nano S+ lean_opt (T7 cycle 1)', 89695, 156468, 6232, 12496, 29898],
      ['Nano S+ lean_sameflags (T7 cycle 1)', 90719, 157492, 6232, 12496, 30236],
      ['Nano S+ lean_opt (baseline T6)', 93791, 160564, 6232, 12496, 31169],
      ['Nano S+ lean_sameflags (baseline T6)', 94303, 161076, 6232, 12496, 31507],
      ['Nano X référence', 91231, 158000, 4212, 11248, 30460],
      ['Nano X lean_opt (T7 cycle 1)', 90463, 157232, 4068, 11248, 30205],
      ['Nano X lean_sameflags (T7 cycle 1)', 91487, 158256, 4068, 11248, 30543],
      ['Nano X lean_opt (baseline T6)', 94559, 161328, 4068, 11248, 31574],
      ['Nano X lean_sameflags (baseline T6)', 95327, 162096, 4068, 11248, 31912]
    ]
  },
  {
    title: 'BOLOS · testnet · T7 cycle 1 et baseline T6 · pas de contrôle sameflags publié',
    headers: ['Cible / variante', 'Flash B', 'ELF stripped B', 'RAM statique B', 'Pile max analysée B', 'ARM émises'],
    rows: [
      ['Nano S+ référence', 91236, 158016, 6376, 12496, 30364],
      ['Nano S+ lean_opt (T7 cycle 1)', 89700, 156480, 6232, 12496, 29898],
      ['Nano S+ lean_opt (baseline T6)', 93796, 160576, 6232, 12496, 31169],
      ['Nano X référence', 91236, 158012, 4212, 11248, 30460],
      ['Nano X lean_opt (T7 cycle 1)', 90468, 157244, 4068, 11248, 30205],
      ['Nano X lean_opt (baseline T6)', 94308, 161084, 4068, 11248, 31574]
    ]
  },
  {
    title: 'BOLOS · latences wall-clock Speculos · baseline T6 (bolos_results.json, ms)',
    headers: ['Cible / scénario', 'Rounds', 'Minimum réf.', 'Minimum Lean', 'Médiane réf.', 'Médiane Lean'],
    rows: [
      ['Nano S+ GET_VERSION', 26, 1.679, 1.734, 1.829, 1.855],
      ['Nano S+ GET_MASTER_FINGERPRINT', 22, 30.707, 30.614, 31.174, 31.254],
      ['Nano S+ GET_EXTENDED_PUBKEY', 18, 59.441, 60.084, 60.821, 61.267],
      ['Nano S+ GET_WALLET_ADDRESS', 14, 208.705, 207.278, 212.269, 211.53],
      ['Nano S+ REGISTER_WALLET', 10, 1334.744, 1342.062, 1349.012, 1360.509],
      ['Nano S+ SIGN_PSBT_TR_3IN', 8, 2298.267, 2284.917, 2436.324, 2435.271],
      ['Nano S+ SIGN_PSBT_WSH3OF5_3IN', 6, 6754.455, 6751.222, 7304.089, 7598.486],
      ['Nano X GET_VERSION', 26, 1.744, 1.748, 1.859, 1.853],
      ['Nano X GET_MASTER_FINGERPRINT', 22, 30.476, 30.978, 30.924, 31.517],
      ['Nano X GET_EXTENDED_PUBKEY', 18, 59.3, 59.78, 60.262, 62.34],
      ['Nano X GET_WALLET_ADDRESS', 14, 205.912, 212.022, 209.733, 218.811],
      ['Nano X REGISTER_WALLET', 10, 1334.971, 1358.028, 1344.669, 1461.584],
      ['Nano X SIGN_PSBT_TR_3IN', 8, 2297.971, 2269.222, 2437.73, 2592.269],
      ['Nano X SIGN_PSBT_WSH3OF5_3IN', 6, 6832.232, 6630.962, 7944.3, 8065.09]
    ]
  },
  {
    title: 'BOLOS · latences wall-clock Speculos · T7 cycle 1 (t7-cycle1.pinned-complete.experimental.json, hôte partagé CPU0, ms)',
    headers: ['Cible / scénario', 'Rounds', 'Minimum réf.', 'Minimum Lean', 'Médiane réf.', 'Médiane Lean'],
    rows: [
      ['Nano S+ GET_VERSION', 26, 1.866, 2.56, 2.331, 2.788],
      ['Nano S+ GET_MASTER_FINGERPRINT', 22, 31.169, 33.657, 33.882, 37.156],
      ['Nano S+ GET_EXTENDED_PUBKEY', 18, 60.455, 64.185, 64.77, 69.673],
      ['Nano S+ GET_WALLET_ADDRESS', 14, 208.662, 227.645, 230.715, 236.673],
      ['Nano S+ REGISTER_WALLET', 10, 1364.462, 1455.238, 1568.562, 1525.039],
      ['Nano S+ SIGN_PSBT_TR_3IN', 8, 2596.802, 2429.755, 3308.156, 2912.53],
      ['Nano S+ SIGN_PSBT_WSH3OF5_3IN', 6, 7230.509, 7360.302, 8706.171, 8203.392],
      ['Nano X GET_VERSION', 26, 1.932, 2.482, 2.043, 2.58],
      ['Nano X GET_MASTER_FINGERPRINT', 22, 31.233, 33.388, 32.167, 42.578],
      ['Nano X GET_EXTENDED_PUBKEY', 18, 60.305, 63.36, 62.242, 67.613],
      ['Nano X GET_WALLET_ADDRESS', 14, 214.497, 222.412, 216.358, 231.76],
      ['Nano X REGISTER_WALLET', 10, 1362.366, 1443.174, 1385.25, 1584.956],
      ['Nano X SIGN_PSBT_TR_3IN', 8, 2315.42, 2631.307, 2537.255, 2797.147],
      ['Nano X SIGN_PSBT_WSH3OF5_3IN', 6, 6805.412, 7413.174, 10168.386, 8064.053]
    ]
  },
  {
    title: 'Vanadium · tailles et réservations · contrôle same-profile séparé',
    headers: ['Variante', 'RX B', 'ELF B', 'RW B', 'Pile réservée B', 'RW + pile B', 'Pages code / profondeur'],
    rows: [
      ['plain référence', 306522, 542552, 65836, 65536, 131372, '1198 / 11'],
      ['plain lean_optimized', 267954, 268384, 33076, 32768, 65844, '1047 / 11'],
      ['plain same_profile_lean', 292560, 538860, 65844, 65536, 131380, '1143 / 11'],
      ['autoapprove référence', 272168, 485684, 65836, 65536, 131372, '1064 / 11'],
      ['autoapprove lean_optimized', 235422, 235852, 33076, 32768, 65844, '920 / 10'],
      ['autoapprove same_profile_lean', 257150, 478100, 65844, 65536, 131380, '1005 / 10']
    ]
  },
  {
    title: 'Vanadium · E2E Flex · wall-clock (ms) et compteurs RV32',
    headers: ['Workload / variante', 'Médiane ms', 'Minimum ms', 'Moyenne ms', 'RV32 insns', 'Page loads', 'Page commits'],
    rows: [
      ['get_fingerprint référence', 950.66, 912.68, 946.11, 6190, 136, 0],
      ['get_fingerprint optimisé', 952.26, 728.06, 912.01, 5891, 134, 0],
      ['get_fingerprint same-profile (1 observation)', 859.71, 859.71, 859.71, 5891, 139, 0],
      ['sign_transaction référence', 4976.32, 4236.07, 4886.87, 234214, 1325, 169],
      ['sign_transaction optimisé', 4249.16, 3926.9, 4269.2, 200029, 1232, 155],
      ['sign_transaction same-profile (1 observation)', 4099.36, 4099.36, 4099.36, 199963, 1258, 154],
      ['send_to_silent_payment référence', 5120.08, 4979.51, 5489.82, 276922, 1342, 211],
      ['send_to_silent_payment optimisé', 4856.23, 4661.52, 5311.59, 243238, 1284, 201],
      ['send_to_silent_payment same-profile (1 observation)', 4836.95, 4836.95, 4836.95, 243176, 1318, 189],
      ['silent_payment_account référence', 3975.53, 3706.21, 3933.52, 180688, 948, 49],
      ['silent_payment_account optimisé', 3587.34, 3234.74, 3576.4, 179232, 902, 47],
      ['silent_payment_account same-profile (1 observation)', 3741.68, 3741.68, 3741.68, 179220, 921, 47]
    ]
  },
  {
    title: 'Vanadium · transport et heap instrumenté (B) · référence heap absent',
    headers: ['Workload / variante', 'Échanges APDU', 'B envoyés', 'B reçus', 'peak_heap_bytes', 'current_heap_bytes'],
    rows: [
      ['get_fingerprint référence', 266, 86907, 2613, 'absent', 'absent'],
      ['get_fingerprint optimisé', 262, 81297, 2575, 853, 837],
      ['get_fingerprint same-profile', 273, 84852, 2677, 853, 837],
      ['sign_transaction référence', 2626, 888050, 71587, 'absent', 'absent'],
      ['sign_transaction optimisé', 2437, 780537, 65963, 5318, 869],
      ['sign_transaction same-profile', 2492, 807638, 66204, 5318, 869],
      ['send_to_silent_payment référence', 2646, 907795, 83507, 'absent', 'absent'],
      ['send_to_silent_payment optimisé', 2528, 820575, 79651, 6851, 869],
      ['send_to_silent_payment same-profile', 2602, 852897, 77051, 6851, 869],
      ['silent_payment_account référence', 1896, 620360, 31986, 'absent', 'absent'],
      ['silent_payment_account optimisé', 1803, 559826, 30557, 1269, 837],
      ['silent_payment_account same-profile', 1841, 575153, 30918, 1269, 837]
    ]
  },
  {
    title: 'BOLOS · hotspots x86_64 RDTSCP · cycles hôte empiriques, pas ARM',
    headers: ['Hotspot', 'Opérations', 'Cycles réf.', 'Cycles Lean', 'Réf. / Lean (×)'],
    rows: [
      ['format_sats_amount', 200000, 98027336, 20443220, 4.795],
      ['merkle_get_ith_direction_256', 409600, 21112452, 30822084, 0.685],
      ['bip32_pubkey_export_check', 800000, 13120888, 11420378, 1.149],
      ['musig2_keysort_5pks', 200000, 78096358, 150486242, 0.519],
      ['segwit_program_check', 800000, 6739122, 11201334, 0.602],
      ['Suite agrégée (régression)', '—', 217096156, 224373258, 0.968]
    ]
  },
  {
    title: 'BOLOS · workloads unitaires hôte · baseline T6 (ms)',
    headers: ['Workload', 'Minimum réf.', 'Minimum Lean', 'Médiane réf.', 'Médiane Lean'],
    rows: [
      ['test_display_utils', 1.328, 1.307, 1.452, 1.355],
      ['test_get_merkle_leaf_index', 26.639, 17.365, 27.253, 18.096],
      ['test_musig', 65.156, 64.41, 66.725, 65.963],
      ['test_wallet', 3.602, 2.504, 3.688, 2.569],
      ['test_register_wallet', 73.364, 58.978, 74.25, 60.404],
      ['test_get_wallet_address', 69.662, 59.058, 70.725, 59.751],
      ['test_get_extended_pubkey', 138.57, 130.751, 139.901, 132.274],
      ['test_psbt_fields', 42.025, 32.913, 42.943, 33.664]
    ]
  },
  {
    title: 'BOLOS · workloads unitaires hôte · T7 cycle 1 (CPU0, ms)',
    headers: ['Workload', 'Minimum réf.', 'Minimum Lean', 'Médiane réf.', 'Médiane Lean', 'Accélération médiane (×)'],
    rows: [
      ['test_display_utils', 1.519, 1.435, 1.669, 1.554, 1.074],
      ['test_get_merkle_leaf_index', 31.171, 20.631, 34.022, 21.356, 1.593],
      ['test_musig', 77.454, 72.161, 99.733, 99.584, 1.001],
      ['test_wallet', 4.77, 3.076, 5.507, 3.577, 1.54],
      ['test_register_wallet', 99.077, 76.911, 118.179, 99.92, 1.183],
      ['test_get_wallet_address', 80.319, 66.913, 103.06, 86.781, 1.188],
      ['test_get_extended_pubkey', 231.999, 240.502, 274.125, 253.828, 1.08],
      ['test_psbt_fields', 69.39, 56.266, 72.467, 60.148, 1.205]
    ]
  },
  {
    title: 'Vanadium · microbenchmark hôte (1 000 000 itérations), pas un E2E Flex',
    headers: ['Métrique', 'Référence', 'Lean'],
    rows: [
      ['Hotpath médiane ns', 1022290283, 46027747],
      ['ns / tx step', 1022.29, 46.03],
      ['opérations / seconde', 978196, 21726025],
      ['Accélération hotpath', '1×', '22,21×'],
      ['Kernel ns / check', 'non fourni', 3.5942],
      ['Kernel Mops / seconde', 'non fourni', 278.23]
    ]
  }
]

export const BENCHMARK_CONCLUSIONS = 'Synthèse T6 / T7 et contrôles : après le cycle 1 T7 (suppression des métadonnées !llvm.loop sur .seqFor en embarqué et préservation de minsize/optsize en LTO), la Flash BOLOS mainnet passe sous la référence C : 91 231 → 89 695 B sur Nano S+ (-1 536 B / -1,68 % vs réf., -4 096 B vs baseline T6 93 791 B) et 91 231 → 90 463 B sur Nano X (-768 B / -0,84 % vs réf., -4 096 B vs baseline T6 94 559 B) ; en contrôle lean_sameflags, Nano S+ est à 90 719 B (-512 B vs réf., contre 94 303 B en T6) et Nano X à 91 487 B (+256 B vs réf., contre 95 327 B en T6). Les instructions ARM Thumb émises baissent à 29 898 (-466 vs réf.) sur Nano S+ et 30 205 (-255 vs réf.) sur Nano X. Les cycles 2 et 3 n’apportant aucun gain Flash (0 B puis +512/+768 B) ont été annulés. La RAM statique baisse de 144 B, la pile maximale analysée reste à 12 496 B / 11 248 B (frame kernel max 136 B S+ / 176 B X) ; register_wallet baisse de 256 B et format_sats_amount passe de 268 B à 124/132 B (99 → 34 insns), tandis que get_extended_pubkey augmente de 8 B. qsort récursif disparaît, mais __udivmoddi4 reste présent en sameflags. Sur hôte x86_64, les 8 suites unitaires C sont toutes entre 1,001× et 1,593× en médiane, mais la suite de microbenchmarks RDTSCP agrégée régresse (0,968× en T6, 0,872× en T7) malgré format_sats_amount (4,795× / 5,463×) et bip32_pubkey_export_check (1,149× / 1,235×), car Merkle, MuSig2 et SegWit ralentissent. Vanadium plain same-profile réduit RX de 4,55 % et ELF de 0,68 %, mais RW + pile augmente de 8 B (131 372 → 131 380 B) : la baisse optimisée de réservation ne vient pas du seul code Lean. La médiane get_fingerprint régresse de 0,17 % malgré moins d’instructions ; les médianes sign_transaction, send_to_silent_payment et silent_payment_account baissent respectivement de 14,61 %, 5,15 % et 9,76 %. Aucun gain wall-clock universel ni attribution intégrale au compilateur ne peut en être déduit.'

export function formatMeasurement(value: string | number, header = ''): string {
  const format = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 4 })
  if (typeof value === 'number') {
    return /\bB\b|_bytes$/.test(header)
      ? `${format(value)} B (${format(value / 1024)} KiB)`
      : format(value)
  }
  return value.replace(/([+-]?\d[\d \u00a0\u202f]*(?:,\d+)?) B\b/g, (match, bytes: string) =>
    `${match} (${format(Number(bytes.replace(/[ \u00a0\u202f]/g, '').replace(',', '.')) / 1024)} KiB)`
  )
}

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
    severityLabel: 'High · risque de blocage des fonds',
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
      'Missing BIP-379 Miniscript B/V/K/W typechecking, non-malleability, unconditional signature requirement, height/time timelock mixing, BIP-68 older(n) masking and resource checks. Medium is the source report’s triage, not a demonstrated exploit severity; impact depends on the accepted policy. The pinned patch adds llb_miniscript_check_postfix; no new exhaustive validation or proof of exploitability is claimed here.'
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
    '**Important :** il s\'agit d\'une POC d\'une journée, un déploiement demanderait davantage de review de notre côté et la validation des choix de modélisation du vôtre.',
    '',
    '## 1. Méthodologie et architecture',
    '',
    'Côté temps humain, j\'ai passé environ **1 h** au départ pour cadrer le problème, poser les specs haut niveau et designer le pipeline (j\'avais déjà une idée de la stack Ledger donc j\'ai gagné un peu de temps), **15 min** ce matin pour débloquer un souci de routing d\'inférence, et **1 h** à la fin pour review et polir l\'ensemble. Tout le reste a tourné en autonomie.',
    '',
    'Ledger maintient deux apps Bitcoin : l\'app historique en C (`LedgerHQ/app-bitcoin@f010982d`), compilée nativement en ARM Thumb directement au-dessus de BOLOS, et la nouvelle V-App en Rust (`LedgerHQ/vanadium@ace8e969`), compilée en RISC-V 32-bit (`RV32IMAC`) et exécutée par la VM `app-vanadium` : 100 % de l\'exécution RISC-V reste confinée dans le Secure Element, seule la mémoire paginée — code et données en pages de `256 B` chiffrées et authentifiées par arbre de Merkle — est déportée sur le host non fiable, utilisé comme stockage et non comme moteur de calcul, pour dépasser la limite de RAM/Flash interne du SE.',
    '',
    'Plutôt que de toucher à l\'UI ou au transport APDU/ECALL (réécrire l\'UI en Lean 4 aurait peu d\'intérêt), on a gardé le décodage bas niveau des flux, l\'UI et l\'IO d\'origine dans chaque app et concentré l\'effort sur des vérifications ciblées de la logique partagée. Le résultat, [Th0rgal/lean-ledger-bitcoin](https://github.com/Th0rgal/lean-ledger-bitcoin), combine deux livrables :',
    '',
    `- **Un jumeau formel en Lean 4** des specs \`BIP-32/67/143/327/341/352/370/379/388\` et des machines d'état BOLOS/Vanadium, avec \`0 sorryAx\`, utilisé comme oracle différentiel. ${PROOF_SCOPE}`,
    '- **Un sous-ensemble exécutable freestanding sur slices zero-copy** (`BitcoinLedger/FreestandingKernels.lean`), compilé via `turbo-lean` (`emit-freestanding-c-lib`, garde `codeHasHeapOps=false`) en LLVM IR 32-bit (`thumbv6m`, `thumbv8m.main`, `riscv32imac`) et lié en LTO via `45` exports ABI `llb_*` (distincts des symboles internes et du jumeau formel complet) pour les vérifications ciblées : typechecker Miniscript `BIP-379/BIP-388` en postfixe, machine d\'état `nLockTime` `BIP-370`, égalité Dual-UTXO et bornes `MAX_MONEY`, validation de chemins `BIP-32`, `CompactSize` canonique, tri lexicographique sans récursion des clés publiques MuSig2/`sortedmulti`, et formatage ASCII des montants sans division.',
    '',
    `Les intégrations sont des patchs sources épinglés sur \`96deef7\` : [\`app-bitcoin-lean-opt.patch\`](${BOLOS_PATCH_URL}) côté BOLOS et [\`vanadium-bitcoin-lean-opt.patch\`](${VANADIUM_PATCH_URL}) côté Vanadium.`,
    '',
    '```mermaid',
    MERMAID_ARCHITECTURE,
    '```',
    '',
    '## 2. Plan d\'exécution',
    '',
    '1) **Specs formelles et cross-backtesting** : formalisation des BIPs en Lean 4 à partir du cadrage haut niveau, puis implémentation du kernel exécutable en bouclant sur les test suites des deux repos (`ctest`/Ragger côté C, `cargo test`/Speculos côté Rust) pour affiner la spec jusqu\'à convergence.',
    `2) **Backend LLVM 32-bit dans \`turbo-lean\`** : ajout du support freestanding 32-bit zero-alloc (\`thumbv6m\`, \`thumbv8m.main\`, \`riscv32imac\`) dans notre compilateur [\`turbo-lean\`](https://github.com/Th0rgal/turbo-lean). Passer par LLVM IR plutôt que d'émettre du bytecode ou de l'assembleur direct m'a semblé plus sûr (la sémantique LLVM est déjà largement formalisée) et ne demandait qu'un patch ciblé. Notez qu'il reste donc encore de la marge d'optimisation avec plus de compute. ${TCB_SCOPE}`,
    '3) **Intégration dans les deux apps** : shim FFI minimal dans `app-bitcoin` et `vnd-bitcoin` conservant l\'UI/IO d\'origine et linkant les kernels Lean en LTO.',
    '4) **Boucle d\'optimisation `maxwell`** : itérations avec les scripts reproductibles `bolos_benchmark.sh` et `vanadium_benchmark.sh`, en contrôlant les invariants formels et les régressions. Les JSON publiés pour T6 documentent gains et régressions ; ils ne remplacent pas une validation de déploiement sur matériel physique.',
    '',
    '## 3. Résultats et limites des mesures',
    '',
    BENCHMARK_STATUS,
    '',
    '### T7 · delta candidat A contre baseline Lean · VM Boat large',
    '',
    CANDIDATE_A_READING,
    '',
    '| Métrique | Baseline C (`app-bitcoin`) | Lean 4 + C | Baseline Rust (`vanadium`) | Lean 4 + Rust | Contrôle Rust same_profile_lean |',
    '|---|---|---|---|---|---|',
    ...BENCHMARK_ROWS.map(
      (r) => `| **${r.metric}** | ${formatMeasurement(r.origC)} | **${formatMeasurement(r.patchedC)}** | ${formatMeasurement(r.origRust)} | **${formatMeasurement(r.patchedRust)}** | ${formatMeasurement(r.sameProfileRust ?? 'Voir les contrôles détaillés ci-dessous')} |`
    ),
    '',
    BENCHMARK_READING,
    '',
    BENCHMARK_CONCLUSIONS,
    '',
    ...MEASUREMENT_TABLES.flatMap((table) => [
      `### ${table.title}`,
      '',
      `| ${table.headers.join(' | ')} |`,
      `| ${table.headers.map(() => '---').join(' | ')} |`,
      ...table.rows.map((row) => `| ${row.map((cell, index) => formatMeasurement(cell, table.headers[index])).join(' | ')} |`),
      ''
    ]),
    RAM_CURVE_NOTICE,
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
    'L\'ensemble du run autonome (formalisation, patch compilateur `turbo-lean`, preuves et vérifications Lean 4 (`2 585` constantes `.thmInfo` dont `879` dans `Proofs.*`, `0 sorryAx`), intégration C/Rust et boucles `maxwell`) a tourné en **19,9 h** wall-clock sur la fenêtre capturée ci-dessous jusqu\'au merge du repo principal (dont 2 heures de pause à cause d\'un problème d\'approvisionnement d\'inférence que j\'ai réglé à la main) à travers **30 agents actifs** et **25 microVMs** :',
    '',
    '- **379,0 CPU hours** de compute cumulé (`327,4 CPU-h` sur 25 microVMs cloud éphémères AMD Zen + `51,6 CPU-h` sur notre serveur dédié pendant les tours actifs).',
    '- **654,9 GB RAM hours** sur les VMs cloud éphémères (`1 049,6 GB RAM-h` en comptant la RAM réservée sur notre serveur dédié durant les tours actifs).',
    '- **23,2 M tokens / agent** en moyenne (`696,6 M` tokens cumulés sur `30` agents actifs : `1` coordinateur + `29` subagents).',
    '',
    'Aux tarifs publics de l\'API Google et d\'OrcaRouter (pour `GLM 5.3 uncensored`) côté inférence, et d\'AWS EC2 On-Demand côté location des VMs, ce run reviendrait à environ **~$520 + ~$17** (soit **~$537** au total), hors infrastructure personnelle (notre serveur dédié et nos GPUs d\'entraînement amont pour optimiser le compilateur, dont la part amortie sur ce run reste relativement négligeable).',
    '',
    '## 6. Prochaines étapes',
    '',
    'Dans cette POC, toutes les portes de validation métier, le typechecking BIP-379/388, le tri MuSig2 et le formatage des montants sont compilés depuis Lean 4 en zero-alloc, tandis que la désérialisation bas niveau des flux (parcours clé-valeur PSBT, lecture des transactions brutes et lexing des descripteurs) reste assurée par le code C et Rust existant (`fastpsbt`, `bip388`) et que l\'émission C99/LLVM de `turbo-lean` fait encore partie de la TCB de compilation.',
    '',
    'L\'étape naturelle suivante consisterait à compiler également l\'intégralité des parseurs streaming et des machines d\'état depuis Lean 4 pour ne laisser en C et en Rust qu\'une coquille minimale de syscalls matériels (crypto `cx_*` / `ecall_*`, transport APDU et écrans NBGL), tout en refermant la TCB du compilateur :',
    '',
    '- **Parseurs streaming zero-copy et sighash en Lean 4** : compiler directement sur slices plates le lecteur streaming BIP-174/370 (PSBT et transactions sérialisées), le générateur streaming des préimages de sighash BIP-143 et BIP-341 (pilotant le SHA-256 matériel via de simples callbacks C/ECALL), le parseur binaire Script / Tapscript / BIP-388 et l\'automate de session APDU, avec preuves d\'absence totale de lecture hors-bornes, de terminaison bornée et de raffinement exact vis-à-vis de `Spec/`.',
    '- **Fermeture de la TCB freestanding de `turbo-lean`** : étendre les théorèmes de préservation sémantique de `LeanNative` jusqu\'aux accès mémoire bornés sur slices plates et aux boucles bornées, avec émission directe et validation de traduction LLVM IR / LTO sur les trois cibles 32 bits (`thumbv6m`, `thumbv8m.main`, `riscv32imac`).',
    '',
    'En termes d\'effort, compter environ **24 à 36 h** de run autonome supplémentaire sur le même pipeline (soit du même ordre de grandeur que cette POC) pour la compilation et les preuves de bout en bout, couplées à une revue conjointe des hypothèses de modélisation et des frontières matérielles avec les équipes Ledger.',
    ''
  ]
  return lines.join('\n')
}
