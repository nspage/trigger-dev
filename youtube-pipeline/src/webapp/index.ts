import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { tasks, runs } from '@trigger.dev/sdk/v3'
import { config } from 'dotenv'

// Import logic for Chrome Extension endpoints
import { getPendingVideos, removePendingVideos, getAllChannels, removeTrackedChannel, addTrackedChannel, getCategories, saveCategory, deleteCategory, renameCategory, getAllAnalyses, getDailyCost, updatePendingVideos, updateAllChannels, getCategorisationPromptDetails, saveCategorisationPrompt } from '../trigger/youtube-pipeline/kv-client'
import { processVideos } from '../trigger/youtube-pipeline/process-video'
import { classifyChannel } from '../trigger/youtube-pipeline/classify-channel'
import { resolveChannelInfo, resolveVideoDuration, getTranscriptSample } from '../trigger/utils'
import { subscribeSingleChannel } from '../trigger/youtube-pipeline/pubsub-manager'

config()

const app = new Hono()

// Enable CORS for Chrome Extension requests
app.use('/api/extension/*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/', (c) => {
    return c.text('Antigravity Trigger.dev Webhook & Extension Server is running!')
})

// === CHROME EXTENSION ENDPOINTS ===

// 1. Get the pending queue
app.get('/api/extension/queue', async (c) => {
    try {
        const pending = await getPendingVideos()
        return c.json({ success: true, queue: pending })
    } catch (e) {
        console.error('Error fetching queue:', e)
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 2. Discard a pending video
app.post('/api/extension/discard', async (c) => {
    try {
        const { videoId } = await c.req.json()
        if (!videoId) return c.json({ success: false, error: 'Missing videoId' }, 400)
        
        await removePendingVideos([videoId])
        return c.json({ success: true })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 3. Process a video (from queue OR directly from Youtube)
app.post('/api/extension/process', async (c) => {
    try {
        const body = await c.req.json()
        
        // Ensure it's formatted as an array for the task
        const videos = body.videos ? body.videos : [body]
        
        console.log(`[Extension] Triggering process for ${videos.length} video(s)`)
        const handle = await processVideos.trigger({ videos })
        
        return c.json({ success: true, runId: handle.id })
    } catch (e) {
        console.error('Error triggering process:', e)
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 4. Track a channel
app.post('/api/extension/add-channel', async (c) => {
    try {
        const body = await c.req.json()
        console.log(`[Extension] Resolving channel for ${body.url}`)
        
        const info = await resolveChannelInfo(body.url)
        if (!info) {
            return c.json({ success: false, error: 'Could not resolve Channel ID from URL' }, 400)
        }

        let category = body.category;
        if (!category) {
            console.log(`[Extension] No category provided, auto-classifying: ${info.name}`);
            const result = await classifyChannel.triggerAndWait({
                channelId: info.id,
                channelName: info.name
            }).unwrap();
            category = result.category;
        }

        await addTrackedChannel({
            id: info.id,
            name: info.name,
            category: category
        })
        
        const subbed = await subscribeSingleChannel(info.id)
        
        return c.json({ 
            success: true, 
            channel: info,
            category: category,
            subscribed: subbed
        })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 5. List channels
app.get('/api/extension/channels', async (c) => {
    try {
        const channels = await getAllChannels()
        return c.json({ success: true, channels })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 6. Remove a channel
app.post('/api/extension/remove-channel', async (c) => {
    try {
        const { channelId } = await c.req.json()
        if (!channelId) return c.json({ success: false, error: 'Missing channelId' }, 400)
        
        await removeTrackedChannel(channelId)
        return c.json({ success: true })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 7. Get categories
app.get('/api/extension/categories', async (c) => {
    try {
        const categories = await getCategories()
        return c.json({ success: true, categories })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 8. Save/Update category
app.post('/api/extension/categories', async (c) => {
    try {
        const { name, prompt, model } = await c.req.json()
        if (!name || !prompt) return c.json({ success: false, error: 'Missing name or prompt' }, 400)
        
        await saveCategory(name, prompt, model)
        return c.json({ success: true })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 9. Delete category
app.post('/api/extension/categories/delete', async (c) => {
    try {
        const { name } = await c.req.json()
        if (!name) return c.json({ success: false, error: 'Missing name' }, 400)
        
        await deleteCategory(name)
        return c.json({ success: true })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 10. Rename category
app.post('/api/extension/categories/rename', async (c) => {
    try {
        const { oldName, newName } = await c.req.json()
        if (!oldName || !newName) return c.json({ success: false, error: 'Missing oldName or newName' }, 400)
        
        await renameCategory(oldName, newName)
        return c.json({ success: true })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 11. Get history (processed videos)
app.get('/api/extension/history', async (c) => {
    try {
        const history = await getAllAnalyses()
        return c.json({ success: true, history })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 12. Get daily cost
app.get('/api/extension/cost', async (c) => {
    try {
        const costData = await getDailyCost()
        return c.json({ success: true, ...costData })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 13. Get video duration info
app.get('/api/extension/video-info', async (c) => {
    try {
        const url = c.req.query('url')
        if (!url) return c.json({ success: false, error: 'Missing url' }, 400)
        
        const duration = await resolveVideoDuration(url)
        return c.json({ success: true, duration })
    } catch (e) {
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 14. Update pending video category
app.post('/api/extension/queue/update-category', async (c) => {
    try {
        const { videoId, category } = await c.req.json()
        if (!videoId || !category) return c.json({ success: false, error: 'Missing videoId or category' }, 400)

        const pending = await getPendingVideos()
        const index = pending.findIndex(v => v.videoId === videoId)
        if (index === -1) {
            return c.json({ success: false, error: 'Video not found in pending queue' }, 404)
        }

        pending[index].category = category
        await updatePendingVideos(pending)
        return c.json({ success: true })
    } catch (e) {
        console.error('Error updating pending video category:', e)
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 15. Classify a video transcript using Gemini and the categorization prompt
app.post('/api/extension/classify-video', async (c) => {
    try {
        const { videoId } = await c.req.json()
        if (!videoId) return c.json({ success: false, error: 'Missing videoId' }, 400)

        // Fetch transcript sample
        const sample = await getTranscriptSample(videoId, 5000)
        if (!sample) {
            return c.json({ success: false, error: 'Could not retrieve transcript sample for video' }, 400)
        }

        const defaultPromptBase = `You are an expert Content Strategist. Based on the following transcript snippets from a YouTube channel, classify this channel into EXACTLY one of the following five categories.

CATEGORIES:
1. **Tactical**: Practical "how-to" guides, technical tutorials, software walkthroughs, coding, or step-by-step Standard Operating Procedures (SOPs).
2. **Ideation**: Brainstorming new business ideas, identifying market "white space," niche hunting, or exploring consumer trends.
3. **Strategy**: High-level frameworks, mental models, macro-economic shifts, philosophical "why" behind business decisions, or long-term industry positioning.
4. **News/Roundup**: Summaries of current events, industry headlines, weekly updates, or commentary on trending topics.
5. **second brain**: Personal Knowledge Management (PKM), productivity systems, note-taking methodologies, or "linking your thinking" workflows.

Instructions:
- Return ONLY the category name (one of: Tactical, Ideation, Strategy, News/Roundup, second brain).
- If the channel fits multiple categories, pick the most dominant one.`;

        let customPrompt = ""
        let customModel = ""
        try {
            const details = await getCategorisationPromptDetails()
            customPrompt = details.prompt
            customModel = details.model
        } catch (e) {
            console.warn('[WebApp] Failed to fetch custom prompt from KV, using default.', e)
        }

        const basePrompt = customPrompt || defaultPromptBase
        const finalModel = customModel || 'gemini-3.1-flash-lite'
        let prompt = ""
        if (basePrompt.includes("{{CONTENT_SNIPPETS}}")) {
            prompt = basePrompt.replace("{{CONTENT_SNIPPETS}}", sample)
        } else if (basePrompt.includes("{{content_snippets}}")) {
            prompt = basePrompt.replace("{{content_snippets}}", sample)
        } else {
            prompt = `${basePrompt}\n\nCONTENT SNIPPETS:\n${sample}`
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env")

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${apiKey}`
        const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
            }),
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`Gemini API error ${response.status}: ${err}`)
        }

        const data: any = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error("Empty response from Gemini")

        const category = text.trim().replace(/[*_]/g, "")
        const validCategories = ["Tactical", "Ideation", "Strategy", "News/Roundup", "second brain"]
        const finalCategory = validCategories.find(c => c.toLowerCase() === category.toLowerCase()) || "Strategy"

        return c.json({ success: true, category: finalCategory })
    } catch (e) {
        console.error('Error classifying video:', e)
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 16. Update channel configuration (name and category)
app.post('/api/extension/channels/update', async (c) => {
    try {
        const { channelId, name, category } = await c.req.json()
        if (!channelId || !name || !category) return c.json({ success: false, error: 'Missing channelId, name, or category' }, 400)

        const channels = await getAllChannels()
        const index = channels.findIndex(ch => ch.id === channelId)
        if (index === -1) {
            channels.push({ id: channelId, name, category })
        } else {
            channels[index].name = name
            channels[index].category = category
        }

        await updateAllChannels(channels)
        return c.json({ success: true })
    } catch (e) {
        console.error('Error updating channel:', e)
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 17. Get categorization prompt
app.get('/api/extension/categorisation-prompt', async (c) => {
    try {
        const details = await getCategorisationPromptDetails()
        return c.json({ success: true, prompt: details.prompt, model: details.model })
    } catch (e) {
        console.error('Error fetching categorization prompt:', e)
        return c.json({ success: false, error: String(e) }, 500)
    }
})

// 18. Update categorization prompt
app.post('/api/extension/categorisation-prompt', async (c) => {
    try {
        const { prompt, model } = await c.req.json()
        if (typeof prompt !== 'string') return c.json({ success: false, error: 'Invalid prompt' }, 400)

        await saveCategorisationPrompt(prompt, model)
        return c.json({ success: true })
    } catch (e) {
        console.error('Error saving categorization prompt:', e)
        return c.json({ success: false, error: String(e) }, 500)
    }
})

const port = 3000
console.log(`Extension Server is running on http://localhost:${port}`)

serve({
    fetch: app.fetch,
    port
})
