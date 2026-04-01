import crypto from "crypto";

const ALGO = "aes-256-gcm";

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(String(secret || ""), "utf8").digest();
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(String(input || ""), "utf8").digest("hex");
}

export function encrypt(plainText: string, secret: string): string {
  const iv = crypto.randomBytes(12);
  const key = deriveKey(secret);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plainText || ""), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decrypt(cipherText: string, secret: string): string {
  const [ivHex, tagHex, dataHex] = String(cipherText || "").split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Invalid encrypted payload");
  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const out = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return out.toString("utf8");
}
