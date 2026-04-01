"use strict";

const { selectTopNiche } = require("../niche/nicheEngine");
const { generateOffer } = require("../offer/offerEngine");
const { generateLeads } = require("../leads/leadEngine");
const { executeStructuredOutreach } = require("../outreach/outreachEngine");
const { processReplyCycle } = require("../reply/replyEngine");
const { generateCallScript } = require("../sales/callEngine");
const { buildFulfilmentPlan } = require("../fulfilment/fulfilmentEngine");
const { generateProofAssets } = require("../proof/proofEngine");
const { computeKpis } = require("../profit/kpiEngine");
const { decideKillScale } = require("../profit/killScale");
const { runLiveScalingBrain } = require("../scalingBrain/scalingLoop");
const { runLivePortfolioBrain } = require("../portfolio/portfolioBrain");
const { appendEconomicMemory } = require("../profit/systemMemory");

async function runEconomicLoop(inputText, context = {}) {
  const niche = selectTopNiche({ input: inputText });
  const offer = generateOffer(niche);
  const leads = generateLeads(niche);
  const outreach = executeStructuredOutreach(leads, niche.selected, offer);

  const replies = processReplyCycle(outreach.messages, {
    niche: niche.selected.niche,
    offer: offer.title,
  });

  const call = generateCallScript({ niche: niche.selected.niche });
  const fulfilment = await buildFulfilmentPlan(niche);

  const closes = replies.closed_count;
  const revenue = closes * Number(String(offer.price).replace(/[^0-9.]/g, "") || 99);
  const kpis = computeKpis({
    leads: leads.length,
    replies: replies.replied_count,
    bookings: replies.booked_count,
    closes,
    revenue,
    cost: closes > 0 ? closes * 35 : 70,
  });
  const adaptation = decideKillScale(kpis);
  const proof = generateProofAssets({
    niche: niche.selected.niche,
    outcome: closes > 0 ? "confirmed revenue movement" : "validated no-go risk",
    timeline: "72 hours",
  });

  const scaling = runLiveScalingBrain();
  const portfolio = runLivePortfolioBrain({ recordMemory: true });

  const sections = {
    "System Judgement": `Niche ${niche.selected.niche} selected with score ${niche.selected.score}. Decision posture is ${adaptation.action}.`,
    "Execution Pathway": `Offer deployed: ${offer.title}. Call flow locked to Context -> Diagnosis -> Framing -> Decision -> Close.`,
    "Supply & Infrastructure": `Fulfilment supplier channel prepared (${fulfilment.supplier}). Execution SLA ${fulfilment.time_to_complete}.`,
    Acquisition: `Lead batch ${leads.length} generated and ${outreach.sent_count} outreach messages dispatched under cap control.`,
    "Revenue Logic": `Projected cycle revenue GBP ${kpis.revenue}. Reply rate ${kpis.reply_rate}% and close rate ${kpis.close_rate}% tracked.`,
    "Portfolio Impact": `Scaling top venture ${scaling.top_venture || "none"}. Portfolio action ${portfolio.system_action}.`,
    "System Action": `Immediate action: ${adaptation.action} (${adaptation.reason}).`,
  };

  const result = {
    flow: "NICHE -> OFFER -> LEADS -> OUTREACH -> REPLIES -> CLOSE -> DELIVERY -> PROOF -> SCALE -> PORTFOLIO",
    niche,
    offer,
    leads: {
      total: leads.length,
      sample: leads.slice(0, 6),
    },
    outreach,
    replies,
    call,
    fulfilment,
    proof,
    kpis,
    adaptation,
    scaling,
    portfolio,
    sections,
  };

  appendEconomicMemory({
    kind: "economic_loop_run",
    input: String(inputText || "").slice(0, 220),
    niche: niche.selected,
    kpis,
    adaptation,
  });

  return result;
}

module.exports = { runEconomicLoop };