export type FunnelStepType = "content" | "engagement" | "conversion";

export type FunnelDefinition = {
  steps: Array<{ type: FunnelStepType; channelHint?: string }>;
  product: {
    name: string;
    price: number;
    id?: string;
  };
  tenantId?: string;
  sessionId?: string;
};

export function buildFunnel(product: FunnelDefinition["product"]): FunnelDefinition {
  return {
    steps: [{ type: "content" }, { type: "engagement" }, { type: "conversion" }],
    product,
  };
}
