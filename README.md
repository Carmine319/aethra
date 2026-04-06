# AETHRA Q+++

Deterministic economic intelligence: seven top-level keys (`decision`, `strategy`, `monetisation`, `brand`, `execution`, `portfolio`, `meta`). Composite viability below 60% yields a kill verdict and control-plane block.

## Install (Python core)

```bash
cd Aethra
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

## Web UI (Next.js) — source of truth

The public site lives in **`aethra-frontend/`** only (App Router). Vercel uses `rootDirectory: aethra-frontend`.

```bash
cd aethra-frontend
npm install
npm run dev
```

Open **http://127.0.0.1:3000** — homepage, `/ideas`, `/business`, `/portfolio`.

From the **repository root** you can also run:

```bash
npm run dev:web
```

Copy **`aethra-frontend/.env.example`** to **`.env.local`** and set **`AETHRA_API_ORIGIN`** if your API is not on `http://localhost:4000`.

## Web API (Node)

From the project root (same folder as `index.js`):

```bash
node index.js
```

- **API** (default): [http://localhost:4000/](http://localhost:4000/) — `GET /health`, `GET /api/v1/schema`, `POST` pipelines as below.
- **Browser UI**: not served here — `GET /` redirects to **`AETHRA_NEXT_ORIGIN`** (default **http://127.0.0.1:3000**). Run the Next app alongside.

Set **`PORT`** or **`AETHRA_PORT`** to change the API listen port (default **3847**).

**Express variant** (`server.js`) defaults to port **3000**; if you use it as the backend, point Next at it:

```bash
# in aethra-frontend/.env.local
AETHRA_API_ORIGIN=http://127.0.0.1:3000
```

### API routes

- `POST /api/v1/idea`, `POST /api/v1/url`, `POST /api/v1/miae`, or unified `POST /api/v1/run` with `{ "mode": "idea"|"url"|"miae", ... }`

The server spawns `python -m aethra stdio` (JSON over stdin) so the browser never shells arguments; use `noCache: true` in JSON bodies while iterating.

### Optional static asset

- **`aethra-frontend/public/control-panel.html`** — served at **`/control-panel.html`** on the Next origin when needed.

## Root npm scripts

| Script        | Purpose                                      |
|---------------|----------------------------------------------|
| `npm run dev:web` | `next dev` in `aethra-frontend`          |
| `npm run build:web` | `next build` (deps must be installed) |
| `npm run build` | CI-style: `npm ci` + build in `aethra-frontend` |

## CLI (Python or Node)

Human-readable **decision summary** prints above the full JSON (envelope unchanged). For pipes and tools, use `--plain-json` or `AETHRA_PLAIN_JSON=1`. **`aethra stdio` and the HTTP API always return JSON only.**

```bash
aethra idea "Validate idea: …"
aethra idea "…" --plain-json
aethra url https://example.com
aethra miae
python -m aethra stdio   # read one JSON object from stdin
```

```bash
node index.js cli idea "Validate idea: …"
node index.js idea "…" --plain-json
node index.js cli url https://example.com
```

## Memory

Versioned store defaults to `.aethra_memory/`. Override with `AETHRA_MEMORY_DIR`.

Phase-2 light log: `aethra_memory/memory.json` (append-only runs: idea, scores, selected_niche, decision). Override path with `AETHRA_LIGHT_MEMORY_FILE`. Use `from aethra.memory import loadMemory, saveMemory`.

IDEA runs add `meta.memory_similarity`: keyword Jaccard + `difflib` string ratio vs prior runs, with short `insights` (e.g. similar idea did well in niche X).

## Rules

- No fabricated suppliers; IEPE lists `research_tasks` until verified data is supplied.
- MIAE does not invent markets; pass `trend_summaries` in context for top-3 opportunities.
