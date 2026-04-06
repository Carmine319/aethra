import Link from "next/link";

export default function Page() {
  return (
    <main className="aethra-home">
      <section className="aethra-section aethra-hero">
        <div className="aethra-shell">
          <p className="aethra-kicker">Autonomous execution infrastructure</p>
          <h1>Turn Ideas, Businesses, and Capital into Revenue</h1>
          <p className="aethra-subtext">
            AETHRA executes end-to-end operating systems across opportunity discovery, deployment,
            and capital reallocation. This is an execution engine, not an advisory dashboard.
          </p>
        </div>
      </section>

      <section className="aethra-section aethra-entry-panel">
        <div className="aethra-shell">
          <div className="aethra-entry-row">
            <Link className="aethra-btn aethra-btn-primary" href="/ideas">
              Submit Idea
            </Link>
            <Link className="aethra-btn" href="/business">
              Analyse Business
            </Link>
            <Link className="aethra-btn" href="/portfolio">
              Explore Portfolio
            </Link>
            <Link className="aethra-btn" href="#capital-system">
              Participate with Capital
            </Link>
          </div>
        </div>
      </section>

      <section className="aethra-section">
        <div className="aethra-shell aethra-grid-two">
          <article className="aethra-card">
            <p className="aethra-kicker">Differentiation</p>
            <h2>AETHRA deploys and operates, it does not just assist</h2>
            <p>
              Most systems stop at recommendations. AETHRA runs controlled cycles that create,
              launch, measure, and adapt business units in live conditions with explicit capital
              discipline.
            </p>
            <p>
              Every cycle writes memory, scores execution quality, and updates deployment
              thresholds so the system compounds operational intelligence over time.
            </p>
          </article>
          <article className="aethra-card">
            <p className="aethra-kicker">Operational stance</p>
            <h2>Execution before opinion</h2>
            <p>
              Decisions are made from verified data paths, observed conversion signals, and
              post-cycle diagnostics. No vanity metrics, no disconnected strategy theatre.
            </p>
            <p>
              The objective is simple: accelerate time-to-cash while preserving survivability and
              avoiding capital waste.
            </p>
          </article>
        </div>
      </section>

      <section className="aethra-section" id="capital-system">
        <div className="aethra-shell aethra-card">
          <p className="aethra-kicker">Capital system</p>
          <h2>Wallet-led allocation and deployment control</h2>
          <p>
            AETHRA runs a wallet model where liquid balance, allocated venture budgets, and
            remaining deployable capital are tracked as one coherent operating ledger.
          </p>
          <p>
            Capital is allocated only when execution confidence and risk thresholds are satisfied.
            If deployment friction rises or outcomes degrade, the system tightens allocation
            automatically and re-prioritises toward stronger lanes.
          </p>
        </div>
      </section>
    </main>
  );
}
