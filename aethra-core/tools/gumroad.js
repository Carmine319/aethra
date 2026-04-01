"use strict";

async function createGumroadOffer(payload = {}) {
  return { ok: false, fallback: true, provider: "gumroad_unavailable", payload };
}

module.exports = { createGumroadOffer };