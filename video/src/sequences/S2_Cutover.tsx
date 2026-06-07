import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTS, hexA } from "../theme";
import { CLIPS } from "../data/config";
import { DigitalTwin } from "../components/DigitalTwin";
import { Mono, Pill } from "../components/hud/primitives";
import { useFade } from "../util/anim";

export const S2_Cutover: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const fade = useFade(durationInFrames, 6, 14);

  const WIPE_START = 92;
  const WIPE_END = 152;
  const p = interpolate(frame, [WIPE_START, WIPE_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // white flash as the scan line crosses
  const flash = interpolate(frame, [WIPE_START + 24, WIPE_START + 30, WIPE_START + 46], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // pre-wipe: real footage with a building-up grid hint
  const realScale = interpolate(frame, [0, durationInFrames], [1.04, 1.12]);
  const labelP = interpolate(frame, [WIPE_END - 6, WIPE_END + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bgDeep, opacity: fade }}>
      {/* twin underneath */}
      <DigitalTwin startSec={CLIPS.simFacade.startSec} playbackRate={0.7} blur={0.6} />

      {/* real footage on top, wiped away left→right to reveal the twin */}
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${p * 100}%)`, overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile("real.mp4")}
          trimBefore={Math.round(CLIPS.realFacade.startSec * fps)}
          playbackRate={0.7}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${realScale})`, filter: "contrast(1.05) saturate(0.98) brightness(0.9)" }}
        />
        <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 45%, transparent 45%, ${hexA("#000", 0.6)} 100%)` }} />
      </AbsoluteFill>

      {/* the scan-wipe line */}
      {frame >= WIPE_START && frame <= WIPE_END + 4 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${p * 100}%`, width: 4, background: C.cyanBright, boxShadow: `0 0 40px 10px ${hexA(C.cyan, 0.9)}` }} />
          {/* leading glow band */}
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${p * 100}%`, width: 90, marginLeft: -90, background: `linear-gradient(90deg, transparent, ${hexA(C.cyan, 0.22)})` }} />
        </AbsoluteFill>
      ) : null}

      {/* white flash */}
      <AbsoluteFill style={{ background: C.white, opacity: flash, pointerEvents: "none" }} />

      {/* RECONSTRUCTING badge before, DIGITAL TWIN after */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 150, pointerEvents: "none" }}>
        {frame < WIPE_START + 20 ? (
          <div style={{ opacity: interpolate(frame, [10, 28, WIPE_START + 6, WIPE_START + 20], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            <Pill color={C.cyan} size={14}>RECONSTRUCTING · GAUSSIAN SPLAT</Pill>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: labelP, transform: `translateY(${(1 - labelP) * 12}px)` }}>
            <Pill color={C.cyan} filled size={14}>DIGITAL TWIN · ACQUIRED</Pill>
            <Mono size={13} dim spacing={3} glowPx={0}>TUM GARCHING · RECONSTRUCTED FROM ORDINARY FOOTAGE</Mono>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
