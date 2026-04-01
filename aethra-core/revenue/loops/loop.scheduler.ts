import { getActiveLoops } from "./loop.registry";
import { executeLoop } from "./loop.engine";

/**
 * Runs all active loops sequentially with bounded evaluation (no unbounded parallel storm).
 */
export async function runAllLoops(): Promise<
  Array<{ name: string; ok: boolean; result?: unknown; error?: string }>
> {
  const loops = getActiveLoops();
  const out: Array<{ name: string; ok: boolean; result?: unknown; error?: string }> = [];

  for (const loop of loops) {
    try {
      const result = await executeLoop(loop);
      out.push({ name: loop.name, ok: true, result });
    } catch (e: any) {
      out.push({ name: loop.name, ok: false, error: String(e?.message || e) });
    }
  }

  return out;
}
