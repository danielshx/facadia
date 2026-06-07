import React from "react";
import { interpolate } from "remotion";
import { C, FONTS, hexA } from "../../theme";
import { Mono } from "./primitives";
import { countUp } from "../../util/anim";

/** Circular building-health score ring, 0→value count-up. Lower = worse. */
export const HealthScore: React.FC<{
  frame: number;
  start: number;
  value: number; // 0..100
  size?: number;
}> = ({ frame, start, value, size = 300 }) => {
  const v = countUp(frame, value, start, start + 50);
  const r = size / 2 - 22;
  const circ = 2 * Math.PI * r;
  // color: 0-40 red, 40-70 amber, 70-100 green
  const color = value < 40 ? C.red : value < 70 ? C.amber : "#38D39F";
  const dash = (v / 100) * circ;
  const appear = interpolate(frame, [start, start + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ width: size, height: size, position: "relative", opacity: appear }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={hexA(C.white, 0.07)} strokeWidth={14} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 10px ${hexA(color, 0.8)})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Mono size={12} dim spacing={4} glowPx={0}>
          BUILDING HEALTH
        </Mono>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 92, color, lineHeight: 1, textShadow: `0 0 26px ${hexA(color, 0.6)}` }}>
            {Math.round(v)}
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 24, color: C.textMid }}>/100</span>
        </div>
        <Mono size={13} color={color} spacing={2} glowPx={6}>
          {value < 40 ? "HIGH RISK" : value < 70 ? "ELEVATED RISK" : "LOW RISK"}
        </Mono>
      </div>
    </div>
  );
};
