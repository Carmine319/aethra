import { logExternalEvent } from "../compliance/audit.bridge";
import { bindToEntity } from "./identity.connector";

export type StripeIntentStub = {
  amount_gbp: number;
  correlation_id: string;
  customer_ref?: string;
};

/** Platform-compliant payment intent stub — wire to real Stripe in host app. */
export function createPaymentIntentStub(input: StripeIntentStub) {
  const bound = bindToEntity({
    type: "stripe_payment_intent_stub",
    ...input,
    venture_id: input.correlation_id,
  });
  logExternalEvent({ event: "stripe_intent_stub", correlation_id: input.correlation_id });
  return bound;
}
