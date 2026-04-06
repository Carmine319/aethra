import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";
import { getRepoRoot } from "../repoPaths";

const nodeRequire = createRequire(__filename);

export interface StrictRevenueCapture {
  verifiedGbp: number;
  flaggedGbp: number;
  revenueConfidenceScore: number;
  sources: string[];
  note: string;
}

/**
 * Confirmed settlement paths only (Stripe learning ledger + optional manual verified flag).
 */
export async function captureRevenue(sinceTs: number): Promise<StrictRevenueCapture> {
  const root = getRepoRoot();
  let verifiedGbp = 0;
  let flaggedGbp = 0;
  const sources: string[] = [];

  try {
    const { LEARNING_FILE } = nodeRequire(path.join(root, "aethra_node", "memory", "learningEngine.js"));
    const learn = JSON.parse(fs.readFileSync(LEARNING_FILE, "utf8"));
    const payments = Array.isArray(learn.payments) ? learn.payments : [];
    for (const p of payments) {
      const ts = Number(p.ts) || 0;
      if (ts < sinceTs) continue;
      const src = String(p.source || "");
      const stripeLike =
        src.startsWith("stripe") || src === "stripe_deal_payment" || src === "stripe_wallet_topup";
      const amt = Number(p.amount_gbp) || 0;
      if (stripeLike && amt > 0) {
        verifiedGbp += amt;
        sources.push(src);
      } else if (amt > 0) {
        flaggedGbp += amt;
        sources.push(`${src}_unverified`);
      }
    }
  } catch {
    /* no ledger */
  }

  verifiedGbp = Math.round(verifiedGbp * 100) / 100;
  flaggedGbp = Math.round(flaggedGbp * 100) / 100;
  const total = verifiedGbp + flaggedGbp;
  const revenueConfidenceScore =
    total <= 0 ? 0 : Math.round((verifiedGbp / total) * 1000) / 1000;

  return {
    verifiedGbp,
    flaggedGbp,
    revenueConfidenceScore,
    sources,
    note:
      flaggedGbp > 0
        ? "Non-Stripe ledger rows present — flagged amounts excluded from verified core metrics."
        : "Verified slice uses Stripe-classified payment events only.",
  };
}
