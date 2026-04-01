export function reduceDependencies(dependencies: Array<{ name: string; criticality: number }>) {
  const reduced = dependencies.map((dep) => ({
    ...dep,
    criticality: Number((Math.max(0.1, Number(dep.criticality || 0.5) * 0.85)).toFixed(4)),
  }));
  const dependencyIndex = Number((reduced.reduce((sum, dep) => sum + dep.criticality, 0) / Math.max(1, reduced.length)).toFixed(4));
  return { reduced, dependencyIndex };
}
