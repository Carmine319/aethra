"use strict";

async function deployVenture(payload = {}) {
  return { ok: true, fallback: true, provider: "deploy_stub", status: "queued", payload };
}

module.exports = { deployVenture };