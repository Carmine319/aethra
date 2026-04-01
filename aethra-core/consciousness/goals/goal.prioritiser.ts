export function prioritiseGoals(goals: Array<{ id: string; priorityHint: number }>) {
  return [...goals].sort((a, b) => Number(a.priorityHint || 99) - Number(b.priorityHint || 99));
}
