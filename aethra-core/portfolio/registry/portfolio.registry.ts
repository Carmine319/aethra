import { OpportunityState } from "./opportunity.state";

const portfolioRegistry: OpportunityState[] = [];

export function registerOpportunity(opportunity: OpportunityState) {
  const exists = portfolioRegistry.some((x) => x.id === opportunity.id);
  if (!exists) portfolioRegistry.push(opportunity);
  return opportunity;
}

export function updateOpportunity(id: string, patch: Partial<OpportunityState>) {
  const idx = portfolioRegistry.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  portfolioRegistry[idx] = { ...portfolioRegistry[idx], ...patch };
  return portfolioRegistry[idx];
}

export function getActivePortfolio() {
  return portfolioRegistry.filter((x) => x.status !== "killed");
}
