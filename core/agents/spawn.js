"use strict";

const { appendHistorical } = require("../memory/store");

const ROLES = new Set([
  "acquisition_agent",
  "product_agent",
  "monetisation_agent",
  "optimisation_agent",
]);

/**
 * @param {string} role
 * @param {{ friction?: string, task?: string }} [ctx]
 */
function spawnAgent(role, ctx) {
  const r = String(role || "").trim();
  if (!ROLES.has(r)) {
    return { ok: false, error: "unknown_role", allowed: [...ROLES] };
  }
  const agent = {
    id: `ag_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    role: r,
    created_at: Date.now(),
    status: "assigned",
    task: String(ctx?.task || inferDefaultTask(r)).slice(0, 500),
    friction_signal: ctx?.friction ? String(ctx.friction).slice(0, 200) : null,
  };
  appendHistorical({ kind: "agent_spawn", agent });
  return { ok: true, agent };
}

function inferDefaultTask(role) {
  switch (role) {
    case "acquisition_agent":
      return "Reduce top-of-funnel friction: tighten lead source and first-touch CTA.";
    case "product_agent":
      return "Align offer scope with pilot boundary and delivery capacity.";
    case "monetisation_agent":
      return "Map checkout paths to revenue events and verify Stripe metadata.";
    case "optimisation_agent":
      return "Review cycle outcomes and adjust template/score weights.";
    default:
      return "Support execution loop.";
  }
}

/**
 * When friction is detected in cycle trace, spawn a specialised agent.
 * @param {string} frictionType
 */
function spawnAgentForFriction(frictionType) {
  const t = String(frictionType || "").toLowerCase();
  if (t.includes("checkout") || t.includes("stripe") || t.includes("pay")) {
    return spawnAgent("monetisation_agent", { friction: frictionType, task: "Unblock payment capture path." });
  }
  if (t.includes("launch") || t.includes("build")) {
    return spawnAgent("product_agent", { friction: frictionType, task: "Stabilise build/launch pipeline." });
  }
  if (t.includes("opportunity") || t.includes("demand")) {
    return spawnAgent("acquisition_agent", { friction: frictionType, task: "Refresh opportunity surface." });
  }
  return spawnAgent("optimisation_agent", { friction: frictionType, task: "Rebalance strategy weights." });
}

module.exports = { spawnAgent, spawnAgentForFriction, ROLES };
