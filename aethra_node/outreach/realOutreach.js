"use strict";

/**
 * Resend API — live send when RESEND_API_KEY set; otherwise simulated (no network).
 */

async function sendOutreachEmail({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const recipient = String(to || "").trim();
  if (!recipient) {
    return { ok: false, mode: "skipped", reason: "missing_to" };
  }

  if (typeof globalThis.fetch !== "function") {
    return {
      ok: true,
      mode: "simulated",
      message_id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      detail: "global fetch unavailable (Node 18+ required for live Resend) — message not sent.",
    };
  }

  if (!key) {
    return {
      ok: true,
      mode: "simulated",
      message_id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      detail: "RESEND_API_KEY not set — message not sent. Wire key + verified domain for live delivery.",
    };
  }

  const textBody = String(text || "").slice(0, 50000);
  const body = {
    from,
    to: [recipient],
    subject: String(subject || "AETHRA outreach").slice(0, 998),
    text: textBody || undefined,
    html:
      html ||
      (textBody
        ? `<pre style="font-family:system-ui">${escapeHtml(textBody)}</pre>`
        : "<p>(no body)</p>"),
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, mode: "live_error", status: res.status, error: j };
    }
    return { ok: true, mode: "live", message_id: j.id, raw: j };
  } catch (e) {
    return { ok: false, mode: "live_error", error: String(e.message || e) };
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = { sendOutreachEmail };
