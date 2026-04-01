export function evaluateKillSwitch(input: { riskScore: number; survivableCapital: number; integrityScore: number }) {
  const trigger = input.riskScore > 0.9 || input.integrityScore < 0.2 || input.survivableCapital <= 0;
  return {
    trigger,
    mode: trigger ? "emergency-preservation" : "normal",
  };
}
