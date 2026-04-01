import { bindToEntity } from "../connectors/identity.connector";
import { logExternalEvent } from "../compliance/audit.bridge";

export function deliverOffer(payload: {
  offer_id: string;
  headline: string;
  price_gbp: number;
  correlation_id: string;
}) {
  logExternalEvent({ event: "offer_delivered", offer_id: payload.offer_id });
  return bindToEntity({
    type: "offer_delivery",
    ...payload,
    amount: payload.price_gbp,
    venture_id: payload.correlation_id,
  });
}
