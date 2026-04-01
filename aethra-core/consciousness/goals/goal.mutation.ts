export function mutateGoals(goals: Array<{ id: string; priorityHint?: number }>, stressLevel: number) {
  if (stressLevel < 0.6) return goals;
  return goals.map((goal) => ({
    ...goal,
    priorityHint: goal.id === "preserve-capital" ? 1 : Number(goal.priorityHint || 3) + 1,
  }));
}
