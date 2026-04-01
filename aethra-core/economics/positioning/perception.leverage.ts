export function leveragePerception(input: { clarity: number; authority: number; repetition: number }) {
  return {
    leverageScore: Number((input.clarity * 0.4 + input.authority * 0.35 + input.repetition * 0.25).toFixed(4)),
  };
}
