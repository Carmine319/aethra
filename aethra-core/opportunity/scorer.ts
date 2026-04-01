type Candidate = {
  idea: string;
  monetisationMethod: string;
  speedToRevenue: number;
  requiredEffort: number;
  roiPotential?: number;
};

export function scoreOpportunity(candidate: Candidate) {
  const roi = Number(candidate.roiPotential || 7);
  const speed = Number(candidate.speedToRevenue || 0);
  const difficulty = Number(candidate.requiredEffort || 0);
  const score = Number((roi * 0.5 + speed * 0.35 - difficulty * 0.15).toFixed(3));
  return { ...candidate, roiPotential: roi, executionDifficulty: difficulty, score };
}

export function selectBestCandidate(candidates: Candidate[]) {
  const scored = (Array.isArray(candidates) ? candidates : []).map(scoreOpportunity);
  scored.sort((a, b) => b.score - a.score);
  return scored[0] || null;
}
