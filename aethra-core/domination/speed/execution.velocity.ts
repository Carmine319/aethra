export function calculateExecutionVelocity(cycleTimeHours: number, outputUnits: number) {
  const safeCycle = Math.max(1, cycleTimeHours);
  return Number((Math.max(0, outputUnits) / safeCycle).toFixed(4));
}
