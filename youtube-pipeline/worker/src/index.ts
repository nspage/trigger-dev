import { Hono } from "hono";

/**
 * Cloudflare Worker — YouTube LLM Pipeline
 *
 * Public-facing endpoints:
 *  1. /youtube/pubsub  — PubSubHubbub verification (GET) + notification (POST)
 *  2. /telegram/webhook — Telegram callback queries (approval buttons)
 *  3. /api/videos/*    — REST API for KV state (used by Trigger.dev tasks)
 */

type Env = {
  YT_KV: KVNamespace;
  TRIGGER_SECRET_KEY: string;
  WORKER_API_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
};

const app = new Hono<{ Bindings: Env }>();

// ── Helper: Auth middleware for /api routes ──

function requireAuth(c: any): boolean {
  const auth = c.req.header("Authorization");
  const expected = `Bearer ${c.env.WORKER_API_SECRET}`;
  return auth === expected;
}

// ── KV Key Helpers ──

const KV_PENDING = "pending_videos";
const KV_PROCESSED_PREFIX = "processed:";
const KV_ANALYSIS_PREFIX = "analysis:";
const KV_TRACKED_CHANNELS = "tracked_channels";
const KV_DAILY_COST_PREFIX = "cost:";
const KV_CATEGORIES = "categories";
const KV_CATEGORISATION_PROMPT = "categorisation_prompt";

const DEFAULT_CATEGORIES = [
  {
    name: "growth",
    model: "gemini-3.1-flash-lite",
    prompt: `Analyze the transcript and provide:\n- Speaker identification with their roles/affiliations\n- Key topics developed in the transcript\nIdentify and categorize the information within the transcript according to the following archetypes. If a category is not present, skip it:\n1. **Mental Models (The 'Why'):** Philosophical shifts or conceptual lenses used to view the problem. \n2. **Frameworks & Systems (The 'Structure'):** Repeatable processes, 2x2 matrices, or step-by-step methodologies developed by the speaker. \n3. **Tactical Tutorials (The 'How'):** Click-by-click or action-by-action instructions. Provide these as a numbered "SOP" (Standard Operating Procedure).\n4. **Deep Dives (The 'Mechanics'):** High-density technical explanations or granular breakdowns of a specific system \n5. **Interview Insights (The 'Nuance'):** If this is an interview, extract the non-obvious wisdom gained from the back-and-forth, including the speaker's personal "war stories."\n6. **Case Studies (The 'Proof'):** Real-world examples cited. Detail the Challenge, the Intervention, and the Result.\n7. **Heuristics & Red Flags (The 'Shortcuts'):** Rules of thumb, "if-this-then-that" shortcuts, and warning signs to watch out for.\n8. **Contrarian Takes (The 'Alpha'):** Ideas mentioned that go against the "common wisdom" of the industry.\n9. **Resource Stack (The 'Tools'):** A list of all software, books, hardware, or third-party services mentioned as essential.`
  },
  {
    name: "ai concepts",
    model: "gemini-3.1-flash-lite",
    prompt: `Analyze the transcript and provide:\n- Speaker identification with their roles/affiliations\n- Key topics developed in the transcript\n- Core frameworks and mental models developed in the transcript (with visual representation instructions if relevant)\n- Case studies with key takeaways\n- Glossary of specialized terms\nIdentify and categorize the information within the transcript according to the following archetypes. If a category is not present, skip it:\n1. **Mental Models (The 'Why'):** Philosophical shifts or conceptual lenses used to view the problem. \n2. **Frameworks & Systems (The 'Structure'):** Repeatable processes, 2x2 matrices, or step-by-step methodologies developed by the speaker. \n3. **Tactical Tutorials (The 'How'):** Click-by-click or action-by-action instructions. Provide these as a numbered "SOP" (Standard Operating Procedure).\n4. **Deep Dives (The 'Mechanics'):** High-density technical explanations or granular breakdowns of a specific system \n5. **Interview Insights (The 'Nuance'):** If this is an interview, extract the non-obvious wisdom gained from the back-and-forth, including the speaker's personal "war stories."\n6. **Case Studies (The 'Proof'):** Real-world examples cited. Detail the Challenge, the Intervention, and the Result.\n7. **Heuristics & Red Flags (The 'Shortcuts'):** Rules of thumb, "if-this-then-that" shortcuts, and warning signs to watch out for.\n8. **Contrarian Takes (The 'Alpha'):** Ideas mentioned that go against the "common wisdom" of the industry.\n9. **Resource Stack (The 'Tools'):** A list of all software, books, hardware, or third-party services mentioned as essential.`
  },
  {
    name: "entrepreneurship",
    model: "gemini-3.1-flash-lite",
    prompt: `Analyze the transcript and provide:\n- Speaker identification with their roles/affiliations\n- Key topics developed in the transcript\n- Glossary of specialized terms\nIdentify and categorize the information within the transcript according to the following archetypes. If a category is not present, skip it:\n1. **Mental Models (The 'Why'):** Philosophical shifts or conceptual lenses used to view the problem. \n2. **Frameworks & Systems (The 'Structure'):** Repeatable processes, 2x2 matrices, or step-by-step methodologies developed by the speaker. \n3. **Tactical Tutorials (The 'How'):** Click-by-click or action-by-action instructions. Provide these as a numbered "SOP" (Standard Operating Procedure).\n4. **Deep Dives (The 'Mechanics'):** High-density technical explanations or granular breakdowns of a specific system \n5. **Interview Insights (The 'Nuance'):** If this is an interview, extract the non-obvious wisdom gained from the back-and-forth, including the speaker's personal "war stories."\n6. **Case Studies (The 'Proof'):** Real-world examples cited. Detail the Challenge, the Intervention, and the Result.\n7. **Heuristics & Red Flags (The 'Shortcuts'):** Rules of thumb, "if-this-then-that" shortcuts, and warning signs to watch out for.\n8. **Contrarian Takes (The 'Alpha'):** Ideas mentioned that go against the "common wisdom" of the industry.\n9. **Resource Stack (The 'Tools'):** A list of all software, books, hardware, or third-party services mentioned as essential.`
  },
  {
    name: "web3 business",
    model: "gemini-3.1-flash-lite",
    prompt: `Analyze the transcript and provide:\n- Speaker identification with their roles/affiliations\n- Key topics developed in the transcript\n- Glossary of specialized terms\nIdentify and categorize the information within the transcript according to the following archetypes. If a category is not present, skip it:\n1. **Mental Models (The 'Why'):** Philosophical shifts or conceptual lenses used to view the problem. \n2. **Frameworks & Systems (The 'Structure'):** Repeatable processes, 2x2 matrices, or step-by-step methodologies developed by the speaker. \n3. **Tactical Tutorials (The 'How'):** Click-by-click or action-by-action instructions. Provide these as a numbered "SOP" (Standard Operating Procedure).\n4. **Deep Dives (The 'Mechanics'):** High-density technical explanations or granular breakdowns of a specific system \n5. **Interview Insights (The 'Nuance'):** If this is an interview, extract the non-obvious wisdom gained from the back-and-forth, including the speaker's personal "war stories."\n6. **Case Studies (The 'Proof'):** Real-world examples cited. Detail the Challenge, the Intervention, and the Result.\n7. **Heuristics & Red Flags (The 'Shortcuts'):** Rules of thumb, "if-this-then-that" shortcuts, and warning signs to watch out for.\n8. **Contrarian Takes (The 'Alpha'):** Ideas mentioned that go against the "common wisdom" of the industry.\n9. **Resource Stack (The 'Tools'):** A list of all software, books, hardware, or third-party services mentioned as essential.`
  }
];

// ────────────────────────────────────────
// 1. PubSubHubbub Endpoints
// ────────────────────────────────────────

/** GET /youtube/pubsub — Hub verification challenge */
app.get("/youtube/pubsub", (c) => {
  const challenge = c.req.query("hub.challenge");
  const mode = c.req.query("hub.mode");
  const topic = c.req.query("hub.topic");

  console.log(`PubSubHubbub verification: mode=${mode} topic=${topic}`);

  if (challenge) {
    return c.text(challenge, 200);
  }
  return c.text("Missing challenge", 400);
});

/** POST /youtube/pubsub — Receive new video notification (Atom XML) */
app.post("/youtube/pubsub", async (c) => {
  const body = await c.req.text();
  console.log("PubSubHubbub notification received");

  // Parse Atom XML — extract video info
  const videoId = extractXmlTag(body, "yt:videoId");
  const channelId = extractXmlTag(body, "yt:channelId");
  const title = extractXmlTag(body, "title");
  const published = extractXmlTag(body, "published");
  const channelName = extractXmlTag(body, "name");

  if (!videoId || !channelId) {
    console.error("Could not parse video/channel ID from notification");
    return c.text("OK", 200); // Still return 200 to avoid re-delivery
  }

  console.log(`New video: "${title}" (${videoId}) from ${channelName} (${channelId})`);

  // Check if already processed
  const existing = await c.env.YT_KV.get(`${KV_PROCESSED_PREFIX}${videoId}`);
  if (existing) {
    console.log("Already processed, skipping.");
    return c.text("OK", 200);
  }

  // Add to pending list
  const pendingRaw = await c.env.YT_KV.get(KV_PENDING);
  const pending: any[] = pendingRaw ? JSON.parse(pendingRaw) : [];

  // Deduplicate
  if (pending.some((v: any) => v.videoId === videoId)) {
    console.log("Already in pending queue.");
    return c.text("OK", 200);
  }

  // Resolve category from KV or hardcoded fallback
  const channelsRaw = await c.env.YT_KV.get(KV_TRACKED_CHANNELS);
  const channels: any[] = channelsRaw ? JSON.parse(channelsRaw) : [];
  let matchedChannel = channels.find((ch: any) => ch.id === channelId);
  
  if (!matchedChannel) {
    // Hardcoded fallback map
    const fallbackMap: Record<string, string> = {
      UCCTLE8ILGcShSjtnZsOqGPw: "growth",
      UCelfWQr9sXVMTvBzviPGlFw: "ai concepts",
      UCPjNBjflYl0_HQtUvOx0Ibw: "entrepreneurship",
      UC9cn0TuPq4dnbTY_CBsm8XA: "entrepreneurship",
      UC0C_17n9iuUQPylguM1d_lQ: "ai concepts",
      UC5xxXc17GHJyuk6X1muBhzg: "web3 business",
      UCC2UPtfjtdAgofzuxUPZJ6g: "web3 business",
      UCjsgQKPpR7ubPQhPqjf8kyA: "web3 business",
      UC2ojq_nuP8ceeHqiroeKhBA: "ai concepts",
      UCEOv_8wHvYC6mzsY2Gm5WcQ: "web3 business",
      UCKc3w9FKFGdBR9PIkfngzPg: "web3 business",
      UCDxhBSgPvrFvyXLdpmygDhg: "growth",
      UCmDs9tGSLkMPj6XbVBrMN2A: "growth",
      UCjIMtrzxYc0lblGhmOgC_CA: "ai concepts",
      UCTHq3W46BiAYjKUYZq2qm_Q: "web3 business",
    };
    const cat = fallbackMap[channelId] || "ai concepts";
    matchedChannel = { category: cat };
  }
  
  const category = matchedChannel.category;

  pending.push({
    videoId,
    title: title || "Untitled",
    channelId,
    channelName: channelName || "Unknown",
    category,
    publishedAt: published || new Date().toISOString(),
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    addedAt: new Date().toISOString(),
  });

  await c.env.YT_KV.put(KV_PENDING, JSON.stringify(pending));
  console.log(`Added to pending. Queue size: ${pending.length}`);

  return c.text("OK", 200);
});

// ────────────────────────────────────────
// 2. REST API for Trigger.dev Tasks
// ────────────────────────────────────────

/** GET /api/categories */
app.get("/api/categories", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const raw = await c.env.YT_KV.get(KV_CATEGORIES);
  let categories = raw ? JSON.parse(raw) : [];
  
  if (categories.length === 0) {
    categories = DEFAULT_CATEGORIES;
    await c.env.YT_KV.put(KV_CATEGORIES, JSON.stringify(categories));
  }
  return c.json(categories);
});

/** POST /api/categories */
app.post("/api/categories", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const { name, prompt, model } = await c.req.json();
  if (!name || !prompt) return c.json({ error: "Missing name or prompt" }, 400);

  const raw = await c.env.YT_KV.get(KV_CATEGORIES);
  let categories: any[] = raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;

  const existingIndex = categories.findIndex((cat: any) => cat.name === name);
  if (existingIndex !== -1) {
    categories[existingIndex].prompt = prompt;
    if (model) categories[existingIndex].model = model;
  } else {
    categories.push({ name, prompt, model: model || "gemini-3.1-flash-lite" });
  }

  await c.env.YT_KV.put(KV_CATEGORIES, JSON.stringify(categories));
  return c.json({ ok: true, count: categories.length });
});

/** POST /api/categories/rename */
app.post("/api/categories/rename", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const { oldName, newName } = await c.req.json();
  if (!oldName || !newName) return c.json({ error: "Missing oldName or newName" }, 400);

  const raw = await c.env.YT_KV.get(KV_CATEGORIES);
  let categories: any[] = raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;

  const existingIndex = categories.findIndex((cat: any) => cat.name === oldName);
  if (existingIndex !== -1) {
    categories[existingIndex].name = newName;
    await c.env.YT_KV.put(KV_CATEGORIES, JSON.stringify(categories));
    return c.json({ ok: true });
  }
  return c.json({ error: "Category not found" }, 404);
});

/** DELETE /api/categories */
app.delete("/api/categories", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const { name } = await c.req.json();
  if (!name) return c.json({ error: "Missing name" }, 400);

  const raw = await c.env.YT_KV.get(KV_CATEGORIES);
  let categories: any[] = raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;

  categories = categories.filter((cat: any) => cat.name !== name);

  await c.env.YT_KV.put(KV_CATEGORIES, JSON.stringify(categories));
  return c.json({ ok: true, count: categories.length });
});

/** GET /api/categorisation-prompt */
app.get("/api/categorisation-prompt", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const raw = await c.env.YT_KV.get(KV_CATEGORISATION_PROMPT);
  if (!raw) {
    return c.json({ prompt: "", model: "" });
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "prompt" in parsed) {
      return c.json({ prompt: parsed.prompt, model: parsed.model || "" });
    }
  } catch (e) {}
  return c.json({ prompt: raw, model: "" });
});

/** POST /api/categorisation-prompt */
app.post("/api/categorisation-prompt", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  if (typeof body.prompt !== "string") {
    return c.json({ error: "Invalid prompt" }, 400);
  }
  const payload = {
    prompt: body.prompt,
    model: body.model || ""
  };
  await c.env.YT_KV.put(KV_CATEGORISATION_PROMPT, JSON.stringify(payload));
  return c.json({ ok: true });
});

/** GET /api/channels */
app.get("/api/channels", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const raw = await c.env.YT_KV.get(KV_TRACKED_CHANNELS);
  return c.json(raw ? JSON.parse(raw) : []);
});

/** PUT /api/channels — Bulk Overwrite */
app.put("/api/channels", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const channels = await c.req.json();
  if (!Array.isArray(channels)) return c.json({ error: "Invalid payload, expected array" }, 400);

  await c.env.YT_KV.put(KV_TRACKED_CHANNELS, JSON.stringify(channels));
  return c.json({ ok: true, count: channels.length });
});

/** POST /api/channels */
app.post("/api/channels", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const channel = await c.req.json();
  const raw = await c.env.YT_KV.get(KV_TRACKED_CHANNELS);
  const channels: any[] = raw ? JSON.parse(raw) : [];

  if (!channels.some((ch: any) => ch.id === channel.id)) {
    channels.push(channel);
    await c.env.YT_KV.put(KV_TRACKED_CHANNELS, JSON.stringify(channels));
  }

  return c.json({ ok: true, count: channels.length });
});

/** DELETE /api/channels */
app.delete("/api/channels", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const { channelId } = await c.req.json();
  if (!channelId) return c.json({ error: "Missing channelId" }, 400);

  const raw = await c.env.YT_KV.get(KV_TRACKED_CHANNELS);
  const channels: any[] = raw ? JSON.parse(raw) : [];
  const updated = channels.filter((ch: any) => ch.id !== channelId);
  await c.env.YT_KV.put(KV_TRACKED_CHANNELS, JSON.stringify(updated));

  return c.json({ ok: true, removed: channels.length - updated.length });
});

/** GET /api/videos/pending */
app.get("/api/videos/pending", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);

  const raw = await c.env.YT_KV.get(KV_PENDING);
  return c.json(raw ? JSON.parse(raw) : []);
});

/** PUT /api/videos/pending — Bulk Overwrite */
app.put("/api/videos/pending", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const pending = await c.req.json();
  if (!Array.isArray(pending)) return c.json({ error: "Invalid payload, expected array" }, 400);

  await c.env.YT_KV.put(KV_PENDING, JSON.stringify(pending));
  return c.json({ ok: true, count: pending.length });
});

/** POST /api/videos/pending — Add a video */
app.post("/api/videos/pending", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);

  const video = await c.req.json();
  const raw = await c.env.YT_KV.get(KV_PENDING);
  const pending: any[] = raw ? JSON.parse(raw) : [];

  if (!pending.some((v: any) => v.videoId === video.videoId)) {
    pending.push(video);
    await c.env.YT_KV.put(KV_PENDING, JSON.stringify(pending));
  }

  return c.json({ ok: true, count: pending.length });
});

/** DELETE /api/videos/pending — Remove videos by IDs */
app.delete("/api/videos/pending", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);

  const { videoIds } = await c.req.json();
  const raw = await c.env.YT_KV.get(KV_PENDING);
  const pending: any[] = raw ? JSON.parse(raw) : [];
  const updated = pending.filter((v: any) => !videoIds.includes(v.videoId));
  await c.env.YT_KV.put(KV_PENDING, JSON.stringify(updated));

  return c.json({ ok: true, removed: pending.length - updated.length });
});

/** GET /api/videos/processed/:videoId */
app.get("/api/videos/processed/:videoId", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);

  const videoId = c.req.param("videoId");
  const existing = await c.env.YT_KV.get(`${KV_PROCESSED_PREFIX}${videoId}`);
  return c.json({ exists: !!existing });
});

/** POST /api/videos/processed — Save a processed video */
app.post("/api/videos/processed", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);

  const video = await c.req.json();
  // Mark as processed
  await c.env.YT_KV.put(`${KV_PROCESSED_PREFIX}${video.videoId}`, "1");
  // Store full analysis (with date prefix for daily queries)
  const dateKey = video.processedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  await c.env.YT_KV.put(
    `${KV_ANALYSIS_PREFIX}${dateKey}:${video.videoId}`,
    JSON.stringify(video),
    { expirationTtl: 60 * 60 * 24 * 30 } // Keep for 30 days
  );

  return c.json({ ok: true });
});

/** GET /api/videos/analyses?date=YYYY-MM-DD or date=all */
app.get("/api/videos/analyses", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);

  const date = c.req.query("date") || new Date().toISOString().slice(0, 10);
  const prefix = date === "all" ? KV_ANALYSIS_PREFIX : `${KV_ANALYSIS_PREFIX}${date}:`;

  const keys = await c.env.YT_KV.list({ prefix });
  const analyses: any[] = [];

  for (const key of keys.keys) {
    const raw = await c.env.YT_KV.get(key.name);
    if (raw) analyses.push(JSON.parse(raw));
  }

  // If date="all", sort descending by processedAt so newest is first
  if (date === "all") {
    analyses.sort((a, b) => new Date(b.processedAt || 0).getTime() - new Date(a.processedAt || 0).getTime());
  }

  return c.json(analyses);
});

/** GET /api/costs/daily?date=YYYY-MM-DD */
app.get("/api/costs/daily", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const date = c.req.query("date") || new Date().toISOString().slice(0, 10);
  const raw = await c.env.YT_KV.get(`${KV_DAILY_COST_PREFIX}${date}`);
  return c.json(raw ? JSON.parse(raw) : { date, cost: 0, tokens: 0 });
});

/** POST /api/costs/daily */
app.post("/api/costs/daily", async (c) => {
  if (!requireAuth(c)) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const date = body.date || new Date().toISOString().slice(0, 10);
  
  const raw = await c.env.YT_KV.get(`${KV_DAILY_COST_PREFIX}${date}`);
  const current = raw ? JSON.parse(raw) : { date, cost: 0, tokens: 0 };
  
  current.cost += (body.cost || 0);
  current.tokens += (body.tokens || 0);
  
  await c.env.YT_KV.put(`${KV_DAILY_COST_PREFIX}${date}`, JSON.stringify(current));
  return c.json(current);
});

// ────────────────────────────────────────
// Helpers
// ────────────────────────────────────────

/** Simple XML tag extractor (no DOM parser needed for Atom) */
function extractXmlTag(xml: string, tag: string): string | null {
  // Handle both <tag>value</tag> and namespaced tags
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/** Trigger a Trigger.dev task via the API */
async function triggerTask(env: Env, taskId: string, payload: any) {
  console.log(`Triggering task ${taskId}...`);
  
  // V3 Trigger API URL
  const url = `https://api.trigger.dev/api/v1/tasks/${taskId}/trigger`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.TRIGGER_SECRET_KEY}`,
    },
    body: JSON.stringify({ payload }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`Trigger.dev API error: ${response.status} - ${responseText}`);
    throw new Error(`Trigger.dev API error: ${response.status}`);
  }

  const result: any = JSON.parse(responseText);
  console.log(`Triggered ${taskId} successfully. Run ID: ${result.id}`);
  return result;
}

// ── Health check ──

app.get("/", (c) => c.json({ status: "ok", service: "yt-pipeline-worker" }));

export default app;
