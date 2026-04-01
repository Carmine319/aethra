import { readAntifragilityPolicy } from "../governance/stress.policy";

let failures = 0;
let openUntil = 0;

export function recordFailure() {
  failures += 1;
  const p = readAntifragilityPolicy();
  if (failures >= Number(p.circuit_failure_threshold ?? 5)) {
    openUntil = Date.now() + 30_000;
  }
}

export function resetCircuit() {
  failures = 0;
  openUntil = 0;
}

export function assertCircuitClosed() {
  if (Date.now() < openUntil) {
    throw new Error("Circuit breaker open — subsystem isolated");
  }
}
