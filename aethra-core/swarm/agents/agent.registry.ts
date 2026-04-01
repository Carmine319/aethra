import fs from "fs";
import path from "path";

export type SwarmAgent = {
  id: string;
  role: string;
  capital: number;
  performance: number;
  reputation: number;
  state: "active" | "scaled" | "terminated";
  birth: number;
  strategyGenome: Record<string, unknown> | null;
  ownerId?: string;
  expectedUtility?: number;
};

const agents: SwarmAgent[] = [];

function readPolicy() {
  const file = path.join(__dirname, "..", "policies", "swarm.policy.json");
  if (!fs.existsSync(file)) {
    return { max_active_agents: 500, max_capital_share_per_agent: 0.35 };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function registerAgent(agent: SwarmAgent) {
  const policy = readPolicy();
  const max = Number(policy.max_active_agents || 500);
  if (agents.filter((a) => a.state !== "terminated").length >= max) {
    throw new Error("Agent spawn cap reached");
  }
  agents.push(agent);
}

export function getAgents(): SwarmAgent[] {
  return [...agents];
}

export function getActiveAgents(): SwarmAgent[] {
  return agents.filter((a) => a.state !== "terminated");
}

export function updateAgentCapital(agentId: string, delta: number) {
  const a = agents.find((x) => x.id === agentId);
  if (!a) return;
  a.capital = Math.max(0, a.capital + delta);
}
