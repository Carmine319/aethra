import * as path from "path";
import { createRequire } from "module";
import { getRepoRoot } from "../repoPaths";
import { getSystemState, runDiagnostics } from "../diagnostics/index";
import {
  detectRealSignals,
  mergeSignalsByTopic,
  validateSignals,
  scoreSignals,
  selectTop,
} from "../data/orchestrator";
import { assessCapitalRisk } from "../capital/risk";
import { selectTemplateForOpportunity, rankTemplates } from "../templates/evolution";
import { captureRevenue } from "../revenue/strict";
import { deriveInsights, updateMemoryRecord } from "../memory/engine";
import { evolveSystem } from "../evolution/system";
import { detectOperationalFailure, recover, recoverExecution, reassignStrategy } from "../resilience/engine";
import type { CycleResult, ExecutionContext } from "../types";

const nodeRequire = createRequire(__filename);

function normTopic(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 6)
    .join(" ");
}

export async function executeCycle(opts: ExecutionContext = {}): Promise<CycleResult> {
  const logs: string[] = [];
  const log = (m: string) => logs.push(`[${new Date().toISOString()}] ${m}`);

  const trace: Record<string, unknown> = { steps: [] as unknown[], startedAt: Date.now() };
  const root = getRepoRoot();
  const userId = String(opts.user_id || opts.userId || "anonymous").slice(0, 120);
  const deployLimit = Math.max(1, Math.min(5, Number(opts.deploy_limit) || 3));
  const startedAt = Date.now();

  try {
    const systemState = await getSystemState();
    if (!systemState.operational) {
      log("Halted: system non-operational (health or missing portfolio state)");
      return { ok: false, halted: true, reason: "non_operational", logs, diagnostics: systemState.diagnostics };
    }

    const rawSignals = await detectRealSignals(opts.seedText);
    const merged = mergeSignalsByTopic(rawSignals);
    const validated = validateSignals(merged);
    if (!validated.length) {
      log("No valid signals after cross-source validation");
      await updateMemoryRecord({ kind: "cycle_audit", phase: "validate", result: "no_valid_signals" });
      return { ok: false, halted: true, reason: "no_valid_signals", logs };
    }

    const scored = scoreSignals(validated);
    const topSignal = selectTop(scored);
    if (!topSignal) {
      log("No viable signal selected");
      return { ok: false, halted: true, reason: "no_viable_opportunity", logs };
    }

    const { detectOpportunities } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "opportunityEngine.js"));
    const { loadState } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "stateStore.js"));
    const { selectTopOpportunities } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "decisionEngine.js"));
    const { runAethraCycle } = nodeRequire(path.join(root, "aethra_node", "portfolioExecution", "cycle.js"));

    const s0 = loadState();
    const opportunities = await detectOpportunities({
      seedText: opts.seedText,
      learning_keywords: s0.learning_keywords || {},
    });

    const topic = topSignal.topic;
    let match = opportunities.find((o: { idea?: string }) => normTopic(String(o.idea || "")) === topic);
    if (!match) match = opportunities.find((o: { idea?: string }) => normTopic(String(o.idea || "")).includes(topic.slice(0, 8)));
    if (!match && topSignal.payload && (topSignal.payload as { idea?: string }).idea) {
      match = topSignal.payload as { idea?: string };
    }
    if (!match && opportunities.length) match = opportunities[0];
    if (!match) {
      log("No matching internal opportunity for validated signals");
      return { ok: false, halted: true, reason: "no_internal_opportunity", logs };
    }

    const selectedList = selectTopOpportunities(opportunities, deployLimit);
    const primary = selectedList[0] || match;

    const template = selectTemplateForOpportunity(primary as Record<string, unknown>) as Record<string, unknown> & {
      id: string;
      name?: string;
      executionSteps?: string[];
      cost_structure?: object;
      time_to_revenue_days?: number;
      risk_profile?: string;
      scalability_score?: number;
      monetisation_hooks?: string[];
    };
    const ranked = rankTemplates();
    const topTemplateId = ranked[0]?.id;

    const capitalCheck = assessCapitalRisk(
      { payload: primary as Record<string, unknown> },
      template,
      systemState.portfolio
    );
    (trace.steps as unknown[]).push({ name: "assessCapitalRisk", capitalCheck });
    if (!capitalCheck.approved) {
      log(`Capital rejected: ${capitalCheck.reason}`);
      await updateMemoryRecord({
        kind: "capital_reject",
        reason: capitalCheck.reason,
        template_id: template.id,
      });
      return { ok: false, halted: true, reason: capitalCheck.reason, logs, capital: capitalCheck };
    }

    const deployOpts = {
      seedText: opts.seedText || (primary as { idea?: string }).idea,
      baseUrl: opts.baseUrl,
      user_id: userId,
      autonomous_enabled:
        opts.autonomous_enabled !== undefined
          ? !!opts.autonomous_enabled
          : opts.mode === "assisted"
            ? false
            : undefined,
      skip_access_check: opts.skip_access_check,
      deploy_limit: deployLimit,
      campaign_id: opts.campaign_id,
      test_group: opts.test_group,
      template_id: template.id,
      template_meta: {
        name: template.name,
        executionSteps: template.executionSteps,
        cost_structure: template.cost_structure,
        time_to_revenue_days: template.time_to_revenue_days,
        risk_profile: template.risk_profile,
        scalability_score: template.scalability_score,
        monetisation_hooks: template.monetisation_hooks,
        rank: ranked.find((r) => r.id === template.id),
      },
      precalculated_opportunities: opportunities,
      precalculated_selected: selectedList,
    };

    const runDeploy = () => runAethraCycle(deployOpts);
    const alt = reassignStrategy("deploy_retry");
    const fallback = () =>
      runAethraCycle({
        ...deployOpts,
        seedText: alt.seedText,
        deploy_limit: Math.min(deployLimit, alt.deploy_limit),
        precalculated_opportunities: undefined,
        precalculated_selected: undefined,
      });

    const recovered = await recoverExecution(runDeploy, { label: "deployExecution", fallback });
    if (!recovered.ok) {
      log(`Deploy failed: ${recovered.error}`);
      await updateMemoryRecord({
        kind: "deployment",
        ok: false,
        template_id: template.id,
        error: recovered.error,
      });
      return { ok: false, halted: true, reason: recovered.error, logs, trace };
    }

    const cycleResult = recovered.result;
    (trace.steps as unknown[]).push({
      name: "deployExecution",
      ok: (cycleResult as { ok?: boolean })?.ok !== false,
      recovered: recovered.recovered,
    });

    const deployments = (cycleResult as { deployments?: unknown[] })?.deployments || [];
    const performanceRows = deployments.map((d: unknown) => {
      const x = d as {
        business?: { id?: string };
        performance?: { signal_strength?: string; revenue?: number };
      };
      return { id: x.business?.id, signal: x.performance?.signal_strength };
    });
    (trace.steps as unknown[]).push({ name: "track", rows: performanceRows });

    const revenue = await captureRevenue(startedAt);
    (trace.steps as unknown[]).push({ name: "captureRevenue", revenue });

    const {
      bumpTemplateUsage,
      recordConversionRate,
      setActiveSystemsCount,
    } = nodeRequire(path.join(root, "core", "memory", "store.js"));
    const evolution = nodeRequire(path.join(root, "core", "evolution", "engine.js"));

    bumpTemplateUsage(template.id);
    for (const d of deployments) {
      const row = d as {
        performance?: { conversion_rate?: number; signal_strength?: string };
        capital?: { action?: string };
        business?: { id?: string };
      };
      const perf = row.performance;
      if (perf) recordConversionRate(Number(perf.conversion_rate) || 0);
      const outcome =
        row.capital?.action === "kill"
          ? "kill"
          : row.capital?.action === "scale"
            ? "scale"
            : String(perf?.signal_strength || "moderate");
      await updateMemoryRecord({
        kind: "deployment",
        ok: true,
        template_id: template.id,
        business_id: row.business?.id,
        outcome,
      });
      evolution.learnFromOutcome({
        template_id: template.id,
        revenue_proxy: 0,
        killed: row.capital?.action === "kill",
        scaled: row.capital?.action === "scale",
      });
    }

    const s1 = loadState();
    setActiveSystemsCount(s1.businesses.filter((b: { status?: string }) => b.status === "live").length);

    const insights = deriveInsights();
    await updateMemoryRecord({
      kind: "memory_insights",
      insights,
      cycle_ts: Date.now(),
    });

    await evolveSystem();

    const failCtx = detectOperationalFailure(s1);
    const recovery = await recover(failCtx);
    await updateMemoryRecord({ kind: "failure_context", failCtx, recovery });

    const diagnostics = await runDiagnostics();
    const finishedAt = Date.now();
    trace.finishedAt = finishedAt;
    trace.elapsedMs = finishedAt - startedAt;

    await updateMemoryRecord({
      kind: "cycle_complete",
      ok: true,
      top_template_id: topTemplateId,
      revenue: { ...revenue } as Record<string, unknown>,
      recovery,
    });

    log(`Cycle complete; health=${diagnostics.health}`);

    const { calculateDailyRevenue, calculateWinRate, projectGrowth } = nodeRequire(path.join(
      root,
      "core",
      "profit",
      "engine.js"
    ));

    return {
      ok: true,
      logs,
      trace,
      cycle: cycleResult,
      capital: capitalCheck,
      revenue: { ...revenue } as Record<string, unknown>,
      diagnostics: diagnostics as unknown as Record<string, unknown>,
      topTemplateId,
      profit: {
        daily: calculateDailyRevenue(s1),
        winRate: calculateWinRate(s1),
        growth: projectGrowth({
          last_cycle_ts: s1.last_cycle_ts,
          portfolio_cycles: (s1.usage as { portfolio_cycles?: number })?.portfolio_cycles,
        }),
      },
    };
  } catch (e) {
    const msg = String((e as Error).message || e);
    log(`Unhandled: ${msg}`);
    await updateMemoryRecord({ kind: "failure", error: msg.slice(0, 500), phase: "executeCycle" });
    await runDiagnostics();
    return { ok: false, halted: true, reason: msg, logs, trace };
  }
}
