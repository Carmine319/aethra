"use strict";

/** In-memory pipeline — swap for DB adapter without changing API. */
let pipeline = [];
let idSeq = 1;
let emailsSentTotal = 0;
let stageTransitionsTotal = 0;

function normalizeLead(lead) {
  const id = String(lead.id || `L${idSeq++}`);
  return {
    ...lead,
    id,
    stage: lead.stage || "lead",
    updatedAt: lead.updatedAt || Date.now(),
    createdAt: lead.createdAt || Date.now(),
    emails_sent: lead.emails_sent || 0,
    history: Array.isArray(lead.history) ? lead.history : [],
  };
}

const MAX_HISTORY_PER_LEAD = 48;

function pushHistory(row, stage) {
  if (!Array.isArray(row.history)) row.history = [];
  row.history.push({ stage, at: Date.now() });
  if (row.history.length > MAX_HISTORY_PER_LEAD) {
    row.history = row.history.slice(-MAX_HISTORY_PER_LEAD);
  }
  stageTransitionsTotal++;
}

function addLead(lead) {
  const row = normalizeLead(lead);
  const email = String(row.email || "").toLowerCase();
  const existing = email
    ? pipeline.find((p) => String(p.email || "").toLowerCase() === email)
    : pipeline.find((p) => p.id === row.id);
  if (existing) {
    Object.assign(existing, row, { updatedAt: Date.now() });
    return existing;
  }
  pushHistory(row, row.stage);
  pipeline.push(row);
  return row;
}

const ALLOWED_STAGES = ["lead", "contacted", "replied", "negotiation", "closed", "lost", "archived"];

function updateStage(leadId, stage) {
  const allowed = new Set(ALLOWED_STAGES);
  if (!allowed.has(stage)) return null;
  const row = pipeline.find((p) => p.id === leadId);
  if (!row) return null;
  if (row.stage !== stage) {
    row.stage = stage;
    row.updatedAt = Date.now();
    pushHistory(row, stage);
  }
  return row;
}

function recordEmailSent(leadId) {
  const row = pipeline.find((p) => p.id === leadId);
  if (!row) return null;
  row.emails_sent = (row.emails_sent || 0) + 1;
  row.last_email_at = Date.now();
  row.updatedAt = Date.now();
  emailsSentTotal++;
  return row;
}

function getPipeline() {
  return pipeline.map((p) => ({
    ...p,
    history: Array.isArray(p.history) ? p.history.map((h) => ({ ...h })) : [],
  }));
}

function getMetrics() {
  const pl = pipeline;
  const byStage = {};
  let contacted = 0;
  let progressed = 0;
  for (const row of pl) {
    const s = row.stage || "lead";
    byStage[s] = (byStage[s] || 0) + 1;
    if (s !== "lead") contacted++;
    if (s === "replied" || s === "negotiation" || s === "closed") progressed++;
  }
  const replyProxy =
    contacted > 0 ? Math.round((progressed / Math.max(1, contacted)) * 1000) / 1000 : 0;
  return {
    total_leads: pl.length,
    by_stage: byStage,
    emails_sent_total: emailsSentTotal,
    stage_transitions_total: stageTransitionsTotal,
    reply_progression_rate: replyProxy,
    pipeline_health:
      pl.length === 0
        ? "empty"
        : replyProxy >= 0.35
          ? "strong"
          : replyProxy >= 0.15
            ? "mixed"
            : "cold",
  };
}

function resetPipeline() {
  pipeline = [];
  idSeq = 1;
  emailsSentTotal = 0;
  stageTransitionsTotal = 0;
}

module.exports = {
  addLead,
  updateStage,
  getPipeline,
  getMetrics,
  recordEmailSent,
  resetPipeline,
  ALLOWED_STAGES,
};
