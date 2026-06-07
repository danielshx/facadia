import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { C, FONTS, hexA, SEVERITY_COLORS, SEVERITY_LABELS } from "../../theme";
import { Mono } from "./primitives";

/** Radial 1–5 severity gauge that sweeps to the graded value. */
export const SeverityGauge: React.FC<{
  frame: number;
  start: number;
  severity: number; // 1..5
  size?: number;
}> = ({ frame, start, severity, size = 240 }) => {
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - start, fps, config: { damping: 16, mass: 0.9 } });
  const color = SEVERITY_COLORS[severity - 1];
  const r = size / 2 - 24;
  const cx = size / 2;
  const cy = size / 2;
  // arc from -210° to 30° (240° sweep)
  const A0 = -210;
  const A1 = 30;
  const segs = 5;
  const valAngle = A0 + ((A1 - A0) * severity) / segs * sp;

  const polar = (ang: number, rad: number) => {
    const a = (ang * Math.PI) / 180;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  };
  const arcPath = (a0: number, a1: number, rad: number) => {
    const [x0, y0] = polar(a0, rad);
    const [x1, y1] = polar(a1, rad);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${rad} ${rad} 0 ${large} 1 ${x1} ${y1}`;
  };

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size}>
        {/* track */}
        <path d={arcPath(A0, A1, r)} stroke={hexA(C.white, 0.08)} strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* segment ticks */}
        {Array.from({ length: segs + 1 }).map((_, i) => {
          const ang = A0 + ((A1 - A0) * i) / segs;
          const [x0, y0] = polar(ang, r - 14);
          const [x1, y1] = polar(ang, r + 14);
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={hexA(SEVERITY_COLORS[Math.min(i, 4)], 0.5)} strokeWidth={2} />;
        })}
        {/* value arc */}
        <path d={arcPath(A0, valAngle, r)} stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${hexA(color, 0.9)})` }} />
        {/* needle */}
        {(() => {
          const [nx, ny] = polar(valAngle, r);
          return <circle cx={nx} cy={ny} r={8} fill={color} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />;
        })()}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <Mono size={11} dim spacing={4} glowPx={0}>
          SEVERITY
        </Mono>
        <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 72, color, lineHeight: 1, textShadow: `0 0 22px ${hexA(color, 0.7)}` }}>
          {Math.max(1, Math.round(severity * sp))}
        </span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 17, color, letterSpacing: 3, opacity: interpolate(frame, [start + 10, start + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          {SEVERITY_LABELS[severity - 1].toUpperCase()}
        </span>
      </div>
    </div>
  );
};
