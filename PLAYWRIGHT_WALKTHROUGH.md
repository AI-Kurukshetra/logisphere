# 🎬 Logisphere Playwright Video Walkthrough Guide

Complete guide to recording, narrating, and producing high-quality video walkthroughs of the Logisphere application using Playwright, TTS, and FFmpeg.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Recording Videos](#recording-videos)
- [Generating Narration](#generating-narration)
- [Merging Video & Audio](#merging-video--audio)
- [Automation](#automation)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Playwright Video Walkthrough system consists of three main components:

1. **Playwright Test Script** (`tests/walkthrough.spec.ts`)
   - Records 1280x720 video of your Next.js application
   - Performs realistic user interactions (navigation, scrolling, clicking)
   - Exports timeline with timestamps for narration

2. **TTS Narration Generator** (`scripts/generate-narration.ts`)
   - Generates voice-over audio using ElevenLabs API
   - Falls back to offline TTS for testing
   - Exports MP3 audio files with precise timing

3. **Video Merger** (`scripts/merge-video-audio.ts`)
   - Combines WebM/MP4 video with MP3 audio using FFmpeg
   - Optimizes for web delivery
   - Produces final production-ready MP4

### ✨ Features

- ✅ **1280x720 HD video recording** - Crystal clear presentations
- ✅ **Realistic interactions** - Navigate, scroll, wait with natural delays
- ✅ **Professional narration** - Natural-sounding voiceover (with API) or silent fallback
- ✅ **Precise timing** - Audio synced to video actions
- ✅ **Web-optimized** - Fast-start MP4 for streaming/embedding
- ✅ **Automated workflow** - Single command to create complete video

---

## 🛠️ Prerequisites

### Required Software

```bash
# Install Node.js 18+
node --version  # Should be v18.0.0 or higher

# Install FFmpeg (required for video encoding/merging)
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
# or download from https://ffmpeg.org/download.html
```

### Verify Installation

```bash
# Check FFmpeg
ffmpeg -version
ffprobe -version

# Check Node.js
node --version
npm --version
```

### API Key (Optional but Recommended)

For professional-quality narration, get an ElevenLabs API key:

1. Sign up at https://elevenlabs.io/
2. Go to API Key settings
3. Copy your API key
4. Set environment variable:

```bash
export ELEVENLABS_API_KEY="your_api_key_here"
```

---

## 📦 Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@playwright/test` - Browser automation
- `axios` - HTTP client for API calls
- `glob` - File pattern matching
- `dotenv` - Environment variables
- Development tools for TypeScript/FFmpeg

### 2. Configure Environment

```bash
# Copy example to .env.local
cp .env.example .env.local

# Edit .env.local and add your ElevenLabs API key (optional)
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

**Available Voice IDs** (ElevenLabs):
- `21m00Tcm4TlvDq8ikWAM` - Rachel (friendly, clear)
- `EXAVITQu4vr4xnSDxMaL` - Bella (warm, expressive)
- `pFZP5JQG7iQjIQuC4Iy3` - Antoni (deep, professional)
- See more at https://elevenlabs.io/docs/voices

### 3. Verify Application is Running

```bash
# Start Next.js development server
npm run dev

# Should be accessible at http://localhost:3000
```

---

## 🎥 Recording Videos

### Option 1: Full Automated Walkthrough

```bash
# Records comprehensive walkthrough with all key pages
npm run record:walkthrough
```

This runs the `walkthrough-dashboard` test which:
- Navigates through dashboard, analytics, scorecards, compliance, tracking, and settings
- Performs realistic scrolling and interactions
- Records at 1280x720 at ~30fps
- Generates `timeline.json` with narration timestamps
- Creates video in `test-results/` directory

**Duration:** ~2-3 minutes depending on page load times

### Option 2: Simple Dashboard Tour

```bash
# Quick demo of main pages
npx playwright test simple-dashboard-tour
```

### Option 3: Interactive Test Mode

```bash
# Watch tests run in real-time
npm run test:playwright:ui
```

### Option 4: Custom Recording

Edit `tests/walkthrough.spec.ts` to customize:
- Which pages to visit
- Interaction timing
- Narration text and timing
- Scroll distances

Example modification:

```typescript
// In tests/walkthrough.spec.ts
test("custom-walkthrough", async ({ page }) => {
  // Navigate to your pages
  await page.goto("/custom-page", { waitUntil: "networkidle" });

  // Perform interactions
  await page.click("button:has-text('Submit')");
  await page.waitForTimeout(2000); // 2 second pause

  // Scroll to show more content
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1500);
});
```

### 📁 Recording Output

Videos are saved to:
```
test-results/
├── [timestamp]-chromium/
│   └── video.webm  (raw recorded video)
└── playwright-report/
    └── index.html  (test report)
```

Also generates:
```
recordings/
└── timeline.json  (narration timestamps)
```

---

## 🎙️ Generating Narration

### Automatic (with ElevenLabs API)

```bash
# Requires ELEVENLABS_API_KEY environment variable
npm run generate:narration
```

This:
- Reads timeline from the recorded video
- Calls ElevenLabs API for each narration segment
- Generates individual MP3 files for each segment
- Concatenates into single `narration_final.mp3`
- Saves metadata to `narration-metadata.json`

**Cost:** ~$0.30 per video walkthrough (500K free characters/month)

### Offline Mode (Testing)

If no API key is set:

```bash
npm run generate:narration
```

Creates silent audio segments for testing (non-speech fallback).

**Perfect for:**
- Testing the video merge process
- Developing without API costs
- Batch processing multiple videos

### Output Files

```
recordings/
├── narration_00.mp3       (intro segment)
├── narration_01.mp3       (dashboard overview)
├── narration_02.mp3       (analytics)
├── ...
├── narration_final.mp3    (concatenated audio)
└── narration-metadata.json (timing & metadata)
```

### 🎵 Custom Narration

To use your own audio:

1. Record narration separately
2. Name it `narration_final.mp3`
3. Place in `recordings/` directory
4. Run merge script (see next section)

---

## 🎬 Merging Video & Audio

### Single Command

```bash
npm run merge:video
```

This:
1. Finds latest Playwright WebM video
2. Converts WebM → MP4 (if needed)
3. Merges with narration audio
4. Optimizes for web streaming
5. Outputs final `logisphere-walkthrough-final.mp4`

### Output Files

```
recordings/
├── logisphere-walkthrough.mp4        (merged, unoptimized)
└── logisphere-walkthrough-final.mp4  (optimized for web)
```

### Manual Control

If you need more control, use FFmpeg directly:

```bash
# Merge specific files
ffmpeg -i video.webm -i audio.mp3 -c:v libx264 -c:a aac output.mp4

# Optimize for web
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 22 -c:a aac -movflags +faststart output.mp4
```

---

## 🤖 Automation

### One-Command Complete Workflow

```bash
# Records, narrates, and merges everything
npm run create:demo
```

**This runs:**
1. `npm run record:walkthrough` - Records video (~2min)
2. `npm run generate:narration` - Generates audio (~30s with API)
3. `npm run merge:video` - Creates final video (~1min)

**Total Time:** ~3-4 minutes

### Scheduling/Batching

Create a shell script for batch processing:

```bash
#!/bin/bash
# scripts/batch-walkthroughs.sh

for test in tests/walkthrough.spec.ts tests/another-walkthrough.spec.ts; do
  echo "Processing $test..."
  npm run record:walkthrough
  npm run generate:narration
  npm run merge:video

  # Move output to dated folder
  mkdir -p "recordings/$(date +%Y-%m-%d)"
  mv recordings/*.mp4 "recordings/$(date +%Y-%m-%d)/"
done

echo "✅ All walkthroughs complete!"
```

Run with:
```bash
chmod +x scripts/batch-walkthroughs.sh
./scripts/batch-walkthroughs.sh
```

---

## 🎨 Customization

### Changing Recording Resolution

Edit `playwright.config.ts`:

```typescript
use: {
  video: {
    mode: "on",
    size: { width: 1920, height: 1080 }, // Change to 4K: 3840, 2160
  },
}
```

### Adjusting Narration Speed

Edit `scripts/generate-narration.ts`:

```typescript
const response = await axios.post(
  `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
  {
    text,
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.5,        // 0-1: Higher = more stable
      similarity_boost: 0.75, // 0-1: Higher = more like voice
    },
  },
  // ...
);
```

### Different Voice

Change voice ID in `.env.local`:

```bash
ELEVENLABS_VOICE_ID=pFZP5JQG7iQjIQuC4Iy3  # Use Antoni instead of Rachel
```

### Video Codec Options

Edit `scripts/merge-video-audio.ts` for different quality:

```typescript
// High quality (larger file)
`ffmpeg -i "${videoFile}" -c:v libx264 -preset slow -crf 18 ...`

// Medium quality (balanced)
`ffmpeg -i "${videoFile}" -c:v libx264 -preset medium -crf 23 ...`

// Low quality (smallest file)
`ffmpeg -i "${videoFile}" -c:v libx264 -preset fast -crf 28 ...`
```

CRF (Constant Rate Factor):
- 18-28: Recommended
- Lower = better quality (larger file)
- Higher = smaller file (lower quality)

---

## 🔧 Troubleshooting

### FFmpeg Not Found

**Error:** `ffmpeg: command not found`

**Solution:**
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
# Add to PATH environment variable
```

### Video Not Recording

**Error:** `WebM file not found`

**Causes & Solutions:**
1. Next.js server not running
   ```bash
   npm run dev  # Start server in another terminal
   ```

2. Playwright timeout
   - Increase timeout in `playwright.config.ts`
   - Check network speed

3. Recording disabled
   - Verify `video: "on"` in config
   - Check disk space (videos are large)

### Audio/Video Out of Sync

**Solutions:**
1. Check audio duration matches video duration
   ```bash
   ffprobe -v error -show_entries format=duration recordings/*.mp3
   ffprobe -v error -show_entries format=duration recordings/*.webm
   ```

2. Use silence padding if audio is shorter:
   ```bash
   ffmpeg -i input.mp3 -af "aformat=sample_rates=48000:channel_layouts=stereo" output.mp3
   ```

### ElevenLabs API Errors

**Error:** `401 Unauthorized`
- Check API key is correct
- Verify key has access to API
- Ensure not rate limited (max 10 requests/min free)

**Error:** `429 Too Many Requests`
- Add delays between API calls
- Use batch processing with delays
- Consider upgrading account

### File Permission Errors

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Make scripts executable
chmod +x scripts/*.ts

# Or run with npx
npx ts-node scripts/generate-narration.ts
```

### Out of Disk Space

**Clean up old recordings:**
```bash
# Remove test artifacts
rm -rf test-results/
rm -rf recordings/narration_*.mp3

# Keep only final videos
```

---

## 📊 Performance Tips

### Faster Recording
```bash
# Skip waiting for network idle (faster but may miss dynamic content)
await page.goto("/", { waitUntil: "domcontentloaded" });

# Reduce timeline durations
// In tests/walkthrough.spec.ts
await page.waitForTimeout(500); // Instead of 2000
```

### Smaller File Sizes
```bash
# Use lower bitrate audio
ffmpeg -i input.mp3 -b:a 64k output.mp3

# Use VP9 codec (better compression, slower)
ffmpeg -i input.webm -c:v libvpx-vp9 -crf 30 output.webm
```

### Faster Merging
```bash
# Copy streams without re-encoding (fast but limited compatibility)
ffmpeg -i video.webm -i audio.mp3 -c copy output.mp4

# Note: This may fail if formats are incompatible
```

---

## 📚 Reference

### Useful FFmpeg Commands

```bash
# Trim video
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:30 output.mp4

# Resize video
ffmpeg -i input.mp4 -s 1280x720 output.mp4

# Add watermark
ffmpeg -i input.mp4 -i watermark.png -filter_complex "[0:v][1:v]overlay=10:10" output.mp4

# Create GIF
ffmpeg -i input.mp4 -vf "fps=10,scale=320:-1:flags=lanczos" output.gif

# Extract audio
ffmpeg -i input.mp4 -q:a 0 -map a output.mp3

# Combine multiple videos
ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4
```

### Playwright Tips

```typescript
// Wait for specific element
await page.waitForSelector(".analytics-chart");

// Take screenshot
await page.screenshot({ path: "screenshot.png" });

// Get performance metrics
const perf = await page.evaluate(() => JSON.stringify(window.performance));

// Slow down interactions (helpful for video)
await page.click(selector, { delay: 500 });
```

---

## 🎉 Success!

You've created a professional video walkthrough! Next steps:

- 📤 Upload to YouTube/Vimeo
- 💻 Embed on website
- 📧 Send to stakeholders
- 🔄 Update quarterly with new features
- 🤖 Automate with CI/CD pipeline

---

## 📞 Support

For issues or questions:
1. Check Troubleshooting section above
2. Review Playwright docs: https://playwright.dev
3. Check ElevenLabs docs: https://elevenlabs.io/docs
4. FFmpeg help: `ffmpeg -h full`

---

## 📝 License

This guide is part of the Logisphere project.

---

**Happy recording! 🎬✨**
