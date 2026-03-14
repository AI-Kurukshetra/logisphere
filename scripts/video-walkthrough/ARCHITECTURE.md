# 🎬 Video Walkthrough Architecture

Complete overview of the automated video generation pipeline.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Logisphere Video Generation                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PHASE 1: PLANNING & SCRIPTING                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐                                         │
│  │  page-scripts.ts    │  22 page scripts with:                  │
│  │  (planning layer)   │  - Route paths                          │
│  │                     │  - Professional narration                │
│  │  ├─ route           │  - Scroll sequences                      │
│  │  ├─ title           │  - Click actions                         │
│  │  ├─ narration       │  - Wait selectors                        │
│  │  ├─ scrollPoints    │  - Duration timing                       │
│  │  └─ clickActions    │                                         │
│  └─────────────────────┘                                         │
│                                                                   │
│  Example Page Script:                                            │
│  {                                                               │
│    route: "/dashboard",                                          │
│    title: "Dashboard - Command Center",                          │
│    duration: 12,                                                 │
│    narration: "Welcome to your command center...",               │
│    scrollPoints: [                                               │
│      { delay: 2000, direction: "down", amount: 400 }             │
│    ]                                                             │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 2: SCREENSHOT CAPTURE                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │      puppeteer-recorder.ts (automation layer)            │    │
│  │                                                           │    │
│  │  For each page script:                                   │    │
│  │  ┌────────────────┐                                      │    │
│  │  │ 1. Navigate    │────→ page.goto(url)                 │    │
│  │  └────────────────┘                                      │    │
│  │           ↓                                              │    │
│  │  ┌────────────────┐                                      │    │
│  │  │ 2. Load        │────→ waitForSelector(waitFor)       │    │
│  │  └────────────────┘                                      │    │
│  │           ↓                                              │    │
│  │  ┌────────────────┐                                      │    │
│  │  │ 3. Capture     │────→ page.screenshot()              │    │
│  │  └────────────────┘     📸 initial frame                │    │
│  │           ↓                                              │    │
│  │  ┌────────────────┐                                      │    │
│  │  │ 4. Scroll      │────→ page.evaluate(scrollBy)        │    │
│  │  └────────────────┘     (smooth 800ms)                  │    │
│  │           ↓                                              │    │
│  │  ┌────────────────┐                                      │    │
│  │  │ 5. Capture     │────→ page.screenshot()              │    │
│  │  └────────────────┘     📸 scroll frame                 │    │
│  │           ↓                                              │    │
│  │  ┌────────────────┐                                      │    │
│  │  │ 6. Repeat      │────→ for each scrollPoint            │    │
│  │  └────────────────┘                                      │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Browser Settings:                                               │
│  ├─ Headless mode                                                │
│  ├─ Viewport: 1280x720 @ 2x resolution                          │
│  ├─ No GPU (stability)                                           │
│  └─ 30-second navigation timeout                                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
         ┌─────────────────────────────────────────┐
         │ CAPTURED ARTIFACTS                      │
         │                                         │
         │ scripts/video-walkthrough/              │
         │ ├─ screenshots/                         │
         │ │  ├─ 00_000.png (Home initial)        │
         │ │  ├─ 00_001.png (Home scroll 1)       │
         │ │  ├─ 01_000.png (Features initial)    │
         │ │  └─ ... (100+ frames total)          │
         │ └─ metadata.json (timing data)         │
         │                                         │
         │ Frame count: ~100+                      │
         │ Total size: ~50-100 MB PNG              │
         │                                         │
         └─────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 3: AUDIO GENERATION (OPTIONAL)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │        tts-generator.ts (audio synthesis layer)          │    │
│  │                                                           │    │
│  │  For each page narration:                                │    │
│  │  ┌──────────────────────────────────────────────┐        │    │
│  │  │ Provider: Google TTS │ ElevenLabs │ AWS Polly│        │    │
│  │  └──────────────────────────────────────────────┘        │    │
│  │           ↓                                              │    │
│  │  ┌────────────────────────────────────────────┐          │    │
│  │  │ Text → Audio Synthesis                     │          │    │
│  │  │ "Welcome to your dashboard..."             │          │    │
│  │  │           ↓                                │          │    │
│  │  │ Output: MP3 (128kbps, 22kHz)               │          │    │
│  │  └────────────────────────────────────────────┘          │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Artifacts:                                                      │
│  ├─ audio/                                                       │
│  │  ├─ home-welcome.mp3                                         │
│  │  ├─ features-powerful-capabilities.mp3                       │
│  │  └─ ... (20+ audio files)                                   │
│  └─ audio-metadata.json                                         │
│                                                                   │
│  Total audio size: ~5-10 MB MP3                                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 4: VIDEO COMPOSITION                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │      remotion-composer.tsx (composition layer)           │    │
│  │                                                           │    │
│  │  Reads: metadata.json + screenshots + optional audio     │    │
│  │                                                           │    │
│  │  Component Structure:                                    │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │ <VideoComposition>                                 │  │    │
│  │  │  │                                                 │  │    │
│  │  │  ├─ <Sequence from={0} duration={150}>            │  │    │
│  │  │  │   <OpeningSequence />          (5s)            │  │    │
│  │  │  │   ├─ Logo animation                            │  │    │
│  │  │  │   ├─ Title fade-in                             │  │    │
│  │  │  │   └─ Subtitle                                  │  │    │
│  │  │  │                                                 │  │    │
│  │  │  ├─ <Sequence from={150} duration={360}>          │  │    │
│  │  │  │   <PageScreenshots>            (12s)           │  │    │
│  │  │  │   ├─ Screenshot 1 (fade-in)                    │  │    │
│  │  │  │   ├─ Audio (sync)                              │  │    │
│  │  │  │   ├─ Screenshot 2 (transition)                 │  │    │
│  │  │  │   └─ ...                                       │  │    │
│  │  │  │                                                 │  │    │
│  │  │  ├─ <Sequence from={...} duration={120}>          │  │    │
│  │  │  │   <ClosingSequence />          (4s)            │  │    │
│  │  │  │   ├─ CTA headline                              │  │    │
│  │  │  │   └─ Company website                           │  │    │
│  │  │  │                                                 │  │    │
│  │  │  └─ Total: 22 pages × ~12s + opening + closing    │  │    │
│  │  │           = ~270 seconds (4.5 minutes)            │  │    │
│  │  │                                                   │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  │                                                           │    │
│  │  Rendering Pipeline:                                    │    │
│  │  1. Remotion reads composition                          │    │
│  │  2. For each frame (0-8100 @ 30fps):                    │    │
│  │     ├─ Render React component                          │    │
│  │     ├─ Apply interpolations (opacity, scale)           │    │
│  │     ├─ Layer screenshot + audio                        │    │
│  │     └─ Encode to H.264 (or other codec)               │    │
│  │  3. Output MP4 file                                     │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Configuration:                                                  │
│  ├─ Resolution: 1280×720                                         │
│  ├─ FPS: 30                                                      │
│  ├─ Codec: H.264 (MP4) / VP9 (WebM) / ProRes (MOV)             │
│  ├─ Quality: CRF 18-20 (high quality)                           │
│  └─ Duration: 270+ seconds                                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
         ┌─────────────────────────────────────────┐
         │ FINAL OUTPUT                            │
         │                                         │
         │ logisphere-walkthrough.mp4              │
         │ (or .webm, .mov, etc.)                  │
         │                                         │
         │ Specs:                                  │
         │ ├─ Duration: 4.5 minutes                │
         │ ├─ Resolution: 1280×720                 │
         │ ├─ FPS: 30                              │
         │ ├─ File size: 30-100 MB                 │
         │ ├─ Codec: H.264 / VP9 / ProRes          │
         │ ├─ Audio: Optional (if TTS enabled)     │
         │ └─ Format: MP4 / WebM / MOV             │
         │                                         │
         │ Ready for:                              │
         │ ├─ YouTube upload                       │
         │ ├─ Website embedding                    │
         │ ├─ Email marketing                      │
         │ ├─ Sales presentations                  │
         │ └─ Internal documentation               │
         │                                         │
         └─────────────────────────────────────────┘
```

## Data Flow

```
User Input (Manual)
      ↓
page-scripts.ts (Define routes, narration, interactions)
      ↓
puppeteer-recorder.ts (Automated page visits)
      ↓
Browser automation (Navigate, scroll, click)
      ↓
Screenshot capture (1280×720, 2x resolution)
      ↓
screenshots/ + metadata.json
      ↓
[Optional] tts-generator.ts (Text-to-speech)
      ↓
[Optional] audio/ + audio-metadata.json
      ↓
remotion-composer.tsx (Video composition)
      ↓
Remotion render command
      ↓
Video encoding (H.264 / VP9 / ProRes)
      ↓
output.mp4 (Final video file)
```

## File Organization

```
scripts/video-walkthrough/
│
├── page-scripts.ts              (Planning layer - 22 page scripts)
│   ├─ Public pages (4)
│   ├─ Workspace pages (18)
│   └─ Outro/closing
│
├── puppeteer-recorder.ts        (Capture layer - automation)
│   ├─ Browser initialization
│   ├─ Page navigation
│   ├─ Screenshot capture
│   └─ Metadata generation
│
├── remotion-composer.tsx        (Composition layer - video creation)
│   ├─ Opening sequence
│   ├─ Page sequences
│   └─ Closing sequence
│
├── tts-generator.ts             (Audio layer - optional)
│   ├─ Google TTS integration
│   ├─ ElevenLabs integration
│   └─ AWS Polly integration
│
├── screenshots/                 (Generated - screenshots)
│   ├─ 00_000.png ... 00_010.png (Page 1: Home)
│   ├─ 01_000.png ... 01_015.png (Page 2: Features)
│   └─ ... (100+ files)
│
├── audio/                       (Generated - optional audio)
│   ├─ home-welcome.mp3
│   ├─ features-powerful.mp3
│   └─ ... (20+ files)
│
├── metadata.json                (Generated - frame timing)
├── audio-metadata.json          (Generated - audio timing)
│
├── package.json                 (Dependencies)
├── README.md                    (Detailed documentation)
├── COMMANDS.md                  (CLI reference)
└── ARCHITECTURE.md              (This file)
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Planning** | TypeScript | Define scripts with type safety |
| **Capture** | Puppeteer | Browser automation & screenshots |
| **Composition** | Remotion + React | Video creation & effects |
| **Audio** | Google TTS / ElevenLabs / AWS Polly | Text-to-speech |
| **Encoding** | FFmpeg (via Remotion) | Video codec & quality |
| **Runtime** | Node.js + ts-node | Execution environment |

## Performance Characteristics

### Screenshot Capture
- **Time per page:** 5-15 seconds
- **Total pages:** 22
- **Total capture time:** 2-5 minutes
- **Frames generated:** 100+
- **Disk usage:** 50-100 MB PNG

### Audio Generation (Optional)
- **Time per voice:** 1-3 minutes
- **Audio files:** 20+
- **Disk usage:** 5-10 MB MP3

### Video Rendering
- **Quality: Standard (CRF 20)** → 5-10 minutes
- **Quality: High (CRF 18)** → 10-15 minutes
- **Quality: Maximum (CRF 16)** → 15-25 minutes
- **Output file:** 30-100 MB MP4

**Total pipeline time (all phases):**
- Quick (test): 10 minutes
- Standard (quality): 20-25 minutes
- Professional (maximum): 35-45 minutes

## Customization Points

### 1. Script Level (`page-scripts.ts`)
- Route URLs
- Narration text
- Scroll timing/amounts
- Click actions
- Wait selectors

### 2. Automation Level (`puppeteer-recorder.ts`)
- Viewport dimensions
- Screenshot quality
- Scroll duration
- Navigation timeouts

### 3. Composition Level (`remotion-composer.tsx`)
- Opening/closing animations
- Fade transitions
- Text overlays
- Watermarks
- Color scheme

### 4. Rendering Level (CLI commands)
- Output codec (H.264, VP9, ProRes)
- Resolution (720p, 1080p, 4K)
- Quality (CRF value)
- FPS (24, 30, 60)
- Concurrency (parallel rendering)

## Quality Tiers

### Preview Quality
- CRF: 30
- Time: 2-3 minutes
- Size: 10-20 MB
- Use: Testing changes

### Standard Quality
- CRF: 22
- Time: 5-10 minutes
- Size: 30-50 MB
- Use: YouTube, web

### High Quality
- CRF: 18
- Time: 10-15 minutes
- Size: 50-80 MB
- Use: Professional, marketing

### Professional Quality
- Codec: ProRes 422
- Time: 15-25 minutes
- Size: 100-200 MB
- Use: Broadcast, download

## Failure Points & Recovery

| Layer | Failure | Recovery |
|-------|---------|----------|
| **Browser** | Can't connect to localhost | Start dev server: `npm run dev` |
| **Navigation** | Page timeout | Increase timeout in puppeteer-recorder.ts |
| **Screenshot** | Selector not found | Update waitFor in page-scripts.ts |
| **Audio** | API key invalid | Check credentials in tts-generator.ts |
| **Rendering** | Out of disk space | Clean output files, increase disk |
| **Rendering** | Out of memory | Reduce concurrency or split video |

## Future Enhancements

Potential improvements:

1. **Dynamic narration** - Generate scripts from page metadata
2. **Live data** - Capture real metrics and numbers from the app
3. **Multi-language** - Auto-translate narration to other languages
4. **Custom branding** - Parameterized logo, colors, fonts
5. **Interactive elements** - Add clickable chapter markers
6. **Analytics** - Track video engagement (if hosted)
7. **Automated uploads** - Direct to YouTube/Vimeo
8. **Accessibility** - Add subtitles/captions

---

**This architecture ensures:**
- ✅ Reproducibility (same input = same output)
- ✅ Maintainability (separate concerns per layer)
- ✅ Scalability (can add more pages without changes)
- ✅ Quality (professional output with minimal effort)
- ✅ Customizability (easy to adjust at any layer)
