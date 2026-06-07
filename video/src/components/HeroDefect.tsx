import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, hexA } from "../theme";
import { ASSETS } from "../data/config";

/** The macro defect that gets scanned — still or video, with a slow push-in. */
export const HeroDefect: React.FC<{ pushFrom?: number; pushTo?: number; panX?: number; panY?: number }> = ({
  pushFrom = 1.05,
  pushTo = 1.22,
  panX = -2.2,
  panY = 1.2,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [pushFrom, pushTo]);
  const tx = interpolate(frame, [0, durationInFrames], [0, panX]);
  const ty = interpolate(frame, [0, durationInFrames], [0, panY]);
  const common: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
    filter: "contrast(1.06) saturate(1.03) brightness(0.94)",
  };
  return (
    <AbsoluteFill style={{ background: C.bgDeep, overflow: "hidden" }}>
      {ASSETS.heroIsVideo ? (
        <OffthreadVideo src={staticFile(ASSETS.heroVideo)} muted style={common} />
      ) : (
        <Img src={staticFile(ASSETS.heroStill)} style={common} />
      )}
      {/* grade + vignette so the HUD pops */}
      <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 45%, transparent 40%, ${hexA("#000", 0.72)} 100%)` }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${hexA("#06223a", 0.25)}, ${hexA("#000", 0.2)})`, mixBlendMode: "multiply" }} />
    </AbsoluteFill>
  );
};
