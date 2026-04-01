"use strict";

function ingestSignals() {
  return [
    { problem: "Local venues need compliance sanitation reports", frequency: 9, sentiment: 0.4, velocity: 8.5 },
    { problem: "I do not know how to use AI in my business", frequency: 10, sentiment: 0.2, velocity: 9.2 },
    { problem: "Marketplace listings are badly written and underperforming", frequency: 7, sentiment: 0.1, velocity: 7.3 },
    { problem: "Outreach scripts are not converting", frequency: 8, sentiment: -0.2, velocity: 8.1 },
  ];
}

module.exports = { ingestSignals };
