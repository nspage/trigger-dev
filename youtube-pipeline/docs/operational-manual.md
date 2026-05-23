# 📖 YouTube LLM Pipeline — Operational Manual

### ⏰ The Schedule (UTC)
*   **Real-time**: New videos appear instantly in your Chrome Extension Queue via Webhook.
*   **21:00 Daily (approx. 9pm Paris)**: `yt-daily-email-digest` sends the end-of-day summary.
*   **Every 4 Days**: Run `yt-subscribe-pubsub` to renew YouTube leases.

### 🕹️ Chrome Extension Dashboard (Sole Control Center)
The Chrome Extension serves as your only control center:
*   **Pending Queue**: Review newly ingested videos. Click `Process` to analyze, or `Discard` to remove.
*   **Channel Tracking**: Switch to the Channels tab to manually add a new YouTube URL or remove existing subscriptions.
*   **Telegram Delivery**: Check the "Telegram" box in the header to receive the final Markdown analysis directly to your phone.

### 🏗️ Architecture
1.  **YouTube Push**: YouTube sends a notification to your Cloudflare Worker.
2.  **KV Storage**: The Worker stores the video info in Cloudflare KV.
3.  **Dashboard**: You open the Chrome Extension to review the pending queue.
4.  **LLM Processing**: When you click Process, Trigger.dev pulls the transcript using your Local Docker IP, sends it to Gemini 3.1 Flash-Lite, and saves the markdown analysis.
5.  **Delivery**: Analysis is sent immediately to your Telegram inbox and batched into a nightly email.

### 🛠️ Maintenance
*   **Updating Prompts**: Edit `src/trigger/youtube-pipeline/process-video.ts` to refine the Gemini analysis style.
*   **Worker Secrets**: Managed in the Cloudflare Dashboard under Settings -> Variables.

### 🐳 Local Worker (Docker)
To avoid YouTube blocking Cloud IPs during transcript extraction, this project uses a **Local Worker** strategy.

*   **Why**: YouTube blocks requests from Trigger.dev's cloud servers. Running the worker on your local Mac IP is the most reliable way to fetch transcripts.
*   **Starting**: Run `docker-compose up -d` from the project root.
*   **Automatic Start**: The container is configured to `restart: always`, meaning it will start automatically when you turn on your Mac.
*   **Monitoring**: Use `docker logs -f yt-pipeline-worker` to see live processing logs.
*   **Code Updates**: Any changes to the `src/` folder are applied instantly (Hot Reload).
*   **Dependency Updates**: If you change `package.json`, run `docker-compose up -d --build` to refresh the container.

