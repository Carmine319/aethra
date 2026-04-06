"use strict";

const fs = require("fs");
const path = require("path");
const { ARTIFACTS_DIR, ensureArtifactsDir } = require("./stateStore");

/**
 * Auto-generated sellable reports (GBP bands per spec).
 * @param {Record<string, unknown>} data
 * @param {{ writeFiles?: boolean }} opts
 */
function generateReports(data, opts) {
  const d = data && typeof data === "object" ? data : {};
  const options = opts && typeof opts === "object" ? opts : {};
  const writeFiles = options.writeFiles !== false;

  const ts = new Date().toISOString();
  const opportunities = Array.isArray(d.opportunities) ? d.opportunities : [];
  const business = d.business && typeof d.business === "object" ? d.business : null;
  const performance = d.performance && typeof d.performance === "object" ? d.performance : {};

  const opportunity_report = {
    sku: "OPP_INTEL",
    title: "Opportunity intelligence pack",
    price_gbp: 79,
    band: "29-99",
    format: "markdown",
    body: buildOpportunityMarkdown(opportunities, ts),
    checkout_hint: "POST /create-checkout-session with product_name + price",
  };

  const clinic_report = {
    sku: "CLINIC_DEEP",
    title: "Business clinic report",
    price_gbp: 129,
    band: "49-199",
    format: "markdown",
    body: buildClinicMarkdown(business, performance, ts),
    checkout_hint: "POST /api/v1/billing/create-deal-checkout-session with amount_gbp",
  };

  const trend_pack = {
    sku: "TREND_LAYER",
    title: "Trend intelligence pack",
    price_gbp: 49,
    band: "29-99",
    format: "markdown",
    body: buildTrendMarkdown(opportunities, ts),
  };

  const files = [];
  if (writeFiles) {
    ensureArtifactsDir();
    const repDir = path.join(ARTIFACTS_DIR, "reports");
    try {
      fs.mkdirSync(repDir, { recursive: true });
    } catch {
      /* ignore */
    }
    const stamp = Date.now();
    for (const rep of [opportunity_report, clinic_report, trend_pack]) {
      const fname = `${rep.sku}_${stamp}.md`;
      const fp = path.join(repDir, fname);
      try {
        fs.writeFileSync(fp, rep.body, "utf8");
        files.push({ sku: rep.sku, path: fp, url_path: `/portfolio-artifacts/reports/${fname}` });
      } catch {
        /* ignore */
      }
    }
  }

  return {
    generated_at: ts,
    products: [opportunity_report, clinic_report, trend_pack],
    files_written: files,
    monetisation_stage: d.stage || "detect",
  };
}

function buildOpportunityMarkdown(opportunities, ts) {
  const lines = [
    `# Opportunity intelligence pack`,
    `Generated: ${ts}`,
    "",
    "## Ranked signals",
    ...opportunities.slice(0, 12).map((o, i) => {
      const idea = String(o.idea || "").slice(0, 160);
      const score = Number(o.score) || 0;
      return `${i + 1}. **${score}** — ${idea}`;
    }),
    "",
    "## How to use",
    "Pick one wedge, one channel, one KPI for 14 days. Do not parallelise before first conversion.",
    "",
    _footer(),
  ];
  return lines.join("\n");
}

function buildClinicMarkdown(business, performance, ts) {
  const b = business || {};
  const head = String(b.product_concept?.headline || b.opportunity_ref || "N/A");
  const lines = [
    `# Business clinic report`,
    `Generated: ${ts}`,
    "",
    "## Concept",
    head,
    "",
    "## Offer structure",
    "```json",
    JSON.stringify(b.offer_structure || {}, null, 2),
    "```",
    "",
    "## Performance snapshot",
    "```json",
    JSON.stringify(performance, null, 2),
    "```",
    "",
    "## Prescriptions",
    "- Tighten ICP to buyers who already spend in-category.",
    "- Publish one proof artefact (before/after metric).",
    "- Cap pilot scope in writing before taking payment.",
    "",
    _footer(),
  ];
  return lines.join("\n");
}

function buildTrendMarkdown(opportunities, ts) {
  const lines = [
    `# Trend intelligence pack`,
    `Generated: ${ts}`,
    "",
    "## Momentum themes",
    ...opportunities.slice(0, 8).map((o) => `- ${String(o.idea || "").slice(0, 100)} (${o.sources?.[0] || "mixed"})`),
    "",
    "## Distribution notes",
    "Lead with pain verbatim from source; avoid generic AI tone in hooks.",
    "",
    _footer(),
  ];
  return lines.join("\n");
}

function _footer() {
  return "---\n*AETHRA auto-generated. Not financial advice. Verify claims before publishing.*";
}

module.exports = { generateReports };
