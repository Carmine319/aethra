export function removeConstraints(bottlenecks: string[]) {
  return bottlenecks.map((bottleneck) => ({
    bottleneck,
    action: `remove-${bottleneck}`,
    status: "scheduled",
  }));
}
