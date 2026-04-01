export function globalKill(condition: boolean) {
  if (condition) {
    throw new Error("System halted by global kill switch");
  }
}
