"use strict";

const { buildEmailSequence } = require("./engine.js");

async function runEmailSequence(lead) {
  return buildEmailSequence(lead.idea || "AETHRA");
}

module.exports = { runEmailSequence };