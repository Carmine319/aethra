import { executeBrowserTask } from "../../execution/browser/bridge";

export type DistributionResult = {
  platformsUsed: string[];
  postsPublished: number;
  timestamps: number[];
};

export async function distribute(content: Array<Record<string, unknown>>): Promise<DistributionResult> {
  const platforms = ["x", "linkedin", "youtube"];
  const rows = Array.isArray(content) ? content : [];
  const timestamps: number[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const target = platforms[i % platforms.length];
    await executeBrowserTask({
      idea: String(rows[i].hook || `content-${i + 1}`),
      actions: ["compose-post", "publish-post", "capture-link"],
      context: { platform: target, payload: rows[i] },
    });
    timestamps.push(Date.now());
  }

  return {
    platformsUsed: platforms.slice(0, Math.min(platforms.length, Math.max(1, rows.length))),
    postsPublished: rows.length,
    timestamps,
  };
}
