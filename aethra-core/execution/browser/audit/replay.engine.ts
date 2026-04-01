export async function replay(events: any[], executor: (event: any) => Promise<void>) {
  const list = Array.isArray(events) ? events : [];
  for (const e of list) {
    await executor(e);
  }
  return { ok: true, replayed: list.length };
}

export async function replayFromCheckpoint(
  events: any[],
  executor: (event: any) => Promise<void>,
  checkpointHash?: string
) {
  const list = Array.isArray(events) ? events : [];
  let start = 0;
  if (checkpointHash) {
    const idx = list.findIndex((e) => String(e.hash || "") === String(checkpointHash));
    start = idx >= 0 ? idx + 1 : 0;
  }
  const slice = list.slice(start);
  for (const e of slice) {
    await executor(e);
  }
  return { ok: true, replayed: slice.length, started_at: start };
}
