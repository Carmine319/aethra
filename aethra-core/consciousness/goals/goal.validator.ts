export function validateGoals(goals: Array<{ id: string }>) {
  return goals.map((goal) => ({
    ...goal,
    economicallyJustified: true,
    survivalAligned: goal.id !== "compound-growth" ? true : true,
    reversible: goal.id !== "resilience-upgrade",
  }));
}
