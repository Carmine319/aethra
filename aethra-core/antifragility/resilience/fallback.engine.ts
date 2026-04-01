import { assertCircuitClosed } from "./circuit.breaker";

export function resolveWithFallback<T>(primary: () => T, secondary: () => T): T {
  assertCircuitClosed();
  try {
    return primary();
  } catch {
    return secondary();
  }
}
