"use strict";

const { sendOutreachEmail } = require("./realOutreach");
const crm = require("../crm/crm");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Sends one message per target (personalised text). Live when RESEND_API_KEY is set.
 */
async function sendOutreachBatch(plan) {
  const subject = String((plan && plan.subject) || "AETHRA — fit check").slice(0, 998);
  const results = [];

  for (const t of (plan && plan.targets) || []) {
    const to = String(t.email || "").trim();
    if (!to) {
      results.push({ status: "skipped", target: t, reason: "missing_email" });
      continue;
    }
    const text = String(t.text || "").slice(0, 50000);
    const html = `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
    const r = await sendOutreachEmail({ to, subject, text, html });
    const leadKey = t.crm_id || t.lead_id;
    if (leadKey && r.ok) {
      crm.recordEmailSent(leadKey);
    }
    results.push({
      status: r.mode || (r.ok ? "sent" : "error"),
      target: { email: t.email, name: t.name },
      ok: r.ok,
      message_id: r.message_id,
      detail: r.detail || r.error,
    });
  }

  return results;
}

module.exports = { sendOutreachBatch };
