export function preventCascade(state: { failureSpread: number }) {
  const spread = Number(state.failureSpread ?? 0);
  if (spread > 0.3) {
    return "isolate";
  }
  return "normal";
}
