const API_BASE = "http://127.0.0.1:3000/api/extension";

let activeCategories = [];

async function ensureCategoriesLoaded() {
  if (activeCategories.length > 0) return activeCategories;
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    if (data.success && data.categories) {
      activeCategories = data.categories.map(c => c.name);
    }
  } catch (err) {
    console.error("Error loading categories", err);
  }
  return activeCategories;
}

document.addEventListener("DOMContentLoaded", () => {
  fetchQueue();
  fetchChannels();
  fetchCategories();
  fetchHistory();
  fetchCost();
  
  // Tabs logic
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      tab.classList.add('active');
      const targetEl = document.getElementById(tab.dataset.target);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // Handle manual channel tracking
  const addChannelBtn = document.getElementById("add-channel-btn");
  if (addChannelBtn) {
    addChannelBtn.addEventListener("click", async () => {
      const urlInput = document.getElementById("channel-url");
      const catSelect = document.getElementById("channel-cat");
      const url = urlInput ? urlInput.value.trim() : "";
      const cat = catSelect ? catSelect.value : "";
      
      if (!url.includes("youtube.com")) {
        alert("Invalid YouTube URL");
        return;
      }
      
      addChannelBtn.innerText = "⏳";
      try {
        const res = await fetch(`${API_BASE}/add-channel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, category: cat })
        });
        const data = await res.json();
        if (data.success) {
          addChannelBtn.innerText = "✓";
          if (urlInput) urlInput.value = "";
          setTimeout(() => { addChannelBtn.innerText = "Track"; }, 2000);
          await fetchChannels(); // refresh
        } else {
          alert("Error: " + data.error);
          addChannelBtn.innerText = "Track";
        }
      } catch (err) {
        alert("Connection error");
        addChannelBtn.innerText = "Track";
      }
    });
  }

  // Handle manual category adding
  const addCategoryBtn = document.getElementById("add-category-btn");
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", async () => {
      const nameInput = document.getElementById("new-category-name");
      const name = nameInput ? nameInput.value.trim() : "";
      if (!name) return;
      
      addCategoryBtn.innerText = "⏳";
      try {
        const res = await fetch(`${API_BASE}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, prompt: "Analyze the transcript and provide key insights." })
        });
        const data = await res.json();
        if (data.success) {
          addCategoryBtn.innerText = "✓";
          if (nameInput) nameInput.value = "";
          setTimeout(() => { addCategoryBtn.innerText = "Add"; }, 2000);
          activeCategories = []; // reset cache
          await fetchCategories(); // refresh
        } else {
          alert("Error: " + data.error);
          addCategoryBtn.innerText = "Add";
        }
      } catch (err) {
        alert("Error adding category");
        addCategoryBtn.innerText = "Add";
      }
    });
  }
});

async function fetchQueue() {
  const loading = document.getElementById("loading");
  const list = document.getElementById("queue-list");
  const empty = document.getElementById("empty-state");
  const count = document.getElementById("queue-count");

  if (loading) loading.classList.remove("hidden");
  if (list) list.innerHTML = "";
  if (empty) empty.classList.add("hidden");

  try {
    await ensureCategoriesLoaded();
    const res = await fetch(`${API_BASE}/queue`);
    const data = await res.json();
    
    if (loading) loading.classList.add("hidden");

    if (!data.success || !data.queue || data.queue.length === 0) {
      if (empty) empty.classList.remove("hidden");
      if (count) count.innerText = "0";
      return;
    }

    if (count) count.innerText = data.queue.length;

    for (const video of data.queue) {
      const el = document.createElement("div");
      el.className = "card";
      
      const durationHtml = video.duration ? `<span class="card-duration">[${video.duration}]</span> ` : `<span class="card-duration duration-placeholder"></span> `;

      // Format publishedAt: "May 20, 14:30"
      let publishedHtml = "";
      if (video.publishedAt) {
        try {
          const date = new Date(video.publishedAt);
          const now = new Date();
          const isToday = date.toDateString() === now.toDateString();
          
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          
          const displayStr = isToday ? `Today, ${timeStr}` : `${dateStr}, ${timeStr}`;
          publishedHtml = `<span>•</span> <span>${displayStr}</span>`;
        } catch (e) {
          console.error("Error parsing date", e);
        }
      }

      el.innerHTML = `
        <div class="card-content">
          <div class="card-title clickable single-line" title="Open Video">
            ${durationHtml}<span class="card-title-text">${video.title}</span>
          </div>
          <div class="card-meta" style="margin-bottom: 4px;">
            <span class="card-channel">${video.channelName}</span>
            ${publishedHtml}
          </div>
          <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px;">
            <select class="card-category-select" style="font-size: 10px; padding: 2px 4px; border-radius: 4px;">
              ${activeCategories.map(cat => `<option value="${cat}" ${cat === video.category ? 'selected' : ''}>${cat}</option>`).join('')}
            </select>
            <button class="btn btn-reclassify" style="padding: 2px; color: var(--text-muted); display: inline-flex;" title="Re-classify with Gemini">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px;"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-approve" title="Process">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
          </button>
          <button class="btn btn-discard" title="Discard">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      `;

      const titleEl = el.querySelector(".card-title");
      if (titleEl) {
        titleEl.addEventListener("click", () => window.open(video.videoUrl, "_blank"));
      }

      // Dynamically fetch duration if missing
      if (!video.duration) {
        const durEl = el.querySelector('.duration-placeholder');
        if (durEl) {
          (async () => {
            try {
              const r = await fetch(`${API_BASE}/video-info?url=${encodeURIComponent(video.videoUrl)}`);
              const d = await r.json();
              if (d.success && d.duration) {
                durEl.innerText = `[${d.duration}] `;
                durEl.classList.remove('duration-placeholder');
              }
            } catch (err) {
              console.warn("Failed to fetch video duration dynamically", err);
            }
          })();
        }
      }

      // Dynamically fix the title bug for old items using public OEmbed
      if (!video.title || video.title === 'YouTube video feed' || video.title === 'Untitled') {
        const titleTextEl = el.querySelector('.card-title-text');
        if (titleTextEl) {
          titleTextEl.innerText = "Loading title...";
          (async () => {
            try {
              const r = await fetch(`https://www.youtube.com/oembed?url=${video.videoUrl}&format=json`);
              const d = await r.json();
              if (d.title) {
                titleTextEl.innerText = d.title;
                video.title = d.title; // Persist resolved title back to the video object
              }
            } catch (err) {
              titleTextEl.innerText = "Unknown Video";
            }
          })();
        }
      }

      const approveBtn = el.querySelector(".btn-approve");
      if (approveBtn && count && empty) {
        approveBtn.addEventListener("click", () => handleAction(video, "process", el, count, empty));
      }
      
      const discardBtn = el.querySelector(".btn-discard");
      if (discardBtn && count && empty) {
        discardBtn.addEventListener("click", () => handleAction(video, "discard", el, count, empty));
      }

      const selectEl = el.querySelector(".card-category-select");
      if (selectEl) {
        selectEl.addEventListener("change", async () => {
          const newCategory = selectEl.value;
          selectEl.disabled = true;
          try {
            const res = await fetch(`${API_BASE}/queue/update-category`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videoId: video.videoId, category: newCategory })
            });
            const data = await res.json();
            if (data.success) {
              video.category = newCategory;
            } else {
              alert("Error: " + data.error);
              selectEl.value = video.category;
            }
          } catch (err) {
            alert("Error updating category");
            selectEl.value = video.category;
          } finally {
            selectEl.disabled = false;
          }
        });
      }

      const reclassifyBtn = el.querySelector(".btn-reclassify");
      if (reclassifyBtn && selectEl) {
        reclassifyBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (reclassifyBtn.classList.contains("spinning")) return;

          reclassifyBtn.classList.add("spinning");
          selectEl.disabled = true;

          try {
            const res = await fetch(`${API_BASE}/classify-video`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videoId: video.videoId })
            });
            const data = await res.json();
            if (data.success && data.category) {
              selectEl.value = data.category;
              
              const saveRes = await fetch(`${API_BASE}/queue/update-category`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: video.videoId, category: data.category })
              });
              const saveData = await saveRes.json();
              if (saveData.success) {
                video.category = data.category;
              } else {
                alert("Failed to save reclassified category: " + saveData.error);
              }
            } else {
              alert("Failed to classify: " + (data.error || "unknown error"));
            }
          } catch (err) {
            alert("Error classifying video");
          } finally {
            reclassifyBtn.classList.remove("spinning");
            selectEl.disabled = false;
          }
        });
      }

      if (list) list.appendChild(el);
    }

  } catch (err) {
    if (loading) loading.classList.add("hidden");
    if (empty) {
      empty.classList.remove("hidden");
      const textEl = empty.querySelector(".empty-text");
      if (textEl) textEl.innerText = "Docker is offline";
    }
  }
}

async function fetchChannels() {
  const loading = document.getElementById("channels-loading");
  const list = document.getElementById("channels-list");
  const empty = document.getElementById("channels-empty-state");
  const count = document.getElementById("channels-count");

  if (loading) loading.classList.remove("hidden");
  if (list) list.innerHTML = "";
  if (empty) empty.classList.add("hidden");

  try {
    await ensureCategoriesLoaded();
    const res = await fetch(`${API_BASE}/channels`);
    const data = await res.json();
    
    if (loading) loading.classList.add("hidden");

    if (!data.success || !data.channels || data.channels.length === 0) {
      if (empty) empty.classList.remove("hidden");
      if (count) count.innerText = "0";
      return;
    }

    if (count) count.innerText = data.channels.length;

    data.channels.forEach(channel => {
      const el = document.createElement("div");
      el.className = "card";
      
      el.innerHTML = `
        <div class="card-content" style="cursor: pointer;">
          <div class="card-title clickable" style="margin-bottom:2px; font-size:13px;">${channel.name || `ID: ${channel.id}`}</div>
          <div class="card-meta">
            <span class="card-category">${channel.category}</span>
            <span>•</span>
            <span class="card-channel" style="font-family:monospace; opacity:0.7;">${channel.id}</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-discard" title="Remove Channel">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      `;

      const contentEl = el.querySelector(".card-content");
      
      function enterEditMode() {
        if (el.classList.contains("editing")) return;
        el.classList.add("editing");
        const actionsEl = el.querySelector(".actions");
        if (actionsEl) actionsEl.style.display = "none";
        
        contentEl.innerHTML = `
          <div class="edit-channel-form" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
            <input type="text" class="input edit-channel-name" value="${channel.name || ''}" style="width: 100%; font-size: 11px; padding: 4px 6px;" placeholder="Channel Name" />
            <div style="display: flex; gap: 6px; align-items: center; width: 100%;">
              <select class="select edit-channel-cat" style="flex-grow: 1; font-size: 11px; padding: 4px 6px; height: 24px; width: auto;">
                ${activeCategories.map(cat => `<option value="${cat}" ${cat === channel.category ? 'selected' : ''}>${cat}</option>`).join('')}
              </select>
              <button class="btn-primary btn-save-channel" style="font-size: 10px; height: 24px; padding: 0 10px;">Save</button>
              <button class="btn btn-cancel-channel" style="font-size: 10px; height: 24px; padding: 0 6px; border: 1px solid var(--border); border-radius: 4px; color: var(--text-muted);" title="Cancel">Cancel</button>
            </div>
          </div>
        `;
        
        const nameInput = contentEl.querySelector(".edit-channel-name");
        nameInput.focus();
        
        const cancelBtn = contentEl.querySelector(".btn-cancel-channel");
        cancelBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          el.classList.remove("editing");
          if (actionsEl) actionsEl.style.display = "";
          fetchChannels();
        });
        
        const saveBtn = contentEl.querySelector(".btn-save-channel");
        saveBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const newName = nameInput.value.trim();
          const newCat = contentEl.querySelector(".edit-channel-cat").value;
          if (!newName || !newCat) {
            alert("Name and category cannot be empty");
            return;
          }
          
          saveBtn.innerText = "...";
          saveBtn.disabled = true;
          
          try {
            const res = await fetch(`${API_BASE}/channels/update`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ channelId: channel.id, name: newName, category: newCat })
            });
            const data = await res.json();
            if (data.success) {
              el.classList.remove("editing");
              if (actionsEl) actionsEl.style.display = "";
              fetchChannels();
            } else {
              alert("Error: " + data.error);
              saveBtn.innerText = "Save";
              saveBtn.disabled = false;
            }
          } catch(err) {
            alert("Error updating channel");
            saveBtn.innerText = "Save";
            saveBtn.disabled = false;
          }
        });
      }

      if (contentEl) {
        contentEl.addEventListener("click", (e) => {
          if (el.classList.contains("editing") || e.target.closest("input, select, button, .card-title")) {
            return;
          }
          window.open('https://www.youtube.com/channel/' + channel.id, '_blank');
        });
      }

      const titleEl = el.querySelector(".card-title");
      if (titleEl) {
        titleEl.addEventListener("click", (e) => {
          e.stopPropagation();
          enterEditMode();
        });
      }

      const discardBtn = el.querySelector(".btn-discard");
      if (discardBtn) {
        discardBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm(`Stop tracking channel "${channel.name || channel.id}"?`)) return;
          el.style.opacity = "0.5";
          el.style.pointerEvents = "none";
          try {
            const r = await fetch(`${API_BASE}/remove-channel`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ channelId: channel.id })
            });
            const d = await r.json();
            if (d.success) {
              el.remove();
              const current = parseInt(count.innerText) - 1;
              count.innerText = Math.max(0, current);
              if (current <= 0) empty.classList.remove("hidden");
            } else {
              alert("Error: " + d.error);
              el.style.opacity = "1";
              el.style.pointerEvents = "auto";
            }
          } catch(e) {
            alert("Error removing channel");
            el.style.opacity = "1";
            el.style.pointerEvents = "auto";
          }
        });
      }

      if (list) list.appendChild(el);
    });

  } catch (err) {
    if (loading) loading.classList.add("hidden");
    if (empty) {
      empty.classList.remove("hidden");
      const textEl = empty.querySelector(".empty-text");
      if (textEl) textEl.innerText = "Failed to load channels";
    }
  }
}

async function handleAction(video, action, element, countEl, emptyEl) {
  element.style.opacity = "0.5";
  element.style.pointerEvents = "none";
  
  try {
    if (action === "process") {
      const sendTg = document.getElementById("send-tg");
      video.sendToTelegram = sendTg ? sendTg.checked : false;
    }
    const payload = action === "process" ? { videos: [video] } : { videoId: video.videoId };
    const res = await fetch(`${API_BASE}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.success) {
      element.remove();
      const current = parseInt(countEl.innerText) - 1;
      countEl.innerText = Math.max(0, current);
      if (current <= 0) emptyEl.classList.remove("hidden");
    } else {
      alert("Error: " + data.error);
      element.style.opacity = "1";
      element.style.pointerEvents = "auto";
    }
  } catch (err) {
    alert("Connection Error. Is Docker running?");
    element.style.opacity = "1";
    element.style.pointerEvents = "auto";
  }
}

async function fetchCategories() {
  const loading = document.getElementById("categories-loading");
  const list = document.getElementById("categories-list");
  const empty = document.getElementById("categories-empty-state");
  const count = document.getElementById("categories-count");
  const dropdown = document.getElementById("channel-cat");

  if (loading) loading.classList.remove("hidden");
  if (list) list.innerHTML = "";
  if (dropdown) dropdown.innerHTML = "";
  if (empty) empty.classList.add("hidden");

  try {
    activeCategories = [];
    await ensureCategoriesLoaded();

    const MODELS = [
      { id: "gemini-3.1-flash-lite", name: "3.1 Flash Lite (Cheapest)" },
      { id: "gemini-1.5-flash", name: "1.5 Flash (Standard)" },
      { id: "gemini-1.5-pro", name: "1.5 Pro (Powerful)" }
    ];

    // 1. Fetch categorization prompt
    let systemPrompt = "";
    let systemModel = "";
    try {
      const spRes = await fetch(`${API_BASE}/categorisation-prompt`);
      const spData = await spRes.json();
      if (spData.success) {
        systemPrompt = spData.prompt;
        systemModel = spData.model || "";
      }
    } catch (err) {
      console.warn("Could not load system categorization prompt", err);
    }

    // 2. Fetch categories configs
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    
    if (loading) loading.classList.add("hidden");

    // Add the pinned system card first
    const pinnedEl = document.createElement("div");
    pinnedEl.className = "card card-pinned";
    
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

    const activeSystemPrompt = systemPrompt || defaultPromptBase;

    const systemModelOptions = MODELS.map(m => 
      `<option value="${m.id}" ${systemModel === m.id ? 'selected' : ''}>${m.name}</option>`
    ).join("");

    pinnedEl.innerHTML = `
      <div class="card-content" style="padding-right: 0; cursor: pointer;">
        <div class="card-title clickable" style="margin-bottom: 2px; font-size: 13px; font-weight: 700; color: #c4ccff; display: flex; align-items: center; justify-content: space-between;">
          <span>Classifier Prompt</span>
          <span class="badge badge-pinned" style="font-size: 9px; text-transform: uppercase; margin-left: 0;">System</span>
        </div>
        <div class="card-meta" style="flex-direction: column; align-items: flex-start; gap: 4px; display: flex;">
          <span>Global prompt used to auto-categorise channels & videos</span>
          <select class="select system-model-select" style="width: 100%; margin-top: 4px; height: 24px; padding: 2px 4px;">
            ${systemModelOptions}
          </select>
        </div>
      </div>
      <div class="card-accordion-content">
        <div style="font-size: 9px; color: var(--text-muted); margin-bottom: 6px;">
          Tip: Include <code>{{CONTENT_SNIPPETS}}</code> where the transcript snippets should be injected.
        </div>
        <textarea class="prompt-textarea system-prompt-textarea" style="height: 180px;">${activeSystemPrompt}</textarea>
        <button class="btn-save btn-save-system-prompt">Save Classifier Prompt</button>
      </div>
    `;

    pinnedEl.querySelector(".card-content").addEventListener("click", (e) => {
      if (e.target.closest("select, option")) return;
      pinnedEl.classList.toggle("expanded");
    });

    const saveSystemBtn = pinnedEl.querySelector(".btn-save-system-prompt");
    saveSystemBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const btn = e.target;
      const newPrompt = pinnedEl.querySelector(".system-prompt-textarea").value;
      const newModel = pinnedEl.querySelector(".system-model-select").value;
      btn.innerText = "Saving...";
      btn.disabled = true;
      try {
        const r = await fetch(`${API_BASE}/categorisation-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: newPrompt, model: newModel })
        });
        const d = await r.json();
        if (d.success) {
          btn.innerText = "Saved!";
          setTimeout(() => { btn.innerText = "Save Classifier Prompt"; btn.disabled = false; }, 2000);
        } else {
          alert("Error: " + d.error);
          btn.innerText = "Save Classifier Prompt";
          btn.disabled = false;
        }
      } catch (err) {
        alert("Error saving classifier prompt");
        btn.innerText = "Save Classifier Prompt";
        btn.disabled = false;
      }
    });

    if (list) list.appendChild(pinnedEl);

    // Add options to track channel category select
    if (dropdown && activeCategories) {
      dropdown.innerHTML = activeCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    if (!data.success || !data.categories || data.categories.length === 0) {
      if (empty) empty.classList.remove("hidden");
      if (count) count.innerText = "0";
      return;
    }

    if (count) count.innerText = data.categories.length;

    // Cache categories to storage for content script
    const categoryNames = data.categories.map(c => c.name);
    try {
      await chrome.storage.local.set({ cachedCategories: categoryNames });
    } catch (storageErr) {
      console.warn("Could not cache categories to storage", storageErr);
    }

    data.categories.forEach(cat => {
      const el = document.createElement("div");
      el.className = "card";
      
      const modelOptions = MODELS.map(m => 
        `<option value="${m.id}" ${cat.model === m.id ? 'selected' : ''}>${m.name}</option>`
      ).join("");

      el.innerHTML = `
        <div class="card-content" style="cursor: pointer;">
          <div class="card-title clickable" style="margin-bottom:2px; font-size:13px; font-weight: 600; display:flex; align-items:center; gap:4px;">
            <span class="cat-name-display">${cat.name}</span>
            <button class="btn btn-edit-name" title="Edit Name" style="padding:0; opacity:0.5;">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px; height:12px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
          </div>
          <div class="card-meta">
             <select class="select model-select" style="width: 100%; margin-top: 4px; height: 24px; padding: 2px 4px;">
               ${modelOptions}
             </select>
          </div>
        </div>
        <div class="card-accordion-content">
          <textarea class="prompt-textarea">${cat.prompt}</textarea>
          <button class="btn-save">Save Config</button>
        </div>
        <div class="actions actions-top">
          <button class="btn btn-discard" title="Remove Category">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      `;

      const editNameBtn = el.querySelector(".btn-edit-name");
      if (editNameBtn) {
        editNameBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const newName = prompt("Enter new category name:", cat.name);
          if (newName && newName.trim() !== cat.name) {
            try {
              const r = await fetch(`${API_BASE}/categories/rename`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldName: cat.name, newName: newName.trim() })
              });
              const d = await r.json();
              if (d.success) {
                activeCategories = [];
                await fetchCategories();
              } else {
                alert("Error: " + d.error);
              }
            } catch (err) {
              alert("Error renaming category");
            }
          }
        });
      }

      // Accordion toggle
      const titleClickable = el.querySelector(".card-content");
      titleClickable.addEventListener("click", (e) => {
        if (e.target.closest("button, select, svg, path")) return;
        el.classList.toggle("expanded");
      });

      // Save prompt and model
      const saveBtn = el.querySelector(".btn-save");
      if (saveBtn) {
        saveBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const btn = e.target;
          const newPrompt = el.querySelector(".prompt-textarea").value;
          const newModel = el.querySelector(".model-select").value;
          btn.innerText = "Saving...";
          btn.disabled = true;
          try {
            const r = await fetch(`${API_BASE}/categories`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: cat.name, prompt: newPrompt, model: newModel })
            });
            const d = await r.json();
            if (d.success) {
              btn.innerText = "Saved!";
              setTimeout(() => { btn.innerText = "Save Config"; btn.disabled = false; }, 2000);
            } else {
              alert("Error: " + d.error);
              btn.innerText = "Save Config";
              btn.disabled = false;
            }
          } catch(err) {
            alert("Error saving category");
            btn.innerText = "Save Config";
            btn.disabled = false;
          }
        });
      }

      // Delete category
      const discardBtn = el.querySelector(".btn-discard");
      if (discardBtn) {
        discardBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm(`Delete category "${cat.name}"?`)) return;
          el.style.opacity = "0.5";
          el.style.pointerEvents = "none";
          try {
            const r = await fetch(`${API_BASE}/categories/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: cat.name })
            });
            const d = await r.json();
            if (d.success) {
              el.remove();
              activeCategories = [];
              await fetchCategories();
            } else {
              alert("Error: " + d.error);
              el.style.opacity = "1";
              el.style.pointerEvents = "auto";
            }
          } catch(e) {
            alert("Error removing category");
            el.style.opacity = "1";
            el.style.pointerEvents = "auto";
          }
        });
      }

      if (list) list.appendChild(el);
    });

  } catch (err) {
    if (loading) loading.classList.add("hidden");
    if (empty) {
      empty.classList.remove("hidden");
      const textEl = empty.querySelector(".empty-text");
      if (textEl) textEl.innerText = "Failed to load categories";
    }
  }
}

async function fetchCost() {
  try {
    const res = await fetch(`${API_BASE}/cost`);
    const data = await res.json();
    if (data.success) {
      const costEl = document.getElementById("daily-cost");
      if (costEl) costEl.innerText = `$${(data.cost || 0).toFixed(4)}`;
    }
  } catch (err) {
    console.error("Error fetching cost", err);
  }
}

async function getReadStates() {
  return new Promise((resolve) => {
    chrome.storage.local.get("historyReadStates", (res) => {
      resolve(res.historyReadStates || {});
    });
  });
}

async function saveReadState(videoId, buttonType) {
  const states = await getReadStates();
  if (!states[videoId]) {
    states[videoId] = { transcript: false, analysis: false };
  }
  states[videoId][buttonType] = true;
  return new Promise((resolve) => {
    chrome.storage.local.set({ historyReadStates: states }, () => {
      resolve();
    });
  });
}

async function fetchHistory() {
  const loading = document.getElementById("history-loading");
  const list = document.getElementById("history-list");
  const empty = document.getElementById("history-empty-state");
  const count = document.getElementById("history-count");

  if (loading) loading.classList.remove("hidden");
  if (list) list.innerHTML = "";
  if (empty) empty.classList.add("hidden");

  try {
    const res = await fetch(`${API_BASE}/history`);
    const data = await res.json();
    
    if (loading) loading.classList.add("hidden");

    if (!data.success || !data.history || data.history.length === 0) {
      if (empty) empty.classList.remove("hidden");
      if (count) count.innerText = "0";
      return;
    }

    if (count) count.innerText = data.history.length;

    const readStates = await getReadStates();

    data.history.forEach(video => {
      const el = document.createElement("div");
      const videoId = video.videoId;
      const state = readStates[videoId] || { transcript: false, analysis: false };
      const isUnread = !(state.transcript && state.analysis);
      
      el.className = isUnread ? "card card-unread" : "card";
      
      const tokens = video.usage?.totalTokenCount ? `${(video.usage.totalTokenCount/1000).toFixed(1)}k tokens` : 'Tokens N/A';
      const costStr = video.cost ? `$${video.cost.toFixed(4)}` : 'Cost N/A';

      let processedHtml = "";
      if (video.processedAt) {
        try {
          const date = new Date(video.processedAt);
          const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          processedHtml = `<span>•</span> <span>Processed ${dateStr}</span>`;
        } catch (e) {
          console.error("Error parsing processedAt date", e);
        }
      }

      el.innerHTML = `
        <div class="card-content" style="padding-right: 0;">
          <div class="card-title clickable" title="Open Video" style="margin-bottom: 4px;">
            ${video.title}
          </div>
          <div class="card-meta" style="margin-bottom: 8px;">
            <span class="card-channel">${video.channelName}</span>
            <span>•</span>
            <span class="card-category">${video.category}</span>
            <span>•</span>
            <span style="color:var(--green);">${costStr}</span>
            ${processedHtml}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-primary btn-dl-transcript" style="font-size: 10px; padding: 2px 8px; background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border);">Transcript</button>
            <button class="btn-primary btn-dl-analysis" style="font-size: 10px; padding: 2px 8px; background: rgba(94, 106, 210, 0.2); color: var(--accent); border: 1px solid rgba(94, 106, 210, 0.4);">Analysis</button>
          </div>
        </div>
      `;

      const titleEl = el.querySelector(".card-title");
      if (titleEl) {
        titleEl.addEventListener("click", () => window.open(video.videoUrl, "_blank"));
      }

      // Dynamically fix the title bug retrospectively for old items in history using public OEmbed
      if (!video.title || video.title === 'YouTube video feed' || video.title === 'Untitled') {
        if (titleEl) {
          titleEl.innerText = "Loading title...";
          (async () => {
            try {
              const r = await fetch(`https://www.youtube.com/oembed?url=${video.videoUrl}&format=json`);
              const d = await r.json();
              if (d.title) {
                titleEl.innerText = d.title;
                video.title = d.title;
              }
            } catch (err) {
              titleEl.innerText = "Unknown Video";
            }
          })();
        }
      }

      const dlTranscriptBtn = el.querySelector(".btn-dl-transcript");
      if (dlTranscriptBtn) {
        dlTranscriptBtn.addEventListener("click", async () => {
          downloadFile(`${video.title.slice(0,30)}-transcript.txt`, video.transcript || "No transcript");
          await saveReadState(videoId, "transcript");
          
          const updatedStates = await getReadStates();
          const updatedState = updatedStates[videoId];
          if (updatedState && updatedState.transcript && updatedState.analysis) {
            el.classList.remove("card-unread");
          }
        });
      }

      const dlAnalysisBtn = el.querySelector(".btn-dl-analysis");
      if (dlAnalysisBtn) {
        dlAnalysisBtn.addEventListener("click", async () => {
          downloadFile(`${video.title.slice(0,30)}-analysis.md`, video.analysis || "No analysis");
          await saveReadState(videoId, "analysis");
          
          const updatedStates = await getReadStates();
          const updatedState = updatedStates[videoId];
          if (updatedState && updatedState.transcript && updatedState.analysis) {
            el.classList.remove("card-unread");
          }
        });
      }

      if (list) list.appendChild(el);
    });

  } catch (err) {
    if (loading) loading.classList.add("hidden");
    if (empty) {
      empty.classList.remove("hidden");
      const textEl = empty.querySelector(".empty-text");
      if (textEl) textEl.innerText = "Failed to load history";
    }
  }
}

function downloadFile(filename, content) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
