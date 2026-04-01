import fs from "fs";
import path from "path";
import { audit } from "../telemetry/tracer";
import { runWithRetry } from "./retry.policy";

const queueFile = path.join(__dirname, "..", "logs", "task.queue.json");
const deadFile = path.join(__dirname, "..", "logs", "task.deadletter.json");

type TaskEnvelope = {
  taskId: string;
  task: any;
};

function ensureFiles() {
  const dir = path.join(__dirname, "..", "logs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(queueFile)) fs.writeFileSync(queueFile, "[]", "utf8");
  if (!fs.existsSync(deadFile)) fs.writeFileSync(deadFile, "[]", "utf8");
}

function readList(file: string): TaskEnvelope[] {
  ensureFiles();
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeList(file: string, rows: TaskEnvelope[]) {
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), "utf8");
}

export function enqueue(task: any) {
  const q = readList(queueFile);
  const envelope = { taskId: String(Date.now()), task };
  q.push(envelope);
  writeList(queueFile, q);
  audit("queue_enqueue", { task_id: envelope.taskId });
  return envelope;
}

export async function processQueue(handler: (task: any) => Promise<void>) {
  const q = readList(queueFile);
  const remaining: TaskEnvelope[] = [];
  for (const item of q) {
    try {
      await runWithRetry(() => handler(item.task));
      audit("queue_processed", { task_id: item.taskId });
    } catch (e: any) {
      const dead = readList(deadFile);
      dead.push(item);
      writeList(deadFile, dead);
      audit("queue_deadletter", { task_id: item.taskId, message: String(e?.message || e) });
    }
  }
  writeList(queueFile, remaining);
}
