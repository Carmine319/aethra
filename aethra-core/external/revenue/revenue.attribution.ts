import { appendCashflow } from "./real.cashflow";
import { generateEvidence } from "../compliance/evidence.generator";
import { resolveLegalEntity } from "../compliance/identity.mapping";

export function attributeRevenue(source: string, amount: number, correlation_id: string) {
  const row = {
    source: String(source),
    amount: Number(amount || 0),
    currency: "GBP",
    legal_entity: resolveLegalEntity(),
    correlation_id,
    timestamp: Date.now(),
  };
  appendCashflow({ event: "revenue_attributed", ...row });
  const evidence = generateEvidence({
    type: "revenue_attribution",
    ...row,
    venture_id: correlation_id,
  });
  return { ...row, evidence };
}
