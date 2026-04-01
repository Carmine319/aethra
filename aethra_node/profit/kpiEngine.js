"use strict";

function safePct(num, den) {
  if (!den) return 0;
  return Math.round((Number(num) / Number(den)) * 10000) / 100;
}

function computeKpis(input = {}) {
  const leads = Number(input.leads || 0);
  const replies = Number(input.replies || 0);
  const bookings = Number(input.bookings || 0);
  const closes = Number(input.closes || 0);
  const revenue = Math.round(Number(input.revenue || 0) * 100) / 100;
  const cost = Math.max(1, Number(input.cost || 1));
  const roi = Math.round((revenue / cost) * 1000) / 1000;

  return {
    leads,
    replies,
    bookings,
    closes,
    revenue,
    reply_rate: safePct(replies, leads),
    booking_rate: safePct(bookings, replies || 1),
    close_rate: safePct(closes, leads),
    ROI: roi,
  };
}

module.exports = { computeKpis };