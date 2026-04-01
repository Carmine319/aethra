export function measureVelocity(capital: number, timeHours: number, revenuePerCycle: number) {
  const safeTime = Math.max(1, timeHours);
  return {
    turnoverRate: Number((capital / safeTime).toFixed(4)),
    revenuePerCycle: Number(revenuePerCycle.toFixed(2)),
    compoundingSpeed: Number((revenuePerCycle / Math.max(1, capital) * (24 / safeTime)).toFixed(4)),
  };
}
