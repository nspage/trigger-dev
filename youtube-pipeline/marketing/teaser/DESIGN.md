# Design System: Local YouTube Knowledge Pipeline Teaser

## Goal
To visually represent the transformation of "YouTube noise into an interlinked knowledge ecosystem", leveraging the exact aesthetic of the existing Chrome Extension, combined with premium HyperFrames rendering techniques.

## Global Specifications
- **Resolution**: 1920x1080 (16:9 Landscape)
- **Framerate**: 60fps (Implied by GSAP duration math)
- **Total Duration**: 10 seconds

## Color Palette
Based on the Chrome Extension `popup.html`:
- **Background Base**: `#0e0f11` (Deep black/gray)
- **Card/Element Background**: `#18191d`
- **Hover/Accent Background**: `#212328`
- **Border**: `#282a30`
- **Text Main**: `#ededed` (Off-white)
- **Text Muted**: `#8b8f98` (Gray)
- **Primary Accent**: `#5e6ad2` (Purple/Blue)
- **Success Green**: `#4ade80`
- **Error/Negative Red**: `#f87171`

## Typography
- **UI & Markdown**: `Inter`, `-apple-system`, `BlinkMacSystemFont`
- **Raw Transcript / Data / Code**: `JetBrains Mono`, `monospace`
- **Headers/Display**: `Geist` or heavy `Inter` weights.

## Core Visual Components

### 1. The Chrome Extension UI Overlay
- Accurately mocked versions of the `Pending`, `Channels`, `Categories`, and `History` tabs.
- Will be used to frame the action (e.g., triggering a queue, showing history).

### 2. The Chaos (Raw Transcript)
- A dense, unformatted block of `JetBrains Mono` text in `#8b8f98`.
- No capitalization, no punctuation.
- Motion: Rapid vertical scrolling and slight glitch opacity shifts.

### 3. The Synthesis (Markdown)
- Clean, structured HTML matching GitHub/Obsidian dark mode.
- Bright headers, highlighted syntax, bullet points.
- Motion: Revealed by a glowing `#5e6ad2` vertical or horizontal scanline.

### 4. Community Validation (X Posts)
- `x-post` template: Dark mode Twitter cards.
- Avatar, Name, Handle, Content.
- Motion: 3D cascading, scaling up and slamming down with offset shadows (`box-shadow: 0 10px 30px rgba(94, 106, 210, 0.2)`).

### 5. The Ecosystem (Graph Vault)
- Glowing SVG paths (`stroke: #5e6ad2`, `filter: drop-shadow(0 0 8px #5e6ad2)`).
- Markdown documents scaling down into rounded nodes (`border-radius: 8px`).
- Motion: Camera zooms out into 3D space, connections draw themselves (GSAP `drawSVG` or `stroke-dashoffset` tricks).
