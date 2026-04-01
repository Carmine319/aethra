"use strict";

function evaluateROI(opportunity) {
  const op = opportunity && typeof opportunity === "object" ? opportunity : {};
  const expectedROI = Number(op.expectedROI || 0);
  const confidence = Number(op.confidenceScore || 0);
  const difficulty = Number(op.difficulty || 0);
  const timeToReturn = Number(op.timeToRevenue || 0);

  const downsideRisk = Math.max(
    0,
    Math.min(1, Number(((difficulty / 10) * 0.6 + ((10 - confidence) / 10) * 0.4).toFixed(4)))
  );
  const asymmetricUpside = expectedROI >= 1.7 && downsideRisk <= 0.35 && confidence >= 7;

  const base =
    expectedROI * 0.5 +
    (1 - downsideRisk) * 0.3 +
    Math.max(0, (14 - timeToReturn) / 14) * 0.2;
  const riskAdjustedScore = Number(base.toFixed(4));

  const rejected = downsideRisk > 0.7 && expectedROI < 2;
  return { expectedROI, downsideRisk, timeToReturn, riskAdjustedScore, asymmetricUpside, rejected };
}

module.exports = { evaluateROI };
