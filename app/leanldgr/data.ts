export const PAGE_TITLE = 'Lean 4 Ledger'
export const REPO_URL = 'https://github.com/Th0rgal/lean-ledger-bitcoin'
export const TURBO_LEAN_URL = 'https://github.com/Th0rgal/turbo-lean'
const BLOB = `${REPO_URL}/blob`
export const BOLOS_PATCH_URL = `${BLOB}/752aa9a/ffi/bolos/patches/app-bitcoin-lean-opt.patch`
export const VANADIUM_PATCH_URL = `${BLOB}/752aa9a/ffi/vanadium/patches/vanadium-bitcoin-lean-opt.patch`
export const CANDIDATE_A_SOURCE_URL = `${BLOB}/092bb97fe05e4957e3f8399c04fd2434b9a902f1/benchmarks/t7-candidate-a.boat-large.experimental.json`
export const CANDIDATE_A_PROOF_URL = `${REPO_URL}/commit/dff706fd918a5a3c78722fec7adaf8623337841f`
export const ISSUE_REPORT_URL = 'https://github.com/Th0rgal/share.thomas.md/blob/5fcbe02107a13e5db4970e5040e8ea7929e622b7/app/leanldgr/data.ts#L422'

export const INTRO = 'Peut-on remplacer des fonctions sensibles d’un logiciel existant par du Lean 4, en reliant leur implémentation à une spécification formelle ? Cette POC, commencée en une journée sur les apps Bitcoin de Ledger, explore cette approche et ses effets sur la taille et les performances.'
export const DISCLAIMER = 'POC : un usage en production demande encore une revue des choix de modélisation et une validation sur matériel.'
export const HUMAN_TIME = 'Pour le run initial : environ 1 h de cadrage, 15 min pour débloquer le routage d’inférence et 1 h de revue. Le reste du travail a tourné en autonomie.'
export const ARCHITECTURE_INTRO = 'Deux intégrations : app-bitcoin en C, exécutée nativement sous BOLOS sur Nano S+ / Nano X ; et Vanadium en Rust, exécutée en RISC-V dans le Secure Element du Flex. Le host Vanadium stocke les pages chiffrées et authentifiées, sans exécuter le code de la V-App.'
export const DELIVERABLES = [
  'Un jumeau formel : des spécifications et des implémentations Lean reliées par des preuves pour les fonctions couvertes (BIP-32/67/143/327/341/352/370/379/388 et machines d’état). L’audit publié compte 2 585 constantes .thmInfo, déclarations générées incluses, dont 879 dans Proofs.*, avec 0 sorryAx ; ce ne sont pas autant de preuves indépendantes.',
  'Un sous-ensemble réellement compilé : 45 exports ABI freestanding pour les vérifications Miniscript, nLockTime, Dual-UTXO, MAX_MONEY, chemins BIP-32, CompactSize, tri des clés et formatage des montants. turbo-lean produit du LLVM IR 32-bit, lié aux apps C/Rust qui conservent leurs parseurs bas niveau, leur UI et leurs entrées/sorties.'
]
export const PLAN = [
  'Modéliser les spécifications et les fonctions Lean, puis confronter leurs résultats aux implémentations existantes par tests différentiels.',
  'Compiler les noyaux freestanding vers ARM Thumb et RV32IMAC avec turbo-lean, puis les intégrer via un shim FFI et LTO.',
  'Itérer sur les benchmarks avec la boucle maxwell, en conservant les preuves et en documentant aussi les régressions.'
]
export const MERMAID_ARCHITECTURE = `flowchart TB
    Spec["Spécifications Lean"] -->|"preuves sur les fonctions couvertes"| Impl["Implémentations Lean"]
    Impl --> Kernel["Sous-ensemble freestanding · 45 exports ABI"]
    Kernel --> Turbo["turbo-lean → LLVM IR 32-bit"]
    Turbo --> ARM["C + noyaux Lean · BOLOS ARM Thumb"]
    Turbo --> RV["Rust + noyaux Lean · Vanadium RV32IMAC"]
    ARM --> Nano["Secure Element · Nano S+ / Nano X"]
    RV --> Flex["VM dans le Secure Element · Flex"]
    Host["Host · stockage des pages chiffrées"] -.-> Flex`

export interface BenchmarkChartItem {
  label: string
  origValue: string
  optValue: string
  optPct: number
  delta: string
  campaign: string
}
function measure(label: string, reference: number, lean: number, unit: string, campaign: string): BenchmarkChartItem {
  const format = (value: number) => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} ${unit}`
  const delta = (lean / reference - 1) * 100
  return { label, origValue: format(reference), optValue: format(lean), optPct: lean / reference * 100,
    delta: `${delta > 0 ? '+' : ''}${delta.toFixed(2).replace('.', ',')} %`, campaign }
}
export const RUST_BENCH_BARS = [
  measure('Code chargé RX', 306522, 267954, 'B', 'T6 · plain'),
  measure('RAM réservée · RW + pile', 131372, 65844, 'B', 'T6 · plain'),
  measure('Fichier ELF', 542552, 268384, 'B', 'T6 · plain'),
  measure('Instructions RV32 exécutées · signature', 234214, 200029, 'insns', 'T6 · E2E sign_transaction'),
  measure('Latence médiane · signature', 4976.32, 4249.16, 'ms', 'T6 · E2E sign_transaction'),
  measure('Latence médiane · empreinte', 950.66, 952.26, 'ms', 'T6 · E2E get_fingerprint')
]
export const C_BENCH_BARS = [
  measure('Flash chargée · Nano S+', 91231, 89695, 'B', 'Cycle 1 T7 · mainnet'),
  measure('Flash chargée · Nano X', 91231, 90463, 'B', 'Cycle 1 T7 · mainnet'),
  measure('RAM statique · Nano S+', 6376, 6232, 'B', 'Cycle 1 T7 · mainnet'),
  measure('Instructions ARM Thumb émises · Nano S+', 30364, 29898, 'insns', 'Cycle 1 T7 · mainnet'),
  measure('Latence médiane · Taproot · Nano S+', 2436.324, 2435.271, 'ms', 'T6 · SIGN_PSBT_TR_3IN'),
  measure('Latence médiane · Taproot · Nano X', 2437.73, 2592.269, 'ms', 'T6 · SIGN_PSBT_TR_3IN')
]
export const BENCHMARK_CARDS = [
  {
    title: 'Vanadium · Rust + Lean 4', sub: 'Flex · RV32IMAC', variant: 'rust' as const,
    items: RUST_BENCH_BARS,
    footer: 'Profil optimisé complet : Lean + réglages Cargo/link et budgets réduits. À profil identique, le code RX baisse de 4,55 % (306 522 → 292 560 B).',
    sources: [{ label: 'Mesures T6 · même hôte dédié', url: `${BLOB}/90ba9da/benchmarks/vanadium_results.json` }]
  },
  {
    title: 'BOLOS · C + Lean 4', sub: 'Nano S+ / X · ARM Thumb', variant: 'c' as const,
    items: C_BENCH_BARS,
    footer: 'Tailles : cycle 1 T7, hôte partagé CPU0. Latences : campagne T6, même hôte dédié. Ce ne sont pas de nouveaux comparatifs C contre A.',
    sources: [
      { label: 'Tailles cycle 1 T7', url: `${BLOB}/752aa9a/benchmarks/t7-cycle1.pinned-complete.experimental.json` },
      { label: 'Latences T6', url: `${BLOB}/222e139/benchmarks/bolos_results.json` }
    ]
  }
]
export const CANDIDATE_A_READING = 'A contre baseline Lean · VM Boat large : .text −228 / −270 B et ARM émises −79 / −89 (Nano S+ / X) ; Flash S+ inchangée sauf −512 B en testnet-perf, X −256 B toutes variantes ; RAM/pile globale inchangées, sous-arbre format_sats_amount X +8 B (132 → 140 B), S+ inchangé à 124 B ; aucune différence de vitesse significative (6 cycles, 672 échantillons, |t| ≤ 1,61), petites différences non exclues ; source experimental_nonvalidated.'
export const LIMITS = [
  'Les preuves portent sur les fonctions couvertes ; extraction et compilation restent dans la TCB. Le firmware complet n’est pas prouvé.',
  'Vanadium : RW + pile est une réservation, pas un pic RAM réel ; le profil optimisé ne mesure pas l’effet isolé de Lean.',
  'Les instructions ARM émises sont des comptes statiques. Les latences Speculos sont bruitées, sans mesure sur matériel ni gain de vitesse universel.',
  'Historique : 31/31 ctest, 176 tests workspace Rust, Ragger S+ 277 passés / 5 ignorés et X 53 / 2 ; A : 45 cibles Lean rapportées OK. Aucune suite complète actuelle certifiée ici ; les tests officiels sont en cours.'
]
export const ISSUES_SUMMARY = 'La formalisation croisée a fait ressortir 9 bugs et écarts de spécification dans Vanadium (ace8e969), dont 7 non signalés dans le relevé initial. Ils concernent notamment Miniscript, les chemins BIP-32 et le traitement des transactions ; les correctifs sont décrits dans le patch. Le catalogue conserve les emplacements et niveaux de sévérité.'
export const RESOURCE_WINDOW_NOTICE = 'Fenêtre historique uniquement : du 10 novembre 2026 à 15:15 au 11 novembre à 11:15 UTC. Les chiffres et la visualisation ci-dessous décrivent le run initial, pas les campagnes récentes. La télémétrie ultérieure est incomplète : aucun total récent de ressources, de tokens ou de coût n’est publié.'
export const RESOURCE_FACTS = [
  '19,9 h de run, 30 agents actifs et 25 microVMs.',
  '379,0 CPU-h, dont 327,4 sur les VMs et 51,6 sur le serveur dédié ; 654,9 GB RAM-h sur les VMs (1 049,6 avec la réservation du serveur).',
  '696,6 M tokens, soit 23,2 M par agent en moyenne.'
]
export const RESOURCE_COST = 'Estimation historique aux tarifs publics Google / OrcaRouter et AWS EC2 On-Demand : ~520 USD d’inférence + ~17 USD de VMs, soit ~537 USD, hors infrastructure personnelle. Ce n’est pas une facture.'

export function renderMarkdown(): string {
  return [
    `# ${PAGE_TITLE}`, '', INTRO, '', DISCLAIMER, '',
    '## 1. Méthodologie et architecture', '', HUMAN_TIME, '', ARCHITECTURE_INTRO, '',
    ...DELIVERABLES.map((s) => `- ${s}`), '',
    `[Projet](${REPO_URL}) · [turbo-lean](${TURBO_LEAN_URL}) · [Patch BOLOS](${BOLOS_PATCH_URL}) · [Patch Vanadium](${VANADIUM_PATCH_URL})`, '',
    '```mermaid', MERMAID_ARCHITECTURE, '```', '',
    '## 2. Plan d’exécution', '', ...PLAN.map((s, i) => `${i + 1}. ${s}`), '',
    '## 3. Résultats', '',
    ...BENCHMARK_CARDS.flatMap((card) => [
      `### ${card.title} · ${card.sub}`, '',
      ...card.items.map((m) => `- **${m.label}** · ${m.campaign} : ${m.origValue} → ${m.optValue} (${m.delta}).`), '',
      card.footer, '', card.sources.map((s) => `[${s.label}](${s.url})`).join(' · '), ''
    ]),
    CANDIDATE_A_READING, '', `[Détails A](${CANDIDATE_A_SOURCE_URL}) · [Preuve de substitution](${CANDIDATE_A_PROOF_URL})`, '',
    ...LIMITS.map((s) => `- ${s}`), '',
    '## 4. Bugs et anomalies trouvés dans Vanadium', '', ISSUES_SUMMARY, '',
    `[Catalogue détaillé](${ISSUE_REPORT_URL}) · [Correctifs](${VANADIUM_PATCH_URL})`, '',
    '## 5. Ressources du run initial', '', RESOURCE_WINDOW_NOTICE, '',
    ...RESOURCE_FACTS.map((s) => `- ${s}`), '', RESOURCE_COST, ''
  ].join('\n')
}
