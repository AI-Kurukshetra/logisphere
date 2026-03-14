# 🚀 Quick Start: Create Your First Video Walkthrough

Get a professional video walkthrough running in **5 minutes**!

## ⚡ TL;DR - 3 Commands

```bash
# 1. Install dependencies
npm install

# 2. Create the video (includes recording, narration, and merging)
npm run create:demo

# 3. Find your video
open recordings/logisphere-walkthrough-final.mp4
```

Done! ✨

---

## 📋 Requirements (2 minutes)

### 1. Check FFmpeg

```bash
ffmpeg -version
```

If not installed:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

### 2. Make sure Next.js runs

```bash
npm run dev
# Should start at http://localhost:3000
```

---

## 🎬 Create Your Video (3 minutes)

In a **separate terminal** (keep dev server running):

```bash
npm run create:demo
```

This will:
1. **Record** the video (~2 min) 🎥
2. **Generate narration** (~30 sec) 🎙️
3. **Merge video + audio** (~1 min) 🎬

**Total:** ~3-4 minutes

---

## 🎉 View Your Video

```bash
# macOS
open recordings/logisphere-walkthrough-final.mp4

# Linux
xdg-open recordings/logisphere-walkthrough-final.mp4

# Windows
start recordings/logisphere-walkthrough-final.mp4
```

---

## 🎙️ Optional: Add Professional Narration

For natural-sounding voice narration instead of silence:

1. Get API key from https://elevenlabs.io (free tier: 10k chars/month)

2. Add to your environment:
   ```bash
   export ELEVENLABS_API_KEY="sk_xxxxx"
   ```

3. Re-run:
   ```bash
   npm run generate:narration
   npm run merge:video
   ```

---

## 📁 Output Files

Your video is in:
```
recordings/
├── logisphere-walkthrough-final.mp4  ← YOUR VIDEO! 🎬
├── narration_final.mp3 (or silent)
└── timeline.json (timestamps)
```

---

## 🎯 Next Steps

### Share Your Video
- YouTube upload
- Embed in website
- Send to team/stakeholders
- Use in presentations

### Customize the Walkthrough
Edit `tests/walkthrough.spec.ts` to:
- Visit different pages
- Add custom interactions
- Change narration text
- Adjust timing

### Automate Regularly
```bash
# Run nightly to create updated demo
schedule: "0 2 * * *"  # 2 AM daily
npm run create:demo
```

---

## ❓ Troubleshooting

### "ffmpeg not found"
→ Install FFmpeg (see Requirements above)

### "test-results folder empty"
→ Make sure `npm run dev` is running in another terminal

### "No API key for narration"
→ Either add `ELEVENLABS_API_KEY` or use silent fallback (it's fine!)

### "Video is out of sync"
→ Run the scripts separately:
```bash
npm run record:walkthrough
npm run generate:narration
npm run merge:video
```

---

## 📚 More Details

For advanced customization, see the full guide:
→ **[PLAYWRIGHT_WALKTHROUGH.md](./PLAYWRIGHT_WALKTHROUGH.md)**

---

## 📊 What's Recorded?

By default, your video shows:
- ✅ Dashboard overview
- ✅ Analytics with charts
- ✅ Carrier scorecards
- ✅ Compliance monitoring
- ✅ Real-time tracking
- ✅ Alert configuration

**Total duration:** ~40 seconds of actual content

---

## 🎬 Specs

- **Resolution:** 1280x720 (HD)
- **Format:** MP4 (H.264)
- **Audio:** AAC 192kbps
- **Size:** ~10-20 MB

Perfect for:
- 📺 YouTube
- 💻 Website embedding
- 📧 Email sharing
- 📱 Mobile viewing

---

**That's it! You're a video producer now. 🎬🍿**

For questions, check [PLAYWRIGHT_WALKTHROUGH.md](./PLAYWRIGHT_WALKTHROUGH.md)
