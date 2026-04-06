"use strict";

const fs = require("fs");
const path = require("path");
const { renderLandingHtml } = require("./buildEngine");
const { ARTIFACTS_DIR, ensureArtifactsDir } = require("./stateStore");

/**
 * Publish landing page to artifacts dir and produce distribution pack.
 * @param {Record<string, unknown>} business
 * @param {{ baseUrl?: string }} opts
 */
function launchBusiness(business, opts) {
  const options = opts && typeof opts === "object" ? opts : {};
  const baseUrl = String(options.baseUrl || "").replace(/\/$/, "") || "";
  const slug = String(business.id || business.landing?.slug || "venture");
  ensureArtifactsDir();
  const dir = path.join(ARTIFACTS_DIR, slug);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
  const html = renderLandingHtml(business);
  const indexPath = path.join(dir, "index.html");
  try {
    fs.writeFileSync(indexPath, html, "utf8");
  } catch {
    return {
      ok: false,
      error: "write_failed",
      business_id: slug,
    };
  }

  const headline = String(business.product_concept?.headline || business.opportunity_ref || "Offer");
  const brand = String(business.brand?.name || "Brand");
  const landingPath = `/portfolio-artifacts/${slug}/index.html`;
  const publicUrl = baseUrl ? `${baseUrl}${landingPath}` : landingPath;

  const reddit = [
    {
      subreddit_suggestion: "r/SideProject",
      title: `${headline.slice(0, 80)} — pilot slots open`,
      body: `Built to remove a specific operational bottleneck. Fixed scope, one KPI, capped pilot. ${publicUrl}`,
    },
    {
      subreddit_suggestion: "r/EntrepreneurRideAlong",
      title: `Looking for 3 operators to stress-test: ${headline.slice(0, 60)}`,
      body: `Happy to share scope doc first. ${publicUrl}`,
    },
  ];

  const x_posts = [
    `Pilot: ${headline.slice(0, 100)}. Capped fee + written KPI. ${publicUrl}`,
    `If ${headline.slice(0, 80)} is on your backlog this quarter, we scoped it to a single measurable outcome. ${publicUrl}`,
  ];

  const tiktok_scripts = [
    {
      hook: `Stop paying for "${headline.slice(0, 40)}..." tools you half-use.`,
      beat: "Show messy workflow → one KPI overlay → pilot cap on screen.",
      cta: `Link in bio — ${brand}`,
    },
    {
      hook: "Three signs you're buying software instead of outcomes.",
      beat: "List signs; last frame is landing URL as text overlay.",
      cta: "Comment 'scope' for the checklist DM.",
    },
  ];

  const optional_deploy = {
    gumroad: {
      ready: true,
      suggested_slug: slug,
      product_type: business.payment?.gumroad_product_type || "digital_download",
    },
    kickstarter: {
      applicable: /physical|hardware|device|kit/i.test(headline),
      note: "Use when COGS and fulfilment are modelled; not auto-posted.",
    },
  };

  return {
    ok: true,
    business_id: slug,
    landing_file: indexPath,
    landing_url_path: landingPath,
    public_url: publicUrl,
    distribution: { reddit, x_posts, tiktok_scripts },
    optional_deploy,
    launched_at: Date.now(),
    monetisation: {
      capture_channel: "landing_waitlist_and_checkout",
      upsell_attach: (business.upsells || []).map((u) => u.sku),
    },
  };
}

module.exports = { launchBusiness };
