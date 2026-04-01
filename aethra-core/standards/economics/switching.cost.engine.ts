/**
 * Ω v15 — Model emergent switching cost from adoption × integration depth.
 */

export function computeSwitchingCost(adoption: number, depth: number) {
  return adoption * depth;
}
