/**
 * Ω v15 — Upgrade path must remain observable and revertible at the policy layer.
 */

export type UpgradeTicket = { from: string; to: string; rollbackFingerprint: string };

export function approveUpgrade(ticket: UpgradeTicket) {
  return {
    approved: Boolean(ticket.rollbackFingerprint),
    ticket,
  };
}
