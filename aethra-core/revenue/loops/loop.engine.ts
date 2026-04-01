import { createTrustOriginReceipt } from "../../trustorigin/integration";
import { appendPerformanceLog } from "../memory/revenue.memory";
import { shouldKill } from "../optimisation/kill.switch";

export type LoopRunResult = {
  revenue: number;
  conversions?: number;
  metadata?: Record<string, unknown>;
};

/**
 * Executes one revenue loop tick. Deprioritises or stops work that fails kill/ROI gates.
 * All runs are logged for traceability (TrustOrigin receipt + append-only performance log).
 */
export async function executeLoop(loop: {
  name: string;
  status?: string;
  run: () => Promise<LoopRunResult>;
  runsCompleted?: number;
  maxRunsPerSession?: number;
}): Promise<LoopRunResult & { status: string; trustorigin_receipt_id?: string }> {
  const maxRuns = Math.max(1, Number(loop.maxRunsPerSession ?? 100));
  const completed = Number(loop.runsCompleted ?? 0);
  if (completed >= maxRuns) {
    const empty = { revenue: 0, conversions: 0, metadata: { reason: "max_runs_reached" } };
    return { ...empty, status: "killed" };
  }

  const result = await loop.run();
  loop.runsCompleted = completed + 1;

  const performance = {
    revenue: result.revenue,
    attempts: loop.runsCompleted,
    conversions: result.conversions ?? 0,
  };

  if (shouldKill(performance)) {
    loop.status = "killed";
    appendPerformanceLog({
      loop_name: loop.name,
      phase: "kill",
      result,
      performance,
    });
    return { ...result, status: "killed" };
  }

  if (result.revenue > 0) {
    loop.status = "scaled";
  } else {
    loop.status = "optimise";
  }

  const receipt = createTrustOriginReceipt({
    venture_id: `loop:${loop.name}`,
    business_record: { loop: loop.name, status: loop.status },
    execution_proof: { revenue: result.revenue, conversions: result.conversions },
    revenue_snapshot: { revenue: result.revenue, ts: Date.now() },
    mutation_history: [{ action: "loop_tick", loop: loop.name, ts: Date.now() }],
    previous_hash: "genesis",
  });

  appendPerformanceLog({
    loop_name: loop.name,
    phase: "tick",
    result,
    trustorigin_receipt_id: receipt.receipt_id,
    verification_hash: receipt.verification_hash,
  });

  return {
    ...result,
    status: loop.status || "optimise",
    trustorigin_receipt_id: receipt.receipt_id,
  };
}
