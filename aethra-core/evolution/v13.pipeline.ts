import { assertEvolutionAllowed } from "./governance/evolution.policy";
import { enforceInvariants } from "./governance/invariants.guard";
import { assessBlastRadius } from "./governance/blast.radius";
import { prioritiseProposals } from "./proposals/proposal.prioritiser";
import { enqueueProposal } from "./proposals/proposal.queue";
import type { EvolutionProposal } from "./proposals/proposal.schema";
import { generateDiff } from "./diff/diff.generator";
import { recordPatchIntent } from "./diff/patch.applier";
import { analyseImpact } from "./diff/impact.analyser";
import { runSandbox } from "./sandbox/sandbox.runner";
import { validateEconomics } from "./validation/economic.validator";
import { validateAgainstPolicy } from "./validation/policy.validator";
import { assertApproved } from "./validation/approval.gateway";
import { planRollout } from "./deployment/rollout.engine";
import { registerVersion } from "./versioning/version.registry";
import { logArchitecture } from "./versioning/architecture.history";
import { measureEvolutionVelocity, improvementRate } from "./telemetry/evolution.velocity";

/**
 * Single governed evolution cycle: prioritise → validate → sandbox → blast → record → version → architect log.
 * Does not mutate live module files; persists intents + lineage only.
 */
export function runEvolutionCycle(input: {
  systemMirror: Record<string, unknown>;
  proposals: EvolutionProposal[];
  approvedByHuman: boolean;
  approvalTier?: "operator" | "owner";
}) {
  assertEvolutionAllowed();
  validateAgainstPolicy();
  assertApproved({
    approvedByHuman: input.approvedByHuman,
    tier: input.approvalTier || "owner",
  });

  const ranked = prioritiseProposals(input.proposals);
  const velocity = measureEvolutionVelocity(ranked);

  const results: Array<{ proposal_id: string; ok: boolean; reason?: string }> = [];
  const leverageHistory: Array<{ leverage_delta?: number; ts: number }> = [];

  for (const proposal of ranked) {
    try {
      enforceInvariants(proposal);
      if (!validateEconomics(proposal)) {
        results.push({ proposal_id: proposal.id, ok: false, reason: "economic_validation_failed" });
        continue;
      }
      const impact = analyseImpact(input.systemMirror, proposal);
      assessBlastRadius({
        affected_modules: impact.affected_nodes,
        total_modules: Math.max(1, impact.total_modules),
      });

      const sandbox = runSandbox(proposal);
      if (!sandbox.worlds.every((w) => w.success) || !sandbox.regression.pass) {
        results.push({ proposal_id: proposal.id, ok: false, reason: "sandbox_failed" });
        continue;
      }

      enqueueProposal(proposal);
      const diff = generateDiff(input.systemMirror, proposal);
      recordPatchIntent(diff, proposal.id);
      const rollout = planRollout({ id: proposal.id });
      const ver = registerVersion({
        proposal_id: proposal.id,
        version: `v_${Date.now()}`,
        snapshot_ref: proposal.id,
      });
      logArchitecture({
        proposal_id: proposal.id,
        rollout,
        lineage: ver,
        layer: proposal.layer,
      });
      leverageHistory.push({
        leverage_delta: proposal.expectedImpact?.leverage_delta,
        ts: Date.now(),
      });
      results.push({ proposal_id: proposal.id, ok: true });
    } catch (e: any) {
      results.push({ proposal_id: proposal.id, ok: false, reason: String(e?.message || e) });
    }
  }

  return {
    velocity,
    improvement_rate: improvementRate(leverageHistory),
    results,
    top: ranked[0] ?? null,
  };
}
