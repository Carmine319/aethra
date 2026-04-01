"use strict";

const { runAgent } = require("../agents/executor.js");
const memory = require("../memory/index.js");
const { shouldKillVenture } = require("../kill/engine.js");
const { optimisePricing, attachUpsell, selectDistributionChannels } = require("../profit/engine.js");
const { deployVenture } = require("../tools/deploy.js");
const { chargeWithStripe } = require("../tools/stripe.js");
const { createGumroadOffer } = require("../tools/gumroad.js");
const { writeCoreLog } = require("../utils.js");

let running = false;
let timer = null;
let active = new Map();

async function runSingleCycle(seed = "local B2B diagnostic", context = {}) {
  const ceo = await runAgent("CEO", seed, context);
  const idea = ceo.output.idea;

  const growthValidation = await runAgent("GROWTH", idea, context);
  if (!growthValidation.output.valid) {
    await runAgent("KILL", idea, { reason: "validation_failed" });
    memory.logFailure({ idea, reason: "validation_failed" });
    return { ok: true, status: "killed_prebuild", idea };
  }

  const builder = await runAgent("BUILDER", idea, context);
  const priced = optimisePricing({ basePrice: 99, targetMargin: 0.9 });
  const upsell = attachUpsell({ title: idea });
  const dist = selectDistributionChannels({ digital_first: true });
  const finance = await runAgent("FINANCE", idea, { priced, upsell, dist });

  const stripe = await chargeWithStripe({ mode: "payment", line_items: [{ name: idea, amount: priced.price }] });
  const gumroad = await createGumroadOffer({ title: idea, price: priced.price });
  const deployed = await deployVenture({ idea, landing_path: builder.output.landing_path });

  const venture = {
    id: `venture_${Date.now()}`,
    idea,
    niche: idea,
    status: "live",
    price: priced.price,
    margin_target: priced.target_margin,
    channels: dist.channels,
    website_path: builder.output.landing_path,
    build: builder.output,
    finance: finance.output,
    payments: { stripe_ok: stripe && stripe.ok !== false, gumroad_ok: gumroad && gumroad.ok !== false },
    deploy: deployed,
    revenue: 0,
    days_live: 0,
    engagement: 0,
  };

  memory.logVenture(venture);
  memory.logRevenue({ venture_id: venture.id, amount: 0, currency: "GBP" });
  active.set(venture.id, venture);
  writeCoreLog({ event: "venture_live", venture_id: venture.id, idea });

  return { ok: true, status: "live", venture };
}

async function runCoreLoop(options = {}) {
  if (!running) return { ok: false, error: "core_not_running" };
  const concurrency = Math.max(1, Number(options.concurrency || 1));
  const seed = String(options.seed || "local B2B diagnostic");
  const jobs = Array.from({ length: concurrency }).map(() => runSingleCycle(seed, options.context || {}));
  const results = await Promise.allSettled(jobs);
  return { ok: true, results };
}

function startScheduler(options = {}) {
  const intervalMs = Math.max(30000, Number(options.interval_ms || 86400000));
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    runCoreLoop(options).catch(() => {});
  }, intervalMs);
}

function stopScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}

function markKill(id) {
  const v = active.get(id);
  if (!v) return { ok: false, error: "not_found" };
  v.status = "killed";
  memory.logFailure({ venture_id: id, reason: "manual_kill" });
  memory.logVenture(v);
  active.delete(id);
  return { ok: true, id, status: "killed" };
}

function scanKillCandidates() {
  const killed = [];
  for (const [id, v] of active.entries()) {
    const verdict = shouldKillVenture(v, {});
    if (verdict.kill) {
      v.status = "killed";
      memory.logFailure({ venture_id: id, reason: verdict.reason });
      memory.logVenture(v);
      active.delete(id);
      killed.push(id);
    }
  }
  return killed;
}

function setRunning(x) { running = !!x; return running; }
function isRunning() { return running; }

module.exports = {
  runCoreLoop,
  runSingleCycle,
  startScheduler,
  stopScheduler,
  markKill,
  scanKillCandidates,
  setRunning,
  isRunning,
};