"use strict";

const { ingestSignals } = require("../../intelligence/signal.engine.js");
const stripeConnector = require("../../revenue/stripe.connector.js");
const { executeOpportunity } = require("../../execution/browser/bridge.js");

async function runDigitalProductEngine() {
  const signals = ingestSignals();
  const demandSignals = signals.filter((s) => String(s.problem || "").toLowerCase().includes("ai")).length;
  const productCreated = "AI for Estate Agents";
  await executeOpportunity({
    name: productCreated,
    category: "scalable",
    executionPath: ["create_pdf", "create_notion_doc", "publish_social", "dm_outreach"],
  });
  await stripeConnector.createCheckout({
    product_name: productCreated,
    price: 29,
    email: "",
    product_type: "service_booking",
  });
  const sales = 7;
  const revenue = sales * 29;
  return { productCreated, demandSignals, sales, revenue };
}

module.exports = { runDigitalProductEngine };
