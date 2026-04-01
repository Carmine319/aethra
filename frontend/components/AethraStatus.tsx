import React from "react";

type AethraStatusProps = {
  modeLabel?: string;
  capitalAllocationActive?: boolean;
  executionInProgress?: boolean;
  onAdjustRiskProfile?: (preference: "auto" | "safe" | "aggressive") => void;
};

export default function AethraStatus(props: AethraStatusProps) {
  const modeLabel = props.modeLabel || "Adaptive";
  const allocationActive = props.capitalAllocationActive !== false;
  const inProgress = props.executionInProgress !== false;

  return (
    <section style={{ border: "1px solid #2e2e2e", borderRadius: 10, padding: 14 }}>
      <p>AETHRA is operating in {modeLabel} Mode</p>
      <p>{allocationActive ? "Capital Allocation Active" : "Capital Allocation Paused"}</p>
      <p>{inProgress ? "Execution in progress" : "Execution idle"}</p>
      {props.onAdjustRiskProfile ? (
        <div style={{ marginTop: 10 }}>
          <label htmlFor="risk-profile">Adjust risk profile: </label>
          <select
            id="risk-profile"
            defaultValue="auto"
            onChange={(e) => props.onAdjustRiskProfile?.(e.target.value as "auto" | "safe" | "aggressive")}
          >
            <option value="auto">Auto</option>
            <option value="safe">Safe</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      ) : null}
    </section>
  );
}
