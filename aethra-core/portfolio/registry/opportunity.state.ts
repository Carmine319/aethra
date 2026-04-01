export type OpportunityStatus = "active" | "scaled" | "killed";

export type OpportunityState = {
  id: string;
  name: string;
  status: OpportunityStatus;
  capitalAllocated: number;
  revenue: number;
  roi: number;
  age: number;
  performanceScore: number;
  signalStrength?: number;
  conversionRate?: number;
  timeToRevenue?: number;
};
