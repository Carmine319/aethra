export type PerformanceSnapshot = {
  revenue: number;
  attempts: number;
  conversions?: number;
};

/**
 * Kill loops that repeatedly fail to produce revenue after sufficient attempts.
 * Experiments remain reversible (no destructive state here).
 */
export function shouldKill(performance: PerformanceSnapshot): boolean {
  const revenue = Number(performance.revenue || 0);
  const attempts = Number(performance.attempts || 0);
  return revenue <= 0 && attempts > 5;
}
