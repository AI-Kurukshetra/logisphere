/**
 * Puppeteer Script Recorder
 * Captures screenshots and interactions from pages for video composition
 * Usage: npx ts-node puppeteer-recorder.ts
 */

import puppeteer, { Browser, Page } from "puppeteer";
import path from "path";
import fs from "fs";
import { pageScripts } from "./page-scripts";

interface FrameData {
  timestamp: number;
  imagePath: string;
  narration?: string;
  duration: number;
}

const LOCALHOST = "http://localhost:3000";
const SCREENSHOTS_DIR = path.join(process.cwd(), "scripts/video-walkthrough/screenshots");
const METADATA_FILE = path.join(process.cwd(), "scripts/video-walkthrough/metadata.json");

// Ensure directories exist
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Initialize Puppeteer browser
 */
async function initBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-web-security",
    ],
  });
}

/**
 * Navigate to page and wait for content to load
 */
async function navigateToPage(page: Page, route: string, waitFor?: string): Promise<void> {
  const url = `${LOCALHOST}${route}`;
  console.log(`\n📍 Navigating to: ${url}`);

  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for specific element if provided
    if (waitFor) {
      console.log(`⏳ Waiting for selector: ${waitFor}`);
      await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {
        console.warn(`⚠️  Selector not found: ${waitFor}, continuing anyway`);
      });
    }

    // Give page time to settle animations
    await page.waitForTimeout(1000);
  } catch (error) {
    console.error(`❌ Failed to navigate to ${url}:`, error);
    throw error;
  }
}

/**
 * Set viewport to standard video dimensions (16:9, 1280x720)
 */
async function setViewport(page: Page): Promise<void> {
  await page.setViewport({
    width: 1280,
    height: 720,
    deviceScaleFactor: 2, // Higher quality screenshots
  });
}

/**
 * Capture screenshot and return file path
 */
async function captureScreenshot(page: Page, filename: string): Promise<string> {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({
    path: filepath,
    type: "png",
    fullPage: false, // Don't scroll, just viewport
  });
  return filepath;
}

/**
 * Scroll page smoothly
 */
async function smoothScroll(
  page: Page,
  direction: "down" | "up",
  amount: number,
  duration: number = 1000
): Promise<void> {
  const distance = direction === "down" ? amount : -amount;
  const steps = Math.ceil(duration / 50); // 50ms per frame
  const stepDistance = distance / steps;

  for (let i = 0; i < steps; i++) {
    await page.evaluate((delta) => {
      window.scrollBy(0, delta);
    }, stepDistance);
    await page.waitForTimeout(50);
  }
}

/**
 * Perform click action
 */
async function performClick(page: Page, selector: string): Promise<void> {
  try {
    await page.click(selector);
    await page.waitForTimeout(500); // Wait for action result
  } catch (error) {
    console.warn(`⚠️  Could not click ${selector}: ${error}`);
  }
}

/**
 * Record page walkthrough
 */
async function recordPageWalkthrough(
  page: Page,
  pageIndex: number,
  totalPages: number
): Promise<FrameData[]> {
  const script = pageScripts[pageIndex];
  const frames: FrameData[] = [];
  let frameNumber = 0;

  console.log(`\n🎬 Recording: ${script.title} (${pageIndex + 1}/${totalPages})`);
  console.log(`   Duration: ${script.duration}s | Narration: ${script.narration.substring(0, 60)}...`);

  try {
    // Navigate to page
    await navigateToPage(page, script.route, script.waitFor);

    // Capture initial frame
    const initialFrame = await captureScreenshot(
      page,
      `${pageIndex.toString().padStart(2, "0")}_${frameNumber.toString().padStart(3, "0")}.png`
    );
    frames.push({
      timestamp: 0,
      imagePath: initialFrame,
      narration: script.narration,
      duration: script.duration,
    });
    frameNumber++;

    // Perform scroll actions
    if (script.scrollPoints && script.scrollPoints.length > 0) {
      let currentTime = 0;

      for (const scrollPoint of script.scrollPoints) {
        // Wait before scrolling
        await page.waitForTimeout(scrollPoint.delay);
        currentTime += scrollPoint.delay;

        // Perform smooth scroll
        const scrollDuration = 800; // 0.8 seconds per scroll
        await smoothScroll(page, scrollPoint.direction, scrollPoint.amount, scrollDuration);
        currentTime += scrollDuration;

        // Capture frame after scroll
        const scrollFrame = await captureScreenshot(
          page,
          `${pageIndex.toString().padStart(2, "0")}_${frameNumber.toString().padStart(3, "0")}.png`
        );
        frames.push({
          timestamp: currentTime,
          imagePath: scrollFrame,
          duration: 1, // 1 second per intermediate frame
        });
        frameNumber++;
      }
    }

    // Perform click actions
    if (script.clickActions && script.clickActions.length > 0) {
      let currentTime = frames[frames.length - 1]?.timestamp || 0;

      for (const clickAction of script.clickActions) {
        await page.waitForTimeout(clickAction.delay);
        currentTime += clickAction.delay;

        await performClick(page, clickAction.selector);

        const clickFrame = await captureScreenshot(
          page,
          `${pageIndex.toString().padStart(2, "0")}_${frameNumber.toString().padStart(3, "0")}.png`
        );
        frames.push({
          timestamp: currentTime,
          imagePath: clickFrame,
          duration: 1,
        });
        frameNumber++;
      }
    }

    console.log(`✅ Captured ${frames.length} frames`);
  } catch (error) {
    console.error(`❌ Error recording page ${pageIndex}:`, error);
  }

  return frames;
}

/**
 * Main recording function
 */
async function main() {
  console.log("🎥 Logisphere Video Walkthrough Recorder");
  console.log("========================================\n");

  ensureDir(SCREENSHOTS_DIR);

  let browser: Browser | null = null;

  try {
    browser = await initBrowser();
    const page = await browser.newPage();

    // Set viewport for video format
    await setViewport(page);

    // Allow keyboard/mouse interactions
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(10000);

    // Record all pages
    const allFrames: FrameData[] = [];
    const pageMetadata = [];

    for (let i = 0; i < pageScripts.length; i++) {
      const frames = await recordPageWalkthrough(page, i, pageScripts.length);
      allFrames.push(...frames);
      pageMetadata.push({
        pageIndex: i,
        route: pageScripts[i].route,
        title: pageScripts[i].title,
        frameCount: frames.length,
        duration: pageScripts[i].duration,
      });

      // Small delay between pages
      await page.waitForTimeout(500);
    }

    // Save metadata for Remotion composition
    const metadata = {
      totalFrames: allFrames.length,
      totalDuration: pageScripts.reduce((sum, s) => sum + s.duration, 0),
      fps: 30,
      resolution: { width: 1280, height: 720 },
      pages: pageMetadata,
      frames: allFrames,
      screenshotsDir: SCREENSHOTS_DIR,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));

    console.log("\n✅ Recording Complete!");
    console.log(`📊 Total Frames: ${allFrames.length}`);
    console.log(`⏱️  Total Duration: ${metadata.totalDuration} seconds`);
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log(`📝 Metadata saved to: ${METADATA_FILE}`);
    console.log("\nNext step: Use Remotion to compose the video");
    console.log("  npx ts-node remotion-composer.ts");
  } catch (error) {
    console.error("❌ Recording failed:", error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run
main().catch(console.error);
