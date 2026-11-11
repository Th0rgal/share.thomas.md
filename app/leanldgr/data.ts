export const PAGE_TITLE = 'Lean 4 pour Ledger Bitcoin'

export const MERMAID_ARCHITECTURE = `flowchart TB
    subgraph Lean["Noyau commun en Lean 4 (0 sorryAx)"]
        Spec["Spécifications unifiées BIP-32 / 143 / 341 / 370 / 379 / 388"]
        Kernel["Noyau exécutable sans allocation<br/>BitcoinLedger/FreestandingKernels.lean"]
        Turbo["turbo-lean (backend LLVM 32 bits)"]
        Spec --> Kernel --> Turbo
    end

    subgraph Bolos["App historique C (LedgerHQ/app-bitcoin)"]
        BUI["UI NBGL + transport APDU + syscalls BOLOS<br/>(conservés en C)"]
        BELF["Clang / LLD LTO (-Oz -fropi -frwpi)<br/>Binaire natif ARM Thumb (Nano S+ / Nano X)"]
        BUI --> BELF
    end

    subgraph Vanadium["Nouvelle V-App Rust (LedgerHQ/vanadium)"]
        VUI["UI Ledger Flex + client ECALLs<br/>(conservés en Rust)"]
        VELF["rustc + LLD (riscv32imac-unknown-none-elf)<br/>ELF paginé 256 B (arbre de Merkle)"]
        VVM["VM RISC-V app-vanadium sur BOLOS"]
        VUI --> VELF --> VVM
    end

    Turbo -->|"IR LLVM ARMv6-M / ARMv8-M"| BELF
    Turbo -->|"IR LLVM RV32IMAC"| VELF`

export interface BenchmarkRow {
  metric: string
  origC: string
  patchedC: string
  origRust: string
  patchedRust: string
}

export const BENCHMARK_ROWS: BenchmarkRow[] = [
  {
    metric: 'Cible matérielle / exécution',
    origC: 'BOLOS natif ARM Thumb (Nano S+)',
    patchedC: 'BOLOS natif ARM Thumb (Nano S+)',
    origRust: 'VM Vanadium RV32IMAC (Flex)',
    patchedRust: 'VM Vanadium RV32IMAC (Flex)'
  },
  {
    metric: 'Flash / segment code (PT_LOAD RX)',
    origC: '91 231 B',
    patchedC: '89 695 B (-1,68 %)',
    origRust: '306 008 B (1 196 pages, prof. 11)',
    patchedRust: '244 350 B (-20,15 %, 955 pages, prof. 10)'
  },
  {
    metric: 'Taille du fichier ELF',
    origC: '158 004 B (strippé)',
    patchedC: '156 468 B (-1,54 KiB)',
    origRust: '542 092 B',
    patchedRust: '244 780 B (-54,85 %)'
  },
  {
    metric: 'RAM statique / segment RW (.bss + .data)',
    origC: '6 376 B',
    patchedC: '6 232 B (-144 B / -2,26 %)',
    origRust: '65 836 B (heap 64 KiB)',
    patchedRust: '33 068 B (-49,77 %, heap 32 KiB)'
  },
  {
    metric: 'Pile (stack)',
    origC: '12 496 B max (qsort récursif)',
    patchedC: '12 496 B max (0 récursion, -256 B register_wallet)',
    origRust: '65 536 B alloués',
    patchedRust: '32 768 B alloués (-50 %, 0 B frame Lean)'
  },
  {
    metric: 'RAM totale réservée (RW + pile)',
    origC: '18 872 B (statique + pire cas pile)',
    patchedC: '18 728 B (-144 B, pile bornée)',
    origRust: '131 372 B (514 pages)',
    patchedRust: '65 836 B (-49,89 %, 258 pages)'
  },
  {
    metric: 'Instructions (binaire / flux signature)',
    origC: '30 364 insns ARM émises',
    patchedC: '29 729 insns ARM (-2,09 %)',
    origRust: '234 238 insns RV32 exécutées',
    patchedRust: '192 632 insns RV32 (-17,76 %)'
  },
  {
    metric: 'Vitesse (Speculos Taproot PSBT)',
    origC: '4 680 ms (Nano S+) / 2 824 ms (Nano X)',
    patchedC: '4 039 ms (-13,7 %) / 2 180 ms (-22,8 %)',
    origRust: '2 605 ms (1 384 page_loads)',
    patchedRust: '2 019 ms (-22,52 %, 1 085 page_loads)'
  },
  {
    metric: 'Suites de tests',
    origC: '30 ctest + 277 Ragger',
    patchedC: '31/31 ctest + 277/277 Ragger + 2 405 théorèmes',
    origRust: '166 tests (unitaires + Speculos)',
    patchedRust: '176/176 tests + 9 correctifs prouvés'
  }
]

export interface VanadiumIssue {
  id: string
  severity: 'High' | 'Medium' | 'Low'
  severityLabel: string
  location: string
  reportedStatus: string
  description: string
}

export const VANADIUM_ISSUES: VanadiumIssue[] = [
  {
    id: 'VND-01',
    severity: 'High',
    severityLabel: 'Critique',
    location: 'common/src/script.rs:367',
    reportedStatus: 'Non signalé',
    description:
      'andor(X, Y, Z) compile OP_NOTIF [Y] OP_ELSE [Z] au lieu de [Z] puis [Y] (BIP-379), inversant les branches de dépense par rapport à Bitcoin Core et app-bitcoin.'
  },
  {
    id: 'VND-02',
    severity: 'High',
    severityLabel: 'Critique',
    location: 'fastpsbt.rs:1052 · analyze.rs:434',
    reportedStatus: 'Non signalé',
    description:
      'Sommes de satoshis u64 sans borne MAX_MONEY et cast u64 as i64 sur les soldes par compte, permettant un débordement ou une inversion de signe.'
  },
  {
    id: 'VND-03',
    severity: 'High',
    severityLabel: 'Élevé',
    location: 'sign_psbt/analyze.rs:223, 305',
    reportedStatus: 'Non signalé',
    description:
      'Quand non_witness_utxo et witness_utxo sont fournis ensemble, leur égalité n\'est pas vérifiée (classe CVE-2020-14199), contrairement à app-bitcoin.'
  },
  {
    id: 'VND-04',
    severity: 'High',
    severityLabel: 'Élevé',
    location: 'common/src/fastpsbt.rs:602',
    reportedStatus: 'Non signalé',
    description:
      'Calcul du nLockTime non conforme à BIP-370 : accepte une hauteur nulle, rejette un input ayant les deux verrous, et laisse fallback_locktime écraser un verrou de bloc en timestamp.'
  },
  {
    id: 'VND-05',
    severity: 'Medium',
    severityLabel: 'Moyen',
    location: 'common/src/script.rs:145',
    reportedStatus: 'Non signalé',
    description:
      'Une policy sh(wsh(...)) est acceptée lors de l\'enregistrement (register_account), mais échoue ensuite systématiquement lors de la dérivation d\'adresse et de la signature.'
  },
  {
    id: 'VND-06',
    severity: 'Medium',
    severityLabel: 'Moyen',
    location: 'bip388/lib.rs:5 · register_account.rs',
    reportedStatus: 'TODO partiel (0 issue)',
    description:
      'Absence de vérification des types Miniscript B/V/K/W, de la non-malléabilité, du mélange hauteur/temps des timelocks et du masquage BIP-68 older(n).'
  },
  {
    id: 'VND-07',
    severity: 'Medium',
    severityLabel: 'Moyen',
    location: 'get_extended_pubkey.rs:138, 161',
    reportedStatus: 'Non signalé',
    description:
      'Test off-by-one len() > 256 suivi d\'un cast en u8 : un chemin BIP-32 de longueur 256 est tronqué à depth = 0 dans l\'xpub sérialisé.'
  },
  {
    id: 'VND-08',
    severity: 'Low',
    severityLabel: 'Faible',
    location: 'musig_signing.rs:463',
    reportedStatus: 'Non signalé',
    description:
      'Au Round 2 de MuSig2, le pubnonce local recalculé n\'est pas comparé à celui présent dans PSBT_IN_MUSIG2_PUB_NONCE avant de produire la signature partielle.'
  },
  {
    id: 'VND-09',
    severity: 'Low',
    severityLabel: 'Faible',
    location: 'main.rs:26 · display.rs:167 · fastpsbt.rs:231',
    reportedStatus: 'todo!() sur GetVersion (0 issue)',
    description:
      'Panic sur Request::GetVersion, rejet des sorties OP_RETURN à l\'affichage, CompactSize non canoniques acceptés et scripts witness_utxo bloqués au-delà de 252 octets.'
  }
]

export function renderMarkdown(): string {
  const lines: string[] = [
    '# Lean 4 pour Ledger Bitcoin : vérification formelle et optimisation sur BOLOS et Vanadium',
    '',
    '- Dépôts : `LedgerHQ/app-bitcoin` (`f010982d`) · `LedgerHQ/vanadium` (`ace8e969`) · `Th0rgal/lean-ledger-bitcoin`',
    '- Preuves Lean 4 : `0 sorryAx`, `0 Classical.choice`, `2 405` théorèmes vérifiés',
    '',
    '## 1. Résumé du Challenge de Charles',
    '',
    'Montrer qu\'il est viable de réécrire un logiciel existant en Lean4 pour obtenir un binaire prouvé formellement, plus compact et plus rapide.',
    '',
    '## 2. Méthodologie et architecture',
    '',
    'Côté temps humain, il m\'a fallu environ **1 h** au départ pour cadrer le problème, poser les spécifications haut niveau et concevoir le pipeline (aidé par une connaissance de base du fonctionnement de Ledger), environ **10 min** d\'intervention manuelle hier soir pour régler un souci d\'inférence, et **1 h** à la fin pour relire et polir l\'ensemble. Tout le reste a tourné en autonomie.',
    '',
    'Ledger maintient deux applications Bitcoin dont la chaîne de compilation diffère :',
    '1) **`app-bitcoin` (C)** : compilée nativement en ARM Thumb (`thumbv8m.main` / `thumbv6m`) avec liens ROPI/RWPI, exécutée directement au-dessus de BOLOS.',
    '2) **`vanadium` (`vnd-bitcoin`, Rust)** : compilée en RISC-V 32 bits (`riscv32imac-unknown-none-elf`), découpée en pages de 256 octets authentifiées par arbre de Merkle et chargées à la demande dans la VM `app-vanadium` tournant sur BOLOS.',
    '',
    'Plutôt que de toucher à l\'interface graphique ou au transport APDU/ECALL (réécrire l\'UI en Lean 4 serait pénible et peu utile), nous avons isolé un noyau commun pour la logique partagée (validation PSBT, montants, BIP-32, SegWit/Taproot, politiques BIP-388/Miniscript, formatage sans division), qui concentre l\'essentiel de la surface d\'attaque, en gardant l\'UI et l\'IO existantes dans chaque application :',
    '',
    '```mermaid',
    MERMAID_ARCHITECTURE,
    '```',
    '',
    '## 3. Plan d\'exécution',
    '',
    '1) **Spécifications formelles et backtesting croisé** : formalisation des BIPs en Lean 4 à partir du cadrage haut niveau, puis implémentation du noyau exécutable en bouclant sur les suites de tests des deux dépôts (`ctest`/Ragger côté C, `cargo test`/Speculos côté Rust) pour affiner la spec jusqu\'à convergence.',
    '2) **Backend LLVM 32 bits dans `turbo-lean`** : ajout du support 32 bits sans runtime ni allocation (`thumbv6m`, `thumbv8m.main`, `riscv32imac`) dans notre compilateur `turbo-lean`. Passer par LLVM IR plutôt que d\'émettre du bytecode ou de l\'assembleur direct m\'a semblé plus sûr (la sémantique LLVM est déjà largement formalisée) et demandait une modification mineure ; il reste de la marge d\'optimisation avec davantage de ressources.',
    '3) **Intégration dans les deux apps** : patch minimal de `app-bitcoin` et de `vnd-bitcoin` conservant l\'UI/IO d\'origine et liant les noyaux Lean en LTO.',
    '4) **Boucle d\'optimisation `maxwell`** : exécution de benchmarks reproductibles dans notre boucle propriétaire `maxwell` sous contrainte de preuve (`0 sorryAx`) et de passage intégral des tests, jusqu\'à réduire la Flash, la RAM et le temps d\'exécution sous les deux références.',
    '',
    '## 4. Résultats et simulation',
    '',
    '| Métrique | Original C (`app-bitcoin`) | Patched C (`+ Lean 4`) | Original Rust (`vanadium`) | Patched Rust (`+ Lean 4`) |',
    '|---|---|---|---|---|',
    ...BENCHMARK_ROWS.map(
      (r) => `| **${r.metric}** | ${r.origC} | **${r.patchedC}** | ${r.origRust} | **${r.patchedRust}** |`
    ),
    '',
    'Vidéo de simulation côte à côte (Speculos Ledger Flex) : https://share.thomas.md/leanldgr/vanadium-side-by-side.mp4',
    '',
    '## 5. Anomalies trouvées dans Vanadium (`apps/bitcoin`)',
    '',
    'La formalisation croisée entre `app-bitcoin` et `vanadium` a fait ressortir **9 anomalies** dans `LedgerHQ/vanadium` (commit `ace8e969`). **7 sur 9 n\'étaient signalées nulle part** (les 2 autres n\'avaient qu\'un commentaire `TODO` ou `todo!()` partiel dans le code, et `0` issue GitHub ouverte). Nous n\'avons ouvert aucune issue publique sur GitHub ; toutes sont corrigées dans le patch.',
    '',
    '| ID | Niveau | Emplacement | Statut amont | Description |',
    '|---|---|---|---|---|',
    ...VANADIUM_ISSUES.map(
      (i) => `| \`${i.id}\` | ${i.severityLabel} | \`${i.location}\` | ${i.reportedStatus} | ${i.description} |`
    ),
    ''
  ]
  return lines.join('\n')
}
