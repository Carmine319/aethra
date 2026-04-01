export function trackPerception(inputs: Array<Record<string, unknown>>) {
  const confidence = inputs.reduce((acc, item) => acc + Number(item.sentiment || item.confidence || 0.6), 0) / Math.max(1, inputs.length);
  const clarity = inputs.reduce((acc, item) => acc + Number(item.clarity || 0.6), 0) / Math.max(1, inputs.length);
  return {
    perceptionIndex: Number(((confidence * 0.6) + (clarity * 0.4)).toFixed(4)),
    confidence: Number(confidence.toFixed(4)),
    clarity: Number(clarity.toFixed(4)),
  };
}
