import { logExternalEvent } from "../compliance/audit.bridge";

export function retainCustomer(customer: { id: string; value: number; correlation_id: string }) {
  const lifetimeValue = Math.round(Number(customer.value || 0) * 1.5 * 100) / 100;
  const out = {
    ...customer,
    retained: true,
    lifetimeValue,
  };
  logExternalEvent({ event: "retention", customer_id: customer.id, lifetimeValue });
  return out;
}
