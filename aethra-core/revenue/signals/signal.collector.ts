export type RawSignalInput = {
  likes?: number;
  comments?: number;
  clicks?: number;
  impressions?: number;
};

export function collectSignals(data: RawSignalInput) {
  const likes = Number(data.likes || 0);
  const comments = Number(data.comments || 0);
  const clicks = Number(data.clicks || 0);
  return {
    engagement: likes + comments,
    clicks,
    impressions: Number(data.impressions || 0),
  };
}
