# Storyboard: Local YouTube Knowledge Pipeline Teaser

## Scene 1: From Noise to Signal (0s - 3s)
- **0.0s**: Dark screen, `#0e0f11`. The Chrome Extension UI (`popup.html` style) sits center-left. 
- **0.5s**: A video is "Processing". The UI slides left, making room.
- **1.0s**: A wall of `#8b8f98` monospace text (Raw Transcript) scrolls furiously upwards on the right side.
- **1.5s**: A glowing `#5e6ad2` horizontal bar drops from the top of the transcript area. 
- **2.0s**: As the bar drops, it acts as a wipe transition. Above the bar is clean, bright Markdown text; below the bar is the chaotic raw text.
- **2.5s**: Caption fades in: "From noise to signal."

## Scene 2: Community Validation (3s - 6s)
- **3.0s**: The Markdown area and UI push backwards in Z-space (GSAP `scale: 0.8`, `opacity: 0.2`, `filter: blur(5px)`).
- **3.3s**: **X-Post 1** slams in from the right. (`rotation: -5deg`)
- **3.7s**: **X-Post 2** slams in from the left, overlapping Post 1. (`rotation: 3deg`)
- **4.1s**: **X-Post 3** slams in from top-right. (`rotation: -2deg`)
- **4.5s**: **X-Post 4** slams in from bottom-left. (`rotation: 4deg`)
- **4.9s**: **X-Post 5** slams directly in the center, biggest of all. 
- **5.2s**: Caption flashes: "The community agrees."

## Scene 3: The Ecosystem (6s - 10s)
- **6.0s**: All X-Posts fly outward off-screen (`scale: 3`, `opacity: 0`).
- **6.5s**: The original Markdown document (from Scene 1) moves to the center and shrinks into a small card/node.
- **7.0s**: 10 other nodes fade in around it in a circular/graph layout.
- **7.5s**: Glowing SVG lines dynamically draw (`stroke-dashoffset` animation) to connect the nodes together.
- **8.0s**: The camera slowly pulls back slightly (`scale: 0.95`).
- **8.5s**: The Chrome Extension "History", "Categories", and "Channels" tabs slide in from the left edge and fan out, showing system management.
- **9.0s**: Caption fades in: "Your personal knowledge ecosystem."
- **10.0s**: Fade to black.
