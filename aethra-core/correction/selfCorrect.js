"use strict";

const path = require("path");
const memory = require(path.join(__dirname, "..", "memory", "index.js"));
const { recommendAction, predictOutcome } = require(path.join(__dirname, "..", "memory", "intelligence.js"));

function selfCorrect(ctx = {}) {
  const rec = recommendAction();
  const prediction = predictOutcome({ type: rec.action });
  const patch = {
    parameter: rec.action,
    reason: rec.reason,
    expected: prediction,
    applied: true,
  };
  memory.logLearning({ type: "self_correct", patch, context: ctx });
  memory.logMetric({ type: "self_correction", action: rec.action });
  return patch;
}

module.exports = { selfCorrect };
