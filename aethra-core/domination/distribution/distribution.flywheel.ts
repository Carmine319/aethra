export function activateDistributionFlywheel(inputs: { channels: string[]; repetitions: number; contentUnits: number }) {
  const momentum = Number(((inputs.channels.length * 0.25) + (inputs.repetitions * 0.1) + (inputs.contentUnits * 0.05)).toFixed(4));
  return {
    momentum,
    active: momentum >= 0.8,
  };
}
