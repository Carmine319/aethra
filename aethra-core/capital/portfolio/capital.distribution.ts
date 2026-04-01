import type { VentureRecord } from "./portfolio.registry";
import { scoreVenture } from "./venture.score";
import { assessRisk } from "../risk/risk.engine";
import { enforceExposureLimit } from "../risk/exposure.control";

export function distributeCapital(
  ventures: VentureRecord[],
  total: number,
  opts?: { minViableRoi?: number; maxExposurePerVenture?: number }
) {
  const minRoi = Number(opts?.minViableRoi ?? 1.2);
  const capRatio = Number(opts?.maxExposurePerVenture ?? 0.4);
  const eligible = (ventures || []).filter((v) => {
    const roi = Number(v.revenue || 0) / Math.max(1, Number(v.cost || 1));
    const upside = Number(v.probability_weighted_upside || 0);
    return roi >= minRoi || upside >= 0.6;
  });

  const scored = eligible.map((v) => {
    const risk = assessRisk(v);
    const riskPenalty = risk === "high" ? 0.5 : risk === "medium" ? 0.8 : 1;
    return {
      ...v,
      risk,
      score: Math.max(0, scoreVenture(v) * riskPenalty),
    };
  });
  const sum = scored.reduce((s, v) => s + Number(v.score || 0), 0) || 1;
  const totalCapital = Math.max(0, Number(total || 0));

  return scored.map((v) => {
    const raw = (Number(v.score || 0) / sum) * totalCapital;
    const allocation = enforceExposureLimit(raw, totalCapital, capRatio);
    return {
      id: v.id,
      score: v.score,
      risk: v.risk,
      allocation,
      starved: allocation === 0,
    };
  });
}
