import fs from "fs";
import path from "path";

type ActionType = "click" | "type" | "navigation" | "read" | string;

type TimingPolicy = {
  min_delay_ms: number;
  max_delay_ms: number;
  jitter_ratio: number;
};

function readTimingPolicy(): TimingPolicy {
  const file = path.join(__dirname, "..", "config", "policies.json");
  const fallback: TimingPolicy = { min_delay_ms: 100, max_delay_ms: 5000, jitter_ratio: 0.4 };
  if (!fs.existsSync(file)) return fallback;
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    return {
      min_delay_ms: Number(raw.min_delay_ms || fallback.min_delay_ms),
      max_delay_ms: Number(raw.max_delay_ms || fallback.max_delay_ms),
      jitter_ratio: Number(raw.jitter_ratio || fallback.jitter_ratio),
    };
  } catch {
    return fallback;
  }
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getHumanDelay(actionType: ActionType, opts?: { seed?: number; seq?: number }) {
  const base =
    {
      click: 300,
      type: 120,
      navigation: 800,
      read: 1500,
    }[actionType] || 500;

  const policy = readTimingPolicy();
  const source = opts && Number.isFinite(opts.seed) ? seededRandom(Number(opts.seed) + Number(opts.seq || 0)) : Math.random();
  const variance = source * base * Math.max(0, policy.jitter_ratio);
  const raw = base + variance;
  const bounded = Math.min(policy.max_delay_ms, Math.max(policy.min_delay_ms, raw));
  return Math.round(bounded);
}
