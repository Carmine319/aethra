"use strict";

function updatePortfolio(state, business, thresholdNoRevenue = 3) {
  const current = state || {
    activeBusinesses: [],
    killedBusinesses: [],
    scaledBusinesses: [],
  };

  let status = business.status;
  if (business.revenue > 0) status = "scaled";
  if (business.revenue <= 0 && business.cyclesWithoutRevenue >= thresholdNoRevenue) status = "killed";

  const next = {
    activeBusinesses: current.activeBusinesses.filter((b) => b.id !== business.id),
    killedBusinesses: current.killedBusinesses.filter((b) => b.id !== business.id),
    scaledBusinesses: current.scaledBusinesses.filter((b) => b.id !== business.id),
  };
  const updated = { ...business, status };

  if (status === "active") next.activeBusinesses.push(updated);
  if (status === "killed") next.killedBusinesses.push(updated);
  if (status === "scaled") next.scaledBusinesses.push(updated);
  return next;
}

module.exports = { updatePortfolio };
