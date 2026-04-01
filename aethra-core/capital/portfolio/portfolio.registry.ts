export type VentureRecord = {
  id: string;
  revenue: number;
  cost?: number;
  growth?: number;
  stability?: number;
  losses?: number;
  volatility?: number;
  probability_weighted_upside?: number;
  active?: boolean;
};

const ventures: VentureRecord[] = [];

export function registerVenture(v: VentureRecord) {
  ventures.push(v);
}

export function getVentures() {
  return [...ventures];
}
