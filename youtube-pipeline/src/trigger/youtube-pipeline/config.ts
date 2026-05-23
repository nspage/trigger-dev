// ──────────────────────────────────────────────
// YouTube Channel Configuration
// ──────────────────────────────────────────────

/**
 * Content categories — determines which structured prompt template
 * is used during Gemini analysis. Category-specific prompts will be
 * defined in a later phase; for now they all share the default template.
 */
export type ContentCategory = string;

export interface ChannelConfig {
  /** YouTube channel ID (from the /channel/ URL) */
  id: string;
  /** Human-readable name (resolved after first notification, or set manually) */
  name: string;
  /** Content category for analysis prompt selection */
  category: ContentCategory;
}

/**
 * Monitored YouTube channels.
 * Used as a fallback if KV (dynamic tracking) is empty or during the transition phase.
 */
export const CHANNELS: ChannelConfig[] = [
  { id: "UCCTLE8ILGcShSjtnZsOqGPw", name: "Channel-01", category: "growth" },
  { id: "UCelfWQr9sXVMTvBzviPGlFw", name: "Channel-02", category: "ai concepts" },
  { id: "UCPjNBjflYl0-HQtUvOx0Ibw", name: "Channel-03", category: "entrepreneurship" },
  { id: "UC9cn0TuPq4dnbTY-CBsm8XA", name: "Channel-04", category: "entrepreneurship" },
  { id: "UC0C_17n9iuUQPylguM1d_lQ", name: "Channel-05", category: "ai concepts" },
  { id: "UC5xxXc17GHJyuk6X1muBhzg", name: "Channel-06", category: "web3 business" },
  { id: "UCC2UPtfjtdAgofzuxUPZJ6g", name: "Channel-07", category: "web3 business" },
  { id: "UCjsgQKPpR7ubPQhPqjf8kyA", name: "Channel-08", category: "web3 business" },
  { id: "UC2ojq_nuP8ceeHqiroeKhBA", name: "Channel-09", category: "ai concepts" },
  { id: "UCEOv_8wHvYC6mzsY2Gm5WcQ", name: "Channel-10", category: "web3 business" },
  { id: "UCKc3w9FKFGdBR9PIkfngzPg", name: "Channel-11", category: "web3 business" },
  { id: "UCDxhBSgPvrFvyXLdpmygDhg", name: "Channel-12", category: "growth" },
  { id: "UCmDs9tGSLkMPj6XbVBrMN2A", name: "Channel-13", category: "growth" },
  { id: "UCjIMtrzxYc0lblGhmOgC_CA", name: "Channel-14", category: "ai concepts" },
  { id: "UCTHq3W46BiAYjKUYZq2qm-Q", name: "Channel-15", category: "web3 business" },
];

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

/** PubSubHubbub hub URL for YouTube */
export const PUBSUB_HUB_URL = "https://pubsubhubbub.appspot.com/subscribe";

/** YouTube Atom feed template — replace CHANNEL_ID */
export const YOUTUBE_FEED_URL = (channelId: string) =>
  `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;

/** Gemini model for analysis */
export const GEMINI_MODEL = "gemini-3.1-flash-lite";

/** Paris timezone (Europe/Paris = CET/CEST) */
export const TIMEZONE = "Europe/Paris";

/** Email recipient */
export const EMAIL_TO = "nicolas.s.page@gmail.com";

/** PubSubHubbub lease duration in seconds (5 days) */
export const PUBSUB_LEASE_SECONDS = 432_000;

// ──────────────────────────────────────────────
// Video types
// ──────────────────────────────────────────────

export interface PendingVideo {
  videoId: string;
  title: string;
  channelId: string;
  channelName: string;
  category: ContentCategory;
  publishedAt: string;
  videoUrl: string;
  addedAt: string; // ISO timestamp when we received the notification
  duration?: string; // e.g. "12:05"
  description?: string; // brief snippet
}

export interface ProcessedVideo extends PendingVideo {
  transcript: string;
  analysis: string; // markdown
  processedAt: string;
}
