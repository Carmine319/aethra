/**
 * Ω v15 — Detect divergent fingerprints for the same protocol name.
 */

export function guardFork(name: string, existingFingerprint: string | null, incomingFingerprint: string) {
  if (existingFingerprint && existingFingerprint !== incomingFingerprint) {
    return { forkRisk: true as const, name, existingFingerprint, incomingFingerprint };
  }
  return { forkRisk: false as const, name };
}
