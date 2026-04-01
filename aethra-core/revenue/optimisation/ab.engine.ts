/**
 * Reversible A/B selection: same seed + labels → same variant (replayable).
 */
export function runAB<T>(testA: T, testB: T, opts?: { seed?: string; label?: string }): T {
  const seed = String(opts?.seed ?? "default");
  const label = String(opts?.label ?? "ab");
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 9973;
  for (let i = 0; i < label.length; i++) h = (h + label.charCodeAt(i) * (i + 3)) % 9973;
  return h % 2 === 0 ? testA : testB;
}
