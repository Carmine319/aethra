export type FederationContract = {
  id: string;
  parties: string[];
  pricing: number;
  currency: string;
  sla_ms: number;
  terms_hash: string;
  created_at: number;
};
