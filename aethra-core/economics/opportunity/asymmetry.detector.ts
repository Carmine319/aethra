export function detectAsymmetry(opportunity: { upside: number; downside: number; validationSpeed: number }) {
  const ratio = opportunity.downside > 0 ? opportunity.upside / opportunity.downside : opportunity.upside;
  return {
    asymmetryRatio: Number(ratio.toFixed(4)),
    lowDownside: opportunity.downside <= 0.35,
    fastValidation: opportunity.validationSpeed >= 0.6,
    preferred: ratio >= 2 && opportunity.validationSpeed >= 0.5,
  };
}
