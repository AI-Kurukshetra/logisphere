# 🎥 Automated Video Walkthrough Generator

Professional video walkthrough of Logisphere generated automatically with code.

## What You Get

A **4-minute professional video** that covers:

✅ **22 page walkthroughs** with engaging narration
✅ **Smooth scrolling animations** that reveal content progressively
✅ **1280x720 resolution** high-quality screenshots
✅ **Automatic scene transitions** with fade effects
✅ **Professional opening/closing** with branding

**Total Pages Covered:**
- 4 public pages (Home, Features, Pricing, About)
- 18 workspace pages (Dashboard, Analytics, Tracking, etc.)

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
# From project root
npm install puppeteer remotion

# Optional: for text-to-speech narration
npm install google-tts-api  # Free option
# OR
npm install elevenlabs  # Professional quality
```

### Step 2: Start Dev Server

```bash
npm run dev
# Runs on http://localhost:3000
```

### Step 3: Record Screenshots

```bash
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts
```

**What happens:**
- 🤖 Launches headless browser
- 📱 Visits each page and scrolls through content
- 📸 Captures 100+ high-quality screenshots
- 💾 Saves to `scripts/video-walkthrough/screenshots/`
- 📝 Generates `metadata.json` with frame timing

**Output:**
```
scripts/video-walkthrough/
├── screenshots/
│   ├── 00_000.png  (Home page)
│   ├── 00_001.png
│   ├── 01_000.png  (Features page)
│   └── ... (20+ pages, 100+ frames total)
└── metadata.json   (frame timing metadata)
```

### Step 4: Render Video

```bash
npx remotion render scripts/video-walkthrough/remotion-composer.tsx LogisphereWalkthrough logisphere-walkthrough.mp4
```

**Output:** `logisphere-walkthrough.mp4` ✅

Done! Upload to YouTube, Vimeo, or your internal wiki.

## Advanced: Add Audio Narration

### Option 1: Google TTS (Free)

```bash
# Generate audio for all pages
npx ts-node scripts/video-walkthrough/tts-generator.ts google

# Output: scripts/video-walkthrough/audio/*.mp3
```

Then update `remotion-composer.tsx` to include audio:

```typescript
import { Audio } from "remotion";

<Sequence from={0} durationInFrames={360}>
  <Audio src={audioFilePath} />
  <ScreenshotFrame imagePath={frame.imagePath} />
</Sequence>
```

### Option 2: ElevenLabs (Professional)

```bash
npx ts-node scripts/video-walkthrough/tts-generator.ts elevenlabs YOUR_API_KEY
```

### Option 3: AWS Polly

```bash
# Requires AWS credentials configured
npx ts-node scripts/video-walkthrough/tts-generator.ts aws
```

## Page Scripts Reference

All narration and interaction sequences are in `scripts/video-walkthrough/page-scripts.ts`.

### Example Script Structure

```typescript
{
  route: "/dashboard",
  title: "Dashboard - Command Center",
  duration: 12,  // seconds of screen time
  narration: "Welcome to your command center...",

  // Smooth scrolling sections
  scrollPoints: [
    { delay: 2000, direction: "down", amount: 400 },  // Wait 2s, then scroll
    { delay: 3000, direction: "down", amount: 400 },  // Wait 3s, then scroll
  ],

  // Optional: click buttons, modals, etc.
  clickActions: [
    { delay: 1000, selector: ".btn-export", description: "Export data" },
  ],

  // Optional: wait for content to load
  waitFor: ".data-loaded",
}
```

### Customizing Scripts

Edit any page's narration, timing, or interactions:

```typescript
{
  route: "/analytics",
  title: "Analytics - Your Custom Title",
  duration: 20,  // Increase from 14 to 20 seconds
  narration: "Your new narration here. Make it engaging and specific to your use case.",
  // ... rest of config
}
```

Then re-run the recorder and renderer.

## Video Export Options

### Standard MP4 (Recommended)
```bash
npx remotion render remotion-composer.tsx LogisphereWalkthrough output.mp4
```

### WebM (Web-optimized)
```bash
npx remotion render --codec=vp9 remotion-composer.tsx LogisphereWalkthrough output.webm
```

### ProRes (Broadcast quality)
```bash
npx remotion render --codec=prores remotion-composer.tsx LogisphereWalkthrough output.mov
```

### With Metadata
```bash
npx remotion render \
  --bundle-size=false \
  remotion-composer.tsx LogisphereWalkthrough output.mp4
```

## Troubleshooting

### "Cannot connect to browser"

```bash
# Make sure dev server is running
npm run dev

# Verify localhost:3000 is accessible
curl http://localhost:3000
```

### "Selector not found"

The recorder continues if optional selectors don't exist. This is intentional.

To fix:
1. Open your browser dev tools
2. Find the correct selector
3. Update `page-scripts.ts`

### Remotion render fails

```bash
# Test preview first
npx remotion preview remotion-composer.tsx LogisphereWalkthrough

# Check that all screenshots exist
ls scripts/video-walkthrough/screenshots/ | wc -l
```

### Slow recording

Disable GPU and use fewer parallel operations:

```typescript
// In puppeteer-recorder.ts
const browser = await puppeteer.launch({
  headless: "new",
  args: ["--disable-gpu"],
});
```

## Architecture

### 1. Page Scripts (`page-scripts.ts`)
- Define narration for each page
- Set scroll points and interactions
- Control timing and transitions

### 2. Puppeteer Recorder (`puppeteer-recorder.ts`)
- Automates browser navigation
- Performs scrolls and clicks
- Captures screenshots
- Generates metadata

### 3. Remotion Composer (`remotion-composer.tsx`)
- Combines screenshots into video
- Adds transitions and effects
- Integrates audio (optional)
- Exports final MP4

## Customization Examples

### Change Opening Animation

```typescript
// In remotion-composer.tsx OpeningSequence
const rotate = interpolate(frame, [0, 60], [0, 360], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

<div style={{ transform: `rotate(${rotate}deg)` }}>
  Logisphere
</div>
```

### Add Watermark

```typescript
<AbsoluteFill style={{ position: "relative" }}>
  <ScreenshotFrame imagePath={imagePath} />
  <div style={{
    position: "absolute",
    bottom: 20,
    right: 20,
    opacity: 0.5,
    fontSize: 16,
  }}>
    Your Company © 2026
  </div>
</AbsoluteFill>
```

### Adjust Transition Speed

```typescript
// Faster fade-in (15 frames = 0.5s)
const fadeInOpacity = interpolate(frame, [0, 5], [0, 1]); // Now 5 frames
```

## Performance Tips

1. **Use preview mode for testing:**
   ```bash
   npx remotion preview remotion-composer.tsx LogisphereWalkthrough
   ```

2. **Render with hardware acceleration:**
   ```bash
   npx remotion render --gl=angle remotion-composer.tsx ...
   ```

3. **For very large videos, render in segments:**
   ```bash
   npx remotion render --frame-range 0-500 ...
   npx remotion render --frame-range 500-1000 ...
   ```

4. **Use SSD for temp files (much faster)**

## Distribution

### YouTube
```bash
# Upload the MP4
# Add description with links to:
# - Documentation
# - Free trial signup
# - Demo environment
```

### Internal Wiki/Docs
```bash
# Embed in MDX
<video width="100%" controls>
  <source src="/logisphere-walkthrough.mp4" type="video/mp4" />
</video>
```

### Email Marketing
```bash
# Create thumbnail and link to YouTube
# or embedded video on landing page
```

## Next Steps

1. ✅ Install dependencies: `npm install puppeteer remotion`
2. ✅ Start dev server: `npm run dev`
3. ✅ Record: `npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts`
4. ✅ Review screenshots: Open `scripts/video-walkthrough/screenshots/`
5. ✅ (Optional) Add audio: `npx ts-node scripts/video-walkthrough/tts-generator.ts google`
6. ✅ Render: `npx remotion render scripts/video-walkthrough/remotion-composer.tsx LogisphereWalkthrough output.mp4`
7. ✅ Upload and share!

## Files Reference

```
scripts/video-walkthrough/
├── page-scripts.ts              ← Edit narration here
├── puppeteer-recorder.ts        ← Screenshot capture automation
├── remotion-composer.tsx        ← Video composition
├── tts-generator.ts             ← Audio narration (optional)
├── README.md                    ← Detailed docs
├── package.json                 ← Dependencies & scripts
├── screenshots/                 ← Generated screenshots (100+)
├── audio/                       ← Generated audio files (optional)
├── metadata.json                ← Frame timing metadata
└── audio-metadata.json          ← Audio timing metadata (optional)
```

## Support

For issues:
1. Check the troubleshooting section above
2. Review Remotion docs: https://www.remotion.dev/docs
3. Check Puppeteer docs: https://pptr.dev

---

**Happy video creation! 🎬**
