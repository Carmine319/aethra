export function buildDependencyGraph(system: Record<string, unknown>) {
  return Object.keys(system || {}).map((key) => ({
    node: key,
    dependencies: ([] as string[]).concat(
      (system[key] && typeof system[key] === "object" && (system[key] as any).dependencies) || []
    ),
  }));
}
