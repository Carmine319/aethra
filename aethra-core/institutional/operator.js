"use strict";

const PRIVATE_ONLY = true;

const OPERATOR_MODE_POLICY = {
  private_only: PRIVATE_ONLY,
  owner_ventures_only: true,
  public_dashboard_access: false,
  external_api_exposure: false,
  mode: "internal_revenue_engine",
};

function assertPrivateOperatorMode() {
  if (!PRIVATE_ONLY) {
    throw new Error("Operator mode violation: PRIVATE_ONLY must remain true.");
  }
  return OPERATOR_MODE_POLICY;
}

function requiresHumanGate() {
  return true;
}

module.exports = {
  PRIVATE_ONLY,
  OPERATOR_MODE_POLICY,
  assertPrivateOperatorMode,
  requiresHumanGate,
};
