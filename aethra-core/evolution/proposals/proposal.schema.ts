export type ExpectedImpact = {
  revenue?: number;
  risk?: number;
  cost_of_adaptation?: number;
  leverage_delta?: number;
};

export type EvolutionProposal = {
  id: string;
  layer: "operational" | "structural" | "architectural";
  description: string;
  expectedImpact: ExpectedImpact;
  breaksCoreLogic?: boolean;
  irreversible?: boolean;
  dependency_hints?: string[];
  created_at?: number;
};
