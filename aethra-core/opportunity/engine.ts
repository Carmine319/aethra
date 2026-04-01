export type Opportunity = {
  idea: string;
  roi: number;
  speed: number;
  friction: number;
  score: number;
};

export function generateIdeas(seed: string): string[] {
  const base = String(seed || "local B2B diagnostic").trim() || "local B2B diagnostic";
  return [
    `${base} - premium diagnostic`,
    `${base} - automation sprint`,
    `${base} - implementation retainer`,
  ];
}

export function scoreOpportunity(idea: string): Opportunity {
  const text = String(idea || "").toLowerCase();
  const roi = text.includes("premium") ? 9 : text.includes("retainer") ? 8 : 7;
  const speed = text.includes("sprint") ? 9 : 7;
  const friction = text.includes("automation") ? 4 : 5;
  const score = Number((roi * 0.5 + speed * 0.35 - friction * 0.15).toFixed(2));
  return { idea, roi, speed, friction, score };
}

export function selectTopCandidate(seed: string): Opportunity {
  const scored = generateIdeas(seed).map(scoreOpportunity).sort((a, b) => b.score - a.score);
  return scored[0];
}
