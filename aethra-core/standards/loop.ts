import { analyseEntropy } from "./discovery/entropy.analyser";
import { detectRepetition } from "./discovery/repetition.detector";
import { analyseInteractions } from "./discovery/interaction.analysis";
import { inferLatentPatterns } from "./discovery/latent.pattern.engine";
import { buildProtocol } from "./design/protocol.builder";
import { assessCompatibility } from "./design/compatibility.engine";
import { registerProtocol } from "./registry/protocol.registry";
import { mapDependencies } from "./registry/dependency.lockin.map";
import { autopilotIntegrate } from "./distribution/integration.autopilot";
import { recordAdoption } from "./registry/adoption.tracker";
import { computeSwitchingCost } from "./economics/switching.cost.engine";
import { buildEcosystemMap } from "./ecosystem/ecosystem.map";
import { planEvolution } from "./design/evolution.strategy";
import { enforceInvariance } from "./governance/invariance.enforcer";
import type { ProtocolSchema } from "./design/protocol.schema";

/**
 * Ω v15 — Hardened standardisation loop (orchestration only; additive to Ω v1–v14).
 */

export function runStandardisationLoop(input: {
  interactions: { type: string; variance: number; decisionPoints: number }[];
  protocolSpec: ProtocolSchema;
  consumerFields: Record<string, string>;
  providerFields: Record<string, string>;
  ecosystemNodes: { name: string; dependencies?: string[] }[];
}) {
  const entropy = analyseEntropy(input.interactions as any[]);
  const classified = analyseInteractions(
    input.interactions.map((i) => ({ type: i.type }))
  );
  const repetition = detectRepetition(classified);
  const latent = inferLatentPatterns(repetition);

  const built = buildProtocol(input.protocolSpec);
  enforceInvariance({ schema: built.schema });

  const compat = assessCompatibility(
    { fields: input.consumerFields },
    { fields: input.providerFields }
  );

  registerProtocol(built.schema.name, built.fingerprint);
  const deps = mapDependencies([{ name: built.schema.name, integrations: Object.keys(input.providerFields) }]);
  const integration = autopilotIntegrate({
    name: built.schema.name,
    fields: input.protocolSpec.fields,
  });
  recordAdoption(built.schema.name, input.interactions.length);
  const switching = computeSwitchingCost(input.interactions.length, deps[0]?.dependencies.length ?? 0);
  const ecosystem = buildEcosystemMap(input.ecosystemNodes);
  const evolution = planEvolution(input.protocolSpec.version, [{ kind: "add_field", target: "observability" }]);

  return {
    entropy,
    latent,
    fingerprint: built.fingerprint,
    compatibility: compat,
    dependencies: deps,
    integration,
    switchingCost: switching,
    ecosystem,
    evolutionPlan: evolution,
  };
}
