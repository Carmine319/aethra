import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const HOST = "localhost";
const PORT = 4000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

type WalletState = {
  balance: number;
  allocated: number;
};

type ActivityEvent = {
  ts: number;
  message: string;
  type: "execute" | "clinic" | "portfolio" | "deploy" | "withdraw" | "checkout" | "system";
};

const walletState: WalletState = {
  balance: 1250,
  allocated: 420,
};

const activityFeed: ActivityEvent[] = [];

function pushActivity(evt: Omit<ActivityEvent, "ts">) {
  activityFeed.unshift({ ts: Date.now(), ...evt });
  while (activityFeed.length > 40) activityFeed.pop();
}

function walletSnapshot() {
  return {
    balance: Number(walletState.balance.toFixed(2)),
    allocated: Number(walletState.allocated.toFixed(2)),
    available: Number(Math.max(0, walletState.balance - walletState.allocated).toFixed(2)),
  };
}

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK" });
});

app.get("/api/wallet", (_req: Request, res: Response) => {
  res.json({ ok: true, wallet: walletSnapshot() });
});

app.get("/api/activity", (_req: Request, res: Response) => {
  res.json({ ok: true, activity: activityFeed });
});

app.get("/api/portfolio", (_req: Request, res: Response) => {
  pushActivity({ type: "portfolio", message: "Portfolio surface opened." });
  res.json({
    ok: true,
    portfolio: {
      activeSystems: 3,
      topLane: "Execution-led local services",
      capitalAtWork: walletSnapshot().allocated,
    },
  });
});

app.post("/api/execute", (req: Request, res: Response) => {
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const idea = String((payload as { idea?: string }).idea || "").trim() || "Untitled idea";
  pushActivity({ type: "execute", message: `Deployment initiated: ${idea}.` });
  res.json({ ok: true, status: "execution_started", idea });
});

app.post("/api/clinic", (req: Request, res: Response) => {
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const business = String((payload as { business?: string }).business || "").trim() || "Submitted business";
  pushActivity({ type: "clinic", message: `Clinic analysis started: ${business}.` });
  res.json({ ok: true, status: "clinic_started", business });
});

app.post("/api/deploy", (req: Request, res: Response) => {
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const requested = Number((payload as { amount?: number }).amount || 150);
  const amount = Number.isFinite(requested) && requested > 0 ? requested : 150;
  const available = walletSnapshot().available;
  if (available < amount) {
    res.status(400).json({ ok: false, error: "insufficient_capital", wallet: walletSnapshot() });
    return;
  }
  walletState.allocated += amount;
  pushActivity({ type: "deploy", message: `Capital allocated: £${amount.toFixed(2)}.` });
  res.json({ ok: true, status: "capital_deployed", wallet: walletSnapshot() });
});

app.post("/api/withdraw", (req: Request, res: Response) => {
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const requested = Number((payload as { amount?: number }).amount || 100);
  const amount = Number.isFinite(requested) && requested > 0 ? requested : 100;
  const available = walletSnapshot().available;
  if (available < amount) {
    res.status(400).json({ ok: false, error: "insufficient_available_balance", wallet: walletSnapshot() });
    return;
  }
  walletState.balance -= amount;
  pushActivity({ type: "withdraw", message: `Withdrawal request queued: £${amount.toFixed(2)}.` });
  res.json({ ok: true, status: "withdrawal_requested", wallet: walletSnapshot() });
});

app.post("/api/checkout", async (req: Request, res: Response) => {
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const productId = String((payload as { productId?: string }).productId || "").trim();
  const supported = new Set(["wallet_topup", "clinic_report", "opportunity_report", "deployment_trigger"]);
  if (!supported.has(productId)) {
    res.status(400).json({ ok: false, error: "unsupported_product" });
    return;
  }

  try {
    // Reuse existing Stripe bridge (simulates safely when keys are absent).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const stripeApi = require(path.join(__dirname, "..", "aethra_node", "payments", "stripe.js"));
    const amountMap: Record<string, number> = {
      wallet_topup: 50,
      clinic_report: 79,
      opportunity_report: 29,
      deployment_trigger: 19,
    };
    const session = await stripeApi.createCheckoutSession({
      product_type: productId,
      name: `AETHRA ${productId}`,
      amount_gbp: amountMap[productId] || 19,
    });
    pushActivity({ type: "checkout", message: `Checkout initiated: ${productId}.` });
    res.json({ ok: session?.ok !== false, ...session });
  } catch (err) {
    res.status(500).json({ ok: false, error: "checkout_failed", detail: String((err as Error)?.message || err) });
  }
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = app.listen(PORT, HOST, () => {
          console.log(`Backend running on http://${HOST}:${PORT}`);
          resolve();
        });
        server.on("error", (err: NodeJS.ErrnoException) => reject(err));
      });
      return;
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e?.code === "EADDRINUSE" && attempt < MAX_RETRIES) {
        console.error(
          `[backend] Port ${PORT} busy (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY_MS}ms...`
        );
        await wait(RETRY_DELAY_MS);
        continue;
      }
      console.error("[backend] Failed to start:", e?.message || e);
      process.exit(1);
    }
  }
}

void startServer();
