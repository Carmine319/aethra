"use strict";

const path = require("path");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));

function summarizePerformance() {
  const leads = memory.readJsonl(memory.FILES.leads, 2000);
  const metricsRaw = memory.readJsonl(memory.FILES.metrics, 5000);

  const dayMs = 86400000;
  const now = Date.now();

  const todaysLeads = leads.filter((l) => now - Number(l.ts || 0) < dayMs).length;
  const todaysOutreach = metricsRaw.filter((m) => m.type === "outreach" && now - Number(m.ts || 0) < dayMs);
  const messages = todaysOutreach.reduce((a, m) => a + Number(m.messages_sent || 0), 0);
  const conv = metricsRaw.filter((m) => m.type === "conversion" && now - Number(m.ts || 0) < dayMs);
  const revenue = conv.reduce((a, m) => a + Number(m.revenue_day || 0), 0);

  const replies = conv.length ? Math.min(messages, conv.length * 2) : Math.round(messages * 0.12);

  const reply_rate = messages ? Math.round((replies / messages) * 10000) / 100 : 0;
  const conversion_rate = messages ? Math.round((conv.length / messages) * 10000) / 100 : 0;

  return {
    leads_per_day: todaysLeads,
    messages_sent: messages,
    reply_rate,
    conversion_rate,
    revenue_per_day: revenue,
  };
}

module.exports = { summarizePerformance };