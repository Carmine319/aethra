export const SOCIAL_CHANNEL_IDS = ["x", "linkedin", "youtube"] as const;

export type SocialChannelId = (typeof SOCIAL_CHANNEL_IDS)[number];
