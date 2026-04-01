import { assertAntifragilityOperational } from "./governance/stress.policy";
import { preventCascade } from "./governance/cascade.prevention";
import { guardSubsystemHandoff } from "./governance/system.guard";
import { detectShock } from "./shock/shock.detector";
import { extractVolatility } from "./amplification/volatility.extractor";
import { findAsymmetry } from "./amplification/asymmetry.engine";
import { mapDislocationToOpportunity } from "./amplification/opportunity.mapper";
import { rebalanceUnderStress } from "./capital/dynamic.rebalancer";
import { recoverSystem } from "./resilience/recovery.engine";
import { analyseFailure } from "./learning/failure.analyser";
import { adaptFromFailure } from "./learning/adaptation.engine";
import { registerShock } from "./shock/shock.registry";

/**
 * Full anti-fragility response cycle: detect → isolate → convexify → learn → recover with uplift.
 */
export function runAntifragilityCycle(input: {
  metric_series: Array<{ value: number; ts?: number }>;
  capital: number;
  downside_estimate: number;
  failure_context?: { subsystem: string; error: string; spread: number };
}) {
  assertAntifragilityOperational();

  const shock = detectShock(input.metric_series || []);
  const values = (input.metric_series || []).map((x) => Number(x.value));
  const vol = extractVolatility(values);
  const asym = findAsymmetry(vol, input.downside_estimate);
  const opportunity = mapDislocationToOpportunity(vol, asym);
  const allocation = rebalanceUnderStress(input.capital, vol, input.downside_estimate);

  const spread = input.failure_context?.spread ?? (shock ? shock.scaled.intensity / 1e6 : 0);
  const mode = preventCascade({ failureSpread: spread });
  if (mode === "isolate") {
    registerShock({ event: "cascade_isolation", spread });
  }

  try {
    guardSubsystemHandoff({
      source: "shock",
      target: "capital",
      failureLoad: spread,
    });
  } catch {
    registerShock({ event: "handoff_blocked", spread });
  }

  let recovery = { restored: true, efficiencyGain: 0, note: "" };
  if (input.failure_context) {
    const analysis = analyseFailure(input.failure_context);
    adaptFromFailure({ ...analysis, subsystem: input.failure_context.subsystem });
    recovery = recoverSystem({ damage: Number(input.failure_context.spread || 0.1) });
  }

  return {
    shock,
    volatility: vol,
    asymmetry: asym,
    opportunity,
    capital_split: allocation,
    cascade_mode: mode,
    recovery,
  };
}
