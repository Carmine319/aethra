import fs from "fs";
import path from "path";

export function readAntifragilityPolicy() {
  const file = path.join(__dirname, "..", "policies", "antifragility.policy.json");
  if (!fs.existsSync(file)) {
    return {
      global_kill_switch: false,
      protected_capital_fraction: 0.6,
      optional_capital_fraction: 0.4,
      max_optional_multiplier: 2.5,
      cascade_isolation_threshold: 0.3,
      circuit_failure_threshold: 5,
      max_leverage_cap: 1.5,
      redundancy_min_paths: 2,
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function assertAntifragilityOperational() {
  const p = readAntifragilityPolicy();
  if (p.global_kill_switch) {
    throw new Error("Anti-fragility layer halted by policy");
  }
}
