import { assertForesightOperational, readForesightPolicy } from "../governance/policy.gate";
import { hitRate, meanAbsoluteError } from "./metrics";
import { appendOutcome } from "../registry/forecast.registry";

export function runBacktest(series: Array<{ predicted: number; actual: number }>) {
  assertForesightOperational();
  const pol = readForesightPolicy();
  const lookback = Math.min(
    Number(pol.backtest_lookback_default ?? 200),
    Math.max(1, series?.length || 0)
  );
  const slice = (series || []).slice(-lookback);
  const signSeries = slice.map((r) => ({
    sign_correct: Math.sign(Number(r.predicted)) === Math.sign(Number(r.actual)),
  }));
  const m = {
    mae: meanAbsoluteError(slice),
    hit: hitRate(signSeries),
    n: slice.length,
  };
  appendOutcome({ event: "backtest_complete", metrics: m });
  return m;
}
