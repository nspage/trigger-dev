# 🎬 Local YouTube Knowledge Pipeline

A pragmatic, local-first tool for extracting high-signal knowledge from YouTube videos using Trigger.dev and Google Gemini.

### 🚀 The Strategy
To bypass YouTube's aggressive IP blocking of cloud servers (like Trigger.dev Cloud), this project runs **strictly locally in a Docker container**. This allows the pipeline to use your residential/local IP for transcript scraping while utilizing Trigger.dev for background task orchestration.

### 🏗️ Architecture
1.  **Ingestion**: A public Cloudflare Worker receives YouTube notifications and stores them in Cloudflare KV.
2.  **Dashboard**: A **Chrome Extension** serves as the primary UI to review and approve videos.
3.  **Processing**: The **Local Docker Worker** fetches transcripts via your local IP and generates AI synthesis using Gemini.
4.  **Delivery**: Results are pushed to Telegram as documents and emailed via a daily digest.

### 🛠️ Setup
1.  Configure your `.env` file (see `.env.example`).
2.  Run `docker-compose up -d`.
3.  Load the `chrome-extension` folder into your browser as an unpacked extension.
