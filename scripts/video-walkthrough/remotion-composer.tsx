/**
 * Remotion Video Composer
 * Combines screenshots, narration, music, and branding into professional video
 * Usage: npm run remotion-compose
 */

import React from "react";
import {
  Composition,
  Sequence,
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import path from "path";
import fs from "fs";

// Types
interface FrameData {
  timestamp: number;
  imagePath: string;
  narration?: string;
  duration: number;
}

interface VideoMetadata {
  totalFrames: number;
  totalDuration: number;
  fps: number;
  resolution: { width: number; height: number };
  pages: Array<{
    pageIndex: number;
    route: string;
    title: string;
    frameCount: number;
    duration: number;
  }>;
  frames: FrameData[];
  screenshotsDir: string;
  timestamp: string;
}

// Load metadata
const metadataPath = path.join(process.cwd(), "scripts/video-walkthrough/metadata.json");
const metadata: VideoMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

/**
 * Frame Component - Displays screenshot with transitions
 */
const ScreenshotFrame: React.FC<{
  imagePath: string;
  duration: number;
  title?: string;
}> = ({ imagePath, duration, title }) => {
  const frame = useCurrentFrame();
  const fps = 30; // Remotion default

  // Fade in/out transitions
  const fadeInOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOutOpacity = interpolate(
    frame,
    [Math.max(0, duration * fps - 15), duration * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <img
        src={`file://${imagePath}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Optional title overlay */}
      {title && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 40,
            color: "white",
            fontSize: 32,
            fontWeight: "bold",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            maxWidth: "80%",
          }}
        >
          {title}
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Opening Sequence - Logo and intro
 */
const OpeningSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, 30], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "linear-gradient(135deg, #0b2b4d 0%, #1a4d7a 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        color: "white",
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: "bold",
          opacity,
          transform: `scale(${scale})`,
          marginBottom: 20,
        }}
      >
        Logisphere
      </div>
      <div
        style={{
          fontSize: 24,
          color: "#f2a94a",
          opacity: Math.max(0, opacity - 0.5),
        }}
      >
        Logistics Management Platform
      </div>
    </AbsoluteFill>
  );
};

/**
 * Closing Sequence - Call to action
 */
const ClosingSequence: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "linear-gradient(135deg, #0b2b4d 0%, #1a4d7a 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        color: "white",
        fontSize: 32,
      }}
    >
      <h1 style={{ fontSize: 56, marginBottom: 30 }}>Ready to Transform?</h1>
      <p style={{ fontSize: 28, color: "#f2a94a", marginBottom: 50 }}>
        Get started with Logisphere today
      </p>
      <div style={{ fontSize: 24 }}>Visit logisphere.io to learn more</div>
    </AbsoluteFill>
  );
};

/**
 * Main Video Composition
 */
export const VideoComposition: React.FC = () => {
  let currentFrame = 0;
  const fps = 30;

  return (
    <>
      {/* Opening */}
      <Sequence from={0} durationInFrames={150}>
        <OpeningSequence />
      </Sequence>

      {/* Page screenshots */}
      {metadata.pages.map((page, pageIndex) => {
        const pageFrames = metadata.frames.filter(
          (_, i) => i >= currentFrame && i < currentFrame + page.frameCount
        );
        const sequenceStart = currentFrame;

        let frameOffset = 0;
        const elements = pageFrames.map((frame, frameIndex) => {
          const frameDuration = frame.duration * fps;
          const sequenceStart = frameOffset;
          frameOffset += frameDuration;

          return (
            <Sequence
              key={`${pageIndex}-${frameIndex}`}
              from={sequenceStart}
              durationInFrames={frameDuration}
            >
              <ScreenshotFrame
                imagePath={frame.imagePath}
                duration={frame.duration}
                title={frameIndex === 0 ? page.title : undefined}
              />
            </Sequence>
          );
        });

        currentFrame += page.frameCount;
        return <React.Fragment key={`page-${pageIndex}`}>{elements}</React.Fragment>;
      })}

      {/* Closing */}
      <Sequence from={currentFrame} durationInFrames={120}>
        <ClosingSequence />
      </Sequence>
    </>
  );
};

/**
 * Register Composition with Remotion
 * This is called by Remotion's renderer
 */
export const registerComposition = () => {
  const totalFrames = Math.ceil(
    (metadata.totalDuration + 4 + 4) * 30 // +4s for opening and closing
  );

  Composition({
    id: "LogisphereWalkthrough",
    component: VideoComposition,
    durationInFrames: totalFrames,
    fps: 30,
    width: metadata.resolution.width,
    height: metadata.resolution.height,
    defaultProps: {},
  });
};

// Export for Remotion
export default VideoComposition;
