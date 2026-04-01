"use strict";

function executeScaling(decisions) {
  const list = Array.isArray(decisions) ? decisions : [];

  return list.map((d) => {
    const name = String(d.name || "Venture");
    const action = d.decision && d.decision.action;

    if (action === "scale") {
      return `${name}: increase outreach, expand targeting, raise budget`;
    }

    if (action === "maintain") {
      return `${name}: continue testing and optimisation`;
    }

    return `${name}: stop execution and reallocate resources`;
  });
}

module.exports = { executeScaling };
