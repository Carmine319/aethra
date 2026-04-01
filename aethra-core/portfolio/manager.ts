export type PortfolioBusiness = {
  id: string;
  idea: string;
  status: "active" | "killed" | "scaled";
  revenue: number;
  cyclesWithoutRevenue: number;
};

export type PortfolioState = {
  activeBusinesses: PortfolioBusiness[];
  killedBusinesses: PortfolioBusiness[];
  scaledBusinesses: PortfolioBusiness[];
};

export function updatePortfolio(
  state: PortfolioState,
  business: PortfolioBusiness,
  thresholdNoRevenue = 3
): PortfolioState {
  const current: PortfolioState = state || {
    activeBusinesses: [],
    killedBusinesses: [],
    scaledBusinesses: [],
  };

  let status = business.status;
  if (business.revenue > 0) status = "scaled";
  if (business.revenue <= 0 && business.cyclesWithoutRevenue >= thresholdNoRevenue) status = "killed";

  const next = {
    activeBusinesses: [...current.activeBusinesses.filter((b) => b.id !== business.id)],
    killedBusinesses: [...current.killedBusinesses.filter((b) => b.id !== business.id)],
    scaledBusinesses: [...current.scaledBusinesses.filter((b) => b.id !== business.id)],
  };
  const updated = { ...business, status };

  if (status === "active") next.activeBusinesses.push(updated);
  if (status === "killed") next.killedBusinesses.push(updated);
  if (status === "scaled") next.scaledBusinesses.push(updated);
  return next;
}
