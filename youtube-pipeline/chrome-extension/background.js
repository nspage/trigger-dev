// background.js

const API_BASE = "http://127.0.0.1:3000/api/extension";

// Service workers listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PROCESS_VIDEO") {
    (async () => {
      console.log("Sending video to local pipeline...");
      try {
        const res = await fetch(`${API_BASE}/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videos: [request.payload] })
        });
        const data = await res.json();
        sendResponse(data);
      } catch (err) {
        console.error("Fetch error:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open for async response
  }

  if (request.type === "ADD_CHANNEL") {
    (async () => {
      console.log("Adding channel to local pipeline...");
      try {
        const res = await fetch(`${API_BASE}/add-channel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request.payload)
        });
        const data = await res.json();
        sendResponse(data);
      } catch (err) {
        console.error("Fetch error:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open for async response
  }

  if (request.type === "GET_CATEGORIES") {
    (async () => {
      console.log("Fetching categories from local pipeline...");
      try {
        const res = await fetch(`${API_BASE}/categories`);
        const data = await res.json();
        if (data.success && data.categories) {
          // Extract just the category names
          const names = data.categories.map(c => c.name);
          // Save to chrome.storage.local for offline fallback
          await chrome.storage.local.set({ cachedCategories: names });
          sendResponse({ success: true, categories: names });
        } else {
          sendResponse({ success: false, error: data.error || "Failed to fetch categories" });
        }
      } catch (err) {
        console.error("Fetch error:", err);
        // Try to read from cache if offline
        try {
          const cached = await chrome.storage.local.get("cachedCategories");
          if (cached && cached.cachedCategories) {
            sendResponse({ success: true, categories: cached.cachedCategories, cached: true });
          } else {
            sendResponse({ success: false, error: err.message });
          }
        } catch (storageErr) {
          sendResponse({ success: false, error: err.message });
        }
      }
    })();
    return true; // Keep message channel open for async response
  }
});
