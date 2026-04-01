export type SignalProvenance = {
  source_id: string;
  channel: string;
  ingested_at: number;
  correlation_id?: string;
};

export function wrapRawSignal(value: number, provenance: SignalProvenance) {
  return {
    value: Number(value),
    provenance: { ...provenance, ingested_at: provenance.ingested_at || Date.now() },
  };
}
