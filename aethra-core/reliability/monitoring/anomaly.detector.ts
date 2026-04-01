export function detectAnomalies(data: { revenueDrop: number; conversionDrop: number; behaviourDrift: number }) {
  const anomalyScore = Number((data.revenueDrop * 0.45 + data.conversionDrop * 0.35 + data.behaviourDrift * 0.2).toFixed(4));
  return {
    anomalyScore,
    detected: anomalyScore >= 0.35,
  };
}
