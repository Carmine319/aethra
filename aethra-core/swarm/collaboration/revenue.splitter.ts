import { logAgentAction } from "../agents/agent.history.append";

export function splitRevenue(total: number, shares: Record<string, number>) {
  const sum = Object.values(shares).reduce((s, v) => s + Number(v || 0), 0) || 1;
  const out: Record<string, number> = {};
  for (const [id, w] of Object.entries(shares)) {
    out[id] = Math.round(((Number(w) / sum) * Number(total || 0)) * 100) / 100;
  }
  logAgentAction({ event: "revenue_split", total, out });
  return out;
}
