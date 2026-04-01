export type ApprovalBand = "auto" | "operator" | "owner";

export function getApprovalBand(input: { risk: number; capitalImpact: number }): ApprovalBand {
  const risk = Number(input.risk || 0);
  const cap = Number(input.capitalImpact || 0);
  if (risk > 0.6 || cap > 25) return "owner";
  if (risk > 0.4 || cap > 10) return "operator";
  return "auto";
}

export function assertApproval(input: { approvedBy?: ApprovalBand; required: ApprovalBand }) {
  const order: Record<ApprovalBand, number> = { auto: 0, operator: 1, owner: 2 };
  const approved = input.approvedBy || "auto";
  if (order[approved] < order[input.required]) {
    throw new Error(`Approval required: ${input.required}`);
  }
}
