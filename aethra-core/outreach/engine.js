"use strict";

const path = require("path");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));
const { writeActionLog } = require(path.join(__dirname, "..", "utils.js"));

function generateMessage(lead, tone = "direct") {
  const t = String(tone || "direct").toLowerCase();
  if (t === "soft") return `I documented how I went from idea to live product using AI - happy to share if useful.`;
  return `Hey - saw you're trying to start something. I built a system that turns ideas into real businesses in days. Want to see it?`;
}

function runOutreach(leads, opts = {}) {
  const list = Array.isArray(leads) ? leads : [];
  const sent = list.map((L, i) => {
    const tone = i % 3 === 0 ? "soft" : "direct";
    return {
      lead: L.name,
      platform: L.platform,
      message: generateMessage(L, tone),
      tone,
      sent_at: Date.now(),
    };
  });

  memory.logMetric({ type: "outreach", messages_sent: sent.length });
  writeActionLog({ type: "outreach_run", messages_sent: sent.length });
  return { sent, messages_sent: sent.length };
}

module.exports = { generateMessage, runOutreach };