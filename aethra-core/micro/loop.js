"use strict";

const path = require("path");
const { computeSystemState, readSystemState } = require(path.join(__dirname, "..", "state", "engine.js"));
const { readStateBeforeAction } = require(path.join(__dirname, "..", "organism", "readStateBeforeAction.js"));
const { flowEnergy } = require(path.join(__dirname, "..", "capital", "flowEnergy.js"));
const { scanEnvironment } = require(path.join(__dirname, "..", "sense", "engine.js"));
const { mutateSystem } = require(path.join(__dirname, "..", "evolution", "mutation.js"));
const { applySelectionPressure } = require(path.join(__dirname, "..", "kill", "selection.js"));
const { replicateWinningPattern } = require(path.join(__dirname, "..", "replication", "engine.js"));
const { deriveInsights } = require(path.join(__dirname, "..", "memory", "intelligence.js"));
const { selfCorrect } = require(path.join(__dirname, "..", "correction", "selfCorrect.js"));
const { compoundKnowledge } = require(path.join(__dirname, "..", "knowledge", "compound.js"));
const { refineGoals } = require(path.join(__dirname, "..", "goals", "refine.js"));
const { utiliseFailures } = require(path.join(__dirname, "..", "memory", "failureUtil.js"));
const { evaluateMutations } = require(path.join(__dirname, "..", "evolution", "evaluate.js"));
const memory = require(path.join(__dirname, "..", "memory", "index.js"));
const { writeCoreLog } = require(path.join(__dirname, "..", "utils.js"));

/**
 * High-frequency micro-cycle: sense + state refresh + fast correction signal.
 */
function runMicroCycle(ctx = {}) {
  const state = computeSystemState(ctx);
  const env = scanEnvironment({ ...ctx, micro: true });
  const pricing_variant = state.stress_level > 55 ? "discount_edge" : "margin_edge";
  const outreach_variant = state.dominance_score < 45 ? "soft_proof_bias" : "direct_outcome_bias";
  const content_variant = state.adaptation_rate > 40 ? "high_rotation" : "stable_hook";
  memory.logMetric({
    type: "micro_hf",
    pricing_variant,
    outreach_variant,
    content_variant,
  });
  const correction = selfCorrect({ ...ctx, micro: true });
  writeCoreLog({ event: "micro_cycle", dominance: state.dominance_score });
  return { state, environment: env, correction, hf_variants: { pricing_variant, outreach_variant, content_variant } };
}

/**
 * Full organism tick — read state before any strategic mutation.
 */
function runOrganismTick(ctx = {}) {
  const state = readStateBeforeAction(ctx);
  readSystemState();

  const energy = flowEnergy(ctx);
  const environment = scanEnvironment(ctx);
  const mutations = mutateSystem(ctx);
  const mutationScoreboard = evaluateMutations();
  const selection = applySelectionPressure(ctx);
  const failureTraining = utiliseFailures();

  let replica = null;
  if (selection.replicated_hint && selection.replicated_hint.length) {
    replica = replicateWinningPattern({ target_niche: selection.replicated_hint[0].pattern });
  }

  const insights = deriveInsights();
  const correction = selfCorrect(ctx);
  const knowledge = compoundKnowledge({ phase: "post_tick", insights });
  const goals = refineGoals(ctx);

  const out = {
    ok: true,
    state,
    failure_training: failureTraining,
    energy,
    environment,
    mutations,
    mutation_scoreboard: mutationScoreboard,
    selection,
    replica,
    insights,
    correction,
    knowledge,
    goals,
  };
  writeCoreLog({ event: "organism_tick", survival_terminated: selection.terminated.length });
  return out;
}

module.exports = { runMicroCycle, runOrganismTick };
