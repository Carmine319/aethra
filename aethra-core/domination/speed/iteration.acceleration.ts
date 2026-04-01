export function accelerateIteration(experimentsPerCycle: number, automationLevel: number) {
  const accelerationFactor = Number((1 + Math.max(0, automationLevel) * 0.2).toFixed(4));
  const acceleratedExperiments = Math.max(1, Math.floor(experimentsPerCycle * accelerationFactor));
  return {
    accelerationFactor,
    acceleratedExperiments,
  };
}
