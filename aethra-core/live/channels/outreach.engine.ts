export function runOutreach(targets: Array<{ id: string; intent: number }>) {
  return targets.map((target) => ({
    id: target.id,
    contacted: true,
    responded: Number(target.intent || 0) > 0.55,
  }));
}
