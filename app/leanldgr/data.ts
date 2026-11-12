export const PAGE_TITLE = 'Lean 4 Ledger'

export const REPO_URL = 'https://github.com/Th0rgal/lean-ledger-bitcoin'
export const BOLOS_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/96deef7c795358b82a37831bf3b1ace2741cbf24/ffi/bolos/patches/app-bitcoin-lean-opt.patch'
export const VANADIUM_PATCH_URL =
  'https://github.com/Th0rgal/lean-ledger-bitcoin/blob/96deef7c795358b82a37831bf3b1ace2741cbf24/ffi/vanadium/patches/vanadium-bitcoin-lean-opt.patch'
export const TURBO_LEAN_URL = 'https://github.com/Th0rgal/turbo-lean'

export const PROOF_SCOPE = 'L’audit T2 précédent rapporte 0 sorryAx et zéro axiome ajouté/non standard (axiomes Lean standard propext et Quot.sound autorisés), sans nouvelle vérification ici. Il compte 2 585 constantes .thmInfo au total, déclarations générées incluses, dont 879 dans Proofs.* : ce total ne désigne pas autant de preuves indépendantes écrites à la main. Le jumeau formel complet est distinct du sous-ensemble exécutable : 45 exports ABI llb_*, à ne pas confondre avec les symboles internes émis par le compilateur.'
export const TCB_SCOPE = 'Transparence sur la TCB : lowerModuleForTarget_sound porte sur la transformation de LLVMAst, pas sur une preuve de bout en bout du binaire. La commande emit-freestanding-c-lib impose le garde codeHasHeapOps=false ; ce contrôle exclut les opérations de tas reconnues dans ce périmètre, sans prouver une pile nulle ni l’absence de heap dans toute l’application. L’extraction LCNF et les frontières clang/rustc/lld restent non vérifiées dans la TCB. Les tests différentiels C-ABI, llvm-nm et les rapports de pile .su apportent des contrôles complémentaires, non une preuve de ces frontières. Absence de récursion ne signifie pas absence de frames de pile : le JSON Vanadium rapporte une frame kernel maximale de 96 B sur RV32 (120 frames analysées), sans borner toute l’application ; le JSON BOLOS ne fournit pas de maximum de frame kernel thumbv6m.'
export const BENCHMARK_STATUS = 'T6 — mesures publiées dans benchmarks/bolos_results.json (commit 222e139) et benchmarks/vanadium_results.json (commit 90ba9da). Provenance Option2 : Serveur dédié de la flotte, même hôte pour référence et Lean. Ces résultats ne démontrent pas un gain uniforme : BOLOS augmente la Flash et les instructions émises ; plusieurs latences régressent. Les patchs liés restent épinglés sur 96deef7, distinct des commits de publication des mesures.'
export const BENCHMARK_READING = 'Précisions de lecture. Les tailles de sections et comptes statiques ARM sont déterministes pour ces artefacts ; les instructions ARM émises ne sont pas des instructions exécutées. Les compteurs RV32, pages et échanges VM décrivent le travail exécuté du scénario, pas sa durée. Le wall-clock Speculos dépend du bruit hôte, du transport et du scénario, sans mesure sur matériel physique. BOLOS : contrôle lean_sameflags séparé du patch lean_opt, Nano S+ ARMv8-M et Nano X thumbv6m selon les cibles publiées. Vanadium : plain (production) et autoapprove (E2E) ne sont pas interchangeables. Le profil Cargo/link optimisé inclut LTO, panic = "abort" (arrêt sans déroulement de pile), retrait de .eh_frame et stripping ; réduire le fichier ELF ne signifie pas réduire autant le code chargé RX. Le contrôle same_profile_lean conserve panic = "unwind", strip = "none" et les budgets heap/stack de 64+64 KiB, contre 32+32 KiB optimisés. RW + pile est une réservation statique (514 → 258 pages de 256 B), pas peak_heap_bytes. Le pic heap Lean est instrumenté ; la référence ne fournit aucun pic heap, donc aucun pourcentage de gain heap ne peut être calculé. Les latences Vanadium référence/optimisé suivent ABBA : une paire de chauffe exclue, 5 cycles, 10 échantillons par variante et workload ; les durées same-profile sont des observations uniques, pas une comparaison ABBA équivalente. Les cycles RDTSCP et nanosecondes hôte restent des mesures empiriques, pas des cycles ARM/RV32 déterministes. La frame kernel maximale RV32 publiée est de 96 B ; ce n’est pas la pile maximale de l’application ni une chaîne d’appels complète. Le maximum de frame kernel thumbv6m n’est pas fourni par ces JSON.'
export const RUST_TEST_HISTORY = 'Historique : 176 tests workspace et 16 tests C-ABI rapportés séparément ; aucune nouvelle validation.'
export const C_TEST_HISTORY = 'Résultats hôte précédemment rapportés, non relancés ici : référence 30/30 ctest, Lean 31/31. Historique Ragger non relancé : Nano S+ 277 passed, 5 skipped ; Nano X 53 passed, 2 skipped.'
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
  measure('Flash chargée · Nano S+ mainnet', 91231, 93791, 'B'),
  measure('RAM statique · Nano S+ mainnet', 6376, 6232, 'B'),
  measure('RAM statique + pile maximale analysée · Nano S+', 18872, 18728, 'B'),
  measure('Instructions ARM Thumb émises · Nano S+', 30364, 31169, 'insns'),
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
    origC: '91 231 B (89,1 KiB · Nano S+)',
    patchedC: '93 791 B (+2,81 % · Nano S+)',
    origRust: '306 522 B (plain, 1 198 pages, depth 11)',
    patchedRust: '267 954 B (-12,58 %, plain, 1 047 pages, depth 11)',
    sameProfileRust: '292 560 B (-4,55 %, plain, 1 143 pages, depth 11)'
  },
  {
    metric: 'Taille du fichier ELF',
    origC: '158 004 B (154,3 KiB, stripped)',
    patchedC: '160 564 B (+2 560 B, stripped)',
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
    patchedC: '12 496 B max Nano S+ / 11 248 B Nano X (qsort récursif absent ; frame kernel max non fournie)',
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
    origC: '30 364 insns ARM émises',
    patchedC: '31 169 insns ARM émises (+2,65 %)',
    origRust: '234 214 insns RV32 exécutées (sign_transaction)',
    patchedRust: '200 029 insns RV32 (-14,60 %)',
    sameProfileRust: '199 963 insns RV32 (sign_transaction)'
  },
  {
    metric: 'Latence médiane Speculos (BOLOS TR_3IN ; Vanadium sign_transaction)',
    origC: '2 436,324 ms (Nano S+) / 2 437,730 ms (Nano X)',
    patchedC: '2 435,271 ms (-0,04 %) / 2 592,269 ms (+6,34 %)',
    origRust: '4 976,32 ms (1 325 page_loads)',
    patchedRust: '4 249,16 ms (-14,61 %, 1 232 page_loads)',
    sameProfileRust: '4 099,36 ms (1 observation, 1 258 page_loads ; pas un ABBA équivalent)'
  },
  {
    metric: 'Latence médiane SIGN_PSBT_WSH3OF5_3IN · Nano S+ (Speculos)',
    origC: '7 304,089 ms',
    patchedC: '7 598,486 ms (+4,03 %)',
    origRust: 'scénario absent du JSON Vanadium',
    patchedRust: 'non mesuré, ne pas substituer sign_transaction'
  },
  {
    metric: 'Latence médiane SIGN_PSBT_WSH3OF5_3IN · Nano X (Speculos)',
    origC: '7 944,300 ms',
    patchedC: '8 065,090 ms (+1,52 %)',
    origRust: 'scénario absent du JSON Vanadium',
    patchedRust: 'non mesuré, ne pas substituer sign_transaction'
  },
  {
    metric: 'Test suites & preuves',
    origC: 'Historique hôte, non relancé ici : 30/30 ctest ; Ragger historique non relancé',
    patchedC:
      'Historique hôte, non relancé ici : 31/31 ctest ; historique Ragger non relancé : Nano S+ 277 passed / 5 skipped, Nano X 53 passed / 2 skipped ; 2 585 .thmInfo (879 Proofs.*)',
    origRust: 'Historique : 166 tests workspace',
    patchedRust:
      'Historique : 176 tests workspace et 16 tests C-ABI rapportés séparément ; pas de relance validée'
  }
]

export interface MeasurementTable {
  title: string
  headers: string[]
  rows: (string | number)[][]
}

export const MEASUREMENT_TABLES: MeasurementTable[] = [
  {
    title: 'BOLOS · mainnet · contrôle lean_sameflags distinct de lean_opt',
    headers: ['Cible / variante', 'Flash B', 'ELF stripped B', 'RAM statique B', 'Pile max analysée B', 'ARM émises'],
    rows: [
      ['Nano S+ référence', 91231, 158004, 6376, 12496, 30364],
      ['Nano S+ lean_opt', 93791, 160564, 6232, 12496, 31169],
      ['Nano S+ lean_sameflags', 94303, 161076, 6232, 12496, 31507],
      ['Nano X référence', 91231, 158000, 4212, 11248, 30460],
      ['Nano X lean_opt', 94559, 161328, 4068, 11248, 31574],
      ['Nano X lean_sameflags', 95327, 162096, 4068, 11248, 31912]
    ]
  },
  {
    title: 'BOLOS · testnet · pas de contrôle sameflags publié',
    headers: ['Cible / variante', 'Flash B', 'ELF stripped B', 'RAM statique B', 'Pile max analysée B', 'ARM émises'],
    rows: [
      ['Nano S+ référence', 91236, 158016, 6376, 12496, 30364],
      ['Nano S+ lean_opt', 93796, 160576, 6232, 12496, 31169],
      ['Nano X référence', 91236, 158012, 4212, 11248, 30460],
      ['Nano X lean_opt', 94308, 161084, 4068, 11248, 31574]
    ]
  },
  {
    title: 'BOLOS · latences wall-clock Speculos · référence → lean_opt (ms)',
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
    title: 'BOLOS · workloads unitaires hôte · wall-clock (ms)',
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

export const BENCHMARK_CONCLUSIONS = 'Régressions et contrôles : BOLOS mainnet Flash +2 560 B sur Nano S+ et +3 328 B sur Nano X ; lean_sameflags monte à 94 303 B et 95 327 B. La RAM statique baisse de 144 B, mais la pile maximale analysée reste 12 496 B / 11 248 B ; register_wallet baisse de 256 B tandis que get_extended_pubkey augmente de 8 B. qsort récursif disparaît, mais __udivmoddi4 reste présent en sameflags. La suite de hotspots hôte régresse (217 096 156 → 224 373 258 cycles, ratio 0,968×), malgré le formatage à 4,795× ; Merkle, MuSig2 et SegWit ralentissent. Vanadium plain same-profile réduit RX de 4,55 % et ELF de 0,68 %, mais RW + pile augmente de 8 B (131 372 → 131 380 B) : la baisse optimisée de réservation ne vient pas du seul code Lean. La médiane get_fingerprint régresse de 0,17 % malgré moins d’instructions ; les médianes sign_transaction, send_to_silent_payment et silent_payment_account baissent respectivement de 14,61 %, 5,15 % et 9,76 %. Aucun gain wall-clock universel ni attribution intégrale au compilateur ne peut en être déduit.'

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
