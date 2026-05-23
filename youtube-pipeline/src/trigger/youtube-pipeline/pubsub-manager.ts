import "dotenv/config";
import { schedules } from "@trigger.dev/sdk/v3";
import { PUBSUB_HUB_URL, YOUTUBE_FEED_URL, PUBSUB_LEASE_SECONDS } from "./config";
import { getAllChannels } from "./kv-client";

/**
 * Subscribe (or renew) PubSubHubbub subscriptions for all monitored YouTube channels.
 *
 * Runs automatically every 4 days to ensure the 5-day lease never expires.
 */
export const subscribePubsub = schedules.task({
  id: "yt-subscribe-pubsub",
  cron: "0 3 */4 * *", // 3 AM every 4 days
  run: async () => {
    const callbackUrl = process.env.PUBSUB_CALLBACK_URL;
    if (!callbackUrl) {
      throw new Error("PUBSUB_CALLBACK_URL missing in .env");
    }

    const channels = await getAllChannels();
    const results: Array<{ channelId: string; status: number; ok: boolean }> = [];

    for (const channel of channels) {
      const topicUrl = YOUTUBE_FEED_URL(channel.id);

      console.log(`Subscribing to channel ${channel.id} (${channel.name})...`);

      try {
        const response = await fetch(PUBSUB_HUB_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            "hub.mode": "subscribe",
            "hub.topic": topicUrl,
            "hub.callback": callbackUrl,
            "hub.verify": "async",
            "hub.lease_seconds": String(PUBSUB_LEASE_SECONDS),
            // hub.secret could be added for HMAC verification
          }).toString(),
        });

        results.push({
          channelId: channel.id,
          status: response.status,
          ok: response.status === 202 || response.status === 204,
        });

        if (response.status === 202 || response.status === 204) {
          console.log(`  ✅ Subscription accepted for ${channel.id}`);
        } else {
          const body = await response.text();
          console.warn(`  ⚠️ Unexpected status ${response.status} for ${channel.id}: ${body}`);
        }

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 300));
      } catch (error) {
        console.error(`  ❌ Failed to subscribe ${channel.id}:`, error);
        results.push({ channelId: channel.id, status: 0, ok: false });
      }
    }

    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    console.log(`\nSubscription complete: ${succeeded} ok, ${failed} failed`);

    return {
      total: channels.length,
      succeeded,
      failed,
      results,
    };
  },
});

/**
 * Subscribe to a single channel manually (e.g. when added via Telegram)
 */
export async function subscribeSingleChannel(channelId: string): Promise<boolean> {
  const callbackUrl = process.env.PUBSUB_CALLBACK_URL;
  if (!callbackUrl) {
    throw new Error("PUBSUB_CALLBACK_URL missing in .env");
  }

  const topicUrl = YOUTUBE_FEED_URL(channelId);
  console.log(`Subscribing to single channel ${channelId}...`);

  try {
    const response = await fetch(PUBSUB_HUB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "hub.mode": "subscribe",
        "hub.topic": topicUrl,
        "hub.callback": callbackUrl,
        "hub.verify": "async",
        "hub.lease_seconds": String(PUBSUB_LEASE_SECONDS),
      }).toString(),
    });

    if (response.status === 202 || response.status === 204) {
      console.log(`  ✅ Subscription accepted for ${channelId}`);
      return true;
    } else {
      const body = await response.text();
      console.warn(`  ⚠️ Unexpected status ${response.status} for ${channelId}: ${body}`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Failed to subscribe ${channelId}:`, error);
    return false;
  }
}
