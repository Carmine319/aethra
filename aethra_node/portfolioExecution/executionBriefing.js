"use strict";

const { loadRecycleStore } = require("./assetRecycleStore");

/** Portfolio mix target from master spec §X — advisory; capital engine applies kill/scale per venture. */
const PORTFOLIO_MIX_TARGET = { testing: 0.7, scaling: 0.2, experimental: 0.1 };

function demandOneToTen(opp) {
  const d = Number(opp?.demand);
  if (Number.isFinite(d) && d <= 1 && d >= 0) return Math.round(d * 10 * 10) / 10;
  const s = Number(opp?.score);
  if (Number.isFinite(s)) return Math.min(10, Math.max(1, Math.round((s / 100) * 10 * 10) / 10));
  return null;
}

/**
 * Section XIV — single structured surface for clients and autonomous loops.
 * @param {{
 *   opportunities: Array<Record<string, unknown>>,
 *   deployments: Array<{ selected: Record<string, unknown>, business: Record<string, unknown>, launch: Record<string, unknown>, performance: Record<string, unknown>, capital: Record<string, unknown>, monetisation_stages?: unknown[] }>,
 *   state: Record<string, unknown>,
 * }} payload
 */
function buildMasterExecutionBriefing(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const opportunities = Array.isArray(p.opportunities) ? p.opportunities : [];
  const deployments = Array.isArray(p.deployments) ? p.deployments : [];
  const s = p.state && typeof p.state === "object" ? p.state : {};

  const top_opportunities = opportunities.slice(0, 12).map((o, i) => ({
    rank: i + 1,
    name: String(o.idea || "").slice(0, 200),
    demand_score_1_10: demandOneToTen(o),
    competition_density: o.competition_intensity || null,
    time_to_revenue: o.time_to_cash || null,
    margin_potential_0_100: Number(o.monetisation_potential) || Number(o.score) || null,
    execution_complexity: o.difficulty || null,
    recommended_angle: o.reason ? String(o.reason).slice(0, 240) : null,
    sources: o.sources || [],
  }));

  const ventures_deployed = deployments.map((d) => ({
    venture_id: d.business?.id,
    brand: d.business?.brand?.name,
    status: d.business?.status,
    structure: {
      positioning: d.business?.product_concept?.headline,
      offer: d.business?.offer?.name || d.business?.payment,
      pricing: d.business?.payment,
    },
    launch: d.launch?.public_url ? { public_url: d.launch.public_url, landing_path: d.launch.landing_url_path } : null,
  }));

  const stripe_setup = {
    note: "Checkout sessions carry metadata: venture_id, campaign_id, test_group, price_tier, aethra_product_type=venture_pilot. Webhook: /webhooks/stripe",
    checkout_routes: [
      "POST /api/v1/billing/top-up-session",
      "POST /api/v1/billing/create-subscription-session",
      "POST /api/v1/billing/create-deal-checkout-session",
    ],
    per_venture: deployments.map((d) => {
      const layer = d.business?.monetisation_layer;
      const sessions = Array.isArray(layer?.checkout_sessions) ? layer.checkout_sessions : [];
      return {
        venture_id: d.business?.id,
        campaign_id: layer?.campaign_id,
        test_group: layer?.test_group,
        checkout_sessions: sessions.map((x) => ({
          tier: x.tier,
          mode: x.mode,
          url: x.url,
          session_id: x.session_id,
          amount_gbp: x.amount_gbp,
        })),
        payment_stub: d.business?.payment || null,
        gumroad: d.launch?.optional_deploy?.gumroad || null,
      };
    }),
  };

  const validation_metrics = deployments.map((d) => ({
    venture_id: d.business?.id,
    traffic: d.performance?.traffic,
    conversion_rate: d.performance?.conversion_rate,
    revenue_gbp_est: d.performance?.revenue,
    engagement: d.performance?.engagement,
    signal: d.performance?.signal_strength,
  }));

  const kill_scale_decisions = deployments.map((d) => ({
    venture_id: d.business?.id,
    action: d.capital?.action,
    note: d.capital?.note,
    budget_delta_gbp: d.capital?.budget_delta_gbp,
  }));

  const businesses = Array.isArray(s.businesses) ? s.businesses : [];
  const live = businesses.filter((b) => b.status === "live").length;
  const killed = businesses.filter((b) => b.status === "killed").length;

  const rs = loadRecycleStore();
  const portfolio_overview = {
    capital_available_gbp: s.capital_available_gbp,
    revenue_today_gbp: s.revenue_today_gbp,
    active_live_ventures: live,
    killed_ventures: killed,
    mix_target: PORTFOLIO_MIX_TARGET,
    asset_recycle_pool: {
      scale_assets: (rs.scale_assets || []).length,
      kill_assets: (rs.kill_assets || []).length,
    },
    note: "Reallocate toward winners; zero budget to killed lines.",
  };

  const next_actions = [];
  const scaled = deployments.filter((d) => d.capital?.action === "scale");
  const killedD = deployments.filter((d) => d.capital?.action === "kill");
  const iter = deployments.filter((d) => d.capital?.action === "iterate");
  if (scaled.length) {
    next_actions.push(
      `Scale ${scaled.length} line(s): increase pilot cap, duplicate creative, narrow channel.`
    );
  }
  if (killedD.length) {
    next_actions.push(`Archive ${killedD.length} line(s); feed negatives into opportunity engine.`);
  }
  if (iter.length) {
    next_actions.push(`Iterate ${iter.length} line(s): A/B headline, single channel, tighten ICP.`);
  }
  next_actions.push("Run next cycle or enable autonomous loop when access allows.");
  if (!deployments.length) {
    next_actions.length = 0;
    next_actions.push("Seed market scan or widen inputs; no ventures deployed this cycle.");
  }

  return {
    top_opportunities,
    ventures_deployed,
    stripe_setup,
    validation_metrics,
    kill_scale_decisions,
    portfolio_overview,
    next_actions,
    system_modes_hint: {
      idea: "No live ventures → detect and deploy top opportunities.",
      portfolio: "Live ventures exist → monitor, kill/scale, reallocate.",
      clinic: "POST /api/v1/portfolio-execution/clinic-report",
      stripe: "Connect Stripe + webhooks; first sale → scale allocation bias.",
    },
  };
}

module.exports = { buildMasterExecutionBriefing, PORTFOLIO_MIX_TARGET };
