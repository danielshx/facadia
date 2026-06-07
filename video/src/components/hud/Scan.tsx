import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, hexA } from "../../theme";

/** A bright horizontal scan line that sweeps over [start,end], leaving a trail. */
export const ScanLine: React.FC<{
  frame: number;
  start: number;
  end: number;
  color?: string;
  vertical?: boolean;
}> = ({ frame, start, end, color = C.cyan, vertical = false }) => {
  const p = interpolate(frame, [start, end], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fade = interpolate(frame, [end - 8, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < start || frame > end) return null;
  const pos = `${p}%`;
  const common: React.CSSProperties = {
    position: "absolute",
    background: color,
    boxShadow: `0 0 26px 6px ${hexA(color, 0.9)}`,
    opacity: fade,
  };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* trailing gradient */}
      <AbsoluteFill
        style={{
          opacity: 0.5 * fade,
          background: vertical
            ? `linear-gradient(90deg, transparent, ${hexA(color, 0.18)} ${pos}, transparent ${pos})`
            : `linear-gradient(180deg, transparent, ${hexA(color, 0.18)} ${pos}, transparent ${pos})`,
        }}
      />
      <div
        style={
          vertical
            ? { ...common, left: pos, top: 0, bottom: 0, width: 2.5 }
            : { ...common, top: pos, left: 0, right: 0, height: 2.5 }
        }
      />
    </AbsoluteFill>
  );
};

/** Rotating targeting reticle that locks onto (x,y) in normalized coords. */
export const Reticle: React.FC<{
  frame: number;
  x: number;
  y: number;
  lockAt: number;
  color?: string;
}> = ({ frame, x, y, lockAt, color = C.cyan }) => {
  const appear = interpolate(frame, [lockAt - 24, lockAt - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const locked = frame >= lockAt;
  const rot = locked ? 0 : interpolate(frame, [lockAt - 24, lockAt], [120, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(frame, [lockAt - 24, lockAt, lockAt + 6], [1.6, 1.0, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lockFade = interpolate(frame, [lockAt + 30, lockAt + 50], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < lockAt - 24) return null;
  const size = 150;
  return (
    <div
      style={{
        position: "absolute",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        opacity: appear * lockFade,
        transform: `rotate(${rot}deg) scale(${scale})`,
        pointerEvents: "none",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 150 150" fill="none">
        <circle cx="75" cy="75" r="58" stroke={hexA(color, 0.4)} strokeWidth="1" strokeDasharray="4 8" />
        <circle cx="75" cy="75" r="40" stroke={color} strokeWidth="1.5" strokeDasharray="40 18" />
        <path d="M75 8 V28 M75 122 V142 M8 75 H28 M122 75 H142" stroke={color} strokeWidth="2" />
        <circle cx="75" cy="75" r="3" fill={color} />
      </svg>
    </div>
  );
};
