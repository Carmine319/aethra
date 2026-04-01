"use strict";

const objectionMatrix = {
  price: {
    trigger: ["expensive", "too much", "cost"],
    response: `Understood — most clients initially see it that way.

The reason they proceed is because the outcome typically offsets the cost within the first cycle.

If useful, we can validate that quickly before committing further.`,
  },

  timing: {
    trigger: ["busy", "later", "not now"],
    response: `No problem — when would be a better moment to revisit?

We can keep it brief and focused on whether it's worth doing at all.`,
  },

  trust: {
    trigger: ["not sure", "who are you"],
    response: `Fair question.

We focus on identifying measurable gaps and validating whether there is a real opportunity before anything is scaled.

Happy to show exactly how that works.`,
  },
};

function handleObjection(message) {
  const lower = String(message || "").toLowerCase();

  for (const key of Object.keys(objectionMatrix)) {
    const entry = objectionMatrix[key];
    if (entry.trigger.some((t) => lower.includes(t))) {
      return { key, response: entry.response };
    }
  }

  return null;
}

module.exports = { objectionMatrix, handleObjection };
