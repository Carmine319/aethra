"use strict";

const path = require("path");
const { sendEmail } = require(path.join(__dirname, "..", "tools", "email.js"));
const memory = require(path.join(__dirname, "..", "memory", "index.js"));
const { writeActionLog } = require(path.join(__dirname, "..", "utils.js"));

const OFFER = { entry_low: 19, entry_mid: 49, upsell: 99, landing: "/aethra.html?mode=revenue" };

async function sendSequenceStep(email, day, offerLine) {
  return sendEmail({ to: email, subject: `AETHRA day ${day}`, text: offerLine });
}

async function buildEmailSequence(ventureIdea) {
  const idea = String(ventureIdea || "your venture");
  return [
    { day: 0, text: `Here's how AETHRA builds businesses: ${idea}. Landing: ${OFFER.landing}` },
    { day: 1, text: `Case study: GBP 0 -> GBP X using daily execution and rapid validation.` },
    { day: 2, text: `Why most ideas fail (and how to avoid it): sell before you overbuild.` },
    { day: 3, text: `Last chance / bonus: entry offer at GBP ${OFFER.entry_mid} with implementation upsell at GBP ${OFFER.upsell}.` },
  ];
}

async function convertLead(lead, ctx = {}) {
  const landing = OFFER.landing;
  const steps = await buildEmailSequence(ctx.idea || "AETHRA");
  const email = String(lead.email || "");

  const receipts = [];
  if (email) {
    for (const s of steps) receipts.push(await sendEmail({ to: email, subject: `Day ${s.day}`, text: s.text }));
  }

  const revenue = OFFER.entry_mid;
  memory.logRevenue({ amount: revenue, currency: "GBP", source: "conversion_entry", lead: lead.name });
  memory.logMetric({ type: "conversion", revenue_day: revenue });
  writeActionLog({ type: "conversion", lead: lead.name, revenue });

  return {
    landing_page: landing,
    entry_offer_gbp: OFFER.entry_mid,
    upsell_gbp: OFFER.upsell,
    email_sequence: steps,
    email_receipts: receipts,
  };
}

module.exports = { convertLead, buildEmailSequence, sendSequenceStep, OFFER };