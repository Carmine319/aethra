"use strict";

function simplifyFulfilment(plan = {}, threshold = 65) {
  const complexity = Number(plan.fulfilment_complexity || plan.complexity || 40);
  if (complexity <= threshold) {
    return {
      simplified: false,
      fulfilment_complexity: complexity,
      model: "current",
      steps: Array.isArray(plan.steps) ? plan.steps : [],
      tools: Array.isArray(plan.tools) ? plan.tools : [],
    };
  }

  return {
    simplified: true,
    fulfilment_complexity: Math.max(30, threshold - 10),
    model: "outsourced_repeatable_tooled",
    steps: [
      "Confirm concise scope",
      "Dispatch vetted supplier",
      "Run standardised QA checklist",
      "Publish completion report",
    ],
    tools: [
      "Dispatch board",
      "Checklist automation",
      "Client proof template",
    ],
  };
}

module.exports = { simplifyFulfilment };