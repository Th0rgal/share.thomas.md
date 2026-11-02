import {
  DRAINER_ADDRESS,
  IDENTITY_CONTRACT,
  ORIGINAL_CLASS_HASH,
  RECOVERY_TRANSFERS,
  REVOKED_OPERATORS,
  TEMPORARY_CLASS_HASH,
} from "../starknet_id_recovery/payload";

export async function GET() {
  const lines: string[] = [
    "# Starknet ID · Recovery Transfers (183 / 183)",
    "",
    `- **Identity contract**: \`${IDENTITY_CONTRACT}\``,
    `- **Drainer address**: \`${DRAINER_ADDRESS}\``,
    `- **Temporary recovery class**: \`${TEMPORARY_CLASS_HASH}\``,
    `- **Restored canonical class**: \`${ORIGINAL_CLASS_HASH}\``,
    `- **Total transfers**: \`${RECOVERY_TRANSFERS.length} / ${RECOVERY_TRANSFERS.length}\` (blocks \`17290492\`–\`17292870\`, \`118\` theft transactions, \`0\` outgoing transfers from drainer)`,
    `- **Revoked legacy Cairo-0 operators**: ${REVOKED_OPERATORS.map((o) => `\`${o.address}\` (${o.label})`).join(", ")}`,
    "",
    "Between blocks `17290492` and `17292870`, 183 Starknet IDs were drained into the address above through legacy Cairo-0 marketplace operator approvals whose `isValidSignature` path lacked the `VALID` magic check. Restitution runs as one atomic 3-call transaction from the Starknet ID admin multisig (`upgrade` -> `recover_batch_to_owners` -> `upgrade`), returning every `token_id` directly to its verified pre-theft owner, clearing legacy Cairo-0 operator approvals for those 183 owners, and restoring the canonical Identity implementation in the same transaction.",
    "",
    "## Complete List of Transfers (183 / 183)",
    "",
    "| # | Starknet ID | Starknet ID (Hex) | Domain (pre-theft) | Recipient (Original Owner) | Theft Tx | Block |",
    "|---:|---:|---|---|---|---|---:|",
    ...RECOVERY_TRANSFERS.map(
      (r) =>
        `| ${r.index} | \`${r.starknetId}\` | \`${r.starknetIdHex}\` | ${r.domain || "—"} | \`${r.to}\` | \`${r.stealTxHash}\` | ${r.stealBlock} |`
    ),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
