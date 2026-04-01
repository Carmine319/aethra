"use strict";

const crypto = require("crypto");

function getBaseUrl() {
  return (
    String(process.env.AETHRA_PUBLIC_BASE_URL || "http://127.0.0.1:3847").replace(/\/$/, "") ||
    "http://127.0.0.1:3847"
  );
}

/**
 * Stripe Checkout — subscription (mode=subscription).
 * Webhook sets user plan in local planStore; does not credit wallet revenue.
 */
async function createSubscriptionSession(userId, priceId, planKey) {
  const key = process.env.STRIPE_SECRET_KEY;
  const uid = String(userId || "anonymous").slice(0, 120);

  const price = String(priceId || "").trim();
  const plan = String(planKey || "").trim().toLowerCase();
  if (!price) return { ok: false, error: "missing_price_id" };
  if (!plan) return { ok: false, error: "missing_plan_key" };

  if (!key || key.startsWith("sk_placeholder")) {
    return {
      ok: true,
      mode: "simulated",
      url: null,
      session_id: `sim_sub_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      amount_gbp_month: plan === "operator" ? 49 : plan === "portfolio" ? 199 : 0,
      user_id: uid,
      plan,
      detail: "STRIPE_SECRET_KEY not set — no live Checkout. Use test keys for live.",
    };
  }

  const base = getBaseUrl();
  const success = `${base}/?stripe=success&sub=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancel = `${base}/?stripe=cancel&sub=1`;

  const params = new URLSearchParams();
  params.append("mode", "subscription");
  params.append("payment_method_types[0]", "card");
  params.append("success_url", success);
  params.append("cancel_url", cancel);
  params.append("line_items[0][price]", price);
  params.append("line_items[0][quantity]", "1");
  params.append("metadata[user_id]", uid);
  params.append("metadata[aethra_product_type]", "subscription");
  params.append("metadata[plan]", plan);

  let res;
  try {
    res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, error: data };

  return {
    ok: true,
    mode: "live",
    url: data.url,
    session_id: data.id,
    plan,
    user_id: uid,
  };
}

module.exports = { createSubscriptionSession };

