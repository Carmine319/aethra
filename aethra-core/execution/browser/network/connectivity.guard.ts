export function validateConnection(url: string) {
  const value = String(url || "");
  if (!value.startsWith("https://")) {
    throw new Error("Insecure connection blocked");
  }
  return true;
}
