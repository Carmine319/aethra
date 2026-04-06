import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "AETHRA portfolio and marketplace access.",
};

export default function PortfolioPage() {
  return (
    <main className="container page-bg">
        <section className="section">
          <div className="card">
            <p className="kicker">Portfolio</p>
            <h1>AETHRA Portfolio &amp; Marketplace</h1>
            <p>
              Access active systems, validated operators, and compounding assets managed through
              disciplined capital allocation.
            </p>
            <div className="cards-grid-3">
              <article className="card">
                <h3>Active revenue systems</h3>
                <p>Live assets with measurable throughput and controlled execution pathways.</p>
              </article>
              <article className="card">
                <h3>Early-stage deployments</h3>
                <p>
                  Emerging opportunities with signal-backed hypotheses and constrained capital
                  testing.
                </p>
              </article>
              <article className="card">
                <h3>Scaling opportunities</h3>
                <p>Validated operators moving from profitable loops into compounding execution.</p>
              </article>
            </div>
            <p>This is not an investment platform. It is access to economic systems and ventures.</p>
          </div>
        </section>
    </main>
  );
}
