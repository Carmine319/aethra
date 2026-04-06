"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, apiPost, createCheckout } from "@/lib/api";

type Wallet = {
  balance: number;
  allocated: number;
  available: number;
};

type Activity = {
  ts: number;
  message: string;
};

function gbp(v: number | undefined) {
  const n = Number(v || 0);
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Page() {
  const [backendActive, setBackendActive] = useState(false);
  const [statusLine, setStatusLine] = useState("AETHRA is initialising backend...");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    try {
      const [health, walletRes, activityRes] = await Promise.all([
        apiFetch("/health"),
        apiFetch("/api/wallet"),
        apiFetch("/api/activity"),
      ]);
      const healthOk = String((health as { status?: string })?.status || "").toUpperCase() === "OK";
      setBackendActive(healthOk);
      setStatusLine(healthOk ? "System status: Active" : "AETHRA is initialising backend...");
      const walletPayload = walletRes as { wallet?: Wallet };
      if (walletPayload.wallet) setWallet(walletPayload.wallet);
      const activityPayload = activityRes as { activity?: Activity[] };
      setActivity(Array.isArray(activityPayload.activity) ? activityPayload.activity : []);
    } catch {
      setBackendActive(false);
      setStatusLine("AETHRA is initialising backend...");
    }
  }, []);

  useEffect(() => {
    void refreshState();
    const id = window.setInterval(() => {
      void refreshState();
    }, 7000);
    return () => window.clearInterval(id);
  }, [refreshState]);

  const runAction = useCallback(
    async (key: string, fn: () => Promise<unknown>) => {
      setBusy(key);
      try {
        await fn();
        await refreshState();
      } catch {
        setStatusLine("Backend unavailable. Actions are paused until runtime recovers.");
      } finally {
        setBusy(null);
      }
    },
    [refreshState]
  );

  const systemStatus = useMemo(() => (backendActive ? "Active" : "Waiting"), [backendActive]);

  return (
    <main className="aethra-home">
      <section className="aethra-section aethra-hero">
        <div className="aethra-shell">
          <div className="aethra-status-inline">
            <p>
              System Status: <strong>{systemStatus}</strong>
            </p>
            <p>
              Runtime: <strong>localhost:3000 → localhost:4000</strong>
            </p>
          </div>
          <h1>Turn Ideas, Businesses, and Capital into Revenue</h1>
          <p className="aethra-subtext">
            AETHRA is a structured execution system.
            <br />
            It identifies opportunities, allocates capital, and deploys revenue-generating systems
            under controlled conditions.
            <br />
            It does not advise. It executes, measures, and compounds outcomes.
          </p>
          <p className="aethra-runtime-note">{statusLine}</p>
        </div>
      </section>

      <section className="aethra-section">
        <div className="aethra-shell aethra-card">
          <p className="aethra-kicker">Execution model</p>
          <h2>Execution, Not Recommendation</h2>
          <p>
            Most systems operate at the surface layer: ideas, reports, and theoretical outputs.
            AETHRA operates below that layer.
          </p>
          <p>
            It converts inputs into deployed systems. It allocates capital into controlled
            execution. It captures outcomes and reintegrates them into future decisions.
          </p>
          <p>Each cycle improves the system. This is not experimentation. It is structured, iterative execution.</p>
        </div>
      </section>

      <section className="aethra-section aethra-entry-panel">
        <div className="aethra-shell">
          <div className="aethra-inline-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Idea or business context"
              aria-label="Execution input"
            />
          </div>
          <div className="aethra-entry-row">
            <button
              className="aethra-btn aethra-btn-primary"
              onClick={() => runAction("execute", () => apiPost("/api/execute", { idea: input }))}
              disabled={busy !== null}
            >
              Submit Idea
            </button>
            <button
              className="aethra-btn"
              onClick={() => runAction("clinic", () => apiPost("/api/clinic", { business: input }))}
              disabled={busy !== null}
            >
              Analyse Business
            </button>
            <button
              className="aethra-btn"
              onClick={() => runAction("portfolio", () => apiFetch("/api/portfolio"))}
              disabled={busy !== null}
            >
              Explore Portfolio
            </button>
            <button
              className="aethra-btn"
              onClick={() => runAction("wallet_topup", () => createCheckout("wallet_topup"))}
              disabled={busy !== null}
            >
              Participate with Capital
            </button>
          </div>
        </div>
      </section>

      <section className="aethra-section" id="capital-system">
        <div className="aethra-shell aethra-card">
          <p className="aethra-kicker">Capital system</p>
          <h2>Capital Allocation Engine</h2>
          <p>
            Capital within AETHRA is not passively stored. It is allocated into controlled
            deployments with scoped opportunities, defined execution paths, and monitored outcomes.
          </p>
          <p>
            Returns are captured, logged, and redeployed. Users maintain control of funding,
            allocation, and withdrawal requests.
          </p>

          <div className="aethra-wallet-grid">
            <div>
              <span>Wallet Balance</span>
              <strong>{wallet ? gbp(wallet.balance) : "—"}</strong>
            </div>
            <div>
              <span>Allocated Capital</span>
              <strong>{wallet ? gbp(wallet.allocated) : "—"}</strong>
            </div>
            <div>
              <span>Available Capital</span>
              <strong>{wallet ? gbp(wallet.available) : "—"}</strong>
            </div>
          </div>
          <div className="aethra-wallet-actions">
            <button className="aethra-btn" onClick={() => runAction("add_funds", () => createCheckout("wallet_topup"))} disabled={busy !== null}>
              Add Funds
            </button>
            <button className="aethra-btn" onClick={() => runAction("deploy", () => apiPost("/api/deploy", { amount: 150 }))} disabled={busy !== null}>
              Deploy Capital
            </button>
            <button className="aethra-btn" onClick={() => runAction("withdraw", () => apiPost("/api/withdraw", { amount: 100 }))} disabled={busy !== null}>
              Withdraw Funds
            </button>
          </div>
        </div>
      </section>

      <section className="aethra-section">
        <div className="aethra-shell">
          <p className="aethra-kicker">Monetisation surfaces</p>
          <h2 className="aethra-section-title">Access Points</h2>
          <div className="aethra-grid-three">
            <article className="aethra-card">
              <h3>Opportunity Report</h3>
              <p className="aethra-price">£29</p>
              <p>Signal-backed opportunities with defined execution paths.</p>
              <button className="aethra-btn" onClick={() => runAction("opportunity_report", () => createCheckout("opportunity_report"))} disabled={busy !== null}>
                Buy Report
              </button>
            </article>
            <article className="aethra-card">
              <h3>Business Clinic</h3>
              <p className="aethra-price">£79–£199</p>
              <p>Structured breakdown of revenue inefficiencies and deployment strategy.</p>
              <button className="aethra-btn" onClick={() => runAction("clinic_card", () => apiPost("/api/clinic", { business: input }))} disabled={busy !== null}>
                Run Analysis
              </button>
            </article>
            <article className="aethra-card">
              <h3>Deployment Trigger</h3>
              <p className="aethra-price">£19+</p>
              <p>Execute a controlled opportunity cycle.</p>
              <button className="aethra-btn" onClick={() => runAction("deployment_trigger", () => createCheckout("deployment_trigger"))} disabled={busy !== null}>
                Execute Now
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="aethra-section">
        <div className="aethra-shell aethra-card">
          <p className="aethra-kicker">System feedback</p>
          <h2>Activity + System State</h2>
          <ul className="aethra-activity-list">
            {activity.length ? (
              activity.map((row) => (
                <li key={`${row.ts}-${row.message}`}>
                  <span>{new Date(row.ts).toLocaleTimeString("en-GB")}</span>
                  <strong>{row.message}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>—</span>
                <strong>No activity logged yet.</strong>
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="aethra-section">
        <div className="aethra-shell aethra-closing">
          AETHRA is a controlled economic system interface. Capital flows into execution, execution
          feeds outcomes, and outcomes refine allocation.
        </div>
      </section>
    </main>
  );
}
