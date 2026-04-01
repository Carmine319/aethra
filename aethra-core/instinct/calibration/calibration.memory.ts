const calibrationRows: Array<{ ts: number; confidence: number; errorRate: number }> = [];

export function appendCalibrationMemory(confidence: number, errorRate: number) {
  const row = { ts: Date.now(), confidence: Number(confidence || 0), errorRate: Number(errorRate || 0) };
  calibrationRows.push(row);
  return row;
}

export function getRecentCalibration(limit = 20) {
  return calibrationRows.slice(-Math.max(1, Number(limit || 20)));
}
