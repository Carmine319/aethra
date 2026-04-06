import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Audits",
  description: "Unlock hidden profit with AETHRA business audits and optimisation.",
};

export default function BusinessPage() {
  return (
    <main className="container page-bg">
        <section className="section">
          <div className="card">
            <p className="kicker">Business</p>
            <h1>Unlock Hidden Profit in Your Business</h1>
            <p>AETHRA identifies revenue leaks and deploys measurable improvements.</p>
            <div className="cards-grid-3">
              <article className="card">
                <p className="plan-name">Audit</p>
                <p className="plan-price">£500</p>
                <ul className="plan-list">
                  <li>revenue leak detection</li>
                  <li>positioning analysis</li>
                  <li>conversion audit</li>
                </ul>
                <button type="button" className="btn btn-secondary" data-plan="audit">
                  Start Audit
                </button>
              </article>
              <article className="card">
                <span className="badge">Most Popular</span>
                <p className="plan-name">Audit + Plan</p>
                <p className="plan-price">£1,000</p>
                <ul className="plan-list">
                  <li>full audit</li>
                  <li>execution roadmap</li>
                  <li>offer optimisation</li>
                </ul>
                <button type="button" className="btn btn-primary" data-plan="audit-pro">
                  Most Popular
                </button>
              </article>
              <article className="card">
                <p className="plan-name">Full Optimisation</p>
                <p className="plan-price">£2,000</p>
                <ul className="plan-list">
                  <li>system upgrade</li>
                  <li>execution support</li>
                  <li>optional revenue share</li>
                </ul>
                <button type="button" className="btn btn-secondary" data-plan="full">
                  Apply
                </button>
              </article>
            </div>
            <p>
              AETHRA improves execution and positioning. Results depend on implementation and
              market conditions.
            </p>
          </div>
        </section>
    </main>
  );
}
