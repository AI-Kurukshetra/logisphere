/**
 * Remotion Video Composer
 * Combines screenshots into a professional video with transitions
 */

import {
  AbsoluteFill,
  useVideoConfig,
  Sequence,
  interpolate,
  Easing,
  Video,
} from "remotion";
import fs from "fs";
import path from "path";

interface FrameMetadata {
  page: string;
  route: string;
  title: string;
  frameIndex: number;
  timestamp: number;
}

interface MetadataFile {
  totalFrames: number;
  fps: number;
  estimatedDuration: number;
  generatedAt: string;
  frames: FrameMetadata[];
}

// Load metadata
const metadataPath = path.join(
  process.cwd(),
  "scripts/video-walkthrough/metadata.json"
);
const metadata: MetadataFile = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

const screenshotDir = path.join(
  process.cwd(),
  "scripts/video-walkthrough/screenshots"
);

/**
 * Individual frame component with fade transition
 */
interface ScreenshotFrameProps {
  imagePath: string;
  fadeInFrames?: number;
  fadeOutFrames?: number;
}

const ScreenshotFrame: React.FC<ScreenshotFrameProps> = ({
  imagePath,
  fadeInFrames = 15,
  fadeOutFrames = 15,
}) => {
  const { frame } = useVideoConfig();

  // Fade in from black
  const fadeInOpacity = interpolate(
    frame,
    [0, fadeInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Fade out to black
  const fadeOutOpacity = interpolate(
    frame,
    [metadata.totalFrames - fadeOutFrames, metadata.totalFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={imagePath}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity,
        }}
        alt="walkthrough"
      />
    </AbsoluteFill>
  );
};

/**
 * Opening sequence with logo
 */
const OpeningSequence: React.FC = () => {
  const { frame } = useVideoConfig();
  const openingDuration = 120; // 4 seconds at 30fps

  // Logo appears and scales up
  const scale = interpolate(
    frame,
    [0, openingDuration / 2],
    [0.5, 1.2],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateRight: "clamp",
    }
  );

  // Logo fades in
  const opacity = interpolate(
    frame,
    [0, 30, openingDuration - 30, openingDuration],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          fontSize: 72,
          fontWeight: "bold",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: -2,
        }}
      >
        Logisphere
      </div>
      <div
        style={{
          opacity,
          fontSize: 24,
          color: "#94a3b8",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 300,
        }}
      >
        Freight Intelligence Platform
      </div>
    </AbsoluteFill>
  );
};

/**
 * Closing sequence with call-to-action
 */
const ClosingSequence: React.FC = () => {
  const { frame } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 30, 180, 210],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div
        style={{
          opacity,
          fontSize: 56,
          fontWeight: "bold",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          maxWidth: "90%",
        }}
      >
        Ready to Transform Your Logistics?
      </div>
      <div
        style={{
          opacity,
          fontSize: 20,
          color: "#cbd5e1",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          maxWidth: "80%",
          lineHeight: 1.6,
        }}
      >
        Get real-time visibility, predictive analytics, and automated compliance
        monitoring.
      </div>
      <div
        style={{
          opacity,
          fontSize: 18,
          color: "#60a5fa",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginTop: 20,
        }}
      >
        Start your free trial today
      </div>
    </AbsoluteFill>
  );
};

/**
 * Main video composition
 */
export const LogisphereWalkthrough: React.FC = () => {
  const screenshotFrames = metadata.frames;

  // Calculate frame range for each screenshot
  const getFramesByIndex = (
    index: number
  ): { from: number; to: number; count: number } => {
    const current = screenshotFrames[index];
    const next = screenshotFrames[index + 1];

    const from = index === 0 ? 0 : screenshotFrames[index - 1].frameIndex + 1;
    const to = next ? next.frameIndex : metadata.totalFrames;

    return { from, to, count: to - from };
  };

  const openingDuration = 120; // 4 seconds
  const contentDuration = metadata.totalFrames;
  const closingDuration = 210; // 7 seconds
  const totalDuration = openingDuration + contentDuration + closingDuration;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Opening */}
      <Sequence from={0} durationInFrames={openingDuration}>
        <OpeningSequence />
      </Sequence>

      {/* Content - Screenshots */}
      <Sequence from={openingDuration} durationInFrames={contentDuration}>
        {screenshotFrames.map((frame, index) => {
          const { from, to } = getFramesByIndex(index);

          if (to - from <= 0) return null;

          const screenshotPath = path.join(
            screenshotDir,
            `${String(Math.floor(index / 1000))
              .padStart(2, "0")}_${String(index % 1000)
              .padStart(3, "0")}.png`
          );

          // Determine if this is likely the last frame of a page
          const isPageEnd =
            index === screenshotFrames.length - 1 ||
            screenshotFrames[index + 1]?.page !== frame.page;

          return (
            <Sequence
              key={index}
              from={frame.frameIndex - openingDuration}
              durationInFrames={to - from}
            >
              <ScreenshotFrame
                imagePath={screenshotPath}
                fadeInFrames={isPageEnd ? 10 : 5}
                fadeOutFrames={isPageEnd ? 15 : 0}
              />
            </Sequence>
          );
        })}
      </Sequence>

      {/* Closing */}
      <Sequence
        from={openingDuration + contentDuration}
        durationInFrames={closingDuration}
      >
        <ClosingSequence />
      </Sequence>
    </AbsoluteFill>
  );
};

export const fps = 30;
export const width = 1280;
export const height = 720;
export const durationInFrames = Math.ceil(
  (metadata.totalFrames / 30 + 4 + 7) * 30
);
export const defaultProps = {
  duration: durationInFrames,
};
