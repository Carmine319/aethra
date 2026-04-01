import fs from "fs";
import path from "path";
import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

function floor() {
  const file = path.join(__dirname, "..", "policies", "swarm.policy.json");
  if (!fs.existsSync(file)) return -50;
  const p = JSON.parse(fs.readFileSync(file, "utf8"));
  return Number(p.elimination_performance_floor ?? -50);
}

export function eliminateWeakAgents(agents: SwarmAgent[]) {
  const f = floor();
  const kept = (agents || []).filter((a) => Number(a.performance || 0) > f);
  logAgentAction({ event: "elimination_cycle", removed: (agents?.length || 0) - kept.length, floor: f });
  return kept;
}
