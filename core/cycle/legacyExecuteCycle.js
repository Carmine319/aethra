"use strict";

const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

const { detectOpportunities } = require(path.join(ROOT, "aethra_node", "portfolioExecution", "opportunityEngine"));
const {
  scoreOpportunities,
  selectTopOpportunities,
} = require(path.join(ROOT, "aethra_node", "portfolioExecution", "decisionEngine"));
const { runAethraCycle } = require(path.join(ROOT, "aethra_node", "portfolioExecution", "cycle"));
const { loadState } = require(path.join(ROOT, "aethra_node", "portfolioExecution", "stateStore"));
const { selectBestTemplate } = require("../templates/selectBestTemplate");
const { appendHistorical, bumpTemplateUsage, recordConversionRate, setActiveSystemsCount } = require("../memory/store");
const { calculateDailyRevenue, calculateWinRate, projectGrowth } = require("../profit/engine");
const evolution = require("../evolution/engine");
const { recoverExecution, reassignStrategy } = require("../resilience/index");

/** Fallback when `core/dist-cjs` is not built — no synthetic GBP booked from performance estimates. */
async function executeCycle(options) {
  const opts = options && typeof options === "object" ? options : {};
  const trace = { steps: [], startedAt: Date.now(), mode: opts.mode || "autonomous" };
  const userId = String(opts.user_id || opts.userId || "anonymous").slice(0, 120);
  const deployLimit = Math.max(1, Math.min(5, Number(opts.deploy_limit) || 3));
  const statePreview = loadState();

  const opportunities = await detectOpportunities({
    seedText: opts.seedText,
    learning_keywords: statePreview.learning_keywords,
  });
  trace.steps.push({ name: "detectOpportunities", count: opportunities.length });
  for (const o of opportunities.slice(0, 12)) {
    appendHistorical({
      kind: "opportunity_eval",
      idea: String(o.idea || "").slice(0, 200),
      score: o.score,
    });
  }

  const scored = scoreOpportunities(opportunities);
  trace.steps.push({ name: "scoreOpportunities", count: scored.length });

  const selectedList = selectTopOpportunities(opportunities, deployLimit);
  const primary = selectedList[0] || null;
  trace.steps.push({
    name: "selectBestOpportunity",
    primary_idea: primary ? String(primary.idea).slice(0, 120) : null,
    selected_count: selectedList.length,
  });

  const template = selectBestTemplate(primary || { idea: opts.seedText || "general" });
  bumpTemplateUsage(template.id);
  trace.steps.push({ name: "assignTemplate", template_id: template.id });

  const deployOpts = {
    seedText: opts.seedText || primary?.idea,
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
      selection: template._selection,
    },
    precalculated_opportunities: opportunities,
    precalculated_selected: selectedList,
  };

  const runDeploy = () => runAethraCycle(deployOpts);
  const fallback = () => {
    const alt = reassignStrategy("deploy_retry");
    return runAethraCycle({
      ...deployOpts,
      seedText: alt.seedText,
      deploy_limit: Math.min(deployLimit, alt.deploy_limit),
      precalculated_opportunities: undefined,
      precalculated_selected: undefined,
    });
  };

  const recovered = await recoverExecution(runDeploy, { label: "deployExecution", fallback });
  if (!recovered.ok) {
    trace.steps.push({ name: "deployExecution", ok: false, error: recovered.error });
    appendHistorical({ kind: "deployment", ok: false, template_id: template.id, error: recovered.error });
    const strategyHints = evolution.adjustStrategy(statePreview);
    return { ok: false, trace, strategyHints, error: recovered.error };
  }

  const cycleResult = recovered.result;
  trace.steps.push({
    name: "deployExecution",
    ok: cycleResult?.ok !== false,
    aborted: !!cycleResult?.aborted,
    deployments: (cycleResult?.deployments || []).length,
    recovered: !!recovered.recovered,
  });

  const deployments = cycleResult?.deployments || [];
  trace.steps.push({
    name: "trackPerformance",
    rows: deployments.map((d) => ({
      id: d.business?.id,
      signal: d.performance?.signal_strength,
    })),
  });

  for (const d of deployments) {
    const perf = d.performance;
    if (!perf) continue;
    recordConversionRate(Number(perf.conversion_rate) || 0);
    const outcome =
      d.capital?.action === "kill"
        ? "kill"
        : d.capital?.action === "scale"
          ? "scale"
          : String(perf.signal_strength || "moderate");
    appendHistorical({
      kind: "deployment",
      ok: true,
      template_id: template.id,
      business_id: d.business?.id,
      outcome,
    });
    evolution.learnFromOutcome({
      template_id: template.id,
      revenue_proxy: 0,
      killed: d.capital?.action === "kill",
      scaled: d.capital?.action === "scale",
    });
  }
  trace.steps.push({
    name: "captureRevenue",
    note: "verified revenue only via Stripe — no performance estimates booked",
  });

  const s = loadState();
  setActiveSystemsCount(s.businesses.filter((b) => b.status === "live").length);
  trace.steps.push({ name: "updateMemory", active_systems: s.businesses.filter((b) => b.status === "live").length });

  evolution.promoteWinningPatterns();
  evolution.deprecateFailingPatterns();
  const strategyHints = evolution.adjustStrategy({ ...s, usage: s.usage });
  trace.steps.push({ name: "optimiseSystem", strategyHints });

  trace.finishedAt = Date.now();
  trace.elapsedMs = trace.finishedAt - trace.startedAt;

  return {
    ok: true,
    trace,
    cycle: cycleResult,
    profit: {
      daily: calculateDailyRevenue(s),
      winRate: calculateWinRate(s),
      growth: projectGrowth({ last_cycle_ts: s.last_cycle_ts, portfolio_cycles: s.usage?.portfolio_cycles }),
    },
    strategyHints,
  };
}

module.exports = { executeCycle };
