export function validateEconomics(input: { revenueReceived: number; paymentSuccessRate: number; reportedProfit: number; calculatedProfit: number }) {
  const revenueValid = input.revenueReceived >= 0;
  const paymentsValid = input.paymentSuccessRate >= 0.9;
  const profitConsistent = Math.abs(input.reportedProfit - input.calculatedProfit) <= 0.01;
  const passed = revenueValid && paymentsValid && profitConsistent;
  return {
    revenueValid,
    paymentsValid,
    profitConsistent,
    passed,
  };
}
