function stressSuccess(proposalId: string, world: string): boolean {
  let h = 0;
  for (let i = 0; i < proposalId.length; i++) h = (h * 31 + proposalId.charCodeAt(i)) >>> 0;
  const w = world === "extreme" ? 3 : world === "stress" ? 2 : 1;
  return (h % 10) > w;
}

/** Multi-world simulation — deterministic per proposal id (replayable). */
export function simulateWorlds(proposal: { id: string }) {
  const id = String(proposal.id || "unknown");
  return [
    { world: "baseline", success: stressSuccess(id, "baseline") },
    { world: "stress", success: stressSuccess(id, "stress") },
    { world: "extreme", success: stressSuccess(id, "extreme") },
  ];
}
