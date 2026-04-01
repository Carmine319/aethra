import fs from "fs";
import path from "path";
import { registerAgent, getActiveAgents, type SwarmAgent } from "./agent.registry";
import type { AgentProfile } from "./agent.profile";
import { logAgentAction } from "./agent.history.append";
import { updateLifecycle } from "./agent.lifecycle";
import { assertSwarmOperational } from "../governance/system.stability";

let spawnsThisCycle = 0;

export function beginSwarmCycle() {
  spawnsThisCycle = 0;
}

function readPolicy() {
  const file = path.join(__dirname, "..", "policies", "swarm.policy.json");
  if (!fs.existsSync(file)) {
    return {
      global_kill_switch: false,
      max_agents_spawned_per_cycle: 12,
      max_capital_share_per_agent: 0.35,
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function totalSystemCapital(): number {
  return getActiveAgents().reduce((s, a) => s + Number(a.capital || 0), 0);
}

function capAgentCapital(requested: number): number {
  const policy = readPolicy();
  assertSwarmOperational();
  const capShare = Number(policy.max_capital_share_per_agent ?? 0.35);
  const total = Math.max(Number(policy.min_system_capital ?? 1), totalSystemCapital());
  const maxByConcentration = total * capShare;
  const capped = Math.min(Number(requested || 0), maxByConcentration);
  return Math.max(0, Math.round(capped * 100) / 100);
}

export function createAgent(profile: AgentProfile): SwarmAgent {
  const policy = readPolicy();
  assertSwarmOperational();

  const maxPerCycle = Number(policy.max_agents_spawned_per_cycle ?? 12);
  if (spawnsThisCycle >= maxPerCycle) {
    throw new Error("Agent spawn budget exhausted for this cycle");
  }
  spawnsThisCycle += 1;

  if (!Number.isFinite(Number(profile.expectedUtility)) || Number(profile.expectedUtility) < 0) {
    throw new Error("Agent requires non-negative measurable expected utility");
  }

  const requestedCapital = Number(profile.capital ?? 0);
  const capital = capAgentCapital(requestedCapital);

  const agent: SwarmAgent = {
    id: `agent_${Date.now()}_${spawnsThisCycle}`,
    role: profile.role,
    capital,
    performance: 0,
    reputation: 1,
    state: "active",
    birth: Date.now(),
    strategyGenome: profile.genome != null ? { ...profile.genome } : null,
    ownerId: profile.ownerId,
    expectedUtility: Number(profile.expectedUtility),
  };

  registerAgent(agent);
  logAgentAction({ event: "agent_born", agent });
  updateLifecycle(agent);
  return agent;
}
