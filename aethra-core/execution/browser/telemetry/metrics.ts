export const metrics = {
  actions: 0,
  failures: 0,
  sessions: 0,
};

export function incrementMetric(key: keyof typeof metrics, by = 1) {
  metrics[key] += by;
}
