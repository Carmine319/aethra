export function evolutionKill(condition: boolean) {
  if (condition) {
    throw new Error("Evolution kill switch triggered");
  }
}
