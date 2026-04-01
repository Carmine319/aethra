export function phasedDeploy(change: { id?: string }) {
  return [
    { phase: 1, exposure: 0.1 },
    { phase: 2, exposure: 0.5 },
    { phase: 3, exposure: 1.0 },
  ].map((p) => ({ ...p, change_id: change.id || "unknown" }));
}
