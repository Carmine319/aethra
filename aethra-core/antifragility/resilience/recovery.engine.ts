export function recoverSystem(state: { damage: number }) {
  const damage = Math.max(0, Number(state.damage ?? 0));
  return {
    restored: true,
    efficiencyGain: Math.round(damage * 0.2 * 1000) / 1000,
    note: "Post-shock baseline uplift from structured recovery",
  };
}
