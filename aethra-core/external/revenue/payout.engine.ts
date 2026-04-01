import { appendCashflow } from "./real.cashflow";
import { logExternalEvent } from "../compliance/audit.bridge";
import { bindToEntity } from "../connectors/identity.connector";

export function schedulePayout(input: {
  amount_gbp: number;
  destination_ref: string;
  correlation_id: string;
}) {
  appendCashflow({ event: "payout_scheduled", ...input });
  logExternalEvent({ event: "payout_scheduled", correlation_id: input.correlation_id });
  return bindToEntity({
    type: "payout",
    ...input,
    amount: input.amount_gbp,
    venture_id: input.correlation_id,
  });
}
