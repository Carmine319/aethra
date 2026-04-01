/**
 * Ω v15 — Structural dependency map (emergent switching surface, non-coercive).
 */

export function mapDependencies(protocols: any[]) {
  return protocols.map((p) => ({
    name: p.name,
    dependencies: p.integrations || [],
  }));
}
