# BidMyRoom Ads - Video Editing Workflow

> Updated: 2026-04-15  
> Project: Ad campaign for BidMyRoom (group hotel booking platform)

---

## Quick Start

```bash
# 1. Preview in browser (with video background)
open html/ad-one-whatever-group.html

# 2. Export final video (frame-perfect)
node ExportFrames.js
```

---

## The Proven Workflow

After testing multiple approaches, here's what works reliably:

### Two-File System

Each ad needs **two HTML files**:

| File | Purpose | Background |
|------|---------|------------|
| `html/{ad-name}.html` | Browser preview | Video embedded |
| `html/{ad-name}-overlay.html` | Export source | Transparent |

**Why two files?**
- Preview file lets you see text on video in real-time
- Overlay file exports clean alpha channel for FFmpeg compositing
- Keeps preview fast and export frame-perfect

### Export Process

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Overlay HTML   │────▶│  Frame Capture   │────▶│  PNG Sequence   │
│  (transparent)  │     │  (Puppeteer)     │     │  (with alpha)   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│  Source Video   │────▶│  FFmpeg Compose  │◀─────────────┘
│  (original)     │     │  + Audio merge   │
└─────────────────┘     └────────┬─────────┘
                                 │
                        ┌────────▼────────┐
                        │  Final Video    │
                        │  (with audio)   │
                        └─────────────────┘
```

---

## Why NOT Real-Time Screen Recording

**Problem**: Puppeteer's screen recorder captures in real-time. When recording video playback:
- Browser can't maintain consistent frame rate
- Results in stuttering/lagging video
- Animation timing becomes inconsistent

**Solution**: Frame-by-frame capture
- Each frame captured independently
- Puppeteer controls exact timestamp via `window.setTime(t)`
- No dropped frames, perfect sync
- Slightly slower export (~1 min) but flawless output

---

## File Structure

```
bidmyroom-ads/
├── WORKFLOW-PLAN.md              # This file
├── ExportFrames.js               # Frame-perfect export script
├── Export.js                     # Legacy (don't use for video overlays)
│
├── un-edited-videos/             # Source footage
│   └── ad-one-whatever-group.mp4
│
├── html/                         # All HTML files
│   ├── ad-one-whatever-group.html        # Preview (video background)
│   └── text-overlay.html                  # Export (transparent)
│
├── edited-videos/                # Final exports
│   └── ad-one-whatever-group.mp4
│
└── assets/                       # Shared assets
    ├── logo-icon.svg
    └── logo-text.svg
```

---

## Creating a New Ad

### Step 1: Add Source Video
```bash
cp /path/to/video.mp4 un-edited-videos/ad-name.mp4
```

### Step 2: Get Video Info
```bash
ffprobe -v quiet -show_entries stream=width,height,duration,r_frame_rate \
  -of csv=p=0 un-edited-videos/ad-name.mp4
```

### Step 3: Create Preview HTML
Copy from template, update:
- Video source path
- Timing constants (T object)
- Text content
- Animation styles

### Step 4: Create Overlay HTML
Same as preview but:
- Remove `<video>` element
- Set `background: transparent` on body/stage
- Add `window.setTime(t)` function for Puppeteer control

### Step 5: Iterate in Browser
- Open preview HTML
- Use "Skip to Xs" button to test text timing
- Adjust timing/animations until satisfied

### Step 6: Update ExportFrames.js
```javascript
const CONFIG = {
  overlayHtml: "html/your-overlay.html",
  sourceVideo: "un-edited-videos/your-video.mp4",
  outputVideo: "edited-videos/your-output.mp4",
  fps: 30,
  duration: 15.0,  // Match source video
  width: 1080,
  height: 1920,
};
```

### Step 7: Export
```bash
node ExportFrames.js
```

---

## Animation Timing Template

```javascript
// Timing configuration (seconds)
const T = {
  effectsIn: 10.2,      // Overlays fade in
  scene1In: 10.5,       // First text appears
  scene1Out: 12.0,      // First text exits
  scene2In: 12.1,       // Second text appears
  scene2Out: 13.2,      // Second text exits
  scene3In: 13.3,       // Third text appears
  scene3Out: 13.9,      // Third text exits
  backdropIn: 13.7,     // Logo backdrop fades in
  scene4In: 14.1,       // Logo appears
};
```

---

## Animation Patterns Library

### Word-by-Word Reveal (3D Flip)
```css
.word {
  opacity: 0;
  transform: translateY(80px) rotateX(-40deg);
  filter: blur(12px);
}
.active .word {
  animation: word-flip-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.active .word:nth-child(1) { animation-delay: 0.0s; }
.active .word:nth-child(2) { animation-delay: 0.08s; }
/* ... */
```

### Zoom Blur Reveal
```css
.text {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
  filter: blur(15px);
}
.active .text {
  animation: zoom-blur-in 0.6s ease-out forwards;
}
```

### Slam In (Big Impact)
```css
.big-text {
  opacity: 0;
  transform: scale(2.5);
  filter: blur(30px);
}
.active .big-text {
  animation: slam-in 0.5s ease-out forwards;
}
```

### Logo Swoop
```css
.logo {
  opacity: 0;
  transform: translateX(-120px) rotate(-15deg) scale(0.6);
}
.active .logo {
  animation: logo-swoop 0.8s ease-out forwards;
}
```

### Character Rise
```css
.char {
  opacity: 0;
  transform: translateY(100%) rotateX(-90deg);
}
.active .char {
  animation: char-rise 0.5s ease-out forwards;
}
.active .char:nth-child(1) { animation-delay: 0.25s; }
/* stagger by 0.05s per character */
```

---

## Tools Reference

### Installed & Working
| Tool | Version | Use For |
|------|---------|---------|
| Node.js | - | Running export scripts |
| Puppeteer | 24.x | Browser automation, frame capture |
| FFmpeg | 7.1.1 | Video compositing, encoding |

### FFmpeg Common Commands

```bash
# Get video info
ffprobe -v quiet -show_format -show_streams video.mp4

# Composite overlay onto video
ffmpeg -i source.mp4 -i overlay.mov \
  -filter_complex "[0:v][1:v]overlay=0:0[outv]" \
  -map "[outv]" -map 0:a \
  -c:v libx264 -crf 18 -c:a aac output.mp4

# Create ProRes with alpha from PNGs
ffmpeg -framerate 30 -i frames/frame_%05d.png \
  -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le \
  overlay.mov

# Extract audio
ffmpeg -i video.mp4 -vn -c:a copy audio.aac

# Trim video
ffmpeg -i input.mp4 -ss 00:00:05 -to 00:00:15 -c copy output.mp4
```

---

## Brand Guidelines

| Element | Value |
|---------|-------|
| Primary Color | `#0f81c0` |
| Font | Poppins (400, 500, 600, 700, 800, 900) |
| Logo | `assets/logo-icon.svg` |
| Aspect Ratio | 9:16 (1080x1920) |

---

## Troubleshooting

### Export is laggy/stuttering
- **Don't use**: Real-time screen recording (`Export.js` with puppeteer-screen-recorder)
- **Do use**: Frame-by-frame capture (`ExportFrames.js`)

### Animations not triggering
- Check timing values in `T` object match your video duration
- Ensure `window.setTime(t)` is being called
- Verify trigger flags aren't getting stuck

### No audio in export
- FFmpeg composite includes `-map 0:a` to copy audio
- Check source video has audio track: `ffprobe -show_streams`

### Fonts not rendering
- Add `await page.evaluate(() => document.fonts.ready)` before capture
- Use web fonts from Google Fonts (loaded via CSS @import)

### Transparent background not working
- Use `omitBackground: true` in Puppeteer screenshot
- Set `background: transparent` on html, body, and stage
- Export to ProRes 4444 (supports alpha) before compositing

---

## Planned Improvement: Config-Driven System

**Problem**: Currently editing two HTML files with 100+ lines each for every change.

**Solution**: Single config file + smart export script

### Proposed Structure
```
configs/
  ad-one.js           <- All creative decisions
  ad-two.js
base-template.html    <- Reusable, reads config
ExportFrames.js       <- Handles preview & export from one source
```

### Config Format
```js
// configs/ad-one.js
export default {
  video: "ad-one-whatever-group.mp4",
  duration: 15,
  
  timing: {
    textStart: 10.3,
    blurStart: 13.4,
  },
  
  scenes: [
    {
      type: "headline",
      text: "Whatever your *group* looks like...",  // *word* = blue
      position: "center",
      in: 10.3,
      out: 12.3,
      animation: "slide-up",
      exit: "iris-close"
    },
    {
      type: "impact",
      text: "Room*?*",
      in: 12.5,
      out: 13.6,
      animation: "letter-drop"
    },
    {
      type: "logo",
      tagline: "For Every Traveler, Every Trip",
      in: 13.8
    }
  ]
}
```

### Benefits
- Edit ~15 lines instead of 200+
- Single source of truth
- Focus on creative, not markup
- Faster iteration with Claude

### Implementation Status
- [ ] Create config parser
- [ ] Build base template
- [ ] Update ExportFrames.js to read config
- [ ] Test with new ad

---

## Completed Ads

### 1. "Whatever Your Group" (ad-one)
- **Status**: Exported
- **Duration**: 15s
- **Scenes**: 3 (headline → "Room?" → logo)
- **Text Flow**:
  - "Whatever your *group* looks like..." (center, blue highlight)
  - "Room*?*" (letter drop, blue ?)
  - BidMyRoom logo + "For Every Traveler, Every Trip"
- **Effects**: Video blur + dark overlay for logo scene
- **Files**: `html/ad-one-whatever-group.html`, `html/ad-one-whatever-group-overlay.html`
