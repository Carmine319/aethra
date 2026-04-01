export function buildTemporalAdvantage(velocity: number, competitorVelocity: number) {
  const advantage = Number((Math.max(0, velocity) - Math.max(0, competitorVelocity)).toFixed(4));
  return {
    advantage,
    dominant: advantage > 0,
    compoundingPotential: Number(Math.max(0, advantage * 1.2).toFixed(4)),
  };
}
