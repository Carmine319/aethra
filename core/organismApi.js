"use strict";

const path = require("path");
const { loadMemory } = require("./memory/store");
const { calculateDailyRevenue, calculateWinRate, projectGrowth } = require("./profit/engine");
const ROOT = path.resolve(__dirname, "..");
const { loadState } = require(path.join(ROOT, "aethra_node", "portfolioExecution", "stateStore"));

function lastExecutionFromMemory(mem) {
  const log = Array.isArray(mem.historicalLog) ? mem.historicalLog : [];
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].kind === "cycle_complete") return log[i];
  }
  return null;
}

function topTemplateFromDist() {
  try {
    const { rankTemplates } = require(path.join(__dirname, "dist-cjs", "templates", "evolution.js"));
    const r = rankTemplates();
    return r[0] || null;
  } catch {
    return null;
  }
}

function diagnosticsFromDist() {
  try {
    const { getLastDiagnostics, runDiagnostics } = require(path.join(__dirname, "dist-cjs", "diagnostics", "index.js"));
    let d = getLastDiagnostics();
    if (!d || Date.now() - d.at > 120000) {
      runDiagnostics().catch(() => {});
      d = getLastDiagnostics();
    }
    return d;
  } catch {
    return null;
  }
}

function getOrganismSnapshot() {
  const mem = loadMemory();
  const s = loadState();
  const daily = calculateDailyRevenue(s);
  const win = calculateWinRate(s);
  const growth = projectGrowth({ last_cycle_ts: s.last_cycle_ts, portfolio_cycles: s.usage?.portfolio_cycles });
  const lastExecution = lastExecutionFromMemory(mem);
  const topTemplate = topTemplateFromDist();
  const diagnostics = diagnosticsFromDist();

  return {
    ok: true,
    memory: {
      verifiedRevenueGbp: Number(mem.verifiedRevenueGbp) || 0,
      totalDeployments: mem.totalDeployments,
      activeSystems: mem.activeSystems,
    },
    portfolio: {
      autonomous_enabled: !!s.autonomous_enabled,
      last_cycle_ts: s.last_cycle_ts,
      active_businesses: s.businesses.filter((b) => b.status === "live").length,
      feed_tail: s.feed.slice(0, 3),
    },
    profit: {
      daily,
      winRate: win,
      growth,
    },
    execution: {
      last_result: lastExecution
        ? {
            ok: lastExecution.ok,
            top_template_id: lastExecution.top_template_id,
            revenue: lastExecution.revenue,
            at: lastExecution.ts,
          }
        : null,
      top_template: topTemplate
        ? { id: topTemplate.id, rankScore: topTemplate.rankScore, stats: topTemplate.stats }
        : null,
    },
    health: diagnostics
      ? { level: diagnostics.health, stuck_deployments: diagnostics.stuckDeployments?.length || 0 }
      : { level: "UNKNOWN", stuck_deployments: 0 },
    mode: {
      autonomous: !!s.autonomous_enabled,
      assisted: !s.autonomous_enabled,
    },
  };
}

module.exports = { getOrganismSnapshot };
