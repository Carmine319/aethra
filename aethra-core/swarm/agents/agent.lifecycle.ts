import fs from "fs";
import path from "path";

import type { SwarmAgent } from "./agent.registry";
import { logAgentAction } from "./agent.history.append";

function readPolicy(): {
  lifecycle_scale_threshold: number;
  lifecycle_termination_floor: number;
} {
  const file = path.join(__dirname, "..", "policies", "swarm.policy.json");
  if (!fs.existsSync(file)) {
    return { lifecycle_scale_threshold: 1000, lifecycle_termination_floor: -100 };
  }
  const p = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    lifecycle_scale_threshold: Number(p.lifecycle_scale_threshold ?? 1000),
    lifecycle_termination_floor: Number(p.lifecycle_termination_floor ?? -100),
  };
}

export function updateLifecycle(agent: SwarmAgent): SwarmAgent {
  const policy = readPolicy();
  if (agent.performance > policy.lifecycle_scale_threshold) {
    agent.state = "scaled";
  }
  if (agent.performance < policy.lifecycle_termination_floor) {
    agent.state = "terminated";
  }
  logAgentAction({ event: "lifecycle_update", agent_id: agent.id, state: agent.state, performance: agent.performance });
  return agent;
}
