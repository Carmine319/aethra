import fs from "fs";
import path from "path";

export function saveSnapshot(label: string, payload: Record<string, unknown>) {
  const file = path.join(__dirname, "snapshots", `${label}.json`);
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return { ref: label, path: file };
}
