export function deriveMacroTrends(memory: any[]) {
  const slice = (memory || []).slice(-100);
  return slice.map((m) => (m && m.signal != null ? m.signal : m));
}
