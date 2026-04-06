import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ideas",
  description: "Submit an idea for AETHRA to validate, build, and deploy.",
};

export default function IdeasPage() {
  return (
    <main className="container page-bg">
      <section className="section">
        <div className="card">
          <p className="kicker">Ideas</p>
          <h1>Turn Your Idea Into Revenue</h1>
          <p>AETHRA validates, builds, and deploys ideas into real revenue systems.</p>
          <form method="post" action="#" className="form-grid">
            <label>
              Idea description
              <textarea
                name="ideaDescription"
                required
                placeholder="Describe the core idea, problem, and why now."
              />
            </label>
            <label>
              Target audience
              <input
                type="text"
                name="targetAudience"
                required
                placeholder="Who specifically is this for?"
              />
            </label>
            <label>
              Desired outcome
              <input
                type="text"
                name="desiredOutcome"
                required
                placeholder="What result should this system produce?"
              />
            </label>
            <label>
              Brand name (optional)
              <input type="text" name="brandName" placeholder="Optional proposed brand name" />
            </label>
            <label>
              Social media handles
              <input
                type="text"
                name="socialHandles"
                required
                placeholder="@handle, profile URL, or account list"
              />
            </label>
            <label>
              Email
              <input type="email" name="email" required placeholder="you@company.com" />
            </label>
            <div>
              <button type="submit" className="btn btn-primary">
                Submit Idea
              </button>
            </div>
          </form>
          <p>
            AETHRA evaluates submissions and deploys high-potential ideas into live systems. Revenue
            share applies only when revenue is generated.
          </p>
        </div>
      </section>
    </main>
  );
}
