export function allocateConsciousCapital(spendableCapital: number, riskScore: number) {
  const safe = Number((spendableCapital * (riskScore > 0.6 ? 0.65 : 0.45)).toFixed(2));
  const growth = Number((spendableCapital * (riskScore > 0.6 ? 0.2 : 0.4)).toFixed(2));
  const optionality = Number((spendableCapital - safe - growth).toFixed(2));
  return { safe, growth, optionality };
}
