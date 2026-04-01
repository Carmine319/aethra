export function runRevenueLoop(input: { traffic: number; conversionRate: number; avgOrderValue: number }) {
  const sales = Math.floor(Math.max(0, input.traffic) * Math.max(0, input.conversionRate));
  const revenue = Number((sales * Math.max(0, input.avgOrderValue)).toFixed(2));
  return { sales, revenue };
}
