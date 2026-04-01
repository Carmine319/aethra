export function validateFulfilment(delivery: Array<{ delivered: boolean }>) {
  const completed = delivery.filter((row) => row.delivered).length;
  return {
    valid: completed === delivery.length,
    completionRate: Number((completed / Math.max(1, delivery.length)).toFixed(4)),
  };
}
