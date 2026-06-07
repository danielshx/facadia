import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { C, FONTS, hexA, SEVERITY_COLORS } from "../../theme";
import { Mono } from "./primitives";

type Box = { x: number; y: number; w: number; h: number };

/**
 * A detection bounding box (normalized coords) that snaps in with animated
 * corner ticks, a class tag, a confidence bar, and a measurement leader line.
 */
export const BoundingBox: React.FC<{
  frame: number;
  snapAt: number;
  box: Box;
  label: string;
  confidence: number;
  severity: number;
  widthMm: number;
  showMeasure?: boolean;
}> = ({ frame, snapAt, box, label, confidence, severity, widthMm, showMeasure = true }) => {
  const { fps } = useVideoConfig();
  const color = SEVERITY_COLORS[severity - 1] ?? C.cyan;

  const snap = spring({ frame: frame - snapAt, fps, config: { damping: 14, mass: 0.6 } });
  if (frame < snapAt - 2) return null;

  // box grows from center into final size
  const cx = (box.x + box.w / 2) * 100;
  const cy = (box.y + box.h / 2) * 100;
  const w = box.w * 100 * snap;
  const h = box.h * 100 * snap;

  const left = `${cx - w / 2}%`;
  const top = `${cy - h / 2}%`;
  const tick = 22;

  const tagP = interpolate(frame, [snapAt + 4, snapAt + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const measureP = interpolate(frame, [snapAt + 16, snapAt + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scanY = interpolate((frame - snapAt) % 60, [0, 60], [0, 100]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left, top, width: `${w}%`, height: `${h}%` }}>
        {/* faint scanning fill */}
        <div style={{ position: "absolute", inset: 0, background: hexA(color, 0.08), overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${scanY}%`,
              height: 2,
              background: hexA(color, 0.7),
              boxShadow: `0 0 12px ${hexA(color, 0.9)}`,
            }}
          />
        </div>
        {/* edges */}
        <div style={{ position: "absolute", inset: 0, border: `1.5px solid ${hexA(color, 0.55)}` }} />
        {/* corner ticks */}
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <CornerTick key={c} pos={c} color={color} size={tick} />
        ))}

        {/* class tag */}
        <div
          style={{
            position: "absolute",
            top: -42,
            left: -1.5,
            display: "flex",
            alignItems: "stretch",
            opacity: tagP,
            transform: `translateY(${(1 - tagP) * 8}px)`,
          }}
        >
          <div
            style={{
              background: color,
              color: C.bgDeep,
              fontFamily: FONTS.mono,
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: 1.5,
              padding: "6px 12px",
              boxShadow: `0 0 18px ${hexA(color, 0.6)}`,
            }}
          >
            {label.toUpperCase()}
          </div>
          <div
            style={{
              background: hexA(C.bgDeep, 0.85),
              border: `1px solid ${hexA(color, 0.5)}`,
              borderLeft: "none",
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Mono size={13} color={color} glowPx={0}>
              {Math.round(confidence * 100)}%
            </Mono>
            <div style={{ width: 50, height: 5, background: hexA(color, 0.2), borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${confidence * 100 * tagP}%`, height: "100%", background: color }} />
            </div>
          </div>
        </div>

        {/* measurement leader to the right */}
        {showMeasure ? (
          <div style={{ position: "absolute", right: -2, top: "50%", opacity: measureP }}>
            <svg width="160" height="60" viewBox="0 0 160 60" style={{ position: "absolute", left: 0, top: -30 }}>
              <line x1="0" y1="30" x2={120 * measureP} y2="30" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="0" cy="30" r="3" fill={color} />
            </svg>
            <div
              style={{
                position: "absolute",
                left: 124,
                top: -44,
                background: hexA(C.bgDeep, 0.9),
                border: `1px solid ${hexA(color, 0.6)}`,
                borderRadius: 5,
                padding: "8px 12px",
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 30, fontWeight: 700, color }}>{widthMm.toFixed(1)}</span>
                <Mono size={15} color={color} glowPx={0}>
                  mm
                </Mono>
              </div>
              <Mono size={10} dim spacing={2} glowPx={0}>
                CRACK WIDTH
              </Mono>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const CornerTick: React.FC<{ pos: "tl" | "tr" | "bl" | "br"; color: string; size: number }> = ({ pos, color, size }) => {
  const t = pos[0] === "t";
  const l = pos[1] === "l";
  return (
    <div style={{ position: "absolute", width: size, height: size, [t ? "top" : "bottom"]: -2, [l ? "left" : "right"]: -2 }}>
      <div style={{ position: "absolute", [t ? "top" : "bottom"]: 0, [l ? "left" : "right"]: 0, width: size, height: 3, background: color, boxShadow: `0 0 8px ${hexA(color, 0.9)}` }} />
      <div style={{ position: "absolute", [t ? "top" : "bottom"]: 0, [l ? "left" : "right"]: 0, width: 3, height: size, background: color, boxShadow: `0 0 8px ${hexA(color, 0.9)}` }} />
    </div>
  );
};
