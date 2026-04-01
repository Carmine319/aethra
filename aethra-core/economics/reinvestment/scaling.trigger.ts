export function triggerScaling(input: { roi: number; velocity: number; asymmetryPreferred: boolean }) {
  const trigger = input.roi > 0.45 && input.velocity > 0.05 && input.asymmetryPreferred;
  return {
    trigger,
    mode: trigger ? "scale-dominant-system" : "continue-probing",
  };
}
