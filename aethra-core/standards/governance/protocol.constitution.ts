/**
 * Ω v15 — Constitutional axioms for compliant protocol modules (reference only).
 */

export const PROTOCOL_CONSTITUTION = [
  "Entropy must not increase per interaction for compliant paths.",
  "Same canonical input + schema implies same binding fingerprint.",
  "Partial providers must degrade to partial value, not hard failure.",
  "No coercive lock-in: only structural switching costs are modeled.",
] as const;
