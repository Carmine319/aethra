import { weightSignals } from "./signal.weighting";
import { filterNoise } from "./noise.filter";
import { detectSignalAnomalies } from "./anomaly.detector";

export function aggregateSignals(signals: any[]) {
  const filtered = filterNoise(signals || []);
  const weighted = weightSignals(filtered);
  return detectSignalAnomalies(weighted);
}
