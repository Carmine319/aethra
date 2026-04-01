"use strict";

/**
 * Map pipeline / CRM rows into analytics-friendly deal records.
 */
function normaliseDealRow(d) {
  if (!d || typeof d !== "object") {
    return {
      message: "(invalid)",
      niche: "(unknown niche)",
      price: null,
      replied: false,
      closed: false,
    };
  }
  const stage = String(d.stage || "lead").toLowerCase();
  const replied =
    typeof d.replied === "boolean"
      ? d.replied
      : stage !== "lead" && stage !== "new" && stage !== "archived";
  const closed = typeof d.closed === "boolean" ? d.closed : stage === "closed";
  const message = String(
    d.message != null && d.message !== ""
      ? d.message
      : d.outreach_hook || d.last_subject || d.best_message || "(no message tag)"
  );
  const niche = String(
    d.niche != null && d.niche !== ""
      ? d.niche
      : d.target_niche || d.context_niche || d.venture_id || "(unknown niche)"
  );
  let price = d.price != null && d.price !== "" ? d.price : null;
  if (price == null && d.offer_price != null) price = d.offer_price;
  if (price != null) price = String(price);

  return { ...d, message, niche, price, replied, closed };
}

function analyseDeals(deals) {
  const insights = {
    best_message: null,
    best_price: null,
    best_niche: null,
  };

  const messageStats = {};
  const priceStats = {};
  const nicheStats = {};

  const list = Array.isArray(deals) ? deals : [];

  list.forEach((raw) => {
    const d = raw._normalised ? raw : normaliseDealRow(raw);

    if (!messageStats[d.message]) {
      messageStats[d.message] = { replies: 0, closes: 0 };
    }
    if (d.replied) messageStats[d.message].replies++;
    if (d.closed) messageStats[d.message].closes++;

    if (d.price != null && d.price !== "") {
      if (!priceStats[d.price]) {
        priceStats[d.price] = { closes: 0 };
      }
      if (d.closed) priceStats[d.price].closes++;
    }

    if (!nicheStats[d.niche]) {
      nicheStats[d.niche] = { closes: 0 };
    }
    if (d.closed) nicheStats[d.niche].closes++;
  });

  const msgEntries = Object.entries(messageStats).filter(([k]) => k !== "(invalid)");
  insights.best_message = msgEntries.sort((a, b) => b[1].closes - a[1].closes)[0]?.[0] ?? null;

  const priceEntries = Object.entries(priceStats);
  insights.best_price = priceEntries.sort((a, b) => b[1].closes - a[1].closes)[0]?.[0] ?? null;

  insights.best_niche = Object.entries(nicheStats).sort((a, b) => b[1].closes - a[1].closes)[0]?.[0] ?? null;

  return {
    ...insights,
    messageStats,
    priceStats,
    nicheStats,
  };
}

module.exports = { analyseDeals, normaliseDealRow };
