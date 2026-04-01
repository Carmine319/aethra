export function detectSignals(environment: Record<string, unknown>) {
  const environmentScore = Number(environment.environmentScore || 0.5);
  const opportunityZones = (environment.opportunityZones as string[] | undefined) || [];
  const strongestSignal = opportunityZones[0] || "general";
  return {
    strongestSignal,
    confidence: Number(Math.max(0.2, Math.min(0.95, environmentScore + 0.25)).toFixed(4)),
    signalClass: environmentScore >= 0.65 ? "high_energy" : environmentScore >= 0.45 ? "viable" : "weak",
  };
}
