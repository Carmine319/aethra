export function accelerateRevenue(system: { conversionRate: number; delayHours: number }) {
  const acceleratedConversion = Number((system.conversionRate * (1 + Math.max(0, 0.18 - system.delayHours * 0.01))).toFixed(4));
  return {
    acceleratedConversion,
    delayReduction: Number((Math.max(0, system.delayHours * 0.25)).toFixed(2)),
  };
}
