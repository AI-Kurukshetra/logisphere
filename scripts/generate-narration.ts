import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { execSync } from "child_process";

interface TimelineEntry {
  timestamp: number;
  action: string;
  narration: string;
  duration?: number;
}

interface NarrationSegment {
  timestamp: number;
  duration: number;
  narration: string;
  audioFile: string;
}

/**
 * Generate narration audio using ElevenLabs API
 * Requires ELEVENLABS_API_KEY environment variable
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel
const OUTPUT_DIR = path.join(__dirname, "../recordings");
const TIMELINE_FILE = path.join(OUTPUT_DIR, "timeline.json");

async function generateSpeech(text: string, outputFile: string): Promise<number> {
  if (!ELEVENLABS_API_KEY) {
    console.warn(
      "⚠️  ELEVENLABS_API_KEY not set. Using offline TTS fallback (text-to-speech).\n" +
      "To use ElevenLabs: export ELEVENLABS_API_KEY=your_key"
    );
    return await generateSpeechOffline(text, outputFile);
  }

  try {
    console.log(`  🎤 Generating speech for: "${text.substring(0, 50)}..."`);

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    fs.writeFileSync(outputFile, response.data);

    // Get audio duration using ffprobe
    const duration = getAudioDuration(outputFile);
    console.log(`  ✅ Generated: ${path.basename(outputFile)} (${duration.toFixed(2)}s)`);

    return duration;
  } catch (error) {
    console.error(`  ❌ ElevenLabs API error:`, error);
    console.log(`  Using offline fallback...`);
    return await generateSpeechOffline(text, outputFile);
  }
}

/**
 * Fallback: Generate silence with duration based on word count
 * Useful for testing without API key
 */
async function generateSpeechOffline(text: string, outputFile: string): Promise<number> {
  try {
    // Estimate duration: ~150 words per minute = ~0.4 seconds per word
    const wordCount = text.split(" ").length;
    const estimatedDuration = Math.max(1, wordCount * 0.4);

    // Create silent audio with ffmpeg
    execSync(
      `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${estimatedDuration} -q:a 9 -acodec libmp3lame "${outputFile}" -y`,
      { stdio: "pipe" }
    );

    console.log(
      `  ℹ️  Generated silent audio (${estimatedDuration.toFixed(2)}s) for offline testing`
    );
    console.log(`     Text: "${text}"`);

    return estimatedDuration;
  } catch (error) {
    console.error(`  ❌ Offline generation failed:`, error);
    throw error;
  }
}

function getAudioDuration(audioFile: string): number {
  try {
    const ffprobeOutput = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_sections=1 "${audioFile}"`,
      { encoding: "utf-8" }
    );
    return parseFloat(ffprobeOutput.trim());
  } catch (error) {
    console.warn(`  ⚠️  Could not determine audio duration, using estimate`);
    return 2; // Default fallback
  }
}

/**
 * Concatenate multiple audio files into a single narration track
 */
function concatenateAudioFiles(audioFiles: string[], outputFile: string): void {
  const concatFile = path.join(OUTPUT_DIR, "concat.txt");
  const concatContent = audioFiles
    .map((file) => `file '${path.resolve(file)}'`)
    .join("\n");

  fs.writeFileSync(concatFile, concatContent);

  try {
    execSync(
      `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:a libmp3lame -q:a 4 "${outputFile}" -y`,
      { stdio: "pipe" }
    );
    console.log(`\n✅ Audio concatenated: ${path.basename(outputFile)}`);
    fs.unlinkSync(concatFile);
  } catch (error) {
    console.error(`❌ Audio concatenation failed:`, error);
    throw error;
  }
}

async function main() {
  console.log("🎙️  Logisphere Walkthrough Narration Generator\n");

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check if timeline exists
  if (!fs.existsSync(TIMELINE_FILE)) {
    console.error(
      `❌ Timeline file not found: ${TIMELINE_FILE}`
    );
    console.error("   Run 'npm run record:walkthrough' first to generate the video and timeline.");
    process.exit(1);
  }

  const timeline: TimelineEntry[] = JSON.parse(
    fs.readFileSync(TIMELINE_FILE, "utf-8")
  );

  console.log(`📋 Loaded timeline with ${timeline.length} narration segments\n`);
  console.log("Generating speech for each segment...\n");

  const narrationSegments: NarrationSegment[] = [];
  const audioFiles: string[] = [];

  for (let i = 0; i < timeline.length; i++) {
    const entry = timeline[i];
    const audioFile = path.join(
      OUTPUT_DIR,
      `narration_${String(i).padStart(2, "0")}.mp3`
    );

    // Generate speech
    const duration = await generateSpeech(entry.narration, audioFile);

    narrationSegments.push({
      timestamp: entry.timestamp,
      duration,
      narration: entry.narration,
      audioFile,
    });

    audioFiles.push(audioFile);

    // Add small delay between API calls to avoid rate limiting
    if (ELEVENLABS_API_KEY && i < timeline.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Concatenate all audio files
  console.log("\n🔗 Concatenating audio files...");
  const finalAudioFile = path.join(OUTPUT_DIR, "narration_final.mp3");
  concatenateAudioFiles(audioFiles, finalAudioFile);

  // Save narration metadata
  const metadataFile = path.join(OUTPUT_DIR, "narration-metadata.json");
  fs.writeFileSync(
    metadataFile,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      apiProvider: ELEVENLABS_API_KEY ? "elevenlabs" : "offline",
      voiceId: ELEVENLABS_VOICE_ID,
      totalDuration: narrationSegments.reduce((sum, seg) => sum + seg.duration, 0),
      segments: narrationSegments,
      finalAudio: path.basename(finalAudioFile),
    }, null, 2)
  );

  console.log(`\n📊 Narration metadata saved: ${path.basename(metadataFile)}`);
  console.log(`\n✅ Narration generation complete!`);
  console.log(`\n📁 Files generated:`);
  console.log(`   - ${path.basename(finalAudioFile)} (final narration track)`);
  console.log(`   - Individual segment files in ${path.basename(OUTPUT_DIR)}/\n`);
  console.log(`Next step: Run 'npm run merge:video' to create the final video!\n`);
}

main().catch((error) => {
  console.error("\n❌ Narration generation failed:", error);
  process.exit(1);
});
