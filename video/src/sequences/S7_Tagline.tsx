import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTS, hexA } from "../theme";
import { Mono } from "../components/hud/primitives";
import { Grid } from "../components/Effects";
import { ramp, useFade } from "../util/anim";

export const S7_Tagline: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade(durationInFrames, 16, 26);

  const markP = ramp(frame, 6, 30);
  const line1 = ramp(frame, 24, 50);
  const line2 = ramp(frame, 54, 80);
  const subP = ramp(frame, 90, 115);
  const lineW = ramp(frame, 70, 110) * 420;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 45%, #0a141c, ${C.bgDeep})`, opacity: fade, alignItems: "center", justifyContent: "center" }}>
      <Grid opacity={0.06} size={80} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* mark */}
        <div style={{ opacity: markP, transform: `scale(${0.9 + markP * 0.1})`, marginBottom: 30 }}>
          <svg width="64" height="64" viewBox="0 0 34 34" fill="none">
            <circle cx="17" cy="17" r="15" stroke={hexA(C.cyan, 0.5)} strokeWidth="1.5" />
            <circle cx="17" cy="17" r="6" stroke={C.cyan} strokeWidth="2" />
            <circle cx="17" cy="17" r="2" fill={C.cyan} />
            <path d="M17 0 V8 M17 26 V34 M0 17 H8 M26 17 H34" stroke={C.cyan} strokeWidth="1.5" />
          </svg>
        </div>

        {/* tagline */}
        <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 58, color: C.textMid, margin: 0, opacity: line1, transform: `translateY(${(1 - line1) * 10}px)` }}>
          See the building.
        </h1>
        <h1 style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 72, color: C.white, margin: "6px 0 0", opacity: line2, transform: `translateY(${(1 - line2) * 10}px)`, textShadow: `0 0 40px ${hexA(C.cyan, 0.3)}` }}>
          Know the <span style={{ color: C.cyan }}>risk.</span>
        </h1>

        <div style={{ height: 1, width: lineW, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, margin: "34px 0 24px" }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: subP }}>
          <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 26, color: C.white, letterSpacing: 6 }}>FACADIA</span>
          <Mono size={14} dim spacing={4} glowPx={0}>AI BUILDING SURVEYOR · HONG KONG</Mono>
        </div>
      </div>
    </AbsoluteFill>
  );
};
