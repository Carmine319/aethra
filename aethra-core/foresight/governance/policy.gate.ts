import fs from "fs";
import path from "path";

export function readForesightPolicy() {
  const file = path.join(__dirname, "..", "policies", "foresight.policy.json");
  if (!fs.existsSync(file)) {
    return {
      require_uncertainty_on_forecasts: true,
      require_decision_audit: true,
      min_confidence_for_capital_map: 0.05,
      max_capital_fraction_per_decision: 0.35,
      global_kill_switch: false,
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function assertForesightOperational() {
  const p = readForesightPolicy();
  if (p.global_kill_switch) {
    throw new Error("Foresight layer halted by policy");
  }
}
