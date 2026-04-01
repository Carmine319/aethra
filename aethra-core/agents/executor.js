"use strict";

const path = require("path");
const { AGENTS } = require("./registry.js");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));
const { routeModel } = require(path.join(__dirname, "..", "ai", "router.js"));
const { writeActionLog } = require(path.join(__dirname, "..", "utils.js"));
const { readStateBeforeAction } = require(path.join(__dirname, "..", "organism", "readStateBeforeAction.js"));

async function runAgent(agent, input, context = {}) {
  const key = String(agent || "").toUpperCase();
  const meta = AGENTS[key] || AGENTS.CEO;
  const model = routeModel(key === "CEO" ? "strategy" : key === "BUILDER" ? "execution" : "bulk");
  let ctx = context && typeof context === "object" ? context : {};
  try {
    const system_state = readStateBeforeAction(ctx);
    ctx = { ...ctx, system_state };
  } catch {
    /* organism layer optional */
  }
  const base = { agent: meta.id, role: meta.role, model, input, context: ctx };
  let output;

  if (meta.id === "CEO") {
    const { generateIdeas } = require(path.join(__dirname, "..", "..", "aethra_node", "idea", "ideaGenerator.js"));
    const ideas = generateIdeas({ text: String(input || "local B2B diagnostic") });
    output = { idea: (ideas && ideas[0] && (ideas[0].idea || ideas[0].title || String(ideas[0]))) || "Local operations diagnostic sprint" };
  } else if (meta.id === "GROWTH") {
    const { runEconomicLoop } = require(path.join(__dirname, "..", "..", "aethra_node", "autonomy", "economicLoop.js"));
    const scan = await runEconomicLoop(String(input || ""), ctx);
    output = { valid: Number(scan.kpis.reply_rate || 0) >= 2, scan };
  } else if (meta.id === "BUILDER") {
    output = {
      product: String(input || "offer") + " productised",
      landing_path: "/aethra.html",
      deployment: "queued",
    };
  } else if (meta.id === "FINANCE") {
    const { optimisePricing } = require(path.join(__dirname, "..", "profit", "engine.js"));
    output = optimisePricing({ basePrice: 99, targetMargin: 0.9 });
  } else if (meta.id === "KILL") {
    output = { killed: true, reason: String(context.reason || "failed thresholds") };
  } else {
    output = { ok: true };
  }

  memory.logLearning({ agent: meta.id, model, output, system_state: ctx.system_state });
  writeActionLog({ type: "agent", ...base, output });
  return { ...base, output };
}

module.exports = { runAgent };