import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig } from "remotion";
import { C, hexA } from "../theme";
import { Scanlines, Grid } from "./Effects";

/**
 * The gaussian-splat flythrough, dressed as an Iron-Man-style digital twin.
 * The source is only 518×294, so we lean INTO that: blur + scanlines + cyan
 * tint + a subtle RGB split read as a holographic render, not low quality.
 */
export const DigitalTwin: React.FC<{
  startSec?: number;
  playbackRate?: number;
  blur?: number;
  tint?: number;
  showGrid?: boolean;
}> = ({ startSec = 0, playbackRate = 0.8, blur = 0.6, tint = 0.13, showGrid = true }) => {
  const { fps } = useVideoConfig();
  const trimBefore = Math.round(startSec * fps);

  const Layer: React.FC<{ dx: number; tintColor?: string; op: number; blend?: any }> = ({
    dx,
    tintColor,
    op,
    blend,
  }) => (
    <AbsoluteFill style={{ transform: `translateX(${dx}px)`, opacity: op, mixBlendMode: blend }}>
      <OffthreadVideo
        src={staticFile("sim.mp4")}
        trimBefore={trimBefore}
        playbackRate={playbackRate}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: tintColor
            ? `blur(${blur}px) saturate(0) brightness(1.1)`
            : `blur(${blur}px) saturate(1.15) contrast(1.08) brightness(1.06)`,
          ...(tintColor ? { } : {}),
        }}
      />
      {tintColor ? (
        <AbsoluteFill style={{ background: tintColor, mixBlendMode: "multiply" }} />
      ) : null}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep, overflow: "hidden" }}>
      {/* base */}
      <Layer dx={0} op={1} />
      {/* faint RGB split — kept subtle */}
      <Layer dx={-2} tintColor="#FF3366" op={0.1} blend="screen" />
      <Layer dx={2} tintColor="#33CCFF" op={0.1} blend="screen" />

      {/* cyan grade wash */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${hexA(C.cyan, tint * 0.6)} 0%, ${hexA(
            "#0a2230",
            tint
          )} 100%)`,
          mixBlendMode: "color",
        }}
      />
      <AbsoluteFill style={{ background: hexA(C.cyanDim, tint * 0.4), mixBlendMode: "overlay" }} />

      {showGrid ? <Grid opacity={0.07} size={72} /> : null}
      <Scanlines opacity={0.1} gap={3} />

      {/* bloom / glow vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(130% 110% at 50% 40%, ${hexA(
            C.cyan,
            0.06
          )} 0%, transparent 55%, ${hexA("#000", 0.78)} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
