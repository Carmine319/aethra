"use strict";

/**
 * UI copy helpers — browser can mirror; kept isomorphic-friendly.
 */
function operatorActivitySummary(data) {
  const act = data?.autonomous?.operator_activity;
  if (!act) return "Operator cycle did not execute on this pass.";
  const parts = [];
  if (act.venture_launched && act.venture_name) {
    parts.push(
      `Operator launch has been staged for «${act.venture_name}» with £${act.budget_allocated} allocated from wallet.`
    );
  } else {
    parts.push("No venture launch executed; gating or wallet constraints applied.");
  }
  parts.push(`${act.leads_generated || 0} lead rows surfaced (discovery pass).`);
  if (act.suppliers_surfaced != null) {
    parts.push(`${act.suppliers_surfaced} supplier relationships surfaced — verify before procurement.`);
  }
  if ((act.emails_live || 0) > 0 || (act.emails_simulated || 0) > 0) {
    parts.push(
      `Outreach: ${act.emails_live || 0} live dispatch(es), ${act.emails_simulated || 0} simulated (credentials determine live path).`
    );
  }
  parts.push(`${act.replies_simulated || 0} inbound replies classified; CRM and draft responses updated.`);
  if ((act.simulated_closes || 0) > 0) {
    parts.push(
      `${act.simulated_closes} close event(s) logged — £${act.simulated_revenue_gbp || 0} revenue tagged, £${act.reinvest_tagged_gbp || 0} reinvest pool.`
    );
  }
  return parts.join(" ");
}

function crmSnapshotSummary(data) {
  const crm = data?.autonomous?.crm || {};
  const pl = crm.pipeline || [];
  const m = crm.metrics;
  if (!pl.length && !m) return "CRM pipeline empty.";
  const by = {};
  for (const row of pl) {
    const s = row.stage || "lead";
    by[s] = (by[s] || 0) + 1;
  }
  const stageStr = Object.entries(by).map(([k, v]) => `${k} ${v}`).join(" · ");
  if (m && typeof m.reply_progression_rate === "number") {
    const pct = Math.round(m.reply_progression_rate * 100);
    return `Stages: ${stageStr || "—"}. Reply progression ~${pct}%. Health: ${m.pipeline_health || "—"}. Emails logged: ${m.emails_sent_total ?? 0}.`;
  }
  return pl.length ? `Stages: ${stageStr}` : "CRM metrics only.";
}

function venturesSummary(data) {
  const v = data?.venture?.active_ventures || [];
  if (!v.length) return "No recorded venture allocations yet.";
  return v
    .map((x) => {
      const tag = x.archived ? " (archived)" : "";
      return `«${x.name}»: £${x.budget} allocated, revenue £${x.revenue || 0}${tag}`;
    })
    .join(" · ");
}

function walletSummary(data) {
  const w = data?.venture?.wallet || {};
  if (w.balance == null) return "Wallet not initialised.";
  const pool = w.reinvest_pool != null ? w.reinvest_pool : 0;
  return `Wallet balance: £${w.balance} (GBP). Reinvest pool tagged: £${pool}.`;
}

function portfolioDashboardSummary(data) {
  const p = data?.portfolio;
  if (!p || typeof p !== "object") return "Portfolio block: run through Node host for ledger-backed metrics.";
  const basis = p.success_rate_basis ? ` (${p.success_rate_basis.replace(/_/g, " ")})` : "";
  return (
    `Liquid £${p.total_wallet} · combined £${p.total_combined} · active ${p.active_ventures} · ` +
    `revenue £${p.total_revenue} · net £${p.net_profit} · success rate ${p.success_rate}${basis}`
  );
}

function synergySummary(data) {
  const s = data?.synergy;
  if (!s || typeof s !== "object") return "";
  const parts = [];
  if (Array.isArray(s.shared_patterns) && s.shared_patterns[0]) {
    parts.push(s.shared_patterns[0]);
  }
  if (s.cross_impact) parts.push(s.cross_impact);
  return parts.join(" ");
}

function ideasSummary(data) {
  const s = data?.ideas_layer?.suggestions;
  if (!Array.isArray(s) || !s.length) return "";
  return s
    .slice(0, 5)
    .map((x) => `${String(x.idea || "").slice(0, 72)} — score ${x.score != null ? x.score : "—"}`)
    .join(" · ");
}

function viralSummary(data) {
  const v = data?.viral_layer;
  if (!v || typeof v !== "object") return "";
  const parts = [];
  if (v.attribution_line) parts.push(String(v.attribution_line));
  if (v.share_url) parts.push(`Shareable report: ${v.share_url}`);
  if (v.canonical_share_url) parts.push(`Public path: ${v.canonical_share_url}`);
  if (v.referral && v.referral.detail) parts.push(String(v.referral.detail));
  return parts.join(" ");
}

function economicSystemSummary(data) {
  const e = data?.autonomous_economic;
  if (!e || typeof e !== "object") return "";
  const k = e.kpis || {};
  const a = e.adaptation || {};
  const niche = e?.niche?.selected?.niche || "niche pending";
  return (
    `Economic loop: ${niche}. ` +
    `Leads ${k.leads || 0}, replies ${k.replies || 0}, closes ${k.closes || 0}, revenue GBP ${k.revenue || 0}. ` +
    `Action: ${a.action || "maintain"}${a.reason ? ` (${a.reason})` : ""}.`
  );
}

module.exports = {
  operatorActivitySummary,
  crmSnapshotSummary,
  venturesSummary,
  walletSummary,
  portfolioDashboardSummary,
  synergySummary,
  ideasSummary,
  viralSummary,
  economicSystemSummary,
};
