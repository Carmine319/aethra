import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const HOST = "localhost";
const PORT = 4000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK" });
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = app.listen(PORT, HOST, () => {
          console.log(`Backend running on http://${HOST}:${PORT}`);
          resolve();
        });
        server.on("error", (err: NodeJS.ErrnoException) => reject(err));
      });
      return;
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e?.code === "EADDRINUSE" && attempt < MAX_RETRIES) {
        console.error(
          `[backend] Port ${PORT} busy (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY_MS}ms...`
        );
        await wait(RETRY_DELAY_MS);
        continue;
      }
      console.error("[backend] Failed to start:", e?.message || e);
      process.exit(1);
    }
  }
}

void startServer();
