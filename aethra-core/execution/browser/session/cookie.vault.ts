import fs from "fs";
import path from "path";
import { decrypt, encrypt, sha256 } from "./encryption";
import { validateSession } from "./session.validator";

const VAULT_DIR = path.join(__dirname, "..", "..", "sessions-vault");

function ensureVaultDir() {
  if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
}

function getVaultPath(sessionId: string): string {
  return path.join(VAULT_DIR, `${sessionId}.cookie.enc`);
}

export function safeParseCookies(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Cookie corruption detected");
  }
}

export function saveCookiesEncrypted(sessionId: string, cookies: unknown, secret: string): string {
  validateSession(sessionId);
  ensureVaultDir();
  const plain = JSON.stringify(cookies || []);
  const payload = {
    hash: sha256(plain),
    encrypted: encrypt(plain, secret),
    ts: Date.now(),
  };
  const out = JSON.stringify(payload);
  fs.writeFileSync(getVaultPath(sessionId), out, "utf8");
  return payload.hash;
}

export function loadCookiesEncrypted(sessionId: string, secret: string): unknown[] {
  validateSession(sessionId);
  ensureVaultDir();
  const file = getVaultPath(sessionId);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(raw || "{}");
  if (!parsed.encrypted || !parsed.hash) throw new Error("Cookie vault payload invalid");
  const plain = decrypt(String(parsed.encrypted), secret);
  const actualHash = sha256(plain);
  if (actualHash !== String(parsed.hash)) {
    throw new Error("Cookie tampering detected");
  }
  const cookies = safeParseCookies(plain);
  if (!Array.isArray(cookies)) throw new Error("Cookie payload must be an array");
  return cookies;
}
