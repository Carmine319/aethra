import type { RawSignalInput } from "./signal.collector";
import { collectSignals } from "./signal.collector";

export function scoreSignal(signal: RawSignalInput) {
  const s = collectSignals(signal);
  return s.engagement * 0.7 + s.clicks * 1.3;
}
