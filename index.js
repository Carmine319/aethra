/**
 * AETHRA Q+++ host
 * - Default (no args): HTTP API + static UI (web/)
 * - cli … : forward to Python CLI
 * Requires: pip install -e . and Python on PATH (python, py -3, or python3)
 */

const { spawnSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = path.resolve(__dirname);
const WEB_DIR = path.join(ROOT, "web");
const WEB_INDEX = path.join(WEB_DIR, "index.html");
const { runAethra } = require(path.join(ROOT, "aethra-core", "engine", "core.loop.js"));
const AETHRA_PORTFOLIO_FILE = path.join(ROOT, "aethra_memory", "portfolio.state.json");
const AETHRA_ACTIONS_FILE = path.join(ROOT, "aethra_memory", "aethra.actions.jsonl");

const { assessProfitSurface } = require(path.join(ROOT, "aethra_node", "core", "profitEnforcement.js"));

let enrichWithOperator = null;
let uiSummaries = null;
try {
  enrichWithOperator = require(path.join(ROOT, "aethra_node", "core", "enrichRun.js")).enrichWithOperator;
  uiSummaries = require(path.join(ROOT, "aethra_node", "ui", "render.js"));
} catch {
  enrichWithOperator = null;
  uiSummaries = null;
}

function attachUiSummaries(obj) {
  if (!uiSummaries || !obj || typeof obj !== "object") return obj;
  try {
    obj._ui_summaries = {
      operator_activity: uiSummaries.operatorActivitySummary(obj),
      crm_snapshot: uiSummaries.crmSnapshotSummary(obj),
      ventures: uiSummaries.venturesSummary(obj),
      wallet: uiSummaries.walletSummary(obj),
      portfolio_dashboard: uiSummaries.portfolioDashboardSummary(obj),
      synergy: uiSummaries.synergySummary(obj),
      ideas_snapshot: uiSummaries.ideasSummary ? uiSummaries.ideasSummary(obj) : "",
      viral: uiSummaries.viralSummary ? uiSummaries.viralSummary(obj) : "",
      economic_system: uiSummaries.economicSystemSummary ? uiSummaries.economicSystemSummary(obj) : "",
    };
  } catch {
    // omit summaries on failure
  }
  return obj;
}

function enrichOptsFromBody(body, ctx) {
  const b = body && typeof body === "object" ? body : {};
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const nested = b.context && typeof b.context === "object" ? b.context : {};
  let fallbackPlan;
  try {
    const { getUserPlan } = require(path.join(ROOT, "aethra_node", "billing", "planStore.js"));
    const uid = b.user_id || nested.user_id || c.user_id;
    fallbackPlan = uid ? getUserPlan(uid) : undefined;
  } catch {
    fallbackPlan = undefined;
  }
  return {
    plan: b.plan || c.plan || nested.plan || fallbackPlan || process.env.AETHRA_PLAN,
    referrals: Number(b.referrals) || Number(nested.referrals) || 0,
    user_id: b.user_id || nested.user_id || c.user_id,
  };
}

async function maybeEnrich(out, inputLabel, enrichOpts) {
  if (!enrichWithOperator || !out || typeof out !== "object") return out;
  try {
    const opts = enrichOpts && typeof enrichOpts === "object" ? enrichOpts : {};
    return await enrichWithOperator(out, String(inputLabel || ""), opts);
  } catch {
    return out;
  }
}

function checkFreeEnrichAllowance(body, ctx, res) {
  const ec = enrichOptsFromBody(body, ctx);
  try {
    const { normalizePlan } = require(path.join(ROOT, "aethra_node", "saas", "billingEngine.js"));
    const { assertFreeAnalysisAllowed } = require(path.join(ROOT, "aethra_node", "saas", "runLimiter.js"));
    if (normalizePlan(ec.plan) === "free") {
      assertFreeAnalysisAllowed(ec.user_id || "anonymous", Number(ec.referrals) || 0);
    }
  } catch (e) {
    if (e && e.code === "DAILY_LIMIT") {
      sendJson(res, 429, {
        ok: false,
        error: "daily_limit",
        message: String(e.message || e),
        upgrade_plan: "operator",
      });
      return false;
    }
  }
  return true;
}
const PORT = parseInt(process.env.PORT || process.env.AETHRA_PORT || "3847", 10);
const MAX_BODY = 2 * 1024 * 1024;
const AETHRA_LOOP_INTERVAL_MS = Math.max(30000, Number(process.env.AETHRA_CORE_INTERVAL_MS || 300000));
let _aethraLoopTimer = null;
let _lastAethraRun = null;

async function runAethraCycle(seed, source = "api", capital = null) {
  const startedAt = Date.now();
  const out = await runAethra({
    seed,
    continuous: true,
    capitalMode: capital != null,
    capital: capital != null ? Number(capital) : undefined,
  });
  _lastAethraRun = {
    ts: Date.now(),
    source,
    selectedIdea: out.selectedIdea || "",
    executionStatus: out.executionStatus || "unknown",
    profitGenerated: Number(out.profitGenerated || 0),
    roi: Number(out.roi || 0),
    elapsedMs: Date.now() - startedAt,
    raw: out,
  };
  return _lastAethraRun;
}

function ensureAethraContinuousLoop() {
  if (_aethraLoopTimer) return;
  const tick = async () => {
    try {
      const defaultCapital = Number(process.env.AETHRA_INITIAL_CAPITAL || 300);
      await runAethraCycle("continuous runtime opportunity scan", "scheduler", defaultCapital);
    } catch {
      // keep server alive if cycle fails
    }
  };
  if (process.env.AETHRA_CORE_AUTORUN !== "0") tick();
  _aethraLoopTimer = setInterval(tick, AETHRA_LOOP_INTERVAL_MS);
  if (typeof _aethraLoopTimer.unref === "function") _aethraLoopTimer.unref();
}

function stopAethraContinuousLoop() {
  if (!_aethraLoopTimer) return false;
  clearInterval(_aethraLoopTimer);
  _aethraLoopTimer = null;
  return true;
}

function readPortfolioState() {
  try {
    const raw = fs.readFileSync(AETHRA_PORTFOLIO_FILE, "utf8");
    const data = JSON.parse(raw);
    return {
      activeBusinesses: Array.isArray(data.activeBusinesses) ? data.activeBusinesses : [],
      killedBusinesses: Array.isArray(data.killedBusinesses) ? data.killedBusinesses : [],
      scaledBusinesses: Array.isArray(data.scaledBusinesses) ? data.scaledBusinesses : [],
    };
  } catch {
    return { activeBusinesses: [], killedBusinesses: [], scaledBusinesses: [] };
  }
}

function readRecentActionRows(limit = 2000) {
  try {
    const raw = fs.readFileSync(AETHRA_ACTIONS_FILE, "utf8");
    const lines = String(raw || "").split(/\r?\n/).filter((x) => x.trim());
    return lines
      .slice(-Math.max(1, Number(limit || 2000)))
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function buildRecentCycleTrends(cycles = 10) {
  const rows = readRecentActionRows(6000);
  const revenueRows = rows.filter((r) => r && r.kind === "revenue_tracked" && r.revenue);
  const feedbackRows = rows.filter((r) => r && r.kind === "execution_feedback" && r.feedbackLearning);
  const scalingRows = rows.filter((r) => r && r.kind === "scaling_decision" && r.scalingDecision);
  const out = [];
  const n = Math.max(1, Number(cycles || 10));
  const start = Math.max(0, revenueRows.length - n);
  for (let i = start; i < revenueRows.length; i += 1) {
    const rr = revenueRows[i];
    const fr = feedbackRows[i] || feedbackRows[feedbackRows.length - 1] || null;
    const sr = scalingRows[i] || scalingRows[scalingRows.length - 1] || null;
    out.push({
      ts: rr.ts || Date.now(),
      profit: Number(rr.revenue.profit || 0),
      conversionRate: fr ? Number((fr.feedbackLearning && fr.feedbackLearning.conversionRate) || 0) : 0,
      scalingAction: sr ? String((sr.scalingDecision && sr.scalingDecision.action) || "hold_and_optimize") : "hold_and_optimize",
    });
  }
  return out;
}

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

function runStdio(payload) {
  const py = findPythonRunner();
  if (!py) {
    const err = new Error(
      "Python + aethra not found. From project root run: pip install -e ."
    );
    err.code = "NO_PYTHON";
    throw err;
  }
  const args = [...py.prefix, "-m", "aethra", "stdio"];
  const r = spawnSync(py.cmd, args, {
    cwd: ROOT,
    input: JSON.stringify(payload),
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
  try {
    let out = (r.stdout || "").trim();
    if (out.charCodeAt(0) === 0xfeff) out = out.slice(1);
    return JSON.parse(out);
  } catch {
    const e = new Error("Invalid JSON from aethra stdio");
    e.stdout = r.stdout;
    throw e;
  }
}

/** One optional Python retry when profit surfaces are thin (AETHRA_PROFIT_RETRY=1). */
function runStdioMaybeRetry(payload) {
  let out = runStdio(payload);
  if (process.env.AETHRA_PROFIT_RETRY !== "1") return out;
  const a = assessProfitSurface(out);
  if (a.satisfied) return out;
  const payload2 = {
    ...payload,
    context: {
      ...(payload.context && typeof payload.context === "object" ? payload.context : {}),
      profit_refinement: `Regenerate with explicit ${a.missing.join(", ")}: GBP pricing, one acquisition channel, one executable offer paragraph.`,
    },
  };
  try {
    out = runStdio(payload2);
  } catch {
    /* keep first response */
  }
  return out;
}

function runSchema() {
  const py = findPythonRunner();
  if (!py) return null;
  const r = spawnSync(py.cmd, [...py.prefix, "-m", "aethra", "schema"], {
    cwd: ROOT,
    encoding: "utf-8",
    timeout: 60000,
  });
  if (r.status !== 0) return null;
  try {
    let out = (r.stdout || "").trim();
    if (out.charCodeAt(0) === 0xfeff) out = out.slice(1);
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function sendText(res, status, text, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": Buffer.byteLength(text),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let len = 0;
    req.on("data", (ch) => {
      len += ch.length;
      if (len > MAX_BODY) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      raw += ch;
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

async function handleApi(req, res, urlPath) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return;
  }

  if (urlPath === "/health" && req.method === "GET") {
    const py = findPythonRunner();
    sendJson(res, 200, {
      ok: true,
      service: "aethra_qppp",
      python: py ? `${py.cmd} ${py.prefix.join(" ")}`.trim() : null,
    });
    return;
  }

  if (urlPath === "/api/v1/schema" && req.method === "GET") {
    const schema = runSchema();
    if (!schema) {
      sendJson(res, 503, { ok: false, error: "schema_unavailable_check_python_install" });
      return;
    }
    sendJson(res, 200, schema);
    return;
  }

  if (urlPath === "/api/v1/aethra/status" && req.method === "GET") {
    const portfolio = readPortfolioState();
    sendJson(res, 200, {
      ok: true,
      mode: "continuous",
      loop_interval_ms: AETHRA_LOOP_INTERVAL_MS,
      loop_running: !!_aethraLoopTimer,
      last_run: _lastAethraRun,
      portfolio_totals: {
        active: portfolio.activeBusinesses.length,
        killed: portfolio.killedBusinesses.length,
        scaled: portfolio.scaledBusinesses.length,
      },
    });
    return;
  }

  if (urlPath === "/api/v1/aethra/portfolio" && req.method === "GET") {
    const portfolio = readPortfolioState();
    sendJson(res, 200, {
      ok: true,
      portfolio,
      totals: {
        active: portfolio.activeBusinesses.length,
        killed: portfolio.killedBusinesses.length,
        scaled: portfolio.scaledBusinesses.length,
      },
    });
    return;
  }

  if (urlPath === "/api/v1/aethra/dashboard" && req.method === "GET") {
    const portfolio = readPortfolioState();
    const totals = {
      active: portfolio.activeBusinesses.length,
      killed: portfolio.killedBusinesses.length,
      scaled: portfolio.scaledBusinesses.length,
    };
    let capitalSnapshot = null;
    try {
      const { getCapitalSnapshot } = require(path.join(ROOT, "aethra_node", "wallet", "capitalSnapshot.js"));
      capitalSnapshot = getCapitalSnapshot("anonymous");
    } catch {
      capitalSnapshot = null;
    }
    sendJson(res, 200, {
      ok: true,
      identity: "AETHRA",
      mode: "autonomous_profit_engine",
      loop: {
        running: !!_aethraLoopTimer,
        interval_ms: AETHRA_LOOP_INTERVAL_MS,
      },
      last_run: _lastAethraRun,
      portfolio,
      portfolio_totals: totals,
      capital_snapshot: capitalSnapshot,
      intelligence: {
        deployment_type: _lastAethraRun && _lastAethraRun.raw ? _lastAethraRun.raw.executionStatus ? (_lastAethraRun.raw.execution && _lastAethraRun.raw.execution.deploymentType) || (_lastAethraRun.raw.analysedTop3 && _lastAethraRun.raw.analysedTop3[0] && _lastAethraRun.raw.analysedTop3[0].deploymentType) || null : null : null,
        scaling_decision: _lastAethraRun && _lastAethraRun.raw ? _lastAethraRun.raw.scalingDecision || null : null,
        feedback_learning: _lastAethraRun && _lastAethraRun.raw ? _lastAethraRun.raw.feedbackLearning || null : null,
        signal_snapshot:
          _lastAethraRun && _lastAethraRun.raw && Array.isArray(_lastAethraRun.raw.matrixTop)
            ? _lastAethraRun.raw.matrixTop.slice(0, 3).map((m) => ({
                name: m.name,
                signalStrength: m.signalStrength,
                demandVelocity: m.demandVelocity,
              }))
            : [],
      },
      output: _lastAethraRun
        ? {
            selected_idea: _lastAethraRun.selectedIdea,
            execution_status: _lastAethraRun.executionStatus,
            profit_generated: _lastAethraRun.profitGenerated,
          }
        : null,
      trends: {
        recent_cycles: buildRecentCycleTrends(10),
      },
    });
    return;
  }

  if (urlPath === "/api/v1/aethra/run/continuous/start" && req.method === "POST") {
    const wasRunning = !!_aethraLoopTimer;
    ensureAethraContinuousLoop();
    sendJson(res, 200, {
      ok: true,
      action: "continuous_start",
      already_running: wasRunning,
      loop_running: !!_aethraLoopTimer,
      loop_interval_ms: AETHRA_LOOP_INTERVAL_MS,
    });
    return;
  }

  if (urlPath === "/api/v1/aethra/run/continuous/stop" && req.method === "POST") {
    const stopped = stopAethraContinuousLoop();
    sendJson(res, 200, {
      ok: true,
      action: "continuous_stop",
      stopped,
      loop_running: !!_aethraLoopTimer,
    });
    return;
  }

  if (urlPath === "/api/v1/invoices" && req.method === "GET") {
    const { listRecent } = require(path.join(ROOT, "aethra_node", "payments", "invoice.js"));
    const { listPaymentEvents } = require(path.join(ROOT, "aethra_node", "memory", "learningEngine.js"));
    sendJson(res, 200, {
      invoices: listRecent(80),
      payment_events: listPaymentEvents(80),
    });
    return;
  }

  if (urlPath === "/api/v1/onboarding" && req.method === "GET") {
    const { getOnboardingDefinition } = require(path.join(ROOT, "aethra_node", "onboarding", "onboarding.js"));
    sendJson(res, 200, getOnboardingDefinition());
    return;
  }

  if (urlPath === "/api/v1/saas/plans" && req.method === "GET") {
    const {
      listPlansForOnboarding,
      PLANS,
    } = require(path.join(ROOT, "aethra_node", "saas", "billingEngine.js"));
    sendJson(res, 200, { ok: true, plans: listPlansForOnboarding(), plan_catalog: PLANS });
    return;
  }

  if (
    (urlPath === "/api/v1/public-report" || urlPath === "/api/v1/public/report") &&
    req.method === "GET"
  ) {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    const id = String(u.searchParams.get("id") || "").trim();
    if (!id) {
      sendJson(res, 400, { ok: false, error: "missing_id" });
      return;
    }
    const { getPublicReport } = require(path.join(ROOT, "aethra_node", "growth", "viralEngine.js"));
    const report = getPublicReport(id);
    if (!report) {
      sendJson(res, 404, { ok: false, error: "not_found" });
      return;
    }
    sendJson(res, 200, {
      ok: true,
      report,
      notice: "Anonymised outcomes only — no personal data.",
    });
    return;
  }

  if (urlPath === "/api/v1/ideas" && req.method === "GET") {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    const text = String(u.searchParams.get("text") || "").trim();
    const { generateIdeas } = require(path.join(ROOT, "aethra_node", "idea", "ideaGenerator.js"));
    sendJson(res, 200, { ok: true, ideas: generateIdeas({ text }) });
    return;
  }

  if (urlPath === "/api/v1/wallet/capital-snapshot" && req.method === "GET") {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    const userId = String(u.searchParams.get("user_id") || "anonymous").trim();
    const { getCapitalSnapshot } = require(path.join(ROOT, "aethra_node", "wallet", "capitalSnapshot.js"));
    sendJson(res, 200, { ok: true, ...getCapitalSnapshot(userId) });
    return;
  }

  if (urlPath === "/api/v1/billing/user-plan" && req.method === "GET") {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    const userId = String(u.searchParams.get("user_id") || "anonymous").trim();
    const { getUserPlan } = require(path.join(ROOT, "aethra_node", "billing", "planStore.js"));
    sendJson(res, 200, { ok: true, user_id: userId, plan: getUserPlan(userId) });
    return;
  }

  if (urlPath === "/api/v1/conversion/metrics" && req.method === "GET") {
    const crm = require(path.join(ROOT, "aethra_node", "crm", "crm.js"));
    const {
      computeMetrics,
      formatOverview,
    } = require(path.join(ROOT, "aethra_node", "conversion", "conversionDashboard.js"));
    const metrics = computeMetrics(crm.getPipeline());
    sendJson(res, 200, {
      ok: true,
      metrics,
      overview_text: formatOverview(metrics),
    });
    return;
  }

  if (urlPath === "/api/v1/optimisation/insights" && req.method === "GET") {
    const crm = require(path.join(ROOT, "aethra_node", "crm", "crm.js"));
    const { runOptimisation } = require(path.join(ROOT, "aethra_node", "optimisation", "optimisationLoop.js"));
    const out = runOptimisation(crm.getPipeline());
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (urlPath === "/api/v1/scaling/brain" && req.method === "GET") {
    const { runLiveScalingBrain } = require(path.join(ROOT, "aethra_node", "scalingBrain", "scalingLoop.js"));
    const out = runLiveScalingBrain();
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (urlPath === "/api/v1/portfolio/brain" && req.method === "GET") {
    const { runLivePortfolioBrain } = require(path.join(ROOT, "aethra_node", "portfolio", "portfolioBrain.js"));
    const out = runLivePortfolioBrain();
    sendJson(res, 200, { ok: true, ...out });
    return;
  }

  if (urlPath === "/webhooks/stripe" && req.method === "POST") {
    try {
      const raw = await readBody(req);
      const { handleWebhook } = require(path.join(ROOT, "aethra_node", "payments", "stripe.js"));
      const sig = req.headers["stripe-signature"] || "";
      const result = handleWebhook(String(raw || ""), sig);
      sendJson(res, result.received !== false ? 200 : 400, result);
    } catch (e) {
      sendJson(res, 400, { received: false, error: String(e.message || e) });
    }
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  let body;
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    sendJson(res, 400, { error: "invalid_json" });
    return;
  }

  const noCache = !!(body.noCache || body.no_cache);
  const ctx = body.context && typeof body.context === "object" ? body.context : {};

  try {
    if (urlPath === "/api/v1/aethra/run") {
      const seed = String(body.seed || body.idea || body.input || "local B2B diagnostic").trim();
      const capital = body.capital != null ? Number(body.capital) : Number(process.env.AETHRA_INITIAL_CAPITAL || 300);
      const run = await runAethraCycle(seed, "manual", capital);
      sendJson(res, 200, {
        ok: true,
        selected_idea: run.selectedIdea,
        execution_status: run.executionStatus,
        profit_generated: run.profitGenerated,
        roi: run.roi,
        cycle_elapsed_ms: run.elapsedMs,
      });
      return;
    }

    if (urlPath === "/api/v1/aethra/run/once") {
      const seed = String(body.seed || body.idea || body.input || "manual one-shot").trim();
      const capital = body.capital != null ? Number(body.capital) : Number(process.env.AETHRA_INITIAL_CAPITAL || 300);
      const run = await runAethraCycle(seed, "manual_once", capital);
      sendJson(res, 200, {
        ok: true,
        selected_idea: run.selectedIdea,
        execution_status: run.executionStatus,
        profit_generated: run.profitGenerated,
        roi: run.roi,
        cycle_elapsed_ms: run.elapsedMs,
      });
      return;
    }

    if (urlPath === "/api/v1/billing/top-up-session") {
      const { createTopUpSession } = require(path.join(ROOT, "aethra_node", "billing", "addFunds.js"));
      const userId = String(body.user_id || body.userId || "anonymous").slice(0, 120);
      const amountGbp = Number(body.amount_gbp) || 50;
      const session = await createTopUpSession(userId, amountGbp);
      sendJson(res, session.ok !== false ? 200 : 400, { ok: session.ok !== false, ...session });
      return;
    }

    if (urlPath === "/api/v1/billing/create-subscription-session") {
      const { createSubscriptionSession } = require(path.join(
        ROOT,
        "aethra_node",
        "billing",
        "subscriptionEngine.js"
      ));
      const userId = String(body.user_id || body.userId || "anonymous").slice(0, 120);
      const planKey = String(body.plan || body.plan_key || body.tier || "operator").toLowerCase();
      const priceId =
        planKey === "portfolio"
          ? process.env.PRICE_PORTFOLIO
          : process.env.PRICE_OPERATOR;
      if (!priceId) {
        sendJson(res, 400, {
          ok: false,
          error: "missing_PRICE_PORTFOLIO/PRICE_OPERATOR env var for live checkout.",
        });
        return;
      }
      const session = await createSubscriptionSession(userId, priceId, planKey);
      sendJson(res, session.ok !== false ? 200 : 400, { ok: session.ok !== false, ...session });
      return;
    }

    if (urlPath === "/api/v1/billing/create-deal-checkout-session") {
      const { createDealCheckout } = require(path.join(
        ROOT,
        "aethra_node",
        "billing",
        "checkoutEngine.js"
      ));
      const userId = String(body.user_id || body.userId || "anonymous").slice(0, 120);
      const amountGbp = Number(body.amount_gbp || body.amount || 0);
      if (!Number.isFinite(amountGbp) || amountGbp <= 0) {
        sendJson(res, 400, { ok: false, error: "amount_gbp must be a positive number." });
        return;
      }
      const session = await createDealCheckout(userId, amountGbp);
      sendJson(res, session.ok !== false ? 200 : 400, { ok: session.ok !== false, ...session });
      return;
    }

    if (urlPath === "/api/v1/create-checkout-session") {
      const { createCheckoutSession } = require(path.join(ROOT, "aethra_node", "payments", "stripe.js"));
      const session = await createCheckoutSession(body);
      sendJson(res, 200, session);
      return;
    }

    if (urlPath === "/api/v1/record-payment") {
      const { recordPayment } = require(path.join(ROOT, "aethra_node", "payments", "stripe.js"));
      const rec = recordPayment(body);
      sendJson(res, rec.ok ? 200 : 400, rec);
      return;
    }

    if (urlPath === "/api/v1/invoice") {
      const { generateInvoice } = require(path.join(ROOT, "aethra_node", "payments", "invoice.js"));
      const inv = generateInvoice(body.client, body.service, body.price, body.status);
      sendJson(res, 200, inv);
      return;
    }

    if (urlPath === "/run") {
      const input = String(body.input || "").trim();
      if (!input) {
        sendJson(res, 400, {
          ok: false,
          error: "missing_or_invalid_input",
          detail: 'Expected JSON body: { "input": "Validate idea: …" } or a URL string',
        });
        return;
      }
      const ec = enrichOptsFromBody(body, ctx);
      try {
        const { normalizePlan } = require(path.join(ROOT, "aethra_node", "saas", "billingEngine.js"));
        const { assertFreeAnalysisAllowed } = require(path.join(ROOT, "aethra_node", "saas", "runLimiter.js"));
        if (normalizePlan(ec.plan) === "free") {
          assertFreeAnalysisAllowed(ec.user_id || "anonymous", Number(ec.referrals) || 0);
        }
      } catch (e) {
        if (e && e.code === "DAILY_LIMIT") {
          sendJson(res, 429, {
            ok: false,
            error: "daily_limit",
            message: String(e.message || e),
            upgrade_plan: "operator",
          });
          return;
        }
      }
      const isUrl = /^https?:\/\//i.test(input);
      if (isUrl) {
        sendJson(
          res,
          200,
          attachUiSummaries(
            await maybeEnrich(
              runStdioMaybeRetry({ cmd: "url", url: input, context: ctx, noCache }),
              input,
              ec
            )
          )
        );
      } else {
        sendJson(
          res,
          200,
          attachUiSummaries(
            await maybeEnrich(
              runStdioMaybeRetry({ cmd: "idea", text: input, context: ctx, noCache }),
              input,
              ec
            )
          )
        );
      }
      return;
    }

    if (urlPath === "/api/v1/idea") {
      const text = String(body.text || "").trim();
      if (!text) {
        sendJson(res, 400, { error: "missing_text" });
        return;
      }
      if (!checkFreeEnrichAllowance(body, ctx, res)) return;
      const out = attachUiSummaries(
        await maybeEnrich(
          runStdioMaybeRetry({ cmd: "idea", text, context: ctx, noCache }),
          text,
          enrichOptsFromBody(body, ctx)
        )
      );
      sendJson(res, 200, out);
      return;
    }
    if (urlPath === "/api/v1/url") {
      const url = String(body.url || "").trim();
      if (!url) {
        sendJson(res, 400, { error: "missing_url" });
        return;
      }
      if (!checkFreeEnrichAllowance(body, ctx, res)) return;
      const out = attachUiSummaries(
        await maybeEnrich(
          runStdioMaybeRetry({ cmd: "url", url, context: ctx, noCache }),
          url,
          enrichOptsFromBody(body, ctx)
        )
      );
      sendJson(res, 200, out);
      return;
    }
    if (urlPath === "/api/v1/miae") {
      const out = runStdio({ cmd: "miae", context: ctx });
      sendJson(res, 200, out);
      return;
    }
    if (urlPath === "/api/v1/conversion/metrics") {
      const crm = require(path.join(ROOT, "aethra_node", "crm", "crm.js"));
      const {
        computeMetrics,
        formatOverview,
      } = require(path.join(ROOT, "aethra_node", "conversion", "conversionDashboard.js"));
      const deals = Array.isArray(body.deals) ? body.deals : crm.getPipeline();
      const hints = {
        best_channel: body.best_channel,
        best_message: body.best_message,
      };
      const metrics = computeMetrics(deals, hints);
      sendJson(res, 200, {
        ok: true,
        metrics,
        overview_text: formatOverview(metrics),
      });
      return;
    }

    if (urlPath === "/api/v1/portfolio/brain") {
      const { runPortfolioBrain, runLivePortfolioBrain } = require(path.join(
        ROOT,
        "aethra_node",
        "portfolio",
        "portfolioBrain.js"
      ));
      const recordMemory = !!(body.record || body.record_memory);
      if (Array.isArray(body.ventures) && body.capital != null) {
        const cap = Number(body.capital);
        const c = Number.isFinite(cap) && cap >= 0 ? cap : 0;
        const out = runPortfolioBrain(body.ventures, c);
        sendJson(res, 200, { ok: true, ...out });
        return;
      }
      const out = runLivePortfolioBrain({ recordMemory });
      sendJson(res, 200, { ok: true, ...out });
      return;
    }

    if (urlPath === "/api/v1/scaling/run") {
      const { runScalingBrain } = require(path.join(ROOT, "aethra_node", "scalingBrain", "scalingLoop.js"));
      const portfolio = Array.isArray(body.portfolio) ? body.portfolio : [];
      const budget = Number(body.budget);
      const b = Number.isFinite(budget) && budget >= 0 ? budget : 0;
      const brain = runScalingBrain(portfolio, b);
      const { executeScaling } = require(path.join(ROOT, "aethra_node", "scalingBrain", "actionEngine.js"));
      sendJson(res, 200, { ok: true, ...brain, actions: executeScaling(brain.decisions) });
      return;
    }

    if (urlPath === "/api/v1/optimisation/run") {
      const crm = require(path.join(ROOT, "aethra_node", "crm", "crm.js"));
      const { runOptimisation } = require(path.join(ROOT, "aethra_node", "optimisation", "optimisationLoop.js"));
      const deals = Array.isArray(body.deals) ? body.deals : crm.getPipeline();
      const out = runOptimisation(deals, {
        seed_message: body.seed_message,
      });
      sendJson(res, 200, { ok: true, ...out });
      return;
    }

    if (urlPath === "/api/v1/conversion/call-script") {
      const {
        generateCallScript,
        getDiagnosticCloseLine,
      } = require(path.join(ROOT, "aethra_node", "conversion", "callEngine.js"));
      const scriptCtx = body.context && typeof body.context === "object" ? body.context : {};
      sendJson(res, 200, {
        ok: true,
        script: generateCallScript(scriptCtx),
        diagnostic_close_line: getDiagnosticCloseLine(),
      });
      return;
    }

    if (urlPath === "/api/v1/reply/process") {
      const message = String(body.message || "").trim();
      if (!message) {
        sendJson(res, 400, { ok: false, error: "missing_message" });
        return;
      }
      try {
        const { processReply } = require(path.join(ROOT, "aethra_node", "reply", "replyEngine.js"));
        const deal = body.deal && typeof body.deal === "object" ? body.deal : {};
        const context = body.context && typeof body.context === "object" ? body.context : {};
        const out = await processReply(message, deal, context);
        sendJson(res, 200, { ok: true, ...out });
      } catch (e) {
        sendJson(res, 500, { ok: false, error: "reply_process_failed", message: String(e.message || e) });
      }
      return;
    }

    if (urlPath === "/api/v1/execution/start") {
      const idea = String(body.idea || body.text || body.input || "").trim();
      if (!idea) {
        sendJson(res, 400, { ok: false, error: "missing_idea" });
        return;
      }
      try {
        const { runExecutionMode } = require(path.join(ROOT, "aethra_node", "execution", "executionEngine.js"));
        const result = await runExecutionMode(body);
        sendJson(res, 200, result);
      } catch (e) {
        if (e.code === "UPGRADE_REQUIRED") {
          sendJson(res, 403, {
            ok: false,
            error: "upgrade_required",
            message: String(e.message || e),
            required_plan: "operator",
          });
          return;
        }
        const code = e.code === "MISSING_IDEA" ? 400 : 500;
        sendJson(res, code, {
          ok: false,
          error: "execution_failed",
          message: String(e.message || e),
        });
      }
      return;
    }

    if (urlPath === "/api/v1/run") {
      const mode = String(body.mode || "").toLowerCase();
      if (mode === "idea") {
        const text = String(body.text || "").trim();
        if (!text) {
          sendJson(res, 400, { error: "missing_text" });
          return;
        }
        if (!checkFreeEnrichAllowance(body, ctx, res)) return;
        sendJson(
          res,
          200,
          attachUiSummaries(
            await maybeEnrich(
              runStdioMaybeRetry({ cmd: "idea", text, context: ctx, noCache }),
              text,
              enrichOptsFromBody(body, ctx)
            )
          )
        );
        return;
      }
      if (mode === "url") {
        const url = String(body.url || "").trim();
        if (!url) {
          sendJson(res, 400, { error: "missing_url" });
          return;
        }
        if (!checkFreeEnrichAllowance(body, ctx, res)) return;
        sendJson(
          res,
          200,
          attachUiSummaries(
            await maybeEnrich(
              runStdioMaybeRetry({ cmd: "url", url, context: ctx, noCache }),
              url,
              enrichOptsFromBody(body, ctx)
            )
          )
        );
        return;
      }
      if (mode === "miae") {
        sendJson(res, 200, runStdio({ cmd: "miae", context: ctx }));
        return;
      }
      sendJson(res, 400, { error: "invalid_mode", allowed: ["idea", "url", "miae"] });
      return;
    }

    sendJson(res, 404, { error: "not_found" });
  } catch (e) {
    const code = e.code === "NO_PYTHON" ? 503 : 500;
    sendJson(res, code, { ok: false, error: e.message || String(e) });
  }
}

function startServer() {
  ensureAethraContinuousLoop();
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
    const p = u.pathname.replace(/\/$/, "") || "/";

    try {
      if (
        p === "/api/v1/schema" ||
        p === "/health" ||
        p === "/run" ||
        p === "/webhooks/stripe" ||
        p.startsWith("/api/")
      ) {
        await handleApi(req, res, p);
        return;
      }
      if (req.method === "GET" && (p === "/" || p === "/index.html")) {
        if (!fs.existsSync(WEB_INDEX)) {
          sendText(res, 404, "web/index.html missing", "text/plain; charset=utf-8");
          return;
        }
        const html = fs.readFileSync(WEB_INDEX, "utf-8");
        sendText(res, 200, html, "text/html; charset=utf-8");
        return;
      }
      if (req.method === "GET" && p.length > 1 && !p.includes("..")) {
        const rel = p.replace(/^\//, "");
        const candidate = path.join(WEB_DIR, rel);
        if (candidate.startsWith(WEB_DIR) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          const ext = path.extname(candidate).toLowerCase();
          const type =
            ext === ".js"
              ? "application/javascript; charset=utf-8"
              : ext === ".css"
                ? "text/css; charset=utf-8"
                : "application/octet-stream";
          sendText(res, 200, fs.readFileSync(candidate, "utf-8"), type);
          return;
        }
      }
      sendJson(res, 404, { error: "not_found" });
    } catch (e) {
      sendJson(res, 500, { error: String(e.message || e) });
    }
  });

  server.listen(PORT, () => {
    console.error(
      `AETHRA Q+++ listening on http://127.0.0.1:${PORT}\n` +
        `  UI: http://127.0.0.1:${PORT}/\n` +
        `  Health: GET /health · Schema: GET /api/v1/schema`
    );
  });
}

function printHelp() {
  console.error(
    "AETHRA Q+++ (Node host)\n\n" +
      "  node index.js              Start API + web UI (PORT=" +
      PORT +
      ")\n" +
      "  node index.js server       Same as above\n" +
      "  node index.js cli idea \"…\"\n" +
      "  node index.js cli url https://…\n" +
      "  node index.js cli miae [--context file.json]\n" +
      "  Append --plain-json for machine-readable stdout (no summary).\n\n" +
      "Environment: PORT or AETHRA_PORT (default 3847), AETHRA_PLAIN_JSON=1\n"
  );
}

function runCli(argv) {
  if (argv[0] === "help" || argv[0] === "--help") {
    printHelp();
    process.exit(0);
  }
  if (argv[0] !== "cli") {
    printHelp();
    process.exit(1);
  }
  const rest = argv.slice(1);
  if (rest.length === 0) {
    printHelp();
    process.exit(1);
  }

  const sub = rest[0].toLowerCase();
  let pyArgs;
  const wantPlain = rest.includes("--plain-json");
  const restNoPlain = rest.filter((x) => x !== "--plain-json");
  if (sub === "idea") {
    const text = restNoPlain.slice(1).join(" ").trim();
    if (!text) {
      printHelp();
      process.exit(1);
    }
    pyArgs = ["-m", "aethra", "idea", text];
    if (wantPlain) pyArgs.push("--plain-json");
  } else if (sub === "url") {
    const url = restNoPlain[1];
    if (!url) {
      printHelp();
      process.exit(1);
    }
    pyArgs = ["-m", "aethra", "url", url];
    if (wantPlain) pyArgs.push("--plain-json");
    const cIdx = restNoPlain.indexOf("--context");
    if (cIdx !== -1 && restNoPlain[cIdx + 1]) {
      pyArgs.push("--context", restNoPlain[cIdx + 1]);
    }
  } else if (sub === "miae") {
    pyArgs = ["-m", "aethra", "miae"];
    if (wantPlain) pyArgs.push("--plain-json");
    const cIdx = restNoPlain.indexOf("--context");
    if (cIdx !== -1 && restNoPlain[cIdx + 1]) {
      pyArgs.push("--context", restNoPlain[cIdx + 1]);
    }
  } else {
    printHelp();
    process.exit(1);
  }

  const py = findPythonRunner();
  if (!py) {
    console.error("Python + aethra not found. Run: pip install -e .");
    process.exit(1);
  }
  const env = { ...process.env };
  if (wantPlain) env.AETHRA_PLAIN_JSON = "1";
  const r = spawnSync(py.cmd, [...py.prefix, ...pyArgs], {
    cwd: ROOT,
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 120000,
    env,
  });
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "aethra failed");
    process.exit(r.status ?? 1);
  }
  process.stdout.write(r.stdout);
}

const argv = process.argv.slice(2);

if (argv.length === 0 || argv[0].toLowerCase() === "server") {
  startServer();
} else if (argv[0].toLowerCase() === "cli" || argv[0] === "help" || argv[0] === "--help") {
  if (argv[0] === "help" || argv[0] === "--help") {
    printHelp();
    process.exit(0);
  }
  runCli(argv);
} else {
  const wantPlain = argv.includes("--plain-json");
  const argvNp = argv.filter((x) => x !== "--plain-json");
  const joined = argvNp.join(" ");
  const spawnCli = (pyArgsIn) => {
    const py = findPythonRunner();
    if (!py) {
      console.error("Python + aethra not found. Run: pip install -e .");
      process.exit(1);
    }
    const pyArgs = [...pyArgsIn];
    if (wantPlain && !pyArgs.includes("--plain-json")) {
      pyArgs.push("--plain-json");
    }
    const env = { ...process.env };
    if (wantPlain) env.AETHRA_PLAIN_JSON = "1";
    const r = spawnSync(py.cmd, [...py.prefix, ...pyArgs], {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 32 * 1024 * 1024,
      timeout: 120000,
      env,
    });
    if (r.error) {
      console.error(r.error.message);
      process.exit(1);
    }
    if (r.status !== 0) {
      console.error(r.stderr || r.stdout || "aethra failed");
      process.exit(r.status ?? 1);
    }
    process.stdout.write(r.stdout);
  };

  const sub = argvNp[0].toLowerCase();
  if (sub === "idea") {
    const text = argvNp.slice(1).join(" ").trim();
    if (!text) printHelp(), process.exit(1);
    spawnCli(["-m", "aethra", "idea", text]);
  } else if (sub === "url") {
    const url = argvNp[1];
    if (!url) printHelp(), process.exit(1);
    const pyArgs = ["-m", "aethra", "url", url];
    const cIdx = argvNp.indexOf("--context");
    if (cIdx !== -1 && argvNp[cIdx + 1]) pyArgs.push("--context", argvNp[cIdx + 1]);
    spawnCli(pyArgs);
  } else if (sub === "miae") {
    const pyArgs = ["-m", "aethra", "miae"];
    const cIdx = argvNp.indexOf("--context");
    if (cIdx !== -1 && argvNp[cIdx + 1]) pyArgs.push("--context", argvNp[cIdx + 1]);
    spawnCli(pyArgs);
  } else if (
    joined.toLowerCase().includes("http") &&
    /^https?:\/\//i.test(argvNp[0])
  ) {
    spawnCli(["-m", "aethra", "url", argvNp[0]]);
  } else {
    spawnCli(["-m", "aethra", "idea", joined]);
  }
}
