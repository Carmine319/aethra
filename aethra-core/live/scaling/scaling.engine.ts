export function scaleLoop(input: { roi: number; capital: number }) {
  const scale = input.roi >= 2;
  return {
    scale,
    nextCapital: scale ? Number((input.capital * 1.35).toFixed(2)) : Number(input.capital.toFixed(2)),
  };
}
