"use strict";

function runAdaptationCycle(input = {}) {
  const messages = Array.isArray(input.messages) ? input.messages : [];
  const niches = Array.isArray(input.niches) ? input.niches : [];
  const offers = Array.isArray(input.offers) ? input.offers : [];

  const bestMessage = messages.sort((a, b) => Number(b.reply_rate || 0) - Number(a.reply_rate || 0))[0] || null;
  const worstMessage = messages.sort((a, b) => Number(a.reply_rate || 0) - Number(b.reply_rate || 0))[0] || null;

  const bestNiche = niches.sort((a, b) => Number(b.roi || 0) - Number(a.roi || 0))[0] || null;
  const weakNiche = niches.sort((a, b) => Number(a.roi || 0) - Number(b.roi || 0))[0] || null;

  const bestOffer = offers.sort((a, b) => Number(b.close_rate || 0) - Number(a.close_rate || 0))[0] || null;
  const weakOffer = offers.sort((a, b) => Number(a.close_rate || 0) - Number(b.close_rate || 0))[0] || null;

  return {
    daily_optimisation: true,
    scale_now: {
      message: bestMessage,
      niche: bestNiche,
      offer: bestOffer,
    },
    kill_now: {
      message: worstMessage,
      niche: weakNiche,
      offer: weakOffer,
    },
    action: "scale_strong_kill_weak_immediately",
  };
}

module.exports = { runAdaptationCycle };