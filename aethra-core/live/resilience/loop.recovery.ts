export function recoverLoop(loop: { id: string; failed: boolean; retry: boolean }) {
  if (!loop.failed) return { id: loop.id, recovered: true, action: "none" };
  return {
    id: loop.id,
    recovered: loop.retry,
    action: loop.retry ? "rerun-loop" : "terminate-loop",
  };
}
