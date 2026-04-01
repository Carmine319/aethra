export const OUTBOUND_CHANNEL_IDS = ["email", "crm_sequence", "direct_outreach"] as const;

export type OutboundChannelId = (typeof OUTBOUND_CHANNEL_IDS)[number];
