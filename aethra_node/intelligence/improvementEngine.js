"use strict";

const { assessProfitSurface } = require("../core/profitEnforcement");
const { getCMSSnapshot } = require("../memory/learningEngine");

/**
 * Surfaces weak outputs and reinforcement cues — feeds the closed loop, no auto prompt mutation.
 */
function improveSystem(ctx = {}) {
  const weak_outputs = [];
  const refinements = [];
  const reinforce = [];

  const envelope = ctx.envelope;
  if (envelope && typeof envelope === "object") {
    const pe = assessProfitSurface(envelope);
    if (!pe.satisfied) {
      weak_outputs.push({ surface: "python_envelope", gaps: pe.missing });
      refinements.push(
        `Refine execution/marketing so ${pe.missing.join(", ")} are explicit before the next operator cycle.`
      );
    }
  }

  const cms = ctx.cms || getCMSSnapshot();
  const strategic = cms.strategic_memory || [];
  const top = strategic[0];
  if (top && typeof top.confidence === "number" && top.confidence >= 0.65) {
    reinforce.push(`Reinforce pattern: «${top.pattern}» (confidence ${top.confidence.toFixed(2)}).`);
  }

  const micro = cms.micro_recent || cms.micro_memory || [];
  const objections = micro.filter((m) => /objection|budget|not now/i.test(String(m.result || ""))).length;
  if (objections >= 3) {
    refinements.push("Multiple objection-class outcomes — lead next touches with written pilot cap and single KPI.");
  }

  if (!weak_outputs.length && !refinements.length) {
    refinements.push("Hold discipline: one channel, one offer shape until ledger shows repeatable revenue.");
  }

  return {
    weak_outputs,
    refinements,
    reinforce,
    priority: ["revenue", "speed", "simplicity", "scale"],
    at: Date.now(),
  };
}

module.exports = { improveSystem };
