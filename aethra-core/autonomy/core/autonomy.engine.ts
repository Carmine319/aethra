import fs from "fs";
import path from "path";
import { createTrustOriginReceipt } from "../../trustorigin/integration";
import { generateStrategy } from "./strategy.generator";
import { evaluateFitness } from "../evolution/fitness.evaluator";
import { applyConstraints } from "../governance/constraint.engine";
import { globalKill } from "../governance/kill.switch.global";
import { getApprovalBand, assertApproval, type ApprovalBand } from "../governance/approval.matrix";
import { registerGenome } from "../genome/genome.registry";
import { evolve } from "../evolution/evolution.engine";
import { appendDecision } from "../memory/decisions.append";
import { storeMemory } from "../memory/long.term.memory";
import { appendStrategy } from "../memory/strategy.memory";
import type { Genome } from "../genome/genome.registry";

function readAutonomyPolicy() {
  const file = path.join(__dirname, "..", "policies", "autonomy.policy.json");
  if (!fs.existsSync(file)) {
    return {
      global_kill_switch: false,
      max_risk_score: 0.7,
      require_reversible_strategies: true,
      max_mutations_per_cycle: 10,
      min_fitness_to_register_genome: 0,
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export async function runAutonomyCycle(context: {
  market?: string;
  approvedBy?: ApprovalBand;
  existingGenomes?: Genome[];
}) {
  const policy = readAutonomyPolicy();
  globalKill(!!policy.global_kill_switch);

  const strategy = await generateStrategy(context);
  applyConstraints(strategy);

  const approvalRequired = getApprovalBand({ risk: strategy.risk, capitalImpact: strategy.capitalImpact });
  assertApproval({ approvedBy: context.approvedBy, required: approvalRequired });

  const fitness = evaluateFitness(strategy);

  const receipt = createTrustOriginReceipt({
    venture_id: `autonomy:${strategy.id}`,
    business_record: { strategy, market: strategy.market },
    execution_proof: { fitness, approval_band: approvalRequired },
    revenue_snapshot: { expectedValue: strategy.expectedValue, capitalImpact: strategy.capitalImpact },
    mutation_history: [{ action: "autonomy_cycle", ts: Date.now(), fitness }],
    previous_hash: "genesis",
  });

  appendDecision({
    event: "strategy_selected",
    strategy,
    fitness,
    receipt_id: receipt.receipt_id,
    verification_hash: receipt.verification_hash,
    approval_band: approvalRequired,
  });

  appendStrategy({ strategy, fitness, trustorigin: receipt });

  storeMemory({
    type: "autonomy_cycle",
    strategy_id: strategy.id,
    fitness,
    receipt_id: receipt.receipt_id,
  });

  if (fitness > Number(policy.min_fitness_to_register_genome ?? 0)) {
    registerGenome({
      id: strategy.id,
      performance: fitness,
      strategy: { ...strategy, trustorigin_receipt_id: receipt.receipt_id },
    });
  }

  const seeds = context.existingGenomes && context.existingGenomes.length
    ? context.existingGenomes
    : [{ id: strategy.id, performance: fitness, strategy: strategy as unknown as Record<string, unknown> }];

  const evolved = evolve(seeds).slice(0, Number(policy.max_mutations_per_cycle || 10));

  appendDecision({
    event: "evolution_step",
    evolved_count: evolved.length,
    parent_ids: seeds.map((g) => g.id),
  });

  return { strategy, fitness, trustorigin: receipt, evolved };
}
