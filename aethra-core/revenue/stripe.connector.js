"use strict";

const fs = require("fs");
const path = require("path");
const stripeApi = require("../../aethra_node/payments/stripe.js");
const memory = require("../memory/index.js");

const APPEND_ONLY_MEMORY = path.join(__dirname, "..", "..", "aethra_memory", "aethra.actions.jsonl");

function appendMemory(event) {
  fs.mkdirSync(path.dirname(APPEND_ONLY_MEMORY), { recursive: true });
  fs.appendFileSync(APPEND_ONLY_MEMORY, JSON.stringify({ ts: Date.now(), ...event }) + "\n", "utf8");
}

async function createCheckout(product) {
  const payload = product && typeof product === "object" ? product : {};
  const session = await stripeApi.createCheckoutSession({
    name: String(payload.product_name || "AETHRA product"),
    amount_gbp: Number(payload.price || 0),
    customer_email: payload.email ? String(payload.email) : "",
    product_type: String(payload.product_type || "service_booking"),
    venture_id: payload.venture_id ? String(payload.venture_id) : "",
  });
  appendMemory({
    kind: "stripe_checkout_created",
    product_name: String(payload.product_name || "AETHRA product"),
    price: Number(payload.price || 0),
    email: payload.email ? String(payload.email) : "",
    stripe_mode: session.mode || "unknown",
  });
  return session;
}

function handleWebhook(event) {
  const body = typeof event === "string" ? event : JSON.stringify(event || {});
  const out = stripeApi.handleWebhook(body, "");
  appendMemory({
    kind: "stripe_webhook_handled",
    received: out && out.received !== false,
    type: out && out.type ? out.type : "unknown",
  });
  memory.logRevenue({
    venture_id: "stripe",
    amount: Number(out && out.recorded_gbp ? out.recorded_gbp : 0),
    currency: "GBP",
    product: (event && event.data && event.data.object && event.data.object.metadata && event.data.object.metadata.aethra_product_type) || "unknown",
    source: "stripe_webhook",
  });
  return out;
}

module.exports = { createCheckout, handleWebhook };
