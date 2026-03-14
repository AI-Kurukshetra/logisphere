/**
 * Text-to-Speech Audio Generator
 * Generates narration audio for each page script
 *
 * Usage: npx ts-node tts-generator.ts
 *
 * Supports multiple TTS providers:
 * - Google TTS (free, but limited)
 * - ElevenLabs (high quality, paid)
 * - AWS Polly (professional, paid)
 */

import path from "path";
import fs from "fs";
import https from "https";
import { pageScripts } from "./page-scripts";

const AUDIO_DIR = path.join(process.cwd(), "scripts/video-walkthrough/audio");
const METADATA_FILE = path.join(process.cwd(), "scripts/video-walkthrough/audio-metadata.json");

// Ensure audio directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generate filename from title
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Google TTS - Free option (rate limited)
 * Requires: npm install google-tts-api
 */
async function generateWithGoogleTTS(): Promise<void> {
  try {
    // @ts-ignore - Optional dependency
    const gtts = require("google-tts-api");

    console.log("🎙️  Generating audio with Google TTS...\n");

    const audioMetadata: Array<{
      route: string;
      title: string;
      audioPath: string;
      duration: number;
    }> = [];

    for (const script of pageScripts) {
      const slug = slugify(script.title);
      const audioPath = path.join(AUDIO_DIR, `${slug}.mp3`);

      console.log(`📝 Processing: ${script.title}`);

      try {
        const url = gtts.getAudioUrl(script.narration, {
          lang: "en",
          slow: false,
          host: "https://translate.google.com",
        });

        // Download MP3 from URL
        await downloadFile(url, audioPath);

        // Estimate duration (rough: ~150 words per minute)
        const wordCount = script.narration.split(" ").length;
        const estimatedDuration = (wordCount / 150) * 60;

        audioMetadata.push({
          route: script.route,
          title: script.title,
          audioPath,
          duration: estimatedDuration,
        });

        console.log(`  ✅ Saved: ${audioPath}`);
      } catch (error) {
        console.error(`  ❌ Failed: ${error}`);
      }
    }

    // Save metadata
    fs.writeFileSync(
      METADATA_FILE,
      JSON.stringify(
        {
          provider: "google-tts",
          generatedAt: new Date().toISOString(),
          audio: audioMetadata,
        },
        null,
        2
      )
    );

    console.log("\n✅ Audio generation complete!");
  } catch (error) {
    console.error("❌ Google TTS not installed. Install with: npm install google-tts-api");
  }
}

/**
 * ElevenLabs TTS - High quality option (requires API key)
 * Requires: npm install elevenlabs
 */
async function generateWithElevenLabs(apiKey: string): Promise<void> {
  try {
    // @ts-ignore - Optional dependency
    const { ElevenLabsClient } = require("elevenlabs");

    const client = new ElevenLabsClient({ apiKey });
    console.log("🎙️  Generating audio with ElevenLabs...\n");

    const audioMetadata: Array<{
      route: string;
      title: string;
      audioPath: string;
      duration: number;
    }> = [];

    for (const script of pageScripts) {
      const slug = slugify(script.title);
      const audioPath = path.join(AUDIO_DIR, `${slug}.mp3`);

      console.log(`📝 Processing: ${script.title}`);

      try {
        const audio = await client.generate({
          text: script.narration,
          voice_id: "21m00Tcm4TlvDq8ikWAM", // Professional male voice
          model_id: "eleven_monolingual_v1",
        });

        // Save audio buffer
        const buffer = Buffer.from(audio.audio_bytes, "binary");
        fs.writeFileSync(audioPath, buffer);

        // Use ElevenLabs reported duration
        const estimatedDuration = script.duration;

        audioMetadata.push({
          route: script.route,
          title: script.title,
          audioPath,
          duration: estimatedDuration,
        });

        console.log(`  ✅ Saved: ${audioPath}`);
      } catch (error) {
        console.error(`  ❌ Failed: ${error}`);
      }
    }

    // Save metadata
    fs.writeFileSync(
      METADATA_FILE,
      JSON.stringify(
        {
          provider: "elevenlabs",
          generatedAt: new Date().toISOString(),
          audio: audioMetadata,
        },
        null,
        2
      )
    );

    console.log("\n✅ Audio generation complete!");
  } catch (error) {
    console.error("❌ ElevenLabs not installed. Install with: npm install elevenlabs");
  }
}

/**
 * AWS Polly TTS - Professional option (requires AWS credentials)
 * Requires: npm install aws-sdk
 */
async function generateWithAWSPolly(): Promise<void> {
  try {
    // @ts-ignore - Optional dependency
    const AWS = require("aws-sdk");

    const polly = new AWS.Polly();
    console.log("🎙️  Generating audio with AWS Polly...\n");

    const audioMetadata: Array<{
      route: string;
      title: string;
      audioPath: string;
      duration: number;
    }> = [];

    for (const script of pageScripts) {
      const slug = slugify(script.title);
      const audioPath = path.join(AUDIO_DIR, `${slug}.mp3`);

      console.log(`📝 Processing: ${script.title}`);

      try {
        const params = {
          Text: script.narration,
          OutputFormat: "mp3",
          VoiceId: "Joanna", // Professional female voice
        };

        const response = await polly.synthesizeSpeech(params).promise();

        // Save audio file
        fs.writeFileSync(audioPath, response.AudioStream);

        const estimatedDuration = script.duration;

        audioMetadata.push({
          route: script.route,
          title: script.title,
          audioPath,
          duration: estimatedDuration,
        });

        console.log(`  ✅ Saved: ${audioPath}`);
      } catch (error) {
        console.error(`  ❌ Failed: ${error}`);
      }
    }

    // Save metadata
    fs.writeFileSync(
      METADATA_FILE,
      JSON.stringify(
        {
          provider: "aws-polly",
          generatedAt: new Date().toISOString(),
          audio: audioMetadata,
        },
        null,
        2
      )
    );

    console.log("\n✅ Audio generation complete!");
  } catch (error) {
    console.error("❌ AWS SDK not installed. Install with: npm install aws-sdk");
  }
}

/**
 * Download file from URL
 */
function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {}); // Delete partial file
        reject(err);
      });
  });
}

/**
 * Main function
 */
async function main() {
  console.log("🎙️  Logisphere Audio Generator");
  console.log("================================\n");

  ensureDir(AUDIO_DIR);

  const provider = process.argv[2] || "google";
  const apiKey = process.argv[3];

  switch (provider) {
    case "google":
      await generateWithGoogleTTS();
      break;

    case "elevenlabs":
      if (!apiKey) {
        console.error("❌ ElevenLabs API key required: npx ts-node tts-generator.ts elevenlabs YOUR_API_KEY");
        process.exit(1);
      }
      await generateWithElevenLabs(apiKey);
      break;

    case "aws":
      await generateWithAWSPolly();
      break;

    default:
      console.error(`Unknown provider: ${provider}`);
      console.log("\nUsage:");
      console.log("  Google TTS:  npx ts-node tts-generator.ts google");
      console.log("  ElevenLabs:  npx ts-node tts-generator.ts elevenlabs YOUR_API_KEY");
      console.log("  AWS Polly:   npx ts-node tts-generator.ts aws");
      process.exit(1);
  }
}

main().catch(console.error);
