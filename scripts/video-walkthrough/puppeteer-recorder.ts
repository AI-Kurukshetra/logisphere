/**
 * Puppeteer Screenshot Recorder
 * Automates browser navigation and screenshot capture for video walkthrough
 */

import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { pageScripts } from "./page-scripts";

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "scripts/video-walkthrough/screenshots"
);
const METADATA_FILE = path.join(
  process.cwd(),
  "scripts/video-walkthrough/metadata.json"
);

interface FrameMetadata {
  page: string;
  route: string;
  title: string;
  frameIndex: number;
  timestamp: number;
}

// Ensure screenshot directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Format frame number with leading zeros
 */
function formatFrameNumber(pageIndex: number, frameIndex: number): string {
  return `${String(pageIndex).padStart(2, "0")}_${String(frameIndex).padStart(
    3,
    "0"
  )}`;
}

/**
 * Main recording function
 */
async function recordPageWalkthrough() {
  console.log("🎬 Logisphere Video Walkthrough Recorder");
  console.log("========================================\n");

  ensureDir(SCREENSHOT_DIR);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });

  const metadata: FrameMetadata[] = [];
  let globalFrameIndex = 0;

  try {
    for (let pageIndex = 0; pageIndex < pageScripts.length; pageIndex++) {
      const script = pageScripts[pageIndex];
      console.log(`\n📄 [${pageIndex + 1}/${pageScripts.length}] ${script.title}`);
      console.log(`   Route: ${script.route}`);
      console.log(`   Duration: ${script.duration}s`);

      try {
        // Navigate to page
        const url = `http://localhost:3000${script.route}`;
        console.log(`   📍 Navigating to ${url}...`);
        try {
          await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        } catch (navError) {
          // Try with just domcontentloaded if networkidle fails
          console.log(`   ⚠️  Network timeout, retrying with domcontentloaded...`);
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        }

        // Wait for optional selector
        if (script.waitFor) {
          console.log(`   ⏳ Waiting for: ${script.waitFor}`);
          try {
            await page.waitForSelector(script.waitFor, { timeout: 5000 });
          } catch {
            console.log(`   ⚠️  Selector not found, continuing...`);
          }
        }

        // Execute click actions
        if (script.clickActions && script.clickActions.length > 0) {
          for (const action of script.clickActions) {
            await new Promise((resolve) => setTimeout(resolve, action.delay));
            try {
              await page.click(action.selector);
              console.log(`   ✅ Clicked: ${action.description}`);
            } catch {
              console.log(`   ⚠️  Click failed: ${action.description}`);
            }
          }
        }

        // Capture initial frame
        let frameIndex = 0;
        const frameName = formatFrameNumber(pageIndex, frameIndex);
        const framePath = path.join(SCREENSHOT_DIR, `${frameName}.png`);

        await page.screenshot({ path: framePath });
        console.log(`   📸 Frame ${frameIndex}: ${framePath}`);

        metadata.push({
          page: script.title,
          route: script.route,
          title: script.title,
          frameIndex: globalFrameIndex,
          timestamp: (globalFrameIndex / 30) * 1000, // 30 FPS
        });

        globalFrameIndex++;
        frameIndex++;

        // Execute scroll actions
        if (script.scrollPoints && script.scrollPoints.length > 0) {
          for (const scrollPoint of script.scrollPoints) {
            // Wait before scrolling
            await new Promise((resolve) =>
              setTimeout(resolve, scrollPoint.delay)
            );

            // Smooth scroll animation (0.8s, 50ms frames)
            const frames = Math.ceil(800 / 50);
            const perFrame = scrollPoint.amount / frames;

            for (let i = 0; i < frames; i++) {
              await page.evaluate((delta) => {
                window.scrollBy(0, delta);
              }, perFrame);

              // Capture intermediate frames at regular intervals
              if (i % 3 === 0 || i === frames - 1) {
                const frameName = formatFrameNumber(pageIndex, frameIndex);
                const framePath = path.join(SCREENSHOT_DIR, `${frameName}.png`);
                await page.screenshot({ path: framePath });

                metadata.push({
                  page: script.title,
                  route: script.route,
                  title: script.title,
                  frameIndex: globalFrameIndex,
                  timestamp: (globalFrameIndex / 30) * 1000,
                });

                globalFrameIndex++;
                frameIndex++;
              }

              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }
        }

        // Hold on final frame for remaining duration
        const capturedFrames = frameIndex;
        const targetFrames = Math.ceil((script.duration * 30) / 1000);
        const holdFrames = Math.max(targetFrames - capturedFrames, 10);

        const lastFrameName = formatFrameNumber(pageIndex, frameIndex - 1);
        const lastFramePath = path.join(SCREENSHOT_DIR, `${lastFrameName}.png`);

        for (let i = 0; i < holdFrames; i++) {
          // Duplicate last frame metadata
          metadata.push({
            page: script.title,
            route: script.route,
            title: script.title,
            frameIndex: globalFrameIndex,
            timestamp: (globalFrameIndex / 30) * 1000,
          });
          globalFrameIndex++;
        }

        console.log(`   ✅ Total frames: ${frameIndex}`);
      } catch (error) {
        console.error(`   ❌ Error recording page: ${error}`);
      }
    }

    // Save metadata
    const metadataOutput = {
      totalFrames: globalFrameIndex,
      fps: 30,
      estimatedDuration: Math.ceil(globalFrameIndex / 30),
      generatedAt: new Date().toISOString(),
      frames: metadata,
    };

    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadataOutput, null, 2));
    console.log(`\n✅ Metadata saved to ${METADATA_FILE}`);

    console.log("\n📊 Recording Summary");
    console.log("====================");
    console.log(`Total Frames: ${globalFrameIndex}`);
    console.log(`Duration: ${Math.ceil(globalFrameIndex / 30)} seconds`);
    console.log(`Output Directory: ${SCREENSHOT_DIR}`);
    console.log(`Metadata File: ${METADATA_FILE}`);
    console.log(
      `\nNext step: npx remotion render scripts/video-walkthrough/remotion-composer.tsx LogisphereWalkthrough output.mp4`
    );
  } finally {
    await browser.close();
  }
}

// Run recorder
recordPageWalkthrough().catch(console.error);
