"use strict";

const crypto = require("crypto");
const wallet = require("../venture/wallet");
const ledger = require("../wallet/ledger");
const { splitPayment } = require("../billing/performanceEngine");
const { setUserPlan } = require("../billing/planStore");
const { recordPaymentEvent } = require("../memory/learningEngine");
const { applyVenturePilotFirstSale } = require("../portfolioExecution/firstSaleCapital");
const path = require("path");
const stripeBridge = (() => {
  try {
    return require(path.join(__dirname, "..", "..", "core", "profit", "stripeBridge.js"));
  } catch {
    return null;
  }
})();
/**
 * Stripe Checkout (test mode) — simulate when STRIPE_SECRET_KEY missing.
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, AETHRA_PUBLIC_BASE_URL
 */

function getBaseUrl() {
  return (
    String(process.env.AETHRA_PUBLIC_BASE_URL || "http://localhost:4000").replace(/\/$/, "") ||
    "http://localhost:4000"
  );
}

async function createCheckoutSession(product) {
  const key = process.env.STRIPE_SECRET_KEY;
  const name = String(product?.name || "AETHRA service").slice(0, 120);
  const amountGbp = Math.max(1, Number(product?.amount_gbp) || 1);
  const amountP = Math.round(amountGbp * 100);
  const productType = String(product?.product_type || "service_booking");
  const ventureId = product?.venture_id != null ? String(product.venture_id) : "";
  const campaignId = product?.campaign_id != null ? String(product.campaign_id).slice(0, 120) : "";
  const testGroup = product?.test_group != null ? String(product.test_group).slice(0, 64) : "";
  const priceTier = product?.price_tier != null ? String(product.price_tier).slice(0, 80) : "";
  const customerEmail = product?.customer_email ? String(product.customer_email).trim() : "";

  if (!key || key.startsWith("sk_placeholder")) {
    return {
      ok: true,
      mode: "simulated",
      url: null,
      session_id: `sim_cs_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      detail:
        "STRIPE_SECRET_KEY not set — no charge. Use test keys from Stripe Dashboard for live Checkout.",
      amount_gbp: amountGbp,
      product_type: productType,
      venture_id: ventureId || undefined,
      campaign_id: campaignId || undefined,
      test_group: testGroup || undefined,
      price_tier: priceTier || undefined,
    };
  }

  const success = `${getBaseUrl()}/?stripe=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancel = `${getBaseUrl()}/?stripe=cancel`;

  const params = new URLSearchParams();
  params.append("mode", productType === "subscription" ? "subscription" : "payment");
  params.append("success_url", success);
  params.append("cancel_url", cancel);
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "gbp");
  params.append("line_items[0][price_data][product_data][name]", name);
  params.append(
    "line_items[0][price_data][unit_amount]",
    String(amountP)
  );
  if (productType !== "subscription") {
    params.append("line_items[0][price_data][product_data][metadata][aethra_product_type]", productType);
    params.append("metadata[aethra_product_type]", productType);
  }
  if (ventureId) {
    params.append("metadata[venture_id]", ventureId);
    if (productType !== "subscription") {
      params.append("line_items[0][price_data][product_data][metadata][venture_id]", ventureId);
    }
  }
  if (campaignId) {
    params.append("metadata[campaign_id]", campaignId);
    if (productType !== "subscription") {
      params.append("line_items[0][price_data][product_data][metadata][campaign_id]", campaignId);
    }
  }
  if (testGroup) {
    params.append("metadata[test_group]", testGroup);
    if (productType !== "subscription") {
      params.append("line_items[0][price_data][product_data][metadata][test_group]", testGroup);
    }
  }
  if (priceTier) {
    params.append("metadata[price_tier]", priceTier);
    if (productType !== "subscription") {
      params.append("line_items[0][price_data][product_data][metadata][price_tier]", priceTier);
    }
  }
  if (customerEmail) params.append("customer_email", customerEmail);

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
    return { ok: false, mode: "error", error: String(e.message || e) };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, mode: "error", status: res.status, error: data };
  }

  return {
    ok: true,
    mode: "live",
    url: data.url,
    session_id: data.id,
    amount_gbp: amountGbp,
    product_type: productType,
    venture_id: ventureId || undefined,
    campaign_id: campaignId || undefined,
    test_group: testGroup || undefined,
    price_tier: priceTier || undefined,
  };
}

function verifyStripeSignature(rawBody, signatureHeader) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return { ok: false, reason: "missing_secret_or_signature" };

  const items = String(signatureHeader).split(",").map((s) => s.trim());
  let timestamp = "";
  const v1s = [];
  for (const item of items) {
    const eq = item.indexOf("=");
    if (eq === -1) continue;
    const k = item.slice(0, eq).trim();
    const v = item.slice(eq + 1).trim();
    if (k === "t") timestamp = v;
    if (k === "v1") v1s.push(v);
  }
  if (!timestamp || !v1s.length) return { ok: false, reason: "malformed_signature_header" };

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  let matched = false;
  for (const v1 of v1s) {
    try {
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(v1, "utf8");
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        matched = true;
        break;
      }
    } catch {
      continue;
    }
  }
  if (!matched) return { ok: false, reason: "signature_mismatch" };
  return { ok: true };
}

/**
 * rawBody: string (utf8) of webhook POST body
 */
function handleWebhook(rawBody, signatureHeader) {
  const simulated = process.env.STRIPE_SIMULATE_WEBHOOK === "1";
  if (!simulated && process.env.STRIPE_WEBHOOK_SECRET) {
    const v = verifyStripeSignature(rawBody, signatureHeader);
    if (!v.ok) return { received: false, error: v.reason };
  }

  let evt;
  try {
    evt = JSON.parse(rawBody);
  } catch {
    return { received: false, error: "invalid_json" };
  }

  const type = evt.type;
  if (type === "checkout.session.completed") {
    const o = evt.data && evt.data.object;
    const amountTotal = Number(o?.amount_total) || 0;
    const amountGbp = Math.round((amountTotal / 100) * 100) / 100;
    const meta = o?.metadata || {};
    const productType = String(meta.aethra_product_type || meta.aethraProductType || "").toLowerCase();

    if (productType === "wallet_topup") {
      const userId = String(meta.user_id || meta.userId || "anonymous").slice(0, 120);
      ledger.credit(userId, amountGbp, {
        source: "stripe_wallet_topup",
        stripe_session_id: o?.id || null,
      });
      recordPaymentEvent({
        amount_gbp: amountGbp,
        fee_gbp: 0,
        customer: o?.customer_details?.email || o?.customer_email || "stripe_customer",
        venture_id: null,
        user_id: userId,
        source: "stripe_wallet_topup",
        stripe_session_id: o?.id,
        product_type: "wallet_topup",
      });
      if (stripeBridge) {
        stripeBridge.notifyStripeRevenue(amountGbp, "stripe_wallet_topup", {
          user_id: userId,
          stripe_session_id: o?.id,
        });
      }
      return { received: true, type, recorded_gbp: amountGbp, credited: "ledger" };
    }

    if (productType === "subscription") {
      const userId = String(meta.user_id || meta.userId || "anonymous").slice(0, 120);
      const plan = String(meta.plan || meta.plan_key || "operator").toLowerCase();
      setUserPlan(userId, plan);
      recordPaymentEvent({
        amount_gbp: amountGbp,
        fee_gbp: 0,
        customer: o?.customer_details?.email || o?.customer_email || "stripe_customer",
        venture_id: null,
        user_id: userId,
        source: "stripe_subscription",
        stripe_session_id: o?.id,
        product_type: "subscription",
      });
      if (stripeBridge) {
        stripeBridge.notifyStripeRevenue(amountGbp, "stripe_subscription", {
          user_id: userId,
          plan,
          stripe_session_id: o?.id,
        });
      }
      return { received: true, type, recorded_gbp: amountGbp, plan_set: plan };
    }

    if (productType === "deal_payment" || String(meta.type || "").toLowerCase() === "deal") {
      const userId = String(meta.user_id || meta.userId || "anonymous").slice(0, 120);
      const { fee, net } = splitPayment(amountGbp, 0.05);
      if (net > 0) {
        ledger.credit(userId, net, {
          source: "stripe_deal_net",
          stripe_session_id: o?.id || null,
        });
      }
      if (fee > 0) {
        wallet.addRevenue(fee);
      }
      recordPaymentEvent({
        amount_gbp: net,
        fee_gbp: fee,
        customer: o?.customer_details?.email || o?.customer_email || "stripe_customer",
        venture_id: null,
        user_id: userId,
        source: "stripe_deal_payment",
        stripe_session_id: o?.id,
        product_type: "deal_payment",
      });
      if (stripeBridge) {
        stripeBridge.notifyStripeRevenue(amountGbp, "stripe_deal_payment", {
          user_id: userId,
          net_gbp: net,
          fee_gbp: fee,
          stripe_session_id: o?.id,
        });
      }
      return { received: true, type, recorded_gbp: amountGbp, net, fee };
    }

    const venture = meta.venture_id || meta.ventureId;
    const customer = o?.customer_details?.email || o?.customer_email || "stripe_customer";

    let portfolio_first_sale = null;
    if (productType === "venture_pilot" && venture) {
      portfolio_first_sale = applyVenturePilotFirstSale({
        ventureId: String(venture),
        amountGbp: amountGbp,
        stripeSessionId: o?.id || null,
      });
    }

    recordPayment({
      amount_gbp: amountGbp,
      customer,
      venture_id: venture || null,
      user_id: meta.user_id || meta.userId,
      source: "stripe",
      stripe_session_id: o?.id,
      stripe_payment_intent: o?.payment_intent || null,
      product_type: productType || "service_booking",
      campaign_id: meta.campaign_id || meta.campaignId || null,
      test_group: meta.test_group || meta.testGroup || null,
      price_tier: meta.price_tier || meta.priceTier || null,
    });
    return {
      received: true,
      type,
      recorded_gbp: amountGbp,
      portfolio_first_sale: portfolio_first_sale || undefined,
    };
  }

  return { received: true, type: type || "ignored" };
}

function recordPayment(data) {
  const amount = Math.round(Number(data.amount_gbp) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "bad_amount" };

  wallet.addRevenue(amount);
  if (data.venture_id) {
    try {
      wallet.updateVentureRevenue(String(data.venture_id), amount);
    } catch {
      /* venture name may not match row */
    }
  }

  recordPaymentEvent({
    amount_gbp: amount,
    fee_gbp: 0,
    customer: String(data.customer || "").slice(0, 200),
    venture_id: data.venture_id || null,
    user_id: data.user_id || null,
    source: String(data.source || "manual"),
    stripe_session_id: data.stripe_session_id || null,
    product_type: data.product_type || "service_booking",
    campaign_id: data.campaign_id || null,
    test_group: data.test_group || null,
    price_tier: data.price_tier || null,
  });

  if (stripeBridge) {
    stripeBridge.notifyStripeRevenue(amount, String(data.source || "stripe"), {
      venture_id: data.venture_id || null,
      product_type: data.product_type || "service_booking",
      stripe_session_id: data.stripe_session_id || null,
    });
  }

  return { ok: true, balance_after: wallet.getBalance() };
}

module.exports = {
  createCheckoutSession,
  handleWebhook,
  recordPayment,
  verifyStripeSignature,
};
