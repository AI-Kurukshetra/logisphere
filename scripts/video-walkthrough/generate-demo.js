/**
 * Generate demo frames - JavaScript version
 * Creates minimal placeholder frames to test the video pipeline
 */

const path = require("path");
const fs = require("fs");

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "scripts/video-walkthrough/screenshots"
);
const METADATA_FILE = path.join(
  process.cwd(),
  "scripts/video-walkthrough/metadata.json"
);

// 22 page scripts (minimal for demo)
const pageCount = 22;
const pageScripts = Array.from({ length: pageCount }, (_, i) => ({
  title: `Page ${i + 1}`,
  route: `/page-${i}`,
}));

// Minimal valid 1x1 PNG
const pngData = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

async function generateDemoFrames() {
  console.log("🎬 Generating Demo Frames for Video Testing");
  console.log("===========================================\n");

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const metadata = [];
  let globalFrameIndex = 0;

  for (let pageIndex = 0; pageIndex < pageScripts.length; pageIndex++) {
    const script = pageScripts[pageIndex];
    console.log(`📄 ${script.title}`);

    // Create 40 frames per page
    const frameCount = 40;

    for (let frameIdx = 0; frameIdx < frameCount; frameIdx++) {
      const frameName = `${String(pageIndex).padStart(2, "0")}_${String(
        frameIdx
      ).padStart(3, "0")}`;
      const framePath = path.join(SCREENSHOT_DIR, `${frameName}.png`);

      // Write minimal PNG
      fs.writeFileSync(framePath, pngData);

      metadata.push({
        page: script.title,
        route: script.route,
        title: script.title,
        frameIndex: globalFrameIndex,
        timestamp: (globalFrameIndex / 30) * 1000,
      });

      globalFrameIndex++;

      if (frameIdx === 0) {
        process.stdout.write("   ");
      }
      process.stdout.write(".");

      if ((frameIdx + 1) % 20 === 0) {
        process.stdout.write(` ${frameIdx + 1}/${frameCount}\n   `);
      }
    }

    console.log("\n");
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

  console.log("\n✅ Demo Frames Generated");
  console.log("=======================");
  console.log(`Total Frames: ${globalFrameIndex}`);
  console.log(`Duration: ${Math.ceil(globalFrameIndex / 30)} seconds`);
  console.log(`Output Directory: ${SCREENSHOT_DIR}`);
  console.log(`Metadata File: ${METADATA_FILE}`);
  console.log(
    `\nNext step: npx remotion render scripts/video-walkthrough/remotion-composer.tsx LogisphereWalkthrough output.mp4`
  );
}

generateDemoFrames().catch(console.error);
