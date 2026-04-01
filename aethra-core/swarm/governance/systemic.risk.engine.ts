import type { SwarmAgent } from "../agents/agent.registry";
import { logAgentAction } from "../agents/agent.history.append";

export function assessSystemRisk(agents: SwarmAgent[]) {
  const totalCapital = (agents || []).reduce((s, a) => s + Number(a.capital || 0), 0);
  if (totalCapital === 0) {
    logAgentAction({ event: "systemic_risk", level: "collapse", total_capital: 0 });
    throw new Error("System collapse risk");
  }
  return { total_capital: totalCapital, ok: true };
}
