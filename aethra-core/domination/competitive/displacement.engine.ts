export function displaceCompetitorFrames(frames: string[]) {
  const displaced = frames.map((frame) => `obsolete:${frame}`);
  return {
    displaced,
    displacementRate: Number((displaced.length / Math.max(1, frames.length)).toFixed(4)),
  };
}
