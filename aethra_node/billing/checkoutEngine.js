"use strict";

const crypto = require("crypto");

function getBaseUrl() {
  return (
    String(process.env.AETHRA_PUBLIC_BASE_URL || "http://127.0.0.1:3847").replace(/\/$/, "") ||
    "http://127.0.0.1:3847"
  );
}

/**
 * Stripe Checkout — deal payment processed by AETHRA.
 * Webhook applies 5% performance fee to user ledger net credit.
 */
async function createDealCheckout(userId, amountGbp) {
  const key = process.env.STRIPE_SECRET_KEY;
  const uid = String(userId || "anonymous").slice(0, 120);

  const amount = Math.max(1, Math.min(500000, Math.round(Number(amountGbp) || 0)));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "bad_amount" };
  const amountP = Math.round(amount * 100);

  if (!key || key.startsWith("sk_placeholder")) {
    return {
      ok: true,
      mode: "simulated",
      url: null,
      session_id: `sim_deal_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      amount_gbp: amount,
      user_id: uid,
      detail: "STRIPE_SECRET_KEY not set — no live Checkout. Use test keys for live.",
    };
  }

  const base = getBaseUrl();
  const success = `${base}/?stripe=success&deal=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancel = `${base}/?stripe=cancel&deal=1`;

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("payment_method_types[0]", "card");
  params.append("success_url", success);
  params.append("cancel_url", cancel);
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "gbp");
  params.append("line_items[0][price_data][product_data][name]", "AETHRA Deal Payment");
  params.append("line_items[0][price_data][unit_amount]", String(amountP));
  params.append("metadata[user_id]", uid);
  params.append("metadata[type]", "deal");
  params.append("metadata[aethra_product_type]", "deal_payment");

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
    amount_gbp: amount,
    user_id: uid,
  };
}

module.exports = { createDealCheckout };

