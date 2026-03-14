# 🎬 Video Walkthrough Commands Reference

Quick reference for all video generation commands.

## Prerequisites

```bash
npm install puppeteer remotion
npm run dev  # Keep running in another terminal
```

## Core Pipeline

### 1. Record Screenshots
```bash
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts
```

**What it does:**
- Launches browser
- Navigates to each page
- Performs scrolls/interactions
- Captures screenshots
- Generates metadata.json

**Time:** ~2-5 minutes
**Output:** 100+ PNG files + metadata.json

### 2. (Optional) Generate Audio
```bash
# Google TTS (free)
npx ts-node scripts/video-walkthrough/tts-generator.ts google

# ElevenLabs (professional, requires API key)
npx ts-node scripts/video-walkthrough/tts-generator.ts elevenlabs sk_abc123def456

# AWS Polly (professional, requires AWS credentials)
npx ts-node scripts/video-walkthrough/tts-generator.ts aws
```

**What it does:**
- Converts page narration to audio
- Saves MP3 files
- Generates audio-metadata.json

**Time:** ~1-3 minutes
**Output:** 20+ MP3 files + audio-metadata.json

### 3. Render Video
```bash
npx remotion render scripts/video-walkthrough/remotion-composer.tsx LogisphereWalkthrough output.mp4
```

**What it does:**
- Combines screenshots
- Adds transitions
- (Optional) adds audio
- Encodes to video

**Time:** ~5-15 minutes (depends on resolution/codec)
**Output:** output.mp4 (30-100 MB)

---

## Individual Commands

### Preview Video (Before Full Render)
```bash
npx remotion preview scripts/video-walkthrough/remotion-composer.tsx LogisphereWalkthrough
```
Opens interactive preview in browser. Great for testing without full render.

### Render with Different Codecs

**MP4 (H.264) - Most compatible**
```bash
npx remotion render \
  --codec=h264 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output.mp4
```

**WebM (VP9) - Smaller file size**
```bash
npx remotion render \
  --codec=vp9 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output.webm
```

**ProRes (Professional)**
```bash
npx remotion render \
  --codec=prores \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output.mov
```

**ProRes 422 HQ (Broadcast quality)**
```bash
npx remotion render \
  --codec=prores-4444 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output.mov
```

### Render with Specific Quality

**High Quality (slower, larger file)**
```bash
npx remotion render \
  --crf=18 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-hq.mp4
```

**Fast Render (lower quality, smaller file)**
```bash
npx remotion render \
  --crf=28 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-fast.mp4
```

**Lowest Quality (testing only)**
```bash
npx remotion render \
  --crf=51 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-test.mp4
```

### Render Specific Segments

**First 500 frames (test render)**
```bash
npx remotion render \
  --frame-range 0-500 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-segment-1.mp4
```

**Frames 500-1000**
```bash
npx remotion render \
  --frame-range 500-1000 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-segment-2.mp4
```

### Render with Custom Resolution

**4K (3840x2160)**
```bash
npx remotion render \
  --width=3840 \
  --height=2160 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-4k.mp4
```

**1080p (1920x1080)**
```bash
npx remotion render \
  --width=1920 \
  --height=1080 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-1080p.mp4
```

**Small Web (640x360)**
```bash
npx remotion render \
  --width=640 \
  --height=360 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-small.mp4
```

### Render with Custom FPS

**24 FPS (cinematic)**
```bash
npx remotion render \
  --fps 24 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-24fps.mp4
```

**60 FPS (smooth)**
```bash
npx remotion render \
  --fps 60 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-60fps.mp4
```

### Render with Concurrency Control

**Single core (safe)**
```bash
npx remotion render \
  --concurrency=1 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output.mp4
```

**Max out cores (faster)**
```bash
npx remotion render \
  --concurrency=$(nproc) \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output.mp4
```

---

## Editing & Re-rendering

### After Changing Narration

1. Edit `scripts/video-walkthrough/page-scripts.ts`
2. Re-record: `npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts`
3. Re-render: `npx remotion render ...`

### After Changing Animations

1. Edit `scripts/video-walkthrough/remotion-composer.tsx`
2. Preview: `npx remotion preview ...`
3. Render: `npx remotion render ...`

### After Changing Scroll Points

1. Edit scrollPoints in `page-scripts.ts`
2. Re-record: `npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts`
3. Re-render: `npx remotion render ...`

---

## Cleanup & Management

### Remove All Generated Files
```bash
rm -rf scripts/video-walkthrough/screenshots
rm -rf scripts/video-walkthrough/audio
rm scripts/video-walkthrough/metadata.json
rm scripts/video-walkthrough/audio-metadata.json
```

### Remove Only Screenshots
```bash
rm -rf scripts/video-walkthrough/screenshots
```

### Remove Only Audio
```bash
rm -rf scripts/video-walkthrough/audio
rm scripts/video-walkthrough/audio-metadata.json
```

### Clean Videos (Keep sources)
```bash
rm output.mp4 output.webm output.mov
```

---

## Batch Operations

### Full Pipeline (Record + Render)
```bash
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts && \
npx remotion render scripts/video-walkthrough/remotion-composer.tsx LogisphereWalkthrough final.mp4
```

### Record + Audio + Render
```bash
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts && \
npx ts-node scripts/video-walkthrough/tts-generator.ts google && \
npx remotion render scripts/video-walkthrough/remotion-composer.tsx LogisphereWalkthrough final.mp4
```

### Render Multiple Formats
```bash
npx remotion render --codec=h264 ... output.mp4 && \
npx remotion render --codec=vp9 ... output.webm && \
npx remotion render --codec=prores ... output.mov
```

---

## Performance Settings

### For Fast Local Testing
```bash
npx remotion render \
  --crf=30 \
  --concurrency=1 \
  --frame-range 0-300 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-test.mp4
```

### For Production Quality
```bash
npx remotion render \
  --codec=h264 \
  --crf=18 \
  --concurrency=$(nproc) \
  --fps 30 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-final.mp4
```

### For YouTube Upload
```bash
npx remotion render \
  --codec=h264 \
  --crf=20 \
  --fps 30 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-youtube.mp4
```

---

## Troubleshooting Commands

### Check if dev server is running
```bash
curl http://localhost:3000
```

### Verify screenshots were created
```bash
ls -lh scripts/video-walkthrough/screenshots/ | head -20
wc -l scripts/video-walkthrough/screenshots/*
```

### Check metadata
```bash
cat scripts/video-walkthrough/metadata.json | head -50
```

### Verify audio files
```bash
ls -lh scripts/video-walkthrough/audio/
```

### Check Remotion version
```bash
npx remotion --version
```

### Check Puppeteer version
```bash
npm list puppeteer
```

---

## Common Workflows

### "I want to test quickly"
```bash
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts && \
npx remotion render \
  --frame-range 0-300 \
  --crf=30 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-test.mp4
```
**Time:** ~5 minutes

### "I want professional quality for YouTube"
```bash
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts && \
npx remotion render \
  --codec=h264 \
  --crf=18 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-youtube.mp4
```
**Time:** ~20 minutes

### "I want to include narration"
```bash
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts && \
npx ts-node scripts/video-walkthrough/tts-generator.ts google && \
npx remotion render \
  --codec=h264 \
  scripts/video-walkthrough/remotion-composer.tsx \
  LogisphereWalkthrough \
  output-with-audio.mp4
```
**Time:** ~15 minutes

### "I want multiple formats for different platforms"
```bash
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts

# YouTube (MP4, H.264)
npx remotion render --codec=h264 ... output-youtube.mp4

# Web (WebM, VP9, smaller)
npx remotion render --codec=vp9 ... output-web.webm

# Download (ProRes, highest quality)
npx remotion render --codec=prores ... output-hq.mov
```
**Time:** ~30 minutes

---

## Environment Variables

### Force GPU Acceleration
```bash
REMOTION_ENABLE_HEADLESS_MODE=1 npx remotion render ...
```

### Disable GPU (safer)
```bash
REMOTION_ENABLE_GPU=0 npx remotion render ...
```

### Set Thread Count
```bash
REMOTION_CONCURRENCY=4 npx remotion render ...
```

---

## Help & Documentation

```bash
# Puppeteer help
npx puppeteer --help

# Remotion help
npx remotion render --help

# Full Remotion docs
npx remotion docs
```

---

**Ready to create? Start with:**
```bash
npm run dev  # Terminal 1
npx ts-node scripts/video-walkthrough/puppeteer-recorder.ts  # Terminal 2
```
