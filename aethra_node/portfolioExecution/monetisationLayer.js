"use strict";

const { createCheckoutSession } = require("../payments/stripe");

const DEFAULT_PRODUCT_TYPE = "venture_pilot";

/**
 * Stripe monetisation layer — Checkout sessions per pricing tier with portfolio metadata.
 * @param {Record<string, unknown>} business — output of buildBusiness
 * @param {{ campaign_id?: string, test_group?: string, user_id?: string, max_tiers?: number }} [opts]
 */
async function createMonetisationLayer(business, opts) {
  const o = opts && typeof opts === "object" ? opts : {};
  const venture_id = String(business?.id || "").slice(0, 120);
  const campaign_id = String(o.campaign_id || `cmp_${business?.built_at || Date.now()}`).slice(0, 120);
  const test_group = String(o.test_group || "control").slice(0, 64);
  const maxTiers = Math.max(1, Math.min(5, Number(o.max_tiers) || 3));
  const tiers = Array.isArray(business?.pricing_model?.tiers) ? business.pricing_model.tiers : [];
  const brand = String(business?.brand?.name || "Venture").slice(0, 80);

  const checkout_sessions = [];
  for (let i = 0; i < Math.min(tiers.length, maxTiers); i++) {
    const t = tiers[i];
    const name = String(t?.name || `Tier ${i + 1}`).slice(0, 40);
    const price_gbp = Math.max(1, Number(t?.price_gbp) || 1);
    const session = await createCheckoutSession({
      name: `${brand} — ${name}`.slice(0, 120),
      amount_gbp: price_gbp,
      venture_id,
      campaign_id,
      test_group,
      price_tier: name,
      product_type: DEFAULT_PRODUCT_TYPE,
      customer_email: o.user_id && String(o.user_id).includes("@") ? String(o.user_id) : undefined,
    });
    checkout_sessions.push({
      tier: name,
      price_gbp,
      detail: t?.detail,
      ...session,
    });
  }

  if (!checkout_sessions.length) {
    const anchor = Math.max(1, Number(business?.pricing_model?.anchor_gbp) || 49);
    const session = await createCheckoutSession({
      name: `${brand} — Pilot`.slice(0, 120),
      amount_gbp: anchor,
      venture_id,
      campaign_id,
      test_group,
      price_tier: "pilot",
      product_type: DEFAULT_PRODUCT_TYPE,
    });
    checkout_sessions.push({
      tier: "pilot",
      price_gbp: anchor,
      ...session,
    });
  }

  return {
    venture_id,
    campaign_id,
    test_group,
    product_type: DEFAULT_PRODUCT_TYPE,
    metadata_keys: ["venture_id", "campaign_id", "test_group", "price_tier", "aethra_product_type"],
    checkout_sessions,
  };
}

module.exports = { createMonetisationLayer, DEFAULT_PRODUCT_TYPE };
