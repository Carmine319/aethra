"use strict";

function slug(s) {
  return String(s || "session")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "session";
}

function createBookingLink(context = {}) {
  const niche = slug(context.niche || context.slug || "intro");
  const base = String(process.env.AETHRA_CAL_BASE || "https://cal.com/aethra").replace(/\/$/, "");
  return `${base}/${niche}`;
}

function shouldOfferBooking(classification) {
  return ["ready_to_book", "price_interest", "positive"].includes(String(classification || ""));
}

module.exports = { createBookingLink, shouldOfferBooking };
