export function manageWallet(capital: number) {
  return {
    reserve: Number((capital * 0.28).toFixed(2)),
    operating: Number((capital * 0.52).toFixed(2)),
    optionality: Number((capital * 0.2).toFixed(2)),
  };
}
