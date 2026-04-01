export const MARKETPLACE_CHANNEL_IDS = ["gumroad", "stripe_checkout", "custom_storefront"] as const;

export type MarketplaceChannelId = (typeof MARKETPLACE_CHANNEL_IDS)[number];
