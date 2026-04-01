export function shouldKillLoop(roi: number) {
  return {
    kill: roi < 1,
    reason: roi < 1 ? "underperforming-loop" : "healthy-loop",
  };
}
