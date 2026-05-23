---
name: hyperframes
description: Create deterministic web-standard video compositions using HTML, CSS, and GSAP (GreenSock). Capture frames and render video files from code using headless browsers and FFmpeg. Use when building automated video production, kinetic typography, dynamic mockups, or automated agentic video generation.
---

# HyperFrames Skill

HyperFrames is an open-source, HTML-based video rendering framework designed for AI agents. It allows you to define video compositions using standard web technologies (HTML, CSS, JavaScript) and animate them programmatically using GSAP (GreenSock Animation Platform). 

Instead of relying on generative video models, HyperFrames produces high-quality, pixel-perfect, deterministic video files by running the composition in a headless browser, seeking the timeline frame-by-frame, capturing high-resolution screenshots, and stitching them together using FFmpeg.

---

## When to Use

- **Automated Video Pipelines**: Generating marketing videos, dynamic product teasers, and content digests from raw data or LLM inputs.
- **Kinetic Typography & Presentations**: Building sharp, high-fidelity slides or explainer animations with precise timing.
- **Dynamic UI Mockups**: Creating premium, animated demonstrations of browser features (such as Chrome Extensions or web apps) for product launches.
- **Autonomous Video Agents**: Letting an AI plan, design, and render professional video compositions in real-time.

---

## 🏗️ Core Architecture & Composition Structure

Every HyperFrames composition page (typically `index.html`) consists of a fixed-resolution root container, modular CSS-styled scene wrappers, and a seekable GSAP timeline.

### 1. The Composition Root
The main wrapper element must declare specific metadata attributes to define the rendering environment:

```html
<div id="intro-comp" 
     data-composition-id="intro" 
     data-width="1920" 
     data-height="1080" 
     data-start="0" 
     data-duration="30">
    <!-- Scene layers go here -->
</div>
```

- `data-composition-id`: Unique identifier registered on the global window timeline mapping.
- `data-width` & `data-height`: Fixed resolution in pixels (e.g., `1920x1080` for 1080p landscape, or `1080x1920` for portrait shorts).
- `data-start`: The starting point in seconds (usually `0`).
- `data-duration`: Total length of the video in seconds.

### 2. Styling Rules (Premium Dark Mode)
To guarantee a professional, high-fidelity "vibe-coded" feel, always implement a unified design token system:

- **Typography**: Import premium fonts from Google Fonts (e.g., `Geist` for headlines, `Inter` for body copy, and `JetBrains Mono` for monospace coordinates/data readouts).
- **Aesthetic Accents**: Leverage radial glows, horizontal/vertical hairlines, and floating coordinate grids (`X: 000 Y: 000`) in corners to create a technical blueprint mood.
- **No Placeholders**: Never use generic placeholder shapes. Generate premium visual assets or build beautiful CSS vector representations.

---

## ⏱️ Timing & Animation Orchestration (GSAP)

The most critical requirement of HyperFrames is **strict determinism**. Because the renderer captures frames individually, the animation must be perfectly seekable on demand.

### 1. Global Timeline Registration
You must register your main GSAP timeline on the global `window.__timelines` object under the matching composition ID, and it must be initialized as **paused**:

```javascript
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });

// Add your animations here...

window.__timelines["intro"] = tl;
```

### 2. Deterministic Guidelines
- 🚫 **Do Not Use Dynamic Dates/Time**: Never use `new Date()` or `Date.now()` to dictate animations. Use the GSAP timeline time track exclusively.
- 🚫 **Do Not Use Math.random()**: Avoid random functions that change output on reload. If randomized effects are needed, seed them or define them statically in arrays.
- 🚫 **Do Not Use CSS Transitions**: Avoid CSS transitions/animations (like `transition: all 0.3s ease`) or standard `requestAnimationFrame` loops. Everything must be controlled via the GSAP timeline.
- 🚫 **Do Not Use HTML5 Video Tags**: Regular video elements do not scrub frame-accurately in a headless browser unless manually bound to the GSAP playback head. Use sequential image assets instead.

---

## 🎨 Scene Transition Patterns

HyperFrames uses standard transition archetypes to maintain flow and rhythm. Use these GSAP setups:

### 1. Vertical Push (S1 -> S2)
Pushes the active scene out while pulling the next scene into view from the bottom:
```javascript
const s1 = "#scene1", s2 = "#scene2";

tl.to(s1, { y: -1080, duration: 0.5, ease: "power3.inOut" }, 5);
tl.set(s1, { visibility: "hidden" }, 5.5);
tl.fromTo(s2, 
  { y: 1080, opacity: 1, visibility: "visible" }, 
  { y: 0, duration: 0.5, ease: "power3.inOut" }, 
  5
);
```

### 2. Shader/Cinematic Zoom (S3 -> S4)
Simulates a camera lens zooming into an element to crossfade scenes:
```javascript
const s3 = "#scene3", s4 = "#scene4";

tl.to(s3, { scale: 2.5, opacity: 0, filter: "blur(8px)", duration: 0.6, ease: "power3.in" }, 20);
tl.set(s3, { visibility: "hidden" }, 20.6);
tl.fromTo(s4,
  { scale: 0.5, opacity: 0, visibility: "visible", filter: "blur(8px)" },
  { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }, 
  20.15
);
```

---

## 🚀 Performance Optimization

Headless frame capture renders every single pixel of the DOM. Follow these best practices to ensure high render speeds:
1. **GPU Acceleration**: Add `transform: translate3d(0, 0, 0)` or `backface-visibility: hidden` to heavily animated divs.
2. **Minimize Layout Shifts**: Prefer GSAP `x` and `y` (CSS `transform: translate`) over `top` and `left` for element positions, as they avoid browser reflows.
3. **Canvas Optimization**: If using canvas elements or WebGL, ensure they have a direct `renderFrame(time)` binding that can be triggered programmatically by the orchestrator.
