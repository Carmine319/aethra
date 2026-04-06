"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "learning_performance.json");

const MAX_MICRO = 80;
const MAX_STRATEGIC = 35;
const MAX_MARKET = 25;
const MAX_CAPITAL = 35;
const MAX_PORTFOLIO_BRAIN = 60;

function defaultCms() {
  return {
    micro_memory: [],
    strategic_memory: [],
    market_memory: [],
    capital_memory: [],
  };
}

function readState() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
    const cms = defaultCms();
    if (Array.isArray(j.micro_memory)) cms.micro_memory = j.micro_memory;
    if (Array.isArray(j.strategic_memory)) cms.strategic_memory = j.strategic_memory;
    if (Array.isArray(j.market_memory)) cms.market_memory = j.market_memory;
    if (Array.isArray(j.capital_memory)) cms.capital_memory = j.capital_memory;
    return {
      cycles: Array.isArray(j.cycles) ? j.cycles : [],
      aggregates: j.aggregates && typeof j.aggregates === "object" ? j.aggregates : {},
      payments: Array.isArray(j.payments) ? j.payments : [],
      portfolio_brain_memory: Array.isArray(j.portfolio_brain_memory) ? j.portfolio_brain_memory : [],
      ...cms,
    };
  } catch {
    return { cycles: [], aggregates: {}, payments: [], portfolio_brain_memory: [], ...defaultCms() };
  }
}

function writeState(s) {
  const out = {
    cycles: s.cycles,
    aggregates: s.aggregates,
    payments: Array.isArray(s.payments) ? s.payments : [],
    portfolio_brain_memory: Array.isArray(s.portfolio_brain_memory) ? s.portfolio_brain_memory : [],
    micro_memory: Array.isArray(s.micro_memory) ? s.micro_memory : [],
    strategic_memory: Array.isArray(s.strategic_memory) ? s.strategic_memory : [],
    market_memory: Array.isArray(s.market_memory) ? s.market_memory : [],
    capital_memory: Array.isArray(s.capital_memory) ? s.capital_memory : [],
  };
  try {
    fs.writeFileSync(FILE, JSON.stringify(out, null, 2), "utf8");
  } catch {
    /* keep running if learning file is not writable */
  }
}

function interpretOutcome(action, result) {
  const type = String(action.type || "").toLowerCase();
  const outcome = String(result.outcome || result.reply_category || result.mode || "").toLowerCase();

  if (type.includes("outreach") || type.includes("email")) {
    if (outcome === "live" || outcome === "simulated") {
      return {
        money_relevant: true,
        lesson:
          outcome === "live"
            ? "Live send logged — track reply-to-meeting conversion before scaling list size."
            : "Simulated send — wire Resend for real reply signal; do not scale on mock IDs alone.",
      };
    }
  }

  if (type.includes("reply") || type.includes("simulated_reply")) {
    if (outcome === "interested") {
      return {
        money_relevant: true,
        lesson: "Positive reply signal — anchor next message on calendar slot + written pilot cap.",
      };
    }
    if (outcome === "objection") {
      return {
        money_relevant: true,
        lesson: "Objection-class reply — use capped pilot and single KPI to derisk price pushback.",
      };
    }
    if (outcome === "follow_up") {
      return {
        money_relevant: true,
        lesson: "Information-seeking — answer with one price band and one scope boundary, not a deck.",
      };
    }
    if (outcome === "ignore") {
      return { money_relevant: false, lesson: "No economic signal — do not store as pattern." };
    }
  }

  if (type.includes("close") && Number(result.revenue_gbp) > 0) {
    return {
      money_relevant: true,
      lesson: "Revenue event logged — protect margin on the next quote in the same niche.",
    };
  }

  return null;
}

function updateStrategicMemory(st, lesson) {
  const key = String(lesson || "")
    .slice(0, 90)
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!key) return;
  const existing = st.strategic_memory.find(
    (x) => String(x.pattern || "").toLowerCase().slice(0, 40) === key.slice(0, 40)
  );
  if (existing) {
    existing.hits = (existing.hits || 0) + 1;
    existing.confidence = Math.min(0.92, 0.45 + (existing.hits || 1) * 0.04);
    existing.last_ts = Date.now();
  } else {
    st.strategic_memory.unshift({
      pattern: String(lesson).slice(0, 160),
      confidence: 0.5,
      hits: 1,
      last_ts: Date.now(),
    });
  }
  while (st.strategic_memory.length > MAX_STRATEGIC) st.strategic_memory.pop();
}

function maybeMarketMemory(st, action, result) {
  const blob = `${action.context_niche || ""} ${result.outcome || ""}`.toLowerCase();
  if (!/\bprice|inflation|budget|tight|cost\b/.test(blob)) return;
  st.market_memory.unshift({
    ts: Date.now(),
    signal: "Price or cost pressure language in context",
    effect: "More price-sensitive evaluation in this niche",
    adjustment: "Lower entry offer or shorter pilot with written cap",
  });
  while (st.market_memory.length > MAX_MARKET) st.market_memory.pop();
}

/**
 * Compounding Memory System (CMS) — store only money-relevant tactical lessons.
 * action: { type, context_niche? }
 * result: { outcome?, mode?, revenue_gbp?, ... }
 */
function learn(action, result) {
  const interpretation = interpretOutcome(action, result || {});
  if (!interpretation || !interpretation.money_relevant) {
    return { stored: false, reason: "not_money_relevant" };
  }

  const st = readState();
  const microRow = {
    ts: Date.now(),
    action: String(action.type || "action").slice(0, 80),
    result: String(result.outcome || result.mode || result.status || "").slice(0, 120),
    context: String(action.context_niche || "").slice(0, 120),
    lesson: interpretation.lesson.slice(0, 240),
  };
  st.micro_memory.unshift(microRow);
  while (st.micro_memory.length > MAX_MICRO) st.micro_memory.pop();

  updateStrategicMemory(st, interpretation.lesson);
  maybeMarketMemory(st, action, result || {});

  writeState(st);
  return { stored: true, micro: microRow, strategic_hint: interpretation.lesson };
}

function learnCapitalFromVenture(ventureName, budget, revenue) {
  const b = Number(budget) || 0;
  const r = Number(revenue) || 0;
  if (r <= 0 || !ventureName) return null;
  const roi = b > 0 ? r / b : 0;
  const st = readState();
  const lesson =
    roi >= 1
      ? "Revenue at or above allocation benchmark — reinvest only after margin check."
      : "Early revenue below allocation multiple — hold price discipline on next contract.";
  st.capital_memory.unshift({
    ts: Date.now(),
    venture: String(ventureName).slice(0, 48),
    ROI: Math.round(roi * 1000) / 1000,
    lesson,
  });
  while (st.capital_memory.length > MAX_CAPITAL) st.capital_memory.pop();
  writeState(st);
  return st.capital_memory[0];
}

function getCMSSnapshot() {
  const st = readState();
  return {
    micro_recent: (st.micro_memory || []).slice(0, 6),
    strategic_memory: (st.strategic_memory || []).slice(0, 10),
    market_memory: (st.market_memory || []).slice(0, 6),
    capital_memory: (st.capital_memory || []).slice(0, 6),
    counts: {
      micro: (st.micro_memory || []).length,
      strategic: (st.strategic_memory || []).length,
      market: (st.market_memory || []).length,
      capital: (st.capital_memory || []).length,
    },
  };
}

/** Append-only payment ledger (never removes cycle history). */
function recordPaymentEvent(row) {
  const st = readState();
  if (!Array.isArray(st.payments)) st.payments = [];
  st.payments.unshift({
    ts: Date.now(),
    amount_gbp: Number(row.amount_gbp) || 0,
    customer: String(row.customer || "").slice(0, 200),
    venture_id: row.venture_id || null,
    source: String(row.source || "unknown"),
    stripe_session_id: row.stripe_session_id || null,
    product_type: String(row.product_type || "service_booking"),
    campaign_id: row.campaign_id || null,
    test_group: row.test_group || null,
    price_tier: row.price_tier || null,
  });
  while (st.payments.length > 200) st.payments.pop();
  const agg = st.aggregates;
  agg.total_stripe_gbp = Math.round(((agg.total_stripe_gbp || 0) + Number(row.amount_gbp || 0)) * 100) / 100;
  agg.payment_events = (agg.payment_events || 0) + 1;
  writeState(st);
  return st.payments[0];
}

function listPaymentEvents(limit = 20) {
  const st = readState();
  return (st.payments || []).slice(0, limit);
}

/** Append-only portfolio orchestration history — new rows only; trim length, never rewrite prior entries. */
function recordPortfolioBrainSnapshot(row) {
  const st = readState();
  if (!Array.isArray(st.portfolio_brain_memory)) st.portfolio_brain_memory = [];
  const safe = row && typeof row === "object" ? { ...row } : { note: "empty" };
  safe.recorded_at = Date.now();
  st.portfolio_brain_memory.unshift(safe);
  while (st.portfolio_brain_memory.length > MAX_PORTFOLIO_BRAIN) st.portfolio_brain_memory.pop();
  writeState(st);
  return st.portfolio_brain_memory[0];
}

function listPortfolioBrainMemory(limit = 20) {
  const st = readState();
  return (st.portfolio_brain_memory || []).slice(0, limit);
}

function recordCycle(entry) {
  const st = readState();
  const row = {
    ts: Date.now(),
    leads: Number(entry.leads) || 0,
    suppliers_found: Number(entry.suppliers_found) || 0,
    emails_sent: Number(entry.emails_sent) || 0,
    emails_simulated: Number(entry.emails_simulated) || 0,
    replies_classified: Number(entry.replies_classified) || 0,
    simulated_closes: Number(entry.simulated_closes) || 0,
    revenue_delta_gbp: Number(entry.revenue_delta_gbp) || 0,
    wallet_after: entry.wallet_after,
  };
  st.cycles.unshift(row);
  while (st.cycles.length > 120) st.cycles.pop();

  const agg = st.aggregates;
  agg.total_runs = (agg.total_runs || 0) + 1;
  agg.total_emails = (agg.total_emails || 0) + row.emails_sent + row.emails_simulated;
  agg.total_leads = (agg.total_leads || 0) + row.leads;
  agg.total_simulated_revenue_gbp = Math.round(((agg.total_simulated_revenue_gbp || 0) + row.revenue_delta_gbp) * 100) / 100;

  writeState(st);
  return row;
}

function getPerformanceSummary() {
  const st = readState();
  const agg = st.aggregates || {};
  const recent = st.cycles.slice(0, 5);
  const lines = [];
  if (!recent.length) {
    lines.push("Performance ledger empty — this run seeds learning signals.");
  } else {
    const last = recent[0];
    lines.push(
      `Last cycle: ${last.leads} leads, ${last.suppliers_found} supplier rows, ${last.emails_sent + last.emails_simulated} outreach events (${last.emails_simulated} simulated), ${last.simulated_closes} simulated closes, £${last.revenue_delta_gbp} wallet delta.`
    );
    if (agg.total_runs > 3) {
      const avgLeads = (agg.total_leads / agg.total_runs).toFixed(1);
      lines.push(`Rolling average leads per run: ${avgLeads}. Total simulated revenue logged: £${agg.total_simulated_revenue_gbp || 0}.`);
    }
  }
  const strat = (st.strategic_memory || [])[0];
  if (strat && strat.pattern) {
    lines.push(`CMS pattern: ${strat.pattern.slice(0, 100)}${strat.pattern.length > 100 ? "…" : ""}`);
  }
  return { lines, aggregates: agg, recent };
}

function getLearningSignals() {
  const { lines, aggregates } = getPerformanceSummary();
  const tips = [...lines];
  if ((aggregates.total_emails || 0) > 10 && (aggregates.total_simulated_revenue_gbp || 0) < 5) {
    tips.push("Learning: high outreach volume with flat revenue — tighten ICP or raise offer clarity before more sends.");
  }
  return tips;
}

module.exports = {
  learn,
  learnCapitalFromVenture,
  getCMSSnapshot,
  recordCycle,
  recordPaymentEvent,
  listPaymentEvents,
  recordPortfolioBrainSnapshot,
  listPortfolioBrainMemory,
  getPerformanceSummary,
  getLearningSignals,
  LEARNING_FILE: FILE,
};
