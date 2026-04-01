export function normaliseFeatures(features: any[]) {
  const list = features || [];
  const max = Math.max(
    1e-9,
    ...list.map((f) => Math.abs(Number(f.momentum ?? 1)))
  );
  return list.map((f) => ({
    ...f,
    momentum: Number(f.momentum ?? 0) / max,
  }));
}
