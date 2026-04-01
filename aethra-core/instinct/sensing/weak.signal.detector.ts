export function detectWeakSignals(inputs: Array<Record<string, unknown>>) {
  const signals = inputs.map((item, idx) => ({
    id: String(item.id || `sig_${idx}`),
    strength: Number(item.strength || 0.3),
    direction: Number(item.direction || 0),
    confidence: Number(item.confidence || 0.4),
  }));
  return signals.filter((signal) => signal.strength >= 0.2 && signal.strength <= 0.65);
}
