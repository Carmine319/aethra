"use strict";

const registry = [];

function runPortfolioLoop(input = {}) {
  const idea = input.selectedIdea || {};
  const id = String(idea.name || idea.idea || `opp_${Date.now()}`);
  const capital = Number(input.capital || 0);
  const revenue = Number(input.revenue || 0);
  const roi = capital > 0 ? Number((revenue / capital).toFixed(4)) : 0;
  const row = {
    id,
    name: String(idea.name || idea.idea || "Opportunity"),
    status: "active",
    capitalAllocated: capital,
    revenue,
    roi,
    age: 1,
    performanceScore: Number((roi * 0.6 + Number(input.signalStrength || 0.5) * 0.25 + Number(input.conversionRate || 0.02) * 0.15).toFixed(4)),
    signalStrength: Number(input.signalStrength || 0.5),
    conversionRate: Number(input.conversionRate || 0.02),
  };
  const idx = registry.findIndex((x) => x.id === id);
  if (idx >= 0) registry[idx] = { ...registry[idx], ...row };
  else registry.push(row);

  const decided = registry.map((x) => {
    const kill = (x.revenue <= 0 && x.age >= 3) || x.roi < 1 || x.signalStrength < 0.35;
    const scale = x.roi >= 2 && x.signalStrength >= 0.65 && x.conversionRate >= 0.03;
    if (kill) return { ...x, status: "killed", capitalAllocated: 0 };
    if (scale) return { ...x, status: "scaled", capitalAllocated: Number((x.capitalAllocated * 1.25).toFixed(2)) };
    return { ...x, status: "active" };
  });

  const active = decided.filter((x) => x.status !== "killed");
  const totalCapital = active.reduce((a, x) => a + Number(x.capitalAllocated || 0), 0);
  const totalRevenue = active.reduce((a, x) => a + Number(x.revenue || 0), 0);
  const profit = Math.max(0, totalRevenue - totalCapital);
  const reinvestedCapital = Number((totalCapital + profit * 0.8).toFixed(2));

  return Promise.resolve({
    activePortfolio: active,
    compound: {
      reinvestedCapital,
      portfolioGrowthRate: totalCapital > 0 ? Number((profit / totalCapital).toFixed(4)) : 0,
    },
    matrix: {
      provenPerformers: Number((reinvestedCapital * 0.6).toFixed(2)),
      scalingOpportunities: Number((reinvestedCapital * 0.25).toFixed(2)),
      experimental: Number((reinvestedCapital * 0.15).toFixed(2)),
    },
    learning: {
      retainedInsights: ["Replicate high-ROI conversion flows", "Reallocate from low performers to scaled assets"],
      profitRelevantOnly: true,
    },
  });
}

module.exports = { runPortfolioLoop };
