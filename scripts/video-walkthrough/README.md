# Logisphere Automated Video Walkthrough

Generate a professional video walkthrough of your Logisphere platform automatically.

## Overview

This system uses three main components to create a complete video walkthrough:

1. **Page Scripts** (`page-scripts.ts`) - Professional narration and interaction sequences for each page
2. **Puppeteer Recorder** (`puppeteer-recorder.ts`) - Automates browser navigation and screenshot capture
3. **Remotion Composer** (`remotion-composer.tsx`) - Combines screenshots into a professional video with transitions

## Features

✅ **Automated Page Navigation** - Visits every key page in your app
✅ **Smart Scrolling** - Smooth scrolls reveal content progressively
✅ **Professional Narration** - Engaging scripts written for each page
✅ **TTS Integration** - Can add text-to-speech audio (optional)
✅ **Video Composition** - Remotion creates polished final video
✅ **Customizable** - Edit scripts and interactions easily

## Prerequisites

```bash
# Install Puppeteer (web automation)
npm install puppeteer

# Install Remotion (video composition)
npm install remotion

# Optional: Install text-to-speech
npm install google-tts-api  # or elevenlabs-js
```

## Quick Start

### 1. Start Your Dev Server

```bash
npm run dev
# Runs on http://localhost:3000
```

### 2. Record Screenshots

```bash
# From project root
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts
```

This will:
- Launch a headless browser
- Navigate to each page in `pageScripts`
- Perform scrolls and interactions
- Capture high-quality screenshots (1280x720 @ 2x resolution)
- Save screenshots to `scripts/video-walkthrough/screenshots/`
- Generate `scripts/video-walkthrough/metadata.json`

**Output:**
```
scripts/video-walkthrough/
├── screenshots/
│   ├── 00_000.png
│   ├── 00_001.png
│   └── ... (hundreds of frames)
└── metadata.json
```

### 3. Generate Video with Remotion

```bash
npm run remotion-render
```

Or manually:

```bash
npx remotion render scripts/video-walkthrough/remotion-composer.tsx LogisphereWalkthrough output.mp4
```

**Output:**
```
logisphere-walkthrough.mp4 (exported video file)
```

## Configuration

### Customizing Page Scripts

Edit `page-scripts.ts`:

```typescript
{
  route: "/dashboard",
  title: "Dashboard - Command Center",
  duration: 12,  // seconds
  narration: "Your engaging script here...",
  scrollPoints: [
    { delay: 2000, direction: "down", amount: 400 },
    { delay: 3000, direction: "down", amount: 400 },
  ],
  clickActions: [
    { delay: 1000, selector: ".btn-primary", description: "Click primary button" },
  ],
  waitFor: ".data-loaded", // CSS selector to wait for
}
```

### Adding Text-to-Speech

To add audio narration:

```bash
npm install google-tts-api
```

Then create `tts-generator.ts`:

```typescript
import gtts from "google-tts-api";
import fs from "fs";
import path from "path";
import { pageScripts } from "./page-scripts";

async function generateAudio() {
  for (const script of pageScripts) {
    const audioPath = path.join(
      process.cwd(),
      `scripts/video-walkthrough/audio/${script.title.slugify()}.mp3`
    );

    const url = gtts.getAudioUrl(script.narration, {
      lang: "en",
      slow: false,
      host: "https://translate.google.com",
    });

    // Download to file...
  }
}
```

Then integrate into `remotion-composer.tsx`:

```typescript
import { Audio } from "remotion";

<Sequence from={0} durationInFrames={360}>
  <Audio src={audioPath} />
  <ScreenshotFrame imagePath={frame.imagePath} />
</Sequence>
```

### Viewport Settings

Default: 1280x720 (16:9) @ 2x resolution for sharpness

To change in `puppeteer-recorder.ts`:

```typescript
await page.setViewport({
  width: 1920,  // Change width
  height: 1080, // Change height
  deviceScaleFactor: 2,
});
```

## Page Scripts Overview

The video covers these pages:

**Public Pages (4):**
- `/` - Home & introduction
- `/features` - Feature showcase
- `/pricing` - Pricing plans
- `/about` - Company mission

**Workspace Pages (18):**
- `/dashboard` - Command center
- `/analytics` - Data intelligence
- `/spend-analysis` - Predictive forecasting
- `/tracking` - Real-time visibility
- `/carriers` - Network management
- `/rates` - Pricing management
- `/invoices` - Billing management
- `/payments` - Financial control
- `/exceptions` - Issue management
- `/compliance` - Regulatory monitoring
- `/scorecards` - Performance metrics
- `/intelligence` - Advanced planning
- `/documents` - Digital records
- `/settings/alerts` - Alert rules
- `/settings/organization` - Organization management
- `/settings/access` - User management

**Total Duration:** ~240 seconds (~4 minutes)

## Troubleshooting

### Puppeteer fails to connect

```bash
# Ensure dev server is running
npm run dev

# Check port 3000 is accessible
curl http://localhost:3000
```

### Selector not found warnings

The recorder will continue even if optional selectors aren't found. This is intentional for robustness.

To fix: Update the selector in `page-scripts.ts`:

```typescript
waitFor: ".new-selector-name"
```

### Screenshots look wrong

1. Check viewport: Is your app responsive at 1280x720?
2. Check animations: Some CSS animations might not be captured
3. Adjust delays: Increase `delay` values in `scrollPoints` if content isn't ready

### Remotion render fails

Ensure all screenshot paths in `metadata.json` are correct:

```bash
# Verify files exist
ls -la scripts/video-walkthrough/screenshots/ | head
```

## Advanced: Parallel Recording

To speed up recording, modify `puppeteer-recorder.ts`:

```typescript
// Record multiple pages in parallel
const recordPromises = pageScripts.slice(0, 5).map((script, i) => {
  const page = await browser.newPage();
  return recordPageWalkthrough(page, i, pageScripts.length);
});

const results = await Promise.all(recordPromises);
```

## Video Output Options

### MP4 (H.264)
```bash
npx remotion render remotion-composer.tsx LogisphereWalkthrough output.mp4
```

### WebM (VP9)
```bash
npx remotion render \
  --codec=vp9 \
  remotion-composer.tsx LogisphereWalkthrough output.webm
```

### ProRes (broadcast quality)
```bash
npx remotion render \
  --codec=prores \
  remotion-composer.tsx LogisphereWalkthrough output.mov
```

### With Audio
```bash
npx remotion render \
  --audio-bitrate=192k \
  remotion-composer.tsx LogisphereWalkthrough output.mp4
```

## Customization Examples

### Change Opening Animation

Edit `OpeningSequence` in `remotion-composer.tsx`:

```typescript
<div
  style={{
    fontSize: 64,
    fontWeight: "bold",
    opacity,
    transform: `scale(${scale}) rotateY(${rotate}deg)`, // Add 3D effect
    marginBottom: 20,
  }}
>
```

### Add Subtitles

```typescript
<Sequence from={frameStart} durationInFrames={frameDuration}>
  <ScreenshotFrame imagePath={imagePath} />
  <Subtitle text={frame.narration} />
</Sequence>
```

### Add Watermark

```typescript
<AbsoluteFill>
  <ScreenshotFrame imagePath={imagePath} />
  <Watermark src="logo.png" />
</AbsoluteFill>
```

## Performance Tips

1. **Use 2-pass encoding for faster preview:**
   ```bash
   npx remotion preview remotion-composer.tsx LogisphereWalkthrough
   ```

2. **Render in segments if video is large:**
   ```bash
   npx remotion render --frame-range 0-1000 ...
   npx remotion render --frame-range 1000-2000 ...
   ```

3. **Use GPU acceleration:**
   ```bash
   npx remotion render --gl=angle remotion-composer.tsx ...
   ```

## Next Steps

1. ✅ Run the recorder
2. ✅ Review generated screenshots
3. ✅ Customize scripts if needed
4. ✅ Add TTS audio (optional)
5. ✅ Render final video
6. ✅ Upload to YouTube/Vimeo/internal wiki

## License

This video generation tooling is proprietary to Logisphere.
