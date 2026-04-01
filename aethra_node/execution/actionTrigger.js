"use strict";

const { appendEconomicMemory } = require("../profit/systemMemory");

function shouldAutoRun(state = {}) {
  const inactiveHours = Number(state.inactive_hours || 0);
  const approved = state.approved_once === true;
  const cooldown = Number(state.cooldown_minutes || 0);
  if (approved && cooldown <= 0) return true;
  if (inactiveHours >= 6 && approved) return true;
  return false;
}

function resolveActionTrigger(state = {}) {
  const autoRun = shouldAutoRun(state);
  const out = {
    user_inactive: Number(state.inactive_hours || 0) >= 6,
    approved_once: state.approved_once === true,
    auto_cycle_enabled: autoRun,
    action: autoRun ? "auto_run_cycle" : "await_next_window",
  };
  appendEconomicMemory({ kind: "action_trigger", state, out });
  return out;
}

module.exports = { shouldAutoRun, resolveActionTrigger };