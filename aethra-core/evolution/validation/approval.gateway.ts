export function assertApproved(opts: { approvedByHuman: boolean; tier: "operator" | "owner" }) {
  if (!opts.approvedByHuman) {
    throw new Error(`Evolution requires human approval (${opts.tier})`);
  }
}
