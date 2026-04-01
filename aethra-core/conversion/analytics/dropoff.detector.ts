export type DropOffInsight = {
  pointsOfAbandonment: string[];
  frictionSources: string[];
  conversionBlockers: string[];
};

export function detectDropOff(events: Array<Record<string, unknown>>): DropOffInsight {
  const rows = Array.isArray(events) ? events : [];
  const dropoffs = rows.filter((e) => String(e.type || "").toLowerCase().includes("drop") || Number(e.completed || 0) === 0);
  const points = [...new Set(dropoffs.map((e) => String(e.step || e.page || "unknown-step")))];
  const friction = [...new Set(dropoffs.map((e) => String(e.reason || "unclear value proposition")))];
  const blockers = [...new Set(dropoffs.map((e) => String(e.blocker || "too many steps to convert")))];
  return {
    pointsOfAbandonment: points.length ? points : ["cta-click"],
    frictionSources: friction.length ? friction : ["ambiguous CTA copy"],
    conversionBlockers: blockers.length ? blockers : ["high cognitive load before checkout"],
  };
}
