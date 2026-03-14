# 📺 Complete Video Production Guide

End-to-end guide for creating professional video walkthroughs with Playwright, TTS narration, and FFmpeg.

---

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Video Production Pipeline          │
└─────────────────────────────────────────────────────┘

Step 1: RECORD                Step 2: NARRATE            Step 3: MERGE
┌──────────────────┐        ┌──────────────────┐      ┌──────────────────┐
│ Playwright Test  │───────→│ Timeline JSON    │────→ │ TTS Generation   │
│                  │        │ with Narrations  │      │                  │
│ - Navigate pages │        └──────────────────┘      │ ElevenLabs API / │
│ - Scroll content │                                   │ Offline TTS      │
│ - Click buttons  │                                   │                  │
│ - Record video   │                                   │ Output: MP3      │
│ Output: WebM     │                                   └──────────────────┘
└──────────────────┘                                            │
         ↓                                                       ↓
    test-results/                                         recordings/
    └── video.webm                                        └── narration_final.mp3

                                    Step 4: FINALIZE
                              ┌──────────────────┐
                              │ FFmpeg Merge     │
                              │ - Convert WebM   │
                              │ - Merge audio    │
                              │ - Optimize MP4   │
                              │ Output: MP4      │
                              └──────────────────┘
                                     ↓
                              recordings/
                              └── logisphere-walkthrough-final.mp4

```

---

## 🏁 Getting Started

### Minimum Setup (< 10 minutes)

```bash
# 1. Clone and navigate to project
cd /path/to/logisphere

# 2. Install dependencies
npm install

# 3. Install FFmpeg (one-time)
brew install ffmpeg  # macOS
# OR: sudo apt-get install ffmpeg  # Ubuntu

# 4. Start dev server
npm run dev

# 5. In another terminal, create video
npm run create:demo

# 6. View your video
open recordings/logisphere-walkthrough-final.mp4
```

**That's it!** You now have a professional video walkthrough. 🎉

---

## 📁 Project Structure

```
logisphere/
├── playwright.config.ts              # ← Video recording config
├── tests/
│   └── walkthrough.spec.ts           # ← Playwright test script
├── scripts/
│   ├── generate-narration.ts         # ← TTS narration generator
│   ├── merge-video-audio.ts          # ← FFmpeg merger
│   └── setup-recording-env.sh        # ← Environment setup helper
├── recordings/                        # ← Output directory
│   ├── timeline.json                 # ← Narration timestamps
│   ├── narration_00.mp3 → N          # ← Individual audio segments
│   ├── narration_final.mp3           # ← Concatenated audio
│   ├── logisphere-walkthrough.mp4    # ← Merged (unoptimized)
│   └── logisphere-walkthrough-final.mp4  # ← Final product ✨
├── test-results/                     # ← Playwright output
│   └── [date]-chromium/
│       └── video.webm                # ← Raw screen recording
├── PLAYWRIGHT_QUICKSTART.md          # ← 5-minute guide
├── PLAYWRIGHT_WALKTHROUGH.md         # ← Complete reference
└── package.json                      # ← Scripts and deps

```

---

## 🔧 Configuration Reference

### Playwright Configuration
**File:** `playwright.config.ts`

Key settings:
```typescript
// Video resolution and format
video: {
  mode: "on",           // "on" | "off" | "retain-on-failure"
  size: { width: 1280, height: 720 }  // HD resolution
}

// Browser type
projects: [
  {
    name: "chromium",
    use: { video: "on" }  // Chrome browser
  }
]

// Server
webServer: {
  command: "npm run dev",
  url: "http://localhost:3000",
  reuseExistingServer: true
}
```

**Customize:** Edit `playwright.config.ts` to change:
- Resolution: `size: { width: 1920, height: 1080 }` for 4K
- Browser: Add Firefox/Safari projects
- Timeout: Increase for slow networks

### Walkthrough Test Script
**File:** `tests/walkthrough.spec.ts`

Key elements:
```typescript
// Timeline with narration
const timeline: TimelineEntry[] = [
  {
    timestamp: 0,                    // When to start narration
    action: "load_dashboard",        // Action name
    narration: "Welcome to...",      // What to say
    duration: 4                      // How long to speak
  },
  // ... more entries
];

// Test implementation
test("walkthrough-dashboard", async ({ page }) => {
  // Navigate
  await page.goto("/");

  // Wait for content
  await page.waitForTimeout(2000);

  // Interact
  await page.click("button");
  await page.evaluate(() => window.scrollBy(0, 300));
});
```

**Customize:** Edit `tests/walkthrough.spec.ts` to:
- Change narration text (in timeline array)
- Add/remove pages visited
- Adjust interaction timing (waitForTimeout values)
- Add clicks, form fills, etc.

### Narration Generator
**File:** `scripts/generate-narration.ts`

Configuration:
```typescript
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";  // Rachel
```

Available voices:
- `21m00Tcm4TlvDq8ikWAM` - Rachel (default)
- `EXAVITQu4vr4xnSDxMaL` - Bella
- `pFZP5JQG7iQjIQuC4Iy3` - Antoni
- See full list: https://elevenlabs.io/docs/voices

**Customize:**
- Change `ELEVENLABS_VOICE_ID` for different voice
- Set `ELEVENLABS_API_KEY` for professional narration
- Leave blank for silent fallback (testing)

### Video Merger
**File:** `scripts/merge-video-audio.ts`

Quality settings:
```typescript
// H.264 codec quality (lower = better, larger)
'-crf', '23'      // 23 = recommended balance
// 18 = high quality
// 28 = small file size
// 0 = lossless (huge file)

// Audio quality
'-b:a', '192k'    // 192 kbps audio
// 128k = compressed
// 256k = high quality
```

---

## 🚀 Complete Workflow Examples

### Example 1: Quick Demo (No API Key)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Create video (silent narration)
npm run create:demo

# Result: Silent video in recordings/
```

**Time:** ~4 minutes
**Cost:** Free (but silent)

### Example 2: Professional Narration

```bash
# 1. Get API key from https://elevenlabs.io
# 2. Set environment variable
export ELEVENLABS_API_KEY="sk_xxxxx"

# Terminal 1: Dev server
npm run dev

# Terminal 2: Create video with narration
npm run create:demo

# Result: Professional voiced video
```

**Time:** ~4 minutes
**Cost:** ~$0.30 per video

### Example 3: Separate Steps (Debugging)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Individual steps
npm run record:walkthrough     # Just record video
npm run generate:narration     # Just generate audio
npm run merge:video            # Just merge files

# Check intermediate files if something fails
ls -lh recordings/
ls -lh test-results/
```

### Example 4: Custom Narration

```bash
# 1. Record video only
npm run record:walkthrough

# 2. Create custom narration manually (e.g., in Audacity)
# Export as: recordings/custom-narration.mp3

# 3. Rename to expected file
mv recordings/custom-narration.mp3 recordings/narration_final.mp3

# 4. Merge
npm run merge:video
```

---

## 📊 Quality & Performance

### Video Quality

| Preset | File Size | Quality | Use Case |
|--------|-----------|---------|----------|
| `-crf 18` | ~50 MB | Excellent | Archive, broadcast |
| `-crf 23` | ~20 MB | Good | Web, YouTube |
| `-crf 28` | ~8 MB | Fair | Mobile, email |

### Recording Performance

| Resolution | FPS | CPU | Disk | Duration |
|-----------|-----|-----|------|----------|
| 1280x720 | 30 | 40% | 10-20 MB | ~40 sec |
| 1920x1080 | 30 | 60% | 30-40 MB | ~40 sec |
| 3840x2160 | 24 | 90% | 100+ MB | ~40 sec |

### API Costs (ElevenLabs)

| Plan | Characters/Month | Price | Requests/Min |
|------|------------------|-------|--------------|
| Free | 10,000 | Free | 10 |
| Starter | 50,000 | $11 | 10 |
| Pro | 500,000 | $88 | 50 |

Typical walkthrough: ~2,000 characters = $0.30 per video

---

## 🎨 Customization Examples

### Change Recording Resolution

```typescript
// In playwright.config.ts
video: {
  mode: "on",
  size: { width: 1920, height: 1080 }  // 1080p instead of 720p
}
```

### Change Voice

```bash
# In .env.local
export ELEVENLABS_VOICE_ID="EXAVITQu4vr4xnSDxMaL"  # Bella instead of Rachel
```

### Add Custom Narration Points

```typescript
// In tests/walkthrough.spec.ts
const timeline = [
  {
    timestamp: 0,
    action: "intro",
    narration: "Welcome to our new feature...",
    duration: 3
  },
  {
    timestamp: 3,
    action: "demo",
    narration: "Here's how to use it...",
    duration: 5
  }
];
```

### Improve Video Quality

```bash
# In scripts/merge-video-audio.ts
# Change from:
'-crf', '23'  // Default

# To:
'-crf', '18'  // Better quality (larger file)
```

### Optimize for Mobile

```bash
# Create smaller version for mobile
ffmpeg -i logisphere-walkthrough-final.mp4 \
  -s 640x360 \
  -c:v libx264 -preset fast -crf 28 \
  -c:a aac -b:a 96k \
  logisphere-walkthrough-mobile.mp4
```

---

## 🔍 Troubleshooting Decision Tree

```
❌ Video not created?
├─ Is npm run dev running? → Start dev server
├─ Is ffmpeg installed? → Run: brew install ffmpeg
├─ Disk space? → Clean test-results/
└─ Check logs in test-results/

❌ No audio in final video?
├─ Generate narration step skipped? → Run: npm run generate:narration
├─ narration_final.mp3 missing? → Check recordings/
├─ API key invalid? → Verify ELEVENLABS_API_KEY
└─ Audio offline fallback created silence (OK)

❌ Audio/video out of sync?
├─ Check durations: ffprobe recordings/*.mp3 recordings/*.webm
├─ Video longer? → FFmpeg adds silence padding
├─ Audio longer? → Edit timeline narration shorter
└─ Manual fix: ffmpeg -i slow.mp3 -filter:a "atempo=1.1" faster.mp3

❌ File too large?
├─ Lower CRF value (higher = smaller)
├─ Reduce resolution: -s 1280x720
├─ Lower audio bitrate: -b:a 128k
└─ Create mobile version (see examples above)
```

---

## 📚 Command Reference

### Quick Commands

```bash
# Setup
npm install                          # Install dependencies
scripts/setup-recording-env.sh      # Check environment

# Recording
npm run record:walkthrough          # Record video only
npm run test:playwright             # Run all tests
npm run test:playwright:ui          # Interactive mode

# Audio
npm run generate:narration           # Generate TTS audio
npm run generate:narration           # Use offline fallback

# Merging
npm run merge:video                 # Merge video + audio
npm run create:demo                 # Do all 3 steps

# View
open recordings/logisphere-walkthrough-final.mp4
```

### FFmpeg Direct Commands

```bash
# Convert WebM to MP4
ffmpeg -i input.webm output.mp4

# Merge video + audio
ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac output.mp4

# Extract audio
ffmpeg -i video.mp4 -q:a 0 -map a audio.mp3

# Trim video
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:01:00 output.mp4

# Resize video
ffmpeg -i input.mp4 -s 1280x720 output.mp4

# Check duration
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_sections=1 file.mp4
```

---

## 🚨 Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `ffmpeg: command not found` | FFmpeg not installed | `brew install ffmpeg` |
| `ENOENT: no such file or directory, open 'test-results/video.webm'` | Dev server not running | `npm run dev` (in another terminal) |
| `401 Unauthorized` (ElevenLabs) | Invalid API key | Check `ELEVENLABS_API_KEY` value |
| `429 Too Many Requests` | Rate limit exceeded | Wait 1 hour or upgrade plan |
| `video.webm not found` | Recording timeout | Increase timeout in config |
| `Audio/video out of sync` | Duration mismatch | Re-record or re-generate audio |

---

## 💾 File Formats

### Input Formats
- **Video:** WebM (VP9), MP4 (H.264), etc.
- **Audio:** MP3, AAC, WAV

### Output Formats
- **Primary:** MP4 (H.264 video + AAC audio)
- **Web optimized:** MP4 with `movflags +faststart`
- **Streaming:** MP4 with keyframes every 2 seconds

### Codec Details

```
Video Codec: libx264 (H.264)
├─ Preset: medium (balance speed/quality)
├─ CRF: 23 (quality 0-51, lower=better)
└─ Profile: main (broad compatibility)

Audio Codec: aac
├─ Bitrate: 192 kbps
├─ Sample rate: 48 kHz
└─ Channels: Stereo
```

---

## 📋 Checklist: Production-Ready Video

- [ ] Dev server running (`npm run dev`)
- [ ] Dependencies installed (`npm install`)
- [ ] FFmpeg installed (`ffmpeg -version`)
- [ ] Video recorded (`npm run record:walkthrough`)
- [ ] Timeline generated (`recordings/timeline.json` exists)
- [ ] Narration created (`npm run generate:narration`)
- [ ] Audio file exists (`recordings/narration_final.mp3`)
- [ ] Video merged (`npm run merge:video`)
- [ ] Final video created (`recordings/logisphere-walkthrough-final.mp4`)
- [ ] Video plays correctly (open and preview)
- [ ] Audio synced with video (watch full video)
- [ ] File size acceptable (< 50 MB for sharing)
- [ ] Ready to deploy or share!

---

## 🎓 Learning Resources

### Playwright
- https://playwright.dev/
- https://playwright.dev/docs/test-configuration
- https://playwright.dev/docs/emulation#record-video

### FFmpeg
- https://ffmpeg.org/documentation.html
- https://trac.ffmpeg.org/wiki/Encoding/H.264
- https://trac.ffmpeg.org/wiki/Concatenate

### ElevenLabs
- https://elevenlabs.io/docs
- https://elevenlabs.io/docs/voices
- https://elevenlabs.io/docs/api-reference

### Video Production
- https://www.youtube.com/watch?v=dQw4w9WgXcQ (FFmpeg basics)
- https://obsproject.com/ (Alternative recording tool)
- https://www.shotcut.org/ (Video editing)

---

## 📞 Getting Help

**Quick issues:**
→ Check [PLAYWRIGHT_QUICKSTART.md](./PLAYWRIGHT_QUICKSTART.md)

**Detailed reference:**
→ See [PLAYWRIGHT_WALKTHROUGH.md](./PLAYWRIGHT_WALKTHROUGH.md)

**Specific questions:**
1. Search issue tracking platform
2. Check FFmpeg docs: https://ffmpeg.org
3. Check Playwright docs: https://playwright.dev

---

**Happy video creating! 🎬✨**
