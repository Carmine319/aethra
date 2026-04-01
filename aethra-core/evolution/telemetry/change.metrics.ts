export function summariseChanges(entries: Array<{ proposal_id: string; ok: boolean }>) {
  const e = entries || [];
  return {
    total: e.length,
    success: e.filter((x) => x.ok).length,
    failure: e.filter((x) => !x.ok).length,
  };
}
