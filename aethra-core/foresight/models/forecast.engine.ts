import { readForesightPolicy } from "../governance/policy.gate";
import type { UncertaintyBundle } from "./uncertainty.estimator";

export function forecastPoint(input: {
  features: Array<{ name: string; momentum: number }>;
  regime: string;
  uncertainty?: UncertaintyBundle;
}) {
  const p = readForesightPolicy();
  if (p.require_uncertainty_on_forecasts && (!input.uncertainty || input.uncertainty.confidence == null)) {
    throw new Error("NO prediction without uncertainty");
  }
  const f = input.features || [];
  const agg = f.reduce((s, x) => s + Number(x.momentum || 0), 0);
  const regimeAdj =
    input.regime === "bull" ? 1.08 : input.regime === "bear" ? 0.92 : 1;
  const point = agg * regimeAdj;
  return {
    point_estimate: Math.round(point * 1000) / 1000,
    regime: input.regime,
    uncertainty: input.uncertainty,
  };
}
