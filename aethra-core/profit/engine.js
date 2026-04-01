"use strict";

function optimisePricing(input = {}) {
  const base = Number(input.basePrice || 99);
  const targetMargin = Math.max(0.9, Number(input.targetMargin || 0.9));
  const cost = Math.max(1, Number(input.cost || base * 0.08));
  const minPrice = Math.ceil(cost / (1 - targetMargin));
  return { price: Math.max(base, minPrice), target_margin: targetMargin };
}

function attachUpsell(product = {}) {
  const title = String(product.title || "Diagnostic");
  return {
    primary: title,
    upsell: `${title} + Implementation Sprint`,
    bundle_price_multiplier: 1.8,
  };
}

function selectDistributionChannels(input = {}) {
  const isDigital = input.digital_first !== false;
  const channels = isDigital ? ["email_outreach", "linkedin", "content_repurpose"] : ["local_referrals", "email_outreach"];
  return { channels, digital_first: isDigital, bundles: true };
}

module.exports = { optimisePricing, attachUpsell, selectDistributionChannels };