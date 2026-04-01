export function protectDownside(capital: number, riskScore: number) {
  const reserveRatio = riskScore > 0.6 ? 0.42 : 0.3;
  return {
    reserveCapital: Number((capital * reserveRatio).toFixed(2)),
    hedgeMode: riskScore > 0.65 ? "strict" : "balanced",
  };
}
