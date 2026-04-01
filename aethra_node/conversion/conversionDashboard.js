"use strict";

function isPreReplyStage(stage) {
  const s = String(stage || "lead").toLowerCase();
  return s === "lead" || s === "new";
}

/**
 * Aggregate conversion view — aligns CRM stages (lead, not legacy "new").
 */
function computeMetrics(deals, hints = {}) {
  const list = Array.isArray(deals) ? deals : [];
  const total = list.length;

  const closed = list.filter((d) => d && String(d.stage || "").toLowerCase() === "closed").length;
  const replied = list.filter((d) => d && !isPreReplyStage(d.stage)).length;

  const reply_rate = total ? Math.round((replied / total) * 10000) / 100 : 0;
  const close_rate = total ? Math.round((closed / total) * 10000) / 100 : 0;

  const best_channel = hints.best_channel != null ? hints.best_channel : inferBestChannel(list);
  const best_message = hints.best_message != null ? hints.best_message : inferBestMessage(list);

  return {
    total_leads: total,
    reply_count: replied,
    reply_rate,
    close_count: closed,
    close_rate,
    best_channel,
    best_message,
  };
}

function inferBestChannel(deals) {
  const counts = {};
  for (const d of deals) {
    const ch = d && (d.channel || d.source || d.acquisition_channel);
    if (!ch) continue;
    const k = String(ch);
    counts[k] = (counts[k] || 0) + 1;
  }
  const keys = Object.keys(counts);
  if (!keys.length) return null;
  return keys.reduce((a, b) => (counts[a] >= counts[b] ? a : b));
}

function inferBestMessage(deals) {
  const counts = {};
  for (const d of deals) {
    const m = d && (d.best_message || d.last_subject || d.outreach_hook);
    if (!m) continue;
    const k = String(m);
    counts[k] = (counts[k] || 0) + 1;
  }
  const keys = Object.keys(counts);
  if (!keys.length) return null;
  return keys.reduce((a, b) => (counts[a] >= counts[b] ? a : b));
}

function formatOverview(metrics) {
  const m = metrics && typeof metrics === "object" ? metrics : computeMetrics([]);
  const lines = [
    "Conversion Overview",
    "",
    `Leads: ${m.total_leads}`,
    `Replies: ${m.reply_count} (${m.reply_rate}%)`,
    `Closed: ${m.close_count} (${m.close_rate}%)`,
  ];
  if (m.best_channel) lines.push("", `Best Channel: ${m.best_channel}`);
  if (m.best_message) lines.push(`Best Message: "${m.best_message}"`);
  return lines.join("\n");
}

module.exports = {
  computeMetrics,
  formatOverview,
  inferBestChannel,
  inferBestMessage,
};
