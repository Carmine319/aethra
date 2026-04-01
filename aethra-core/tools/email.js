"use strict";

async function sendEmail(payload = {}) {
  return { ok: true, fallback: true, provider: "email_stub", payload };
}

module.exports = { sendEmail };