# 🎬 Local YouTube Knowledge Pipeline

A local-first, pragmatic system for turning YouTube videos into high-signal knowledge using **Trigger.dev (v3)** and **Google Gemini**.

## 🏗️ Architecture & Purpose

This project extracts transcripts from YouTube videos, synthesizes them into structured Markdown summaries using LLMs, and delivers them via Telegram and Email.

### Core Components
1.  **Ingestion Layer (Remote):** A Cloudflare Worker receiving PubSubHubbub notifications from YouTube.
2.  **Storage (Remote):** Cloudflare KV stores the global state (pending queue, tracked channels, processed analyses).
3.  **Local Dashboard (Webapp):** A Node.js Hono server (`src/webapp/index.ts`) that serves the Chrome Extension and triggers background tasks.
4.  **Local Processing (Trigger.dev):** Background tasks running locally in Docker to bypass YouTube's aggressive IP blocking of cloud servers.
5.  **User Interface:** A Chrome Extension for reviewing the queue, adding channels, and viewing processing history.

## 🛠️ Building and Running

### Prerequisites
- **Docker & Docker Compose**
- **Node.js 20+**
- **Trigger.dev Account** (Project ID required)
- **Google AI Studio Key** (Gemini API)
- **Cloudflare Account** (KV Namespace)

### Key Commands
- **Local Development:** `npm run dev` (Starts the extension server and Trigger.dev dev loop)
- **Docker Setup:** `docker-compose up -d` (Runs the full pipeline worker in the background)
- **Webapp/API:** `npm run dev:web` (Starts just the Hono server on port 3000)

### Deployment
- **Worker:** Deploy the Cloudflare Worker in `worker/` using `npx wrangler deploy`.
- **Pipeline:** **DO NOT** deploy the main pipeline to Trigger.dev Cloud. It must run locally or in a residential Docker container to ensure `youtube-transcript` works reliably.

## 📜 Development Conventions

### Local-First Mandate
- **IP Sensitivity:** YouTube transcript scraping must originate from a residential or non-cloud IP. The pipeline is architected to run in Docker on a local machine for this reason.
- **Trigger.dev v3:** Always use the latest SDK patterns (`schemaTask`, `trigger`, etc.). Do not use deprecated v2 syntax.

### State Management
- **KV-Centric:** Use `src/trigger/youtube-pipeline/kv-client.ts` for all state interactions. This client proxies requests through the Cloudflare Worker API.
- **Environment Variables:** All critical keys (Gemini, Telegram, Trigger, Cloudflare) must be defined in `.env`. See `.env.example`.

### Task Logic
- **`process-video.ts`:** The core engine. Fetches transcripts, calls Gemini with category-specific prompts, and saves results.
- **`ingest.ts`:** Polling/triggered ingestion of videos from KV into the active processing queue.

### Extension Communication
- The Chrome extension communicates with `http://localhost:3000/api/extension/*`.
- All extension endpoints are defined in `src/webapp/index.ts`.

## 📂 Directory Structure
- `src/trigger/`: Trigger.dev background tasks.
- `src/webapp/`: Local API server for the Chrome Extension.
- `worker/`: Cloudflare Worker source (Remote entry point).
- `chrome-extension/`: Frontend UI for the pipeline.
- `docs/`: Additional integration and operational guides.
