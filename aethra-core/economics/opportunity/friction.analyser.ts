export function analyseFriction(input: { steps: number; latencyMs: number; dropoffRate: number }) {
  const score = Number((input.steps * 0.25 + (input.latencyMs / 1000) * 0.35 + input.dropoffRate * 0.4).toFixed(4));
  return {
    frictionScore: score,
    bottlenecks: score > 1 ? ["checkout-delay", "too-many-steps"] : ["low-friction"],
  };
}
