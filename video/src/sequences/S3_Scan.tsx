import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { FONTS, hexA, SEVERITY_COLORS } from "../theme";
import { DEFECT } from "../data/config";
import { HeroDefect } from "../components/HeroDefect";
import { ScanLine, Reticle } from "../components/hud/Scan";
import { BoundingBox } from "../components/hud/BoundingBox";
import { HudTag } from "../components/hud/primitives";
import { useFade } from "../util/anim";

// quick secondary detections in the back half — adds motion + shows it keeps scanning
const SECONDARY = [
  { x: 0.13, y: 0.26, w: 0.15, h: 0.13, c: "Spalling", s: 5, at: 240 },
  { x: 0.74, y: 0.6, w: 0.16, h: 0.12, c: "Corrosion", s: 3, at: 360 },
  { x: 0.5, y: 0.16, w: 0.13, h: 0.1, c: "Efflorescence", s: 1, at: 470 },
];

export const S3_Scan: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade(durationInFrames, 8, 16);
  const h = DEFECT.hero;
  const cx = h.bbox.x + h.bbox.w / 2;
  const cy = h.bbox.y + h.bbox.h / 2;

  const labelP = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <HeroDefect />

      {/* phase label top-left under the HUD */}
      <div style={{ position: "absolute", left: 92, top: 150, opacity: labelP }}>
        <HudTag>CV SEGMENTATION · MASK</HudTag>
      </div>

      {/* scan sweep */}
      <ScanLine frame={frame} start={28} end={92} />

      {/* reticle locks, then box snaps with measurement */}
      <Reticle frame={frame} x={cx} y={cy} lockAt={96} />
      <BoundingBox
        frame={frame}
        snapAt={104}
        box={h.bbox}
        label={h.class}
        confidence={h.confidence}
        severity={h.severity}
        widthMm={h.widthMm}
      />

      {/* rapid secondary detections */}
      {SECONDARY.map((d, i) => {
        const a = interpolate(frame, [d.at, d.at + 10, d.at + 95, d.at + 108], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (a <= 0) return null;
        const col = SEVERITY_COLORS[d.s - 1];
        return (
          <div key={i} style={{ position: "absolute", left: `${d.x * 100}%`, top: `${d.y * 100}%`, width: `${d.w * 100}%`, height: `${d.h * 100}%`, opacity: a, border: `1.5px solid ${hexA(col, 0.85)}`, boxShadow: `0 0 12px ${hexA(col, 0.4)}` }}>
            <div style={{ position: "absolute", top: -21, left: -1.5, background: col, color: "#04070b", fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: "2px 7px" }}>
              {d.c.toUpperCase()} · S{d.s}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
