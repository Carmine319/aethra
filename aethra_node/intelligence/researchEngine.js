"use strict";

const { getPortfolioStats } = require("../portfolio/portfolioEngine");
const { getPerformanceSummary } = require("../memory/learningEngine");

const MAX_OPS = 3;

/**
 * Scheduled intelligence cycle — rule-scored opportunities from ledger + context.
 * Does not scrape the open web; avoids noise and infinite scanning.
 */
function runResearchCycle(context = {}) {
  const portfolio = getPortfolioStats();
  const { aggregates } = getPerformanceSummary();
  const productHint = String(context.product_line || context.target_customer || "").slice(0, 120);
  const crmHealth = context.crm_health || "unknown";

  const opportunities = [];

  const op1 = {
    title: "Tighten first-touch offer around one KPI",
    basis: productHint || "current execution focus",
    urgency: portfolio.net_profit <= 0 ? "high" : "medium",
    confidence: 0.62,
    score: 72,
    monetisation_link: "Faster path to paid pilot when price and cap are explicit in message one.",
  };
  opportunities.push(op1);

  if ((aggregates.total_emails || 0) > 8 && (portfolio.total_revenue || 0) < 1) {
    opportunities.push({
      title: "Pause volume — rewrite ICP keyword layer",
      basis: "High outreach count with flat ledger revenue",
      urgency: "high",
      confidence: 0.58,
      score: 76,
      monetisation_link: "Reduce waste spend; narrow niche before more sends.",
    });
  } else {
    opportunities.push({
      title: "Deepen follow-up on warm CRM stages",
      basis: crmHealth !== "cold" ? `CRM health: ${crmHealth}` : "Pipeline has depth",
      urgency: "medium",
      confidence: 0.55,
      score: 68,
      monetisation_link: "Convert replied/negotiation rows before sourcing new leads.",
    });
  }

  if ((portfolio.reinvest_pool || 0) > 5) {
    opportunities.push({
      title: "Allocate reinvest pool to one validated venture only",
      basis: `Reinvest pool £${portfolio.reinvest_pool}`,
      urgency: "low",
      confidence: 0.52,
      score: 64,
      monetisation_link: "Compound only where ROI is already observed in ledger.",
    });
  } else {
    opportunities.push({
      title: "Introduce entry SKU below core offer",
      basis: "Net profit guardrail",
      urgency: portfolio.net_profit <= 0 ? "high" : "low",
      confidence: 0.54,
      score: 66,
      monetisation_link: "Price-sensitive demand — lower entry, same written scope discipline.",
    });
  }

  opportunities.sort((a, b) => b.score - a.score);
  const top = opportunities.slice(0, MAX_OPS);

  return {
    cycle_at: Date.now(),
    top_opportunities: top,
    summary: top.map((o) => ({
      title: o.title,
      confidence: o.confidence,
      urgency: o.urgency,
      score: o.score,
    })),
    note: "Rule-scored cycle from portfolio + learning aggregates — attach real market feeds when you wire data providers.",
  };
}

module.exports = { runResearchCycle };
