import { createPaymentIntentStub } from "../connectors/stripe.connector";
import { logExternalEvent } from "../compliance/audit.bridge";

export function startCheckoutFlow(input: { amount_gbp: number; correlation_id: string; customer_ref?: string }) {
  logExternalEvent({ event: "checkout_started", correlation_id: input.correlation_id });
  return createPaymentIntentStub({
    amount_gbp: input.amount_gbp,
    correlation_id: input.correlation_id,
    customer_ref: input.customer_ref,
  });
}
