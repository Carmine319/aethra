import fs from "fs";
import path from "path";

export function readEvolutionPolicy() {
  const file = path.join(__dirname, "..", "policies", "evolution.policy.json");
  if (!fs.existsSync(file)) {
    return {
      evolution_kill_switch: false,
      require_economic_validation: true,
      require_invariant_guard: true,
      max_blast_radius: 0.35,
      canary_exposure_start: 0.1,
      simulation_worlds: ["baseline", "stress", "extreme"],
      structurally_persistent_log: true,
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function assertEvolutionAllowed() {
  const p = readEvolutionPolicy();
  if (p.evolution_kill_switch) {
    throw new Error("Evolution halted by policy");
  }
}
