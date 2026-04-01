import fs from "fs";
import path from "path";
import { globalKill } from "../../autonomy/governance/kill.switch.global";

function readJson(file: string, fallback: Record<string, unknown>) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Enforces Ω v8 global kill + Ω v9 swarm kill (read-only policy files; no Ω v1–v8 edits).
 */
export function assertSwarmOperational() {
  const swarmPolicy = readJson(path.join(__dirname, "..", "policies", "swarm.policy.json"), {});
  const autonomyPolicy = readJson(path.join(__dirname, "..", "..", "autonomy", "policies", "autonomy.policy.json"), {});
  const halt = !!(swarmPolicy.global_kill_switch || autonomyPolicy.global_kill_switch);
  globalKill(halt);
}

export { globalKill };
