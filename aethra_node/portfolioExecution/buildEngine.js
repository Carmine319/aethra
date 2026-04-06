"use strict";

const crypto = require("crypto");

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "venture";
}

function randomBrandSuffix() {
  return crypto.randomBytes(2).toString("hex");
}

/**
 * @param {Record<string, unknown>} opportunity
 * @param {Record<string, unknown>} [recycleHints] — from getRecycleHintsForBuild()
 * @returns {Record<string, unknown>}
 */
function buildBusiness(opportunity, recycleHints) {
  const hints = recycleHints && typeof recycleHints === "object" ? recycleHints : {};
  let idea = String(opportunity.idea || "Untitled offer");
  const avoid = Array.isArray(hints.avoid_tokens) ? hints.avoid_tokens : [];
  const low = idea.toLowerCase();
  for (const t of avoid) {
    if (t && low.includes(String(t).toLowerCase())) {
      idea = `${idea} — reframed pilot`;
      break;
    }
  }
  const slug = `${slugify(idea)}-${randomBrandSuffix()}`;
  const brandName = `${slugify(idea).split("-").slice(0, 2).join(" ").replace(/\b\w/g, (c) => c.toUpperCase())} Labs`;
  const tone = "direct, confident, proof-first; no hype adjectives";
  const anchorPrice = 49 + (Number(opportunity.score) % 40);
  const product_concept = {
    headline: idea.slice(0, 120),
    promise: "Measurable outcome in a fixed window with a capped pilot.",
    icp: "Operators drowning in manual work who already pay for tools.",
    differentiator: "Single KPI + written scope boundary + rollback clause.",
  };
  if (hints.suggested_subhead) {
    product_concept.subhead = String(hints.suggested_subhead).slice(0, 220);
  }
  if (hints.suggested_angle) {
    product_concept.recycled_angle = String(hints.suggested_angle).slice(0, 240);
  }
  const offer_structure = {
    core: "Fixed-scope implementation or template pack",
    guarantee: "If KPI not hit in pilot window, second iteration at no additional fee (terms apply).",
    pilot_cap_gbp: Math.min(2500, 500 + anchorPrice * 10),
  };
  const pricing_model = {
    currency: "GBP",
    anchor_gbp: anchorPrice,
    tiers: [
      { name: "Starter", price_gbp: anchorPrice, detail: "Self-serve templates + checklist" },
      { name: "Operator", price_gbp: anchorPrice * 3, detail: "Done-with-you setup + 2 calls" },
      { name: "Portfolio", price_gbp: anchorPrice * 8, detail: "Multi-unit rollout + Slack" },
    ],
  };
  const payment = {
    provider: "stripe",
    env_price_hint: "Map PRICE_PORTFOLIO or per-product Price ID in Stripe Dashboard",
    checkout_product_name: `${brandName} — ${product_concept.headline.slice(0, 80)}`,
    gumroad_ready: true,
    gumroad_product_type: "digital_download",
  };
  const upsells = [
    { sku: "priority_audit", label: "48h audit + Loom walkthrough", price_gbp: 199 },
    { sku: "annual_retainer", label: "Quarterly optimisation", price_gbp: 149 * 12 * 0.65 },
  ];
  const report_products = [
    { sku: "opp_pack", title: "Opportunity signal pack", price_gbp: 49, band: "29-99" },
    { sku: "clinic_deep", title: "Business clinic — deep dive", price_gbp: 149, band: "49-199" },
  ];
  const rev_share_onboarding = {
    enabled: true,
    default_pct: 15,
    range_pct: [10, 25],
    terms_summary: "AETHRA tracks attributed revenue; fee on collected cash above threshold.",
  };

  const landing = {
    slug,
    path_relative: `/portfolio-artifacts/${slug}/index.html`,
    html_title: `${brandName} — ${product_concept.headline.slice(0, 60)}`,
  };

  return {
    id: slug,
    opportunity_ref: idea,
    brand: { name: brandName, tone },
    product_concept,
    offer_structure,
    pricing_model,
    payment,
    landing,
    upsells,
    report_products,
    rev_share_onboarding,
    built_at: Date.now(),
    monetisation: {
      build_service_listing_gbp: 997,
      report_skus: report_products.map((r) => r.sku),
    },
  };
}

/**
 * Minimal high-conversion landing HTML (editorial B/W).
 */
function renderLandingHtml(business) {
  const b = business.brand || {};
  const p = business.product_concept || {};
  const pr = business.pricing_model || {};
  const tier = (pr.tiers && pr.tiers[0]) || { price_gbp: 49, name: "Starter" };
  const title = String(business.landing?.html_title || b.name || "Offer");
  const headline = String(p.headline || "Outcome in a fixed window");
  const sessions = business.monetisation_layer?.checkout_sessions;
  const firstCheckout =
    Array.isArray(sessions) && sessions.length ? sessions.find((x) => x && x.url) || sessions[0] : null;
  const ctaHref = firstCheckout?.url ? String(firstCheckout.url) : "#";
  const ctaRel = firstCheckout?.url ? ' rel="noopener noreferrer"' : "";
  const subhead = p.subhead ? `<p class="subhead">${escapeHtml(String(p.subhead))}</p>` : "";
  const recycled = p.recycled_angle
    ? `<p class="recycle-hint" style="font-size:0.9rem;color:var(--muted);font-style:italic;">${escapeHtml(String(p.recycled_angle))}</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    :root { --fg:#0a0a0a; --bg:#fafafa; --muted:#444; --line:#ccc; }
    *{box-sizing:border-box;}
    body{margin:0;font-family:Georgia,'Times New Roman',serif;background:var(--bg);color:var(--fg);line-height:1.5;}
    main{max-width:42rem;margin:0 auto;padding:3rem 1.5rem 4rem;}
    h1{font-size:2rem;font-weight:400;letter-spacing:-0.02em;margin:0 0 1rem;}
    p.lead{font-size:1.1rem;color:var(--muted);margin:0 0 2rem;}
    section{border-top:1px solid var(--line);padding-top:1.5rem;margin-top:1.5rem;}
    ul{padding-left:1.2rem;color:var(--muted);}
    .price{font-size:1.4rem;margin:1rem 0;}
    .cta{display:inline-block;margin-top:1rem;padding:0.65rem 1.2rem;border:1px solid var(--fg);color:var(--fg);text-decoration:none;font-size:0.95rem;letter-spacing:0.04em;text-transform:uppercase;font-family:system-ui,sans-serif;}
    .cta:hover{background:var(--fg);color:var(--bg);}
    footer{margin-top:3rem;font-size:0.85rem;color:var(--muted);}
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(headline)}</h1>
    ${subhead}
    <p class="lead">${escapeHtml(String(p.promise || ""))}</p>
    ${recycled}
    <section>
      <h2 style="font-size:1rem;font-weight:600;font-family:system-ui,sans-serif;">Who it is for</h2>
      <p style="color:var(--muted);">${escapeHtml(String(p.icp || ""))}</p>
    </section>
    <section>
      <h2 style="font-size:1rem;font-weight:600;font-family:system-ui,sans-serif;">What you get</h2>
      <ul>
        <li>Written scope + single KPI</li>
        <li>Pilot window with capped fee</li>
        <li>Rollback terms disclosed before payment</li>
      </ul>
      <div class="price">${escapeHtml(tier.name)} — £${escapeHtml(String(tier.price_gbp))}</div>
      <a class="cta" href="${escapeHtml(ctaHref)}" data-stripe-checkout="${firstCheckout?.session_id ? escapeHtml(String(firstCheckout.session_id)) : "pending"}"${ctaRel}>Reserve pilot</a>
      <p style="font-size:0.85rem;color:var(--muted);margin-top:1rem;">${
        firstCheckout?.url
          ? "Stripe Checkout (metadata: venture_id, campaign_id, test_group)."
          : "Set STRIPE_SECRET_KEY for live Checkout URLs, or POST /create-checkout-session."
      }</p>
    </section>
    <footer>${escapeHtml(b.name || "AETHRA")} · ${new Date().toISOString().slice(0, 10)}</footer>
  </main>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { buildBusiness, renderLandingHtml, slugify };
