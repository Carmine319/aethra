/**
 * AETHRA — node server.js
 * Python stdio core + operator / venture / CRM enrichment.
 */

"use strict";

const { spawnSync } = require("child_process");
const path = require("path");
const express = require("express");
const { enrichWithOperator } = require("./aethra_node/core/enrichRun.js");
const {
  operatorActivitySummary,
  crmSnapshotSummary,
  venturesSummary,
  walletSummary,
  portfolioDashboardSummary,
  synergySummary,
  ideasSummary,
  viralSummary,
  economicSystemSummary,
} = require("./aethra_node/ui/render.js");
const { normalizePlan } = require("./aethra_node/saas/billingEngine.js");
const { assertFreeAnalysisAllowed } = require("./aethra_node/saas/runLimiter.js");

const ROOT = path.resolve(__dirname);
const PORT = parseInt(process.env.AETHRA_EXPRESS_PORT || process.env.PORT || "3000", 10);

let _pythonRunner = null;

function findPythonRunner() {
  if (_pythonRunner !== null) return _pythonRunner;
  const trials = [
    { cmd: "python", prefix: [] },
    { cmd: "py", prefix: ["-3"] },
    { cmd: "python3", prefix: [] },
  ];
  for (const { cmd, prefix } of trials) {
    const r = spawnSync(cmd, [...prefix, "-m", "aethra", "schema"], {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 60000,
    });
    if (r.status !== 0) continue;
    let out = (r.stdout || "").trim();
    if (out.charCodeAt(0) === 0xfeff) out = out.slice(1);
    if (!out) continue;
    try {
      JSON.parse(out);
      _pythonRunner = { cmd, prefix };
      return _pythonRunner;
    } catch {
      continue;
    }
  }
  _pythonRunner = false;
  return null;
}

function runAethraStdio(payload) {
  const py = findPythonRunner();
  if (!py) {
    const err = new Error(
      "Python + aethra not found. From project root run: pip install -e ."
    );
    err.code = "NO_PYTHON";
    throw err;
  }
  const r = spawnSync(py.cmd, [...py.prefix, "-m", "aethra", "stdio"], {
    cwd: ROOT,
    input: JSON.stringify(payload || {}),
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 120000,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const msg = (r.stderr || r.stdout || "aethra stdio failed").trim();
    const e = new Error(msg);
    e.code = "AETHRA_EXIT";
    e.status = r.status;
    throw e;
  }
  let out = (r.stdout || "").trim();
  if (out.charCodeAt(0) === 0xfeff) out = out.slice(1);
  return JSON.parse(out);
}

const stripeApi = require("./aethra_node/payments/stripe.js");
const stripeConnector = require("./aethra-core/revenue/stripe.connector.js");
const { listRecent } = require("./aethra_node/payments/invoice.js");
const { listPaymentEvents } = require("./aethra_node/memory/learningEngine.js");
const { getOnboardingDefinition } = require("./aethra_node/onboarding/onboarding.js");
const { assessProfitSurface } = require("./aethra_node/core/profitEnforcement.js");

const app = express();

app.use(
  "/portfolio-artifacts",
  express.static(path.join(ROOT, "aethra_node", "portfolioExecution", "artifacts"))
);

app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json", limit: "2mb" }),
  (req, res) => {
    const raw = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body || "");
    const sig = req.headers["stripe-signature"] || "";
    const result = stripeApi.handleWebhook(raw, sig);
    res.status(result.received !== false ? 200 : 400).json(result);
  }
);

app.use(express.json({ limit: "2mb" }));

if (process.env.CORE_ENABLED === "true") {
  try {
    const { initCore } = require("./aethra-core/index.js");
    const { createCoreRouter } = require("./aethra-core/api/routes.js");
    initCore({
      interval_ms: Number(process.env.CORE_INTERVAL_MS || 86400000),
      concurrency: Number(process.env.CORE_CONCURRENCY || 1),
    });
    app.use(createCoreRouter());
  } catch {
    /* Core overlay remains optional */
  }
}

function runAethraStdioMaybeRetry(payload) {
  let out = runAethraStdio(payload);
  if (process.env.AETHRA_PROFIT_RETRY !== "1") return out;
  const a = assessProfitSurface(out);
  if (a.satisfied) return out;
  try {
    out = runAethraStdio({
      ...payload,
      context: {
        ...(payload.context && typeof payload.context === "object" ? payload.context : {}),
        profit_refinement: `Regenerate with explicit ${a.missing.join(", ")} — GBP pricing, channel, offer.`,
      },
    });
  } catch {
    /* keep first */
  }
  return out;
}

app.get("/api/v1/invoices", (_req, res) => {
  res.status(200).json({
    invoices: listRecent(80),
    payment_events: listPaymentEvents(80),
  });
});

app.get("/api/v1/onboarding", (_req, res) => {
  res.status(200).json(getOnboardingDefinition());
});

app.get("/api/v1/saas/plans", (_req, res) => {
  const { listPlansForOnboarding, PLANS } = require("./aethra_node/saas/billingEngine.js");
  res.status(200).json({ ok: true, plans: listPlansForOnboarding(), plan_catalog: PLANS });
});

function sendPublicReport(req, res) {
  const id = String((req.query && req.query.id) || "").trim();
  if (!id) {
    res.status(400).json({ ok: false, error: "missing_id" });
    return;
  }
  const { getPublicReport } = require("./aethra_node/growth/viralEngine.js");
  const report = getPublicReport(id);
  if (!report) {
    res.status(404).json({ ok: false, error: "not_found" });
    return;
  }
  res.status(200).json({ ok: true, report, notice: "Anonymised outcomes only — no personal data." });
}

app.get("/api/v1/public-report", sendPublicReport);
app.get("/api/v1/public/report", sendPublicReport);

app.get("/api/v1/ideas", (req, res) => {
  const text = String((req.query && req.query.text) || "").trim();
  const { generateIdeas } = require("./aethra_node/idea/ideaGenerator.js");
  res.status(200).json({ ok: true, ideas: generateIdeas({ text }) });
});

const portfolioExecution = require("./aethra_node/portfolioExecution/index.js");
const { getOrganismSnapshot } = require("./core/organismApi.js");
const { executeCycle } = require("./core/cycle/executeCycle.js");
const { startOrganismAutonomousLoop } = require("./core/cycle/scheduler.js");

app.get("/api/v1/organism/snapshot", (_req, res) => {
  try {
    res.status(200).json(getOrganismSnapshot());
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.get("/api/v1/organism/mode", (_req, res) => {
  try {
    const snap = getOrganismSnapshot();
    res.status(200).json({
      ok: true,
      autonomous_enabled: snap.portfolio.autonomous_enabled,
      mode: snap.mode,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/v1/organism/mode", (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const gate = portfolioExecution.checkAccess(String(b.user_id || "anonymous"), "autonomous_cycle");
  if (!gate.allowed) {
    res.status(403).json({ ok: false, error: "access_denied", gate });
    return;
  }
  try {
    const s = portfolioExecution.loadState();
    s.autonomous_enabled = !!b.enabled;
    portfolioExecution.saveBusinesses(s);
    res.status(200).json({ ok: true, autonomous_enabled: s.autonomous_enabled });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/v1/organism/cycle", async (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const userId = String(b.user_id || b.userId || "anonymous").trim();
  const gate = portfolioExecution.checkAccess(userId, "portfolio_execution");
  if (!gate.allowed) {
    res.status(403).json({ ok: false, error: "access_denied", gate });
    return;
  }
  try {
    const out = await executeCycle({
      seedText: b.seed_text || b.seedText,
      baseUrl: b.base_url || b.baseUrl || "",
      user_id: userId,
      deploy_limit: b.deploy_limit ?? b.deployLimit,
      mode: String(b.mode || "assisted").toLowerCase() === "autonomous" ? "autonomous" : "assisted",
      autonomous_enabled: b.autonomous_enabled,
      campaign_id: b.campaign_id ?? b.campaignId,
      test_group: b.test_group ?? b.testGroup,
      skip_access_check: false,
    });
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.get("/api/v1/portfolio-execution/status", (req, res) => {
  const s = portfolioExecution.loadState();
  const userId = String((req.query && req.query.user_id) || "anonymous").trim();
  let organism = null;
  try {
    organism = getOrganismSnapshot();
  } catch {
    organism = null;
  }
  res.status(200).json({
    ok: true,
    capital_available_gbp: s.capital_available_gbp,
    revenue_today_gbp: s.revenue_today_gbp,
    autonomous_enabled: !!s.autonomous_enabled,
    last_cycle_ts: s.last_cycle_ts,
    active_businesses: s.businesses.filter((b) => b.status === "live").length,
    businesses: s.businesses.slice(0, 40),
    feed: s.feed.slice(0, 60),
    rev_share: s.rev_share.slice(0, 20),
    access: portfolioExecution.checkAccess(userId, "portfolio_execution"),
    organism,
  });
});

app.get("/api/v1/portfolio-execution/infra", (_req, res) => {
  res.status(200).json({ ok: true, ...portfolioExecution.getSubscriptionTiers() });
});

app.get("/api/v1/portfolio-execution/recycle-stats", (req, res) => {
  const userId = String((req.query && req.query.user_id) || "anonymous").trim();
  const gate = portfolioExecution.checkAccess(userId, "portfolio_execution");
  if (!gate.allowed) {
    res.status(403).json({ ok: false, error: "access_denied", gate });
    return;
  }
  const limit = req.query && req.query.limit != null ? Number(req.query.limit) : undefined;
  res.status(200).json({
    ok: true,
    ...portfolioExecution.getRecycleStatsForApi({ limit }),
  });
});

app.post("/api/v1/portfolio-execution/cycle", async (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const userId = String(b.user_id || b.userId || "anonymous").trim();
  const gate = portfolioExecution.checkAccess(userId, "portfolio_execution");
  if (!gate.allowed) {
    res.status(403).json({ ok: false, error: "access_denied", gate });
    return;
  }
  try {
    const useOrganism = !!(b.use_organism_loop ?? b.organism);
    const out = useOrganism
      ? await executeCycle({
          seedText: b.seed_text || b.seedText,
          baseUrl: b.base_url || b.baseUrl || "",
          user_id: userId,
          deploy_limit: b.deploy_limit ?? b.deployLimit,
          mode: String(b.mode || "assisted").toLowerCase() === "autonomous" ? "autonomous" : "assisted",
          autonomous_enabled: b.autonomous_enabled,
          campaign_id: b.campaign_id ?? b.campaignId,
          test_group: b.test_group ?? b.testGroup,
          skip_access_check: false,
        })
      : await portfolioExecution.runAethraCycle({
          seedText: b.seed_text || b.seedText,
          baseUrl: b.base_url || b.baseUrl || "",
          user_id: userId,
          autonomous_enabled: !!b.autonomous_enabled,
          deploy_limit: b.deploy_limit ?? b.deployLimit,
          campaign_id: b.campaign_id ?? b.campaignId,
          test_group: b.test_group ?? b.testGroup,
        });
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/v1/portfolio-execution/deploy", async (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const userId = String(b.user_id || "anonymous").trim();
  portfolioExecution.trackUsage(userId, "deploy_opportunity");
  try {
    const out = await portfolioExecution.runAethraCycle({
      seedText: b.seed_text || "",
      baseUrl: b.base_url || "",
      user_id: userId,
      autonomous_enabled: !!b.autonomous,
      deploy_limit: b.deploy_limit ?? b.deployLimit,
      campaign_id: b.campaign_id ?? b.campaignId,
      test_group: b.test_group ?? b.testGroup,
    });
    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/v1/portfolio-execution/clinic-report", (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const userId = String(b.user_id || "anonymous").trim();
  portfolioExecution.trackUsage(userId, "clinic_report");
  const s = portfolioExecution.loadState();
  const bid = String(b.business_id || "").trim();
  const business = bid ? s.businesses.find((x) => x.id === bid) : s.businesses[0];
  const reports = portfolioExecution.generateReports(
    {
      business: business || {},
      performance: business?.metrics || {},
      opportunities: [],
      stage: "clinic",
    },
    { writeFiles: true }
  );
  portfolioExecution.pushFeed(
    s,
    `Clinic report generated${business ? ` for ${business.id}` : ""}.`,
    { type: "clinic" }
  );
  portfolioExecution.saveBusinesses(s);
  res.status(200).json({ ok: true, reports, business_id: business?.id || null });
});

app.post("/api/v1/portfolio-execution/scale", (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const userId = String(b.user_id || "anonymous").trim();
  portfolioExecution.trackUsage(userId, "scale_winner");
  const s = portfolioExecution.loadState();
  const bid = String(b.business_id || "").trim();
  const business = bid ? s.businesses.find((x) => x.id === bid) : s.businesses.find((x) => x.status === "live");
  if (!business) {
    res.status(404).json({ ok: false, error: "no_business" });
    return;
  }
  s.capital_available_gbp = Math.round((s.capital_available_gbp + 300) * 100) / 100;
  business.capital_decision = { action: "scale", note: "Manual scale from control panel.", budget_delta_gbp: 300 };
  portfolioExecution.pushFeed(s, `Manual scale: ${business.id}`, { type: "capital", action: "scale_manual" });
  portfolioExecution.saveBusinesses(s);
  res.status(200).json({
    ok: true,
    business_id: business.id,
    capital_available_gbp: s.capital_available_gbp,
  });
});

app.post("/api/v1/portfolio-execution/kill", (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const userId = String(b.user_id || "anonymous").trim();
  portfolioExecution.trackUsage(userId, "kill_project");
  const s = portfolioExecution.loadState();
  const bid = String(b.business_id || "").trim();
  const idx = bid ? s.businesses.findIndex((x) => x.id === bid) : 0;
  if (idx < 0 || !s.businesses[idx]) {
    res.status(404).json({ ok: false, error: "not_found" });
    return;
  }
  s.businesses[idx].status = "killed";
  portfolioExecution.pushFeed(s, `Killed project: ${s.businesses[idx].id}`, { type: "capital", action: "kill_manual" });
  portfolioExecution.saveBusinesses(s);
  res.status(200).json({ ok: true, business_id: s.businesses[idx].id });
});

app.post("/api/v1/portfolio-execution/rev-share", (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const out = portfolioExecution.enableRevShare({
    user_id: b.user_id,
    business_id: b.business_id,
    revenue_gbp: b.revenue_gbp,
    pct: b.pct,
  });
  res.status(out.ok ? 200 : 400).json(out);
});

app.post("/api/v1/portfolio-execution/autonomous", (req, res) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  const s = portfolioExecution.loadState();
  const gate = portfolioExecution.checkAccess(String(b.user_id || "anonymous"), "autonomous_cycle");
  if (!gate.allowed) {
    res.status(403).json({ ok: false, error: "access_denied", gate });
    return;
  }
  s.autonomous_enabled = !!b.enabled;
  portfolioExecution.saveBusinesses(s);
  res.status(200).json({ ok: true, autonomous_enabled: s.autonomous_enabled });
});

app.get("/api/v1/wallet/capital-snapshot", (req, res) => {
  const userId = String((req.query && req.query.user_id) || "anonymous").trim();
  const { getCapitalSnapshot } = require("./aethra_node/wallet/capitalSnapshot.js");
  res.status(200).json({ ok: true, ...getCapitalSnapshot(userId) });
});

app.post("/api/v1/billing/top-up-session", async (req, res) => {
  const b = req.body || {};
  const userId = String(b.user_id || b.userId || "anonymous").slice(0, 120);
  const amountGbp = Number(b.amount_gbp) || 50;
  const { createTopUpSession } = require("./aethra_node/billing/addFunds.js");
  const session = await createTopUpSession(userId, amountGbp);
  res.status(session.ok !== false ? 200 : 400).json({ ok: session.ok !== false, ...session });
});

app.get("/api/v1/billing/user-plan", (req, res) => {
  const userId = String((req.query && req.query.user_id) || "anonymous").trim();
  const { getUserPlan } = require("./aethra_node/billing/planStore.js");
  res.status(200).json({ ok: true, user_id: userId, plan: getUserPlan(userId) });
});

app.post("/api/v1/billing/create-subscription-session", async (req, res) => {
  const b = req.body || {};
  const userId = String(b.user_id || b.userId || "anonymous").slice(0, 120);
  const planKey = String(b.plan || b.plan_key || b.tier || "").toLowerCase() || "operator";

  const priceId = planKey === "portfolio" ? process.env.PRICE_PORTFOLIO : process.env.PRICE_OPERATOR;
  if (!priceId) {
    res.status(400).json({ ok: false, error: "missing_PRICE_PORTFOLIO/PRICE_OPERATOR env var for live checkout." });
    return;
  }
  const { createSubscriptionSession } = require("./aethra_node/billing/subscriptionEngine.js");
  const session = await createSubscriptionSession(userId, priceId, planKey);
  res.status(session.ok !== false ? 200 : 400).json({ ok: session.ok !== false, ...session });
});

app.post("/api/v1/billing/create-deal-checkout-session", async (req, res) => {
  const b = req.body || {};
  const userId = String(b.user_id || b.userId || "anonymous").slice(0, 120);
  const amountGbp = Number(b.amount_gbp || b.amount_gbp_gbp || b.amount || 0);
  if (!Number.isFinite(amountGbp) || amountGbp <= 0) {
    res.status(400).json({ ok: false, error: "amount_gbp must be a positive number." });
    return;
  }
  const { createDealCheckout } = require("./aethra_node/billing/checkoutEngine.js");
  const session = await createDealCheckout(userId, amountGbp);
  res.status(session.ok !== false ? 200 : 400).json({ ok: session.ok !== false, ...session });
});

app.get("/api/v1/conversion/metrics", (_req, res) => {
  const crm = require("./aethra_node/crm/crm.js");
  const { computeMetrics, formatOverview } = require("./aethra_node/conversion/conversionDashboard.js");
  const metrics = computeMetrics(crm.getPipeline());
  res.status(200).json({ ok: true, metrics, overview_text: formatOverview(metrics) });
});

app.get("/api/v1/optimisation/insights", (_req, res) => {
  const crm = require("./aethra_node/crm/crm.js");
  const { runOptimisation } = require("./aethra_node/optimisation/optimisationLoop.js");
  res.status(200).json({ ok: true, ...runOptimisation(crm.getPipeline()) });
});

app.get("/api/v1/scaling/brain", (_req, res) => {
  const { runLiveScalingBrain } = require("./aethra_node/scalingBrain/scalingLoop.js");
  res.status(200).json({ ok: true, ...runLiveScalingBrain() });
});

app.get("/api/v1/portfolio/brain", (_req, res) => {
  const { runLivePortfolioBrain } = require("./aethra_node/portfolio/portfolioBrain.js");
  res.status(200).json({ ok: true, ...runLivePortfolioBrain() });
});

app.post("/api/v1/portfolio/brain", (req, res) => {
  const { runPortfolioBrain, runLivePortfolioBrain } = require("./aethra_node/portfolio/portfolioBrain.js");
  const b = req.body || {};
  const recordMemory = !!(b.record || b.record_memory);
  if (Array.isArray(b.ventures) && b.capital != null) {
    const cap = Number(b.capital);
    const c = Number.isFinite(cap) && cap >= 0 ? cap : 0;
    res.status(200).json({ ok: true, ...runPortfolioBrain(b.ventures, c) });
    return;
  }
  res.status(200).json({ ok: true, ...runLivePortfolioBrain({ recordMemory }) });
});

app.post("/api/v1/scaling/run", (req, res) => {
  const { runScalingBrain } = require("./aethra_node/scalingBrain/scalingLoop.js");
  const { executeScaling } = require("./aethra_node/scalingBrain/actionEngine.js");
  const b = req.body || {};
  const portfolio = Array.isArray(b.portfolio) ? b.portfolio : [];
  const budget = Number(b.budget);
  const pool = Number.isFinite(budget) && budget >= 0 ? budget : 0;
  const brain = runScalingBrain(portfolio, pool);
  res.status(200).json({ ok: true, ...brain, actions: executeScaling(brain.decisions) });
});

app.post("/api/v1/optimisation/run", (req, res) => {
  const crm = require("./aethra_node/crm/crm.js");
  const { runOptimisation } = require("./aethra_node/optimisation/optimisationLoop.js");
  const b = req.body || {};
  const deals = Array.isArray(b.deals) ? b.deals : crm.getPipeline();
  res.status(200).json({ ok: true, ...runOptimisation(deals, { seed_message: b.seed_message }) });
});

app.post("/api/v1/conversion/metrics", (req, res) => {
  const crm = require("./aethra_node/crm/crm.js");
  const { computeMetrics, formatOverview } = require("./aethra_node/conversion/conversionDashboard.js");
  const b = req.body || {};
  const deals = Array.isArray(b.deals) ? b.deals : crm.getPipeline();
  const hints = { best_channel: b.best_channel, best_message: b.best_message };
  const metrics = computeMetrics(deals, hints);
  res.status(200).json({ ok: true, metrics, overview_text: formatOverview(metrics) });
});

app.post("/api/v1/conversion/call-script", (req, res) => {
  const { generateCallScript, getDiagnosticCloseLine } = require("./aethra_node/conversion/callEngine.js");
  const b = req.body || {};
  const scriptCtx = b.context && typeof b.context === "object" ? b.context : {};
  res.status(200).json({
    ok: true,
    script: generateCallScript(scriptCtx),
    diagnostic_close_line: getDiagnosticCloseLine(),
  });
});

app.post("/api/v1/create-checkout-session", async (req, res) => {
  try {
    const session = await stripeApi.createCheckoutSession(req.body || {});
    res.status(200).json(session);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const productName = String(b.product_name || "").trim();
    const price = Number(b.price);
    const email = String(b.email || "").trim();
    if (!productName) {
      res.status(400).json({ ok: false, error: "missing_product_name" });
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      res.status(400).json({ ok: false, error: "invalid_price" });
      return;
    }
    const session = await stripeConnector.createCheckout({
      product_name: productName,
      price,
      email,
      product_type: String(b.product_type || "service_booking"),
      venture_id: b.venture_id ? String(b.venture_id) : "",
    });
    res.status(session && session.ok === false ? 400 : 200).json({
      ok: session && session.ok !== false,
      checkout_url: session && session.url ? session.url : null,
      ...session,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/v1/record-payment", (req, res) => {
  const rec = stripeApi.recordPayment(req.body || {});
  res.status(rec.ok ? 200 : 400).json(rec);
});

app.post("/api/v1/invoice", (req, res) => {
  const { generateInvoice } = require("./aethra_node/payments/invoice.js");
  const b = req.body || {};
  const inv = generateInvoice(b.client, b.service, b.price, b.status);
  res.status(200).json(inv);
});

app.post("/api/v1/reply/process", async (req, res) => {
  try {
    const message = String((req.body && req.body.message) || "").trim();
    if (!message) {
      res.status(400).json({ ok: false, error: "missing_message" });
      return;
    }
    const { processReply } = require("./aethra_node/reply/replyEngine.js");
    const deal = req.body.deal && typeof req.body.deal === "object" ? req.body.deal : {};
    const context = req.body.context && typeof req.body.context === "object" ? req.body.context : {};
    const out = await processReply(message, deal, context);
    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ ok: false, error: "reply_process_failed", message: String(e.message || e) });
  }
});

app.post("/api/v1/execution/start", async (req, res) => {
  try {
    const { runExecutionMode } = require("./aethra_node/execution/executionEngine.js");
    const result = await runExecutionMode(req.body || {});
    res.status(200).json(result);
  } catch (e) {
    if (e.code === "UPGRADE_REQUIRED") {
      res.status(403).json({
        ok: false,
        error: "upgrade_required",
        message: String(e.message || e),
        required_plan: "operator",
      });
      return;
    }
    const code = e.code === "MISSING_IDEA" ? 400 : 500;
    res.status(code).json({
      ok: false,
      error: "execution_failed",
      message: String(e.message || e),
    });
  }
});

app.post("/run", async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const input = body.input;
  if (typeof input !== "string" || !input.trim()) {
    res.status(400).json({
      ok: false,
      error: "missing_or_invalid_input",
      detail: 'Expected JSON body: { "input": "…" }',
    });
    return;
  }
  try {
    const raw = input.trim();
    const ctx = body.context && typeof body.context === "object" ? body.context : {};
    const { getUserPlan } = require("./aethra_node/billing/planStore.js");
    const uid = body.user_id || ctx.user_id;
    const enrichOpts = {
      plan: body.plan || ctx.plan || (uid ? getUserPlan(uid) : undefined) || process.env.AETHRA_PLAN,
      referrals: Number(body.referrals) || Number(ctx.referrals) || 0,
      user_id: body.user_id || ctx.user_id,
    };
    if (normalizePlan(enrichOpts.plan) === "free") {
      try {
        assertFreeAnalysisAllowed(enrichOpts.user_id || "anonymous", enrichOpts.referrals || 0);
      } catch (e) {
        if (e.code === "DAILY_LIMIT") {
          res.status(429).json({
            ok: false,
            error: "daily_limit",
            message: String(e.message || e),
            upgrade_plan: "operator",
          });
          return;
        }
      }
    }
    const isUrl = /^https?:\/\//i.test(raw);
    const payload = isUrl ? { cmd: "url", url: raw } : { cmd: "idea", text: raw };
    let result = runAethraStdioMaybeRetry(payload);
    result = await enrichWithOperator(result, raw, enrichOpts);
    result._ui_summaries = {
      operator_activity: operatorActivitySummary(result),
      crm_snapshot: crmSnapshotSummary(result),
      ventures: venturesSummary(result),
      wallet: walletSummary(result),
      portfolio_dashboard: portfolioDashboardSummary(result),
      synergy: synergySummary(result),
      ideas_snapshot: ideasSummary(result),
      viral: viralSummary(result),
      economic_system: economicSystemSummary(result),
    };
    res.status(200).json(result);
  } catch (e) {
    if (e.code === "NO_PYTHON") {
      res.status(503).json({ ok: false, error: "no_python", message: e.message });
      return;
    }
    if (e.code === "AETHRA_EXIT") {
      res.status(502).json({
        ok: false,
        error: "aethra_exit",
        message: e.message,
        status: e.status,
      });
      return;
    }
    res.status(500).json({
      ok: false,
      error: "internal",
      message: e.message || String(e),
    });
  }
});

app.listen(PORT, () => {
  const nextUi = process.env.AETHRA_NEXT_ORIGIN || "http://127.0.0.1:3000";
  try {
    startOrganismAutonomousLoop();
  } catch {
    /* non-fatal */
  }
  try {
    const { runDiagnostics } = require("./core/dist-cjs/diagnostics/index.js");
    runDiagnostics().catch(() => {});
  } catch {
    /* run `npm run build:core` if dist missing */
  }
  console.log(
    `AETHRA server.js on http://127.0.0.1:${PORT}\n` +
      `  Next.js UI: ${nextUi} (run: cd aethra-frontend && npm run dev)\n` +
      `  POST /run`
  );
});
