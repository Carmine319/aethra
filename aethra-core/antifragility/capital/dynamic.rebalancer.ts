import { applyConvexity } from "./convexity.engine";
import { findAsymmetry } from "../amplification/asymmetry.engine";

export function rebalanceUnderStress(capital: number, volatility: number, downside: number) {
  const label = findAsymmetry(volatility, downside);
  const mult = label === "positive-asymmetry" ? 1.15 : 0.85;
  return applyConvexity(capital, { multiplier: mult });
}
