const blocked = ["bank", "wallet", "billing", "stripe", "coinbase"];

export function sandboxCheck(url: string) {
  const value = String(url || "").toLowerCase();
  if (!value) return;
  if (blocked.some((b) => value.includes(b))) {
    throw new Error("Restricted domain");
  }
}
