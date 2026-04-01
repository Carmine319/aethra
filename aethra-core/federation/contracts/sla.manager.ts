export function assertSla(deadlineMs: number, startedAt: number) {
  if (Date.now() - startedAt > deadlineMs) {
    throw new Error("SLA breached");
  }
  return true;
}
