import "dotenv/config";
import { task } from "@trigger.dev/sdk/v3";
import { getTrackedChannels, updateAllChannels } from "./kv-client";
import { classifyChannel } from "./classify-channel";
import { ChannelConfig } from "./config";

/**
 * Migration Orchestrator: Classifies all currently tracked channels
 * and updates their categories in Cloudflare KV.
 */
export const migrateAllChannels = task({
  id: "yt-migrate-all-channels",
  run: async () => {
    // 1. Fetch current dynamic channels from KV
    // We only migrate the dynamic ones, as hardcoded ones in config.ts 
    // are meant to be temporary or fixed.
    const channels = await getTrackedChannels();
    console.log(`[Migration] Found ${channels.length} dynamic channels to migrate.`);

    if (channels.length === 0) {
      return { status: "skipped", reason: "no_dynamic_channels" };
    }

    // 2. Trigger classification for each channel and wait for all to complete
    console.log(`[Migration] Triggering classification for all channels...`);
    const results: any = await classifyChannel.batchTriggerAndWait(
      channels.map((c) => ({
        payload: { channelId: c.id, channelName: c.name },
      }))
    );

    const runs = Array.isArray(results) ? results : (results.runs || []);
    console.log(`[Migration] Processing ${runs.length} classification results.`);

    // 3. Collect updated configurations
    const updatedChannels: ChannelConfig[] = [];

    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const originalChannel = channels[i];

      if (run && run.ok) {
        console.log(`[Migration] Successfully classified: ${originalChannel.name} -> ${run.output.category}`);
        updatedChannels.push({
          ...originalChannel,
          category: run.output.category,
        });
      } else {
        const error = run ? (run.error || run.status) : "Missing run object";
        console.error(`[Migration] Failed to classify ${originalChannel.name}:`, error);
        // Keep the original category if classification fails
        updatedChannels.push(originalChannel);
      }
    }

    console.log(`[Migration] Final updatedChannels count: ${updatedChannels.length}`);

    // 4. Perform a single bulk update to KV
    if (updatedChannels.length > 0) {
      console.log(`[Migration] Performing bulk update to Cloudflare KV for ${updatedChannels.length} channels...`);
      await updateAllChannels(updatedChannels);
      console.log(`[Migration] Successfully updated ${updatedChannels.length} channels in KV.`);
    } else {
      console.warn("[Migration] Warning: No channels were processed. Skipping KV update.");
      return { status: "failed", reason: "no_channels_processed" };
    }

    return { 
      total: channels.length, 
      updated: updatedChannels.length,
      mapping: updatedChannels.map(c => ({ name: c.name, category: c.category }))
    };
  },
});
