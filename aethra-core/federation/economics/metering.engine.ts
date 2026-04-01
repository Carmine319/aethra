import { federationLog } from "../memory/partner.registry";

export function meterUsage(partnerId: string, units: number, unit_price: number) {
  const cost = Math.round(Number(units || 0) * Number(unit_price || 0) * 100) / 100;
  federationLog({ event: "metering", partner_id: partnerId, units, unit_price, cost });
  return { cost_gbp: cost };
}
