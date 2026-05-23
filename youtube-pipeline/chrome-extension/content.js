// content.js

async function getCategories() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_CATEGORIES" });
    if (response && response.success && response.categories) {
      return response.categories;
    }
  } catch (err) {
    console.warn("[Antigravity] Failed to fetch live categories from background:", err);
  }

  // Fallback to cached categories in storage
  try {
    const cached = await chrome.storage.local.get("cachedCategories");
    if (cached && cached.cachedCategories && cached.cachedCategories.length > 0) {
      return cached.cachedCategories;
    }
  } catch (err) {
    console.error("[Antigravity] Storage error:", err);
  }

  // Last-resort fallback matching current worker category setup
  return ["Tactical", "Ideation", "Strategy", "News/Roundup", "second brain"];
}

function injectVideoMenuButton() {
  if (document.getElementById("antigravity-process-btn")) return;

  console.log("[Antigravity] Attempting to inject video button...");

  // Try highly specific selectors first to avoid hitting hidden/mobile DOM elements
  const selectors = [
    "ytd-watch-metadata ytd-menu-renderer #top-level-buttons-computed",
    "ytd-watch-metadata #actions-inner #menu",
    "ytd-menu-renderer #top-level-buttons-computed",
    "#top-level-buttons-computed"
  ];

  let menuContainer = null;
  for (const selector of selectors) {
    menuContainer = document.querySelector(selector);
    if (menuContainer) {
      console.log(`[Antigravity] Found menu container using: ${selector}`);
      break;
    }
  }
  
  if (!menuContainer) return;

  const btn = document.createElement("button");
  btn.id = "antigravity-process-btn";
  btn.className = "antigravity-btn";
  btn.innerHTML = `✨ Analyze with LLM`;

  btn.onclick = async () => {
    btn.blur();
    const categories = await getCategories();
    const displayList = categories.join(", ");
    
    const category = prompt(`Select pipeline category:\n${displayList}`, categories[0]);
    if (!category) return;

    const chosenLower = category.toLowerCase().trim();
    const formattedCategories = categories.map(c => c.toLowerCase());
    
    if (!formattedCategories.includes(chosenLower)) {
      alert("Invalid category. Must be one of: " + displayList);
      return;
    }

    const matchedCategory = categories.find(c => c.toLowerCase() === chosenLower) || category;
    const videoId = new URLSearchParams(window.location.search).get("v");
    const title = document.querySelector("h1.ytd-watch-metadata")?.innerText || document.title;
    const channelName = document.querySelector("#upload-info .ytd-channel-name a")?.innerText || "Unknown";

    btn.innerText = "⏳ Sending...";
    btn.classList.add("loading");

    try {
      console.log("[Antigravity] Sending payload to background...", { videoId, title, category: matchedCategory });
      const response = await chrome.runtime.sendMessage({
        type: "PROCESS_VIDEO",
        payload: {
          videoId,
          title,
          channelId: "manual_ingest",
          channelName,
          category: matchedCategory.toLowerCase(),
          videoUrl: window.location.href,
          publishedAt: new Date().toISOString(),
          addedAt: new Date().toISOString()
        }
      });

      if (response && response.success) {
        btn.innerText = "✅ Sent!";
        setTimeout(() => { 
          btn.innerText = "✨ Analyze with LLM"; 
          btn.classList.remove("loading"); 
        }, 3000);
      } else {
        alert("Pipeline Error: " + (response?.error || "Unknown"));
        btn.innerText = "❌ Failed";
        btn.classList.remove("loading");
      }
    } catch (err) {
      alert("Extension Error: Make sure local Docker is running! Details: " + err.message);
      btn.innerText = "❌ Failed";
      btn.classList.remove("loading");
    }
  };

  menuContainer.insertBefore(btn, menuContainer.firstChild);
  console.log("[Antigravity] Button injected successfully!");
}

function injectChannelButton() {
  if (document.getElementById("antigravity-track-btn")) return;

  // The container where the "Subscribe" button lives
  const subscribeContainer = document.querySelector("#inner-header-container #buttons") || document.querySelector("#subscribe-button");
  
  if (!subscribeContainer) return;

  const btn = document.createElement("button");
  btn.id = "antigravity-track-btn";
  btn.className = "antigravity-btn";
  btn.innerHTML = `📡 Track in Pipeline`;

  btn.onclick = async () => {
    btn.blur();
    const categories = await getCategories();
    const displayList = categories.join(", ");
    
    const category = prompt(`Select category for tracking:\n${displayList}`, categories[0]);
    if (!category) return;

    const chosenLower = category.toLowerCase().trim();
    const formattedCategories = categories.map(c => c.toLowerCase());

    if (!formattedCategories.includes(chosenLower)) {
      alert("Invalid category. Must be one of: " + displayList);
      return;
    }

    const matchedCategory = categories.find(c => c.toLowerCase() === chosenLower) || category;

    btn.innerText = "⏳ Tracking...";
    btn.classList.add("loading");

    try {
      const response = await chrome.runtime.sendMessage({
        type: "ADD_CHANNEL",
        payload: {
          url: window.location.href,
          category: matchedCategory.toLowerCase()
        }
      });

      if (response && response.success) {
        btn.innerText = "✅ Tracking!";
      } else {
        alert("Pipeline Error: " + (response?.error || "Unknown"));
        btn.innerText = "❌ Failed";
        btn.classList.remove("loading");
      }
    } catch (err) {
      alert("Extension Error: Make sure local Docker is running!");
      btn.innerText = "❌ Failed";
      btn.classList.remove("loading");
    }
  };

  subscribeContainer.insertBefore(btn, subscribeContainer.firstChild);
}

// Entry point: Route based on current URL
function checkAndInject() {
  const url = window.location.href;
  if (url.includes("/watch?v=")) {
    injectVideoMenuButton();
  } else if (url.includes("/@") || url.includes("/channel/")) {
    injectChannelButton();
  }
}

// Setup throttled MutationObserver to detect DOM changes when navigation or load happens
let observer = null;
function setupObserver() {
  if (observer) return;
  let timeoutId = null;
  observer = new MutationObserver(() => {
    if (timeoutId) return;
    timeoutId = setTimeout(() => {
      checkAndInject();
      timeoutId = null;
    }, 250);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Event listeners for Youtube's SPA navigation
document.addEventListener("yt-navigate-finish", checkAndInject);

// Initial injection and observer activation
checkAndInject();
setupObserver();
