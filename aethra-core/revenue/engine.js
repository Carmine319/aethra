"use strict";

const path = require("path");
const { generateDailyContent, generateVideoFromScript } = require("../content/engine.js");
const { scrapeLeads } = require("../leads/scraper.js");
const { runOutreach } = require("../outreach/engine.js");
const { convertLead } = require("../conversion/engine.js");
const { scanMarketplaces, cloneAndImproveProduct } = require("../arbitrage/engine.js");
const { generateDossier } = require("../trustorigin/engine.js");
const { summarizePerformance } = require("../metrics/performance.js");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));
const { writeCoreLog, writeActionLog } = require(path.join(__dirname, "..", "utils.js"));

function readOffer() {
  try {
    const fs = require("fs");
    const p = path.join(__dirname, "self-product", "offer.json");
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {
      headline: "Turn Any Idea Into a Revenue-Generating Business",
      price: [19, 49, 99],
      format: "digital system + reports + automation",
      cta: "Start Building Now",
    };
  }
}

async function runRevenueLoop(seedCtx = {}) {
  try {
    const { readStateBeforeAction } = require(path.join(__dirname, "..", "organism", "readStateBeforeAction.js"));
    readStateBeforeAction(seedCtx);
  } catch {
    /* organism prelude optional */
  }
  const offer = readOffer();
  const content = generateDailyContent();
  const video = generateVideoFromScript(content.video_script);

  const publish = {
    linkedin: content.short_form_posts.find((p) => p.platform === "linkedin"),
    reddit: content.short_form_posts.find((p) => p.platform === "reddit"),
    x: content.short_form_posts.find((p) => p.platform === "x"),
    blog: content.long_form_post,
  };
  memory.logMetric({ type: "publish_queue", channels: Object.keys(publish).length });
  writeActionLog({ type: "revenue_publish_plan", publish });

  let leads = scrapeLeads();
  if (!leads.length) {
    leads = scrapeLeads();
    memory.logLearning({ type: "scrape_double_pass", reason: "no_leads" });
  }

  const outreach = runOutreach(leads, { offer });
  const conversions = [];
  for (let i = 0; i < Math.min(3, leads.length); i++) {
    conversions.push(await convertLead({ ...leads[i], email: leads[i].email || "" }, { idea: offer.headline }));
  }

  const opps = scanMarketplaces().map(cloneAndImproveProduct);
  const dossier = generateDossier({ venture: offer.headline, pricing: offer.price });

  const perf = summarizePerformance();
  const optimisations = [];
  if (perf.leads_per_day < 5) {
    optimisations.push("increase_scraping_depth");
    leads = scrapeLeads();
  }
  if (perf.reply_rate < 5) {
    optimisations.push("improve_messaging_soft_tone_bias");
    memory.logLearning({ type: "message_tune", reply_rate: perf.reply_rate });
  }
  if (perf.revenue_per_day < 10) {
    optimisations.push("adjust_offer_price_ladder");
    offer.price = [19, 39, 89];
    memory.logLearning({ type: "offer_adjust", prices: offer.price });
  }

  memory.logRevenue({
    amount: perf.revenue_per_day,
    currency: "GBP",
    source: "revenue_loop_aggregate",
  });
  memory.logLearning({
    type: "revenue_loop_summary",
    perf,
    optimisations,
  });

  const summary = {
    ok: true,
    offer,
    content,
    video,
    publish,
    leads_scraped: leads.length,
    outreach,
    conversions,
    arbitrage: opps,
    trustorigin: dossier,
    performance: perf,
    optimisations,
  };
  writeCoreLog({ event: "revenue_loop", summary_keys: Object.keys(summary) });
  return summary;
}

module.exports = { runRevenueLoop, readOffer };
