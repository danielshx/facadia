import React from "react";
import { interpolate } from "remotion";
import { C, FONTS, hexA, textGlow } from "../../theme";

export type Cap = { text: string; from: number; dur: number; accent?: boolean };

/** Bottom-centred kinetic caption track (key terms / VO subtitle). */
export const CaptionTrack: React.FC<{ frame: number; caps: Cap[]; bottom?: number }> = ({
  frame,
  caps,
  bottom = 150,
}) => {
  const active = caps.find((c) => frame >= c.from && frame < c.from + c.dur);
  if (!active) return null;
  const local = frame - active.from;
  const o = interpolate(local, [0, 8, active.dur - 8, active.dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(local, [0, 10], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const color = active.accent ? C.cyan : C.textHi;
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: o,
        transform: `translateY(${y}px)`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: active.accent ? FONTS.mono : FONTS.display,
          fontSize: active.accent ? 27 : 29,
          fontWeight: 600,
          letterSpacing: active.accent ? 2 : 0.3,
          color,
          textShadow: `${textGlow(active.accent ? C.cyan : "#000", active.accent ? 12 : 14, 0.9)}, 0 2px 18px ${hexA("#000", 0.95)}`,
          textAlign: "center",
          maxWidth: 1280,
          padding: "10px 28px",
          background: `linear-gradient(180deg, ${hexA("#04070b", 0.0)}, ${hexA("#04070b", 0.5)})`,
          borderRadius: 10,
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
