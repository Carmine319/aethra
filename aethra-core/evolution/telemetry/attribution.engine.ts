export function attributeEvolutionOutcome(outcomes: Array<{ proposal_id: string; delta_revenue: number }>) {
  return (outcomes || []).map((o) => ({
    proposal_id: o.proposal_id,
    attributed_delta: Number(o.delta_revenue || 0),
  }));
}
