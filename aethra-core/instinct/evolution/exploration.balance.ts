export function balanceStrategies(confidence: number, uncertainty: number) {
  const exploration = Math.max(0.2, Math.min(0.8, uncertainty * 0.6 + (1 - confidence) * 0.4));
  const exploitation = Number((1 - exploration).toFixed(4));
  return {
    exploration: Number(exploration.toFixed(4)),
    exploitation,
  };
}
