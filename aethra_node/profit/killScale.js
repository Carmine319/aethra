"use strict";

function decideKillScale(kpi) {
  const replyRate = Number(kpi.reply_rate || 0);
  const closeRate = Number(kpi.close_rate || 0);
  const roi = Number(kpi.ROI || 0);

  if (replyRate < 5) {
    return { action: "rewrite_outreach", reason: "Reply rate below 5%" };
  }
  if (closeRate < 2) {
    return { action: "improve_offer", reason: "Close rate below 2%" };
  }
  if (roi < 1.2) {
    return { action: "pause", reason: "ROI below 1.2" };
  }
  if (roi > 1.5) {
    return { action: "scale", reason: "ROI above 1.5" };
  }
  return { action: "maintain", reason: "Signals inside operating band" };
}

module.exports = { decideKillScale };