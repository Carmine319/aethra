export const PRIVATE_ONLY = true;

export type OperatorModePolicy = {
  private_only: true;
  owner_ventures_only: true;
  public_dashboard_access: false;
  external_api_exposure: false;
  mode: "internal_revenue_engine";
};

export const OPERATOR_MODE_POLICY: OperatorModePolicy = {
  private_only: PRIVATE_ONLY,
  owner_ventures_only: true,
  public_dashboard_access: false,
  external_api_exposure: false,
  mode: "internal_revenue_engine",
};

export function assertPrivateOperatorMode(): OperatorModePolicy {
  if (!PRIVATE_ONLY) {
    throw new Error("Operator mode violation: PRIVATE_ONLY must remain true.");
  }
  return OPERATOR_MODE_POLICY;
}

export function requiresHumanGate(): boolean {
  return true;
}
