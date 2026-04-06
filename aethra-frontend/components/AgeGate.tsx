export default function AgeGate() {
  return (
    <div
      id="ageGateOverlay"
      className="age-gate-overlay"
      aria-modal="true"
      role="dialog"
      aria-labelledby="ageGateTitle"
    >
      <div className="age-gate-card">
        <h2 id="ageGateTitle">AETHRA notice</h2>
        <p className="age-gate-lede">
          This platform is intended for users aged <strong>18 and above</strong>. By
          continuing, you confirm that you meet this requirement.
        </p>
        <button type="button" className="btn btn-primary" id="ageGateConfirm">
          I am 18+
        </button>
      </div>
    </div>
  );
}
