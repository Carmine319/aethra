export function mapBehaviourJourney(events: Array<Record<string, unknown>>) {
  const rows = Array.isArray(events) ? events : [];
  return rows.map((e, idx) => ({
    step: String(e.step || `step-${idx + 1}`),
    action: String(e.action || e.type || "view"),
    dwellTimeMs: Number(e.dwellTimeMs || 1500),
  }));
}
