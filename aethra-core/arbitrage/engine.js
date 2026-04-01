"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { writeActionLog } = require("../utils.js");

function scanMarketplaces() {
  return [
    { platform: "gumroad", title: "Notion templates pack", demand_signal: 0.72, quality_signal: 0.41 },
    { platform: "etsy", title: "AI prompt bundles", demand_signal: 0.65, quality_signal: 0.48 },
    { platform: "fiverr", title: "Cold email gig", demand_signal: 0.8, quality_signal: 0.55 },
  ].filter((x) => x.demand_signal > 0.6 && x.quality_signal < 0.6);
}

function cloneAndImproveProduct(opportunity) {
  const improved = {
    title: `${opportunity.title} (AETHRA positioning refresh)`,
    pricing_gbp: [19, 49],
    differentiator: "Faster outcome proof + daily execution loop",
    channel: "organic + outreach",
  };
  writeActionLog({ type: "arbitrage_clone", opportunity, improved });
  return improved;
}

module.exports = { scanMarketplaces, cloneAndImproveProduct };