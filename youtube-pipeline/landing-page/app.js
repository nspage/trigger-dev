document.addEventListener('DOMContentLoaded', () => {
  setupVideoPlayer();
  setupSimulator();
});

function setupVideoPlayer() {
  const overlay = document.getElementById('videoOverlay');
  const video = document.getElementById('promoVideo');
  
  if (!overlay || !video) return;
  
  overlay.addEventListener('click', () => {
    overlay.classList.add('playing');
    video.play();
    video.controls = true;
  });
  
  video.addEventListener('pause', () => {
    // If user paused the video natively
    if (video.paused) {
      overlay.classList.remove('playing');
      video.controls = false;
    }
  });

  video.addEventListener('ended', () => {
    overlay.classList.remove('playing');
    video.controls = false;
    video.load(); // Reset video
  });
}

const SIMULATOR_DATA = {
  1: {
    title: 'Cloudflare Ingestion',
    icon: 'incoming',
    logs: [
      { text: '$ curl -X POST https://yt-pipeline.worker.dev/webhook', type: 'cmd' },
      { text: '[Worker] Received PubSubHubbub ping from YouTube', type: 'info' },
      { text: '[Worker] Parsing RSS Feed XML payload...', type: 'info' },
      { text: '[Worker] New video detected: "Building AI Agents from Scratch" (Id: dQw4w9WgXcQ)', type: 'info' },
      { text: '[Worker] Channel: DevMastery (Category: TECH)', type: 'info' },
      { text: '[Worker] Writing state to Cloudflare KV: status=pending, timestamp=1716567900', type: 'info' },
      { text: '[Worker] Webhook processed successfully. HTTP 200 OK.', type: 'success' }
    ]
  },
  2: {
    title: 'Chrome Extension Review',
    icon: 'extension',
    logs: [
      { text: '[Extension] Fetching pending queue from Hono server...', type: 'info' },
      { text: '[Extension] GET http://localhost:3000/api/extension/queue -> HTTP 200', type: 'cmd' },
      { text: '[Extension] Queue status: 1 video pending review', type: 'info' },
      { text: '[User Action] Clicked "Approve & Synthesize" in extension UI', type: 'warn' },
      { text: '[Extension] Sending POST /api/extension/process payload={videoId: "dQw4w9WgXcQ"}', type: 'cmd' },
      { text: '[Hono API] Process request received. Triggering Trigger.dev task...', type: 'info' },
      { text: '[Trigger.dev] Task "process-video" scheduled. Run ID: run_td348a27bc', type: 'success' }
    ]
  },
  3: {
    title: 'Local Scraping (Docker)',
    icon: 'docker',
    logs: [
      { text: '[Trigger.dev Node] Local Docker worker listening on dev tunnel...', type: 'info' },
      { text: '[Trigger.dev Node] run_td348a27bc pulled by local container', type: 'info' },
      { text: '[Docker] Executing task "process-video" (V3 engine)', type: 'info' },
      { text: '[Docker] Scraping transcript via youtube-transcript (Using Residential IP: 82.35.12.19)', type: 'cmd' },
      { text: '[Docker] YT transcript API connection handshake established.', type: 'info' },
      { text: '[Docker] Fetched 204 subtitle lines (approx. 4,500 words of spoken text)', type: 'success' },
      { text: '[Docker] Local transcript cache updated successfully.', type: 'info' }
    ]
  },
  4: {
    title: 'AI Synthesis (Gemini)',
    icon: 'gemini',
    logs: [
      { text: '[Gemini API] Formatting synthesis prompt (Model: gemini-3.5-flash-medium)', type: 'cmd' },
      { text: '[Gemini API] Loading category prompt template: "Tactical" (how-to & tutorials)', type: 'info' },
      { text: '[Gemini API] Packing transcript snippets (Tokens: 4,920)', type: 'info' },
      { text: '[Gemini API] POST https://generativelanguage.googleapis.com/v1beta/models/...', type: 'info' },
      { text: '[Gemini API] Generating Markdown summaries and action items...', type: 'info' },
      { text: '[Gemini API] Call succeeded in 1.54s (Output tokens: 680, cost: $0.00037)', type: 'success' },
      { text: '[Gemini API] Summary validated. Title: "Building AI Agents from Scratch"', type: 'info' }
    ]
  },
  5: {
    title: 'GTM Delivery',
    icon: 'delivery',
    logs: [
      { text: '[Telegram] Packaging synthethized summary for delivery...', type: 'info' },
      { text: '[Telegram] POST https://api.telegram.org/bot<token>/sendDocument', type: 'cmd' },
      { text: '[Telegram] Message successfully sent to chat_id: -4829392 (Status: Delivered)', type: 'success' },
      { text: '[Resend API] Queueing daily digest email for 08:00 AM', type: 'info' },
      { text: '[KV State] Updating video record: status=processed, cost=$0.00037', type: 'info' },
      { text: '[System] Pipeline run_td348a27bc completed successfully in 5.21s!', type: 'success' }
    ]
  }
};

function setupSimulator() {
  const steps = document.querySelectorAll('.sim-step-btn');
  const consoleEl = document.getElementById('terminalConsole');
  const demos = document.querySelectorAll('.demo-state');
  const prevBtn = document.getElementById('simPrev');
  const nextBtn = document.getElementById('simNext');
  
  if (!consoleEl || steps.length === 0) return;
  
  let currentStep = 1;
  let lineInterval = null;
  
  function renderStep(stepNum) {
    currentStep = stepNum;
    
    // Update button states
    steps.forEach(btn => {
      const num = parseInt(btn.getAttribute('data-step'));
      if (num === stepNum) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Update graphic states
    demos.forEach(demo => {
      const num = parseInt(demo.getAttribute('data-step'));
      if (num === stepNum) {
        demo.classList.add('active');
      } else {
        demo.classList.remove('active');
      }
    });
    
    // Update Prev/Next buttons
    if (prevBtn) prevBtn.disabled = stepNum === 1;
    if (nextBtn) {
      if (stepNum === 5) {
        nextBtn.innerHTML = 'Restart <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>';
      } else {
        nextBtn.innerHTML = 'Next Step <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
      }
    }
    
    // Clear old typing logs
    clearInterval(lineInterval);
    consoleEl.innerHTML = '';
    
    // Animate logs typing line by line
    const data = SIMULATOR_DATA[stepNum];
    let logIdx = 0;
    
    function printNextLine() {
      if (logIdx >= data.logs.length) {
        // Append blinking cursor at the end
        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        consoleEl.appendChild(cursor);
        consoleEl.scrollTop = consoleEl.scrollHeight;
        return;
      }
      
      const lineData = data.logs[logIdx];
      const lineDiv = document.createElement('div');
      lineDiv.className = `terminal-line ${lineData.type}`;
      lineDiv.innerText = lineData.text;
      
      consoleEl.appendChild(lineDiv);
      consoleEl.scrollTop = consoleEl.scrollHeight;
      
      logIdx++;
      lineInterval = setTimeout(printNextLine, 350 + Math.random() * 200);
    }
    
    printNextLine();
  }
  
  // Wire up click events on steps
  steps.forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.getAttribute('data-step'));
      renderStep(num);
    });
  });
  
  // Wire up navigation controls
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        renderStep(currentStep - 1);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStep < 5) {
        renderStep(currentStep + 1);
      } else {
        renderStep(1);
      }
    });
  }
  
  // Initialize with Step 1
  renderStep(1);
}
