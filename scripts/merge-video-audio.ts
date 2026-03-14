import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as glob from "glob";

/**
 * Merge Playwright screen recording with generated narration audio using FFmpeg
 * Creates a final high-quality MP4 video
 */

const OUTPUT_DIR = path.join(__dirname, "../recordings");
const PLAYWRIGHT_VIDEO_DIR = path.join(
  __dirname,
  "../test-results"
);

interface MergeOptions {
  videoFile?: string;
  audioFile?: string;
  outputFile?: string;
}

function findLatestVideo(): string {
  try {
    // Look for video files from Playwright
    const patterns = [
      path.join(PLAYWRIGHT_VIDEO_DIR, "*/chromium/**/*.webm"),
      path.join(PLAYWRIGHT_VIDEO_DIR, "**/*.webm"),
      path.join(OUTPUT_DIR, "*.webm"),
    ];

    for (const pattern of patterns) {
      const files = glob.sync(pattern);
      if (files.length > 0) {
        // Return the most recently modified file
        return files.sort((a, b) =>
          fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime()
        )[0];
      }
    }

    throw new Error("No video file found");
  } catch (error) {
    console.error("❌ Could not find Playwright video:", error);
    throw error;
  }
}

function findNarrationAudio(): string {
  const audioFile = path.join(OUTPUT_DIR, "narration_final.mp3");
  if (!fs.existsSync(audioFile)) {
    throw new Error(
      `Narration audio not found: ${audioFile}\nRun 'npm run generate:narration' first`
    );
  }
  return audioFile;
}

function getVideoDuration(videoFile: string): number {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_sections=1 "${videoFile}"`,
      { encoding: "utf-8" }
    );
    return parseFloat(output.trim());
  } catch (error) {
    console.error("Could not determine video duration:", error);
    return 0;
  }
}

function getAudioDuration(audioFile: string): number {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_sections=1 "${audioFile}"`,
      { encoding: "utf-8" }
    );
    return parseFloat(output.trim());
  } catch (error) {
    console.error("Could not determine audio duration:", error);
    return 0;
  }
}

function convertWebmToMp4(webmFile: string, mp4File: string): void {
  console.log(`  🎬 Converting WebM to MP4...`);
  try {
    execSync(
      `ffmpeg -i "${webmFile}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 192k "${mp4File}" -y`,
      { stdio: "inherit" }
    );
    console.log(`  ✅ Converted to MP4`);
  } catch (error) {
    console.error("  ❌ Conversion failed:", error);
    throw error;
  }
}

function mergeVideoAudio(
  videoFile: string,
  audioFile: string,
  outputFile: string
): void {
  console.log(`  🔗 Merging video and audio...`);

  const videoDuration = getVideoDuration(videoFile);
  const audioDuration = getAudioDuration(audioFile);

  console.log(`     Video duration: ${videoDuration.toFixed(2)}s`);
  console.log(`     Audio duration: ${audioDuration.toFixed(2)}s`);

  const filterComplex = videoDuration > audioDuration
    ? `-filter_complex "[0:v]pad=ceil(iw/2)*2:ceil(ih/2)*2[v];[1:a]aformat=sample_rates=48000:channel_layouts=stereo[a];[v][a]concat=n=1:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]"`
    : `-c:v copy`;

  try {
    const ffmpegCmd = `ffmpeg -i "${videoFile}" -i "${audioFile}" ${filterComplex} -c:a aac -b:a 192k -movflags +faststart "${outputFile}" -y`;

    execSync(ffmpegCmd, { stdio: "inherit" });
    console.log(`  ✅ Merged successfully`);
  } catch (error) {
    console.error("  ❌ Merge failed:", error);
    throw error;
  }
}

function optimizeForWeb(inputFile: string, outputFile: string): void {
  console.log(`  📦 Optimizing for web...`);
  try {
    execSync(
      `ffmpeg -i "${inputFile}" -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k -movflags +faststart "${outputFile}" -y`,
      { stdio: "inherit" }
    );
    console.log(`  ✅ Optimization complete`);
  } catch (error) {
    console.error("  ❌ Optimization failed:", error);
    throw error;
  }
}

function getFileSize(filePath: string): string {
  const bytes = fs.statSync(filePath).size;
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  return `${mb} MB`;
}

async function main() {
  console.log("🎬 Logisphere Walkthrough Video Merger\n");

  try {
    // Find video and audio files
    console.log("📹 Locating files...\n");

    let videoFile: string;
    try {
      videoFile = findLatestVideo();
      console.log(`  ✅ Video found: ${path.basename(videoFile)}`);
      console.log(`     Path: ${videoFile}`);
      console.log(`     Size: ${getFileSize(videoFile)}`);
    } catch (error) {
      console.error(`  ❌ ${error}`);
      console.error(`\n     Make sure to run: npm run record:walkthrough`);
      process.exit(1);
    }

    let audioFile: string;
    try {
      audioFile = findNarrationAudio();
      console.log(`  ✅ Audio found: ${path.basename(audioFile)}`);
      console.log(`     Path: ${audioFile}`);
      console.log(`     Size: ${getFileSize(audioFile)}\n`);
    } catch (error) {
      console.error(`  ❌ ${error}`);
      process.exit(1);
    }

    // Prepare output files
    const mp4File = path.join(OUTPUT_DIR, "logisphere-walkthrough.mp4");
    const finalFile = path.join(OUTPUT_DIR, "logisphere-walkthrough-final.mp4");

    // Check if input is WebM and convert to MP4 first
    if (videoFile.endsWith(".webm")) {
      console.log("\n🎞️  Converting format...\n");
      convertWebmToMp4(videoFile, mp4File);
      videoFile = mp4File;
    }

    // Merge video and audio
    console.log("\n🎙️  Merging media files...\n");
    mergeVideoAudio(videoFile, audioFile, mp4File);

    // Optimize for web
    console.log("\n⚙️  Optimizing for web distribution...\n");
    optimizeForWeb(mp4File, finalFile);

    // Print final stats
    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ VIDEO GENERATION COMPLETE!`);
    console.log(`${"=".repeat(60)}\n`);
    console.log(`📁 Output file: ${finalFile}`);
    console.log(`📊 File size: ${getFileSize(finalFile)}`);
    console.log(`⏱️  Duration: ${getVideoDuration(finalFile).toFixed(2)} seconds`);
    console.log(`\n🎬 Ready to share! Your video is optimized for web.`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Review the video: open "${finalFile}"`);
    console.log(`   2. Share on your platform`);
    console.log(`   3. Use as demo or training material\n`);

  } catch (error) {
    console.error("\n❌ Video merging failed:", error);
    process.exit(1);
  }
}

main();
