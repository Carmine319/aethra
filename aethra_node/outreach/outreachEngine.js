"use strict";

const { appendEconomicMemory } = require("../profit/systemMemory");

function clip(s, n) {
  const t = String(s || "").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "...";
}

function generateMessage(lead, offer) {
  const who = clip(lead.name, 40);
  const hook = clip(offer, 120);
  return `${who} - quick question: we deliver ${hook}. Worth a 12-minute call this week to see fit?`;
}

function generateSequence(lead) {
  const n = clip(lead.name, 28);
  return {
    initial: `Hi ${n}, saw your operation in ${lead.location}. We help teams cut cycle time on the problem you solve - open to a one-line reply if this is on your radar?`,
    follow_up_1: `${n} - following up once. One concrete outcome we could pilot in 14 days; no deck unless you want it. Still relevant?`,
    follow_up_2: `${n} - last note from me. If timing is wrong, a one-word \"later\" is enough. If useful, I will send two slots Thursday.`,
  };
}

async function generateOutreachPlan(idea, supplierPack) {
  const ideaStr = String(idea || "").trim();
  const leads = (require("../operator/leadEngine").findLeads(ideaStr) || []).filter((L) => L.email);
  const capped = leads.slice(0, 5);
  const offer = clip(ideaStr, 120);
  const subject = `${clip(ideaStr, 52)} - quick fit check`;
  const targets = capped.map((L) => ({
    lead_id: L.id,
    name: L.name,
    email: L.email,
    phone: L.phone,
    location: L.location,
    niche_score: L.niche_score,
    text: generateMessage(L, offer),
  }));
  return {
    idea: ideaStr,
    subject,
    supplier_query_digest: (supplierPack && supplierPack.query_digest) || "",
    targets,
  };
}

function executeStructuredOutreach(leads, niche, offer) {
  const list = Array.isArray(leads) ? leads : [];
  const maxPerDay = 30;
  const sent = list.slice(0, maxPerDay).map((lead, i) => {
    const outcome = String((offer && offer.promise) || "measurable operational outcome");
    const body =
      `Subject: Quick fit check\n\n` +
      `We help ${niche && niche.niche ? niche.niche : "teams"} improve ${outcome}.\n\n` +
      `Is this currently handled internally, or would a short 10-15 minute check be useful?\n\n` +
      `If not relevant, I will not follow up.\n\n` +
      `Context: ${lead.business || lead.name || "operation"}`;
    return {
      id: `outreach_${i + 1}`,
      to: lead.email,
      lead_name: lead.name,
      personalized: true,
      subject: "Quick fit check",
      message: body,
      niche: lead.niche,
      sent_at: Date.now(),
    };
  });

  appendEconomicMemory({
    kind: "messages_performance",
    sent_count: sent.length,
    cap: maxPerDay,
    niche: niche && niche.niche ? niche.niche : null,
    subject: "Quick fit check",
  });

  return {
    sent_count: sent.length,
    daily_cap: maxPerDay,
    messages: sent,
  };
}

module.exports = {
  generateMessage,
  generateSequence,
  generateOutreachPlan,
  executeStructuredOutreach,
};