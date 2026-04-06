"use strict";

const { saveMemory } = require("../memory/memory");
const { recordCycle } = require("../memory/learningEngine");
const { detectOpportunities } = require("./opportunityEngine");
const { selectTopOpportunities } = require("./decisionEngine");
const { buildBusiness } = require("./buildEngine");
const { launchBusiness } = require("./launchEngine");
const { measurePerformance } = require("./feedbackEngine");
const { allocateCapital } = require("./capitalEngine");
const { generateReports } = require("./intelligenceMonetisation");
const { checkAccess, trackUsage } = require("./infraMonetisation");
const { buildMasterExecutionBriefing } = require("./executionBriefing");
const { createMonetisationLayer } = require("./monetisationLayer");
const { getRecycleHintsForBuild, storeAndReuseAssets } = require("./assetRecycleStore");
const {
  loadState,
  writeState,
  pushFeed,
  appendPerformance,
  saveBusinesses,
  applyRevenueToState,
} = require("./stateStore");

function tokenBoostPenalty(idea, delta) {
  const words = String(idea || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 10);
  return { words, delta };
}

function applyLearning(state, idea, direction) {
  const { words, delta } = tokenBoostPenalty(idea, direction === "boost" ? 2 : -3);
  state.learning_keywords = state.learning_keywords && typeof state.learning_keywords === "object"
    ? state.learning_keywords
    : {};
  for (const w of words) {
    state.learning_keywords[w] = (Number(state.learning_keywords[w]) || 0) + delta;
  }
}

/**
 * Full autonomous sequence: detect → select top N → build → launch → measure → allocate capital (each venture).
 * Master prompt: max 3 opportunities executed per cycle (configurable via deploy_limit).
 * @param {{ seedText?: string, baseUrl?: string, user_id?: string, skip_access_check?: boolean, deploy_limit?: number, campaign_id?: string, test_group?: string }} options
 */
async function runAethraCycle(options) {
  const opts = options && typeof options === "object" ? options : {};
  const userId = String(opts.user_id || opts.userId || "anonymous").slice(0, 120);
  const baseUrl = String(opts.baseUrl || process.env.AETHRA_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const deployLimit = Math.max(1, Math.min(5, Number(opts.deploy_limit) || 3));
  const cycleCampaignId = String(opts.campaign_id || opts.campaignId || `cmp_${Date.now()}`).slice(0, 120);

  if (!opts.skip_access_check) {
    const gate = checkAccess(userId, "portfolio_execution");
    if (!gate.allowed) {
      return { ok: false, error: "access_denied", gate };
    }
  }

  trackUsage(userId, "portfolio_cycle");
  const s = loadState();
  s.usage = s.usage || {};
  s.usage.portfolio_cycles = (Number(s.usage.portfolio_cycles) || 0) + 1;

  const monetisation_trace = [];

  if (opts.template_id || opts.template_meta) {
    pushFeed(
      s,
      `Template assigned: ${String(opts.template_id || "custom").slice(0, 80)}`,
      { type: "template", template_id: opts.template_id, template_meta: opts.template_meta }
    );
  }

  const opportunities = Array.isArray(opts.precalculated_opportunities) && opts.precalculated_opportunities.length
    ? opts.precalculated_opportunities
    : await detectOpportunities({
        seedText: opts.seedText,
        learning_keywords: s.learning_keywords,
      });
  monetisation_trace.push({
    stage: "detect",
    venture_index: null,
    ...generateReports(
      { opportunities, stage: "detect", business: null },
      { writeFiles: true }
    ),
  });

  const selectedList =
    Array.isArray(opts.precalculated_selected) && opts.precalculated_selected.length
      ? opts.precalculated_selected.slice(0, deployLimit)
      : selectTopOpportunities(opportunities, deployLimit);
  if (!selectedList.length) {
    pushFeed(s, "Cycle aborted — no opportunities in pool.", { type: "decision" });
    s.last_cycle_ts = Date.now();
    writeState(s);
    const master_briefing = buildMasterExecutionBriefing({
      opportunities,
      deployments: [],
      state: s,
    });
    return {
      ok: true,
      aborted: true,
      reason: "no_opportunity_selected",
      opportunities,
      selectedOpportunities: [],
      selectedOpportunity: null,
      deployments: [],
      master_briefing,
      monetisation_trace,
    };
  }

  pushFeed(
    s,
    `Selected ${selectedList.length} opportunity(ies) for this cycle (cap ${deployLimit}).`,
    { type: "decision", count: selectedList.length }
  );

  const deployments = [];
  let activeCount = s.businesses.filter((b) => b.status === "live").length;
  let cycleLeads = 0;
  let cycleEmailsSim = 0;
  let cycleCloses = 0;
  let cycleRevenueDelta = 0;
  const recycleHints = getRecycleHintsForBuild();

  for (let ventureIndex = 0; ventureIndex < selectedList.length; ventureIndex++) {
    const selected = selectedList[ventureIndex];
    pushFeed(s, `Deploy rank ${ventureIndex + 1}: ${String(selected.idea).slice(0, 120)}`, {
      type: "decision",
      score: selected.score,
      rank: ventureIndex + 1,
    });

    const business = { ...buildBusiness(selected, recycleHints), opportunity: selected };

    monetisation_trace.push({
      stage: "build",
      venture_index: ventureIndex,
      build_service_gbp: business.monetisation?.build_service_listing_gbp,
      ...generateReports({ opportunities, business, stage: "build" }, { writeFiles: true }),
    });

    let monetisation_layer;
    try {
      monetisation_layer = await createMonetisationLayer(business, {
        campaign_id: cycleCampaignId,
        test_group: String(opts.test_group || opts.testGroup || `slot_${ventureIndex}`).slice(0, 64),
        user_id: userId,
      });
    } catch (e) {
      monetisation_layer = { error: String(e.message || e), venture_id: business.id };
    }
    business.monetisation_layer = monetisation_layer;
    monetisation_trace.push({
      stage: "stripe_layer",
      venture_index: ventureIndex,
      campaign_id: cycleCampaignId,
      sessions: (monetisation_layer.checkout_sessions || []).map((x) => ({
        tier: x.tier,
        mode: x.mode,
        url: x.url,
        session_id: x.session_id,
      })),
    });

    const launch = launchBusiness(business, { baseUrl });
    business.launch = launch;
    business.status = launch.ok ? "live" : "draft";

    monetisation_trace.push({
      stage: "launch",
      venture_index: ventureIndex,
      capture: launch.monetisation,
      ...generateReports(
        { opportunities, business, performance: { launched: launch.ok }, stage: "launch" },
        { writeFiles: true }
      ),
    });

    const performance = measurePerformance(business, {
      active_businesses: activeCount + (business.status === "live" ? 1 : 0),
    });
    business.metrics = performance;
    if (business.status === "live") activeCount += 1;

    monetisation_trace.push({
      stage: "measure",
      venture_index: ventureIndex,
      ...generateReports(
        { opportunities, business, performance, stage: "measure" },
        { writeFiles: true }
      ),
    });

    const capital = allocateCapital(performance, { state: s, business });
    business.capital_decision = capital;

    if (capital.action === "kill") {
      business.status = "killed";
      applyLearning(s, selected.idea, "penalize");
      pushFeed(s, `Killed project: ${business.id} — ${capital.note}`, {
        type: "capital",
        action: "kill",
        venture_index: ventureIndex,
      });
    } else if (capital.action === "scale") {
      applyLearning(s, selected.idea, "boost");
      pushFeed(s, `Scale winner: ${business.id} — ${capital.note}`, {
        type: "capital",
        action: "scale",
        venture_index: ventureIndex,
      });
      if (capital.duplicate_model && capital.duplicate_model.clones > 0) {
        pushFeed(s, `Duplicate model queued from ${business.id} (clone pipeline).`, {
          type: "capital",
          action: "duplicate",
        });
      }
    } else {
      pushFeed(s, `Iterate: ${business.id} — ${capital.note}`, {
        type: "capital",
        action: "iterate",
        venture_index: ventureIndex,
      });
    }

    monetisation_trace.push({
      stage: "capital",
      venture_index: ventureIndex,
      infra_subscription: "getSubscriptionTiers() via /api/v1/portfolio-execution/infra",
      ...generateReports(
        { opportunities, business, performance, stage: "capital" },
        { writeFiles: true }
      ),
    });

    const recycleMeta = storeAndReuseAssets({ business, performance, capital });
    business.asset_recycle = recycleMeta;

    const revBump = Math.min(500, performance.revenue * 0.08);
    applyRevenueToState(s, revBump);
    cycleLeads += 1;
    cycleEmailsSim += launch.ok ? 1 : 0;
    cycleCloses += performance.signal_strength === "strong" ? 1 : 0;
    cycleRevenueDelta += Math.round(performance.revenue * 0.05 * 100) / 100;

    s.businesses.unshift(business);
    appendPerformance(s, {
      business_id: business.id,
      revenue: performance.revenue,
      conversion_rate: performance.conversion_rate,
      signal: performance.signal_strength,
      capital_action: capital.action,
    });

    pushFeed(s, `Business ${business.status}: ${business.brand?.name || business.id} · £${performance.revenue} est.`, {
      type: "launch",
      public_url: launch.public_url,
      venture_index: ventureIndex,
    });

    saveMemory({
      idea: selected.idea,
      decision: {
        verdict: capital.action === "kill" ? "kill" : "advance",
        build_recommended: capital.action !== "kill",
        scores: {
          viability_0_100:
            performance.signal_strength === "strong" ? 82 : performance.signal_strength === "moderate" ? 64 : 44,
        },
      },
      execution: {
        product_focus: business.product_concept?.headline,
        landing: launch.landing_url_path,
      },
      results: performance,
      conversion_signals: { engagement: performance.engagement, traffic: performance.traffic },
    });

    deployments.push({
      selected,
      business,
      launch,
      performance,
      capital,
    });
  }

  try {
    recordCycle({
      leads: cycleLeads,
      suppliers_found: 0,
      emails_sent: 0,
      emails_simulated: cycleEmailsSim,
      replies_classified: 0,
      simulated_closes: cycleCloses,
      revenue_delta_gbp: Math.round(cycleRevenueDelta * 100) / 100,
    });
  } catch {
    /* learning file may be read-only */
  }

  s.last_cycle_ts = Date.now();
  if (opts.autonomous_enabled !== undefined) {
    s.autonomous_enabled = !!opts.autonomous_enabled;
  }
  saveBusinesses(s);

  const master_briefing = buildMasterExecutionBriefing({
    opportunities,
    deployments,
    state: s,
  });

  const first = deployments[0];

  return {
    ok: true,
    deploy_limit: deployLimit,
    campaign_id: cycleCampaignId,
    opportunities,
    selectedOpportunities: selectedList,
    selectedOpportunity: first?.selected || null,
    deployments,
    business: first?.business,
    launch: first?.launch,
    performance: first?.performance,
    capital: first?.capital,
    master_briefing,
    monetisation_trace,
    state: {
      capital_available_gbp: s.capital_available_gbp,
      revenue_today_gbp: s.revenue_today_gbp,
      active_businesses: s.businesses.filter((b) => b.status === "live").length,
    },
  };
}

module.exports = { runAethraCycle };
