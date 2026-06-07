import React from "react";
import { interpolate } from "remotion";
import { C, FONTS, hexA } from "../../theme";
import { Mono } from "./primitives";
import { typed } from "../../util/anim";

/** Claude VLM reasoning panel — slides in, types out the inferred cause. */
export const ReasoningCard: React.FC<{
  frame: number;
  start: number;
  defectClass: string;
  cause: string;
  anchor: string;
  action: string;
  width?: number;
}> = ({ frame, start, defectClass, cause, anchor, action, width = 620 }) => {
  const inP = interpolate(frame, [start, start + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const caret = Math.floor(frame / 8) % 2 === 0 ? "▍" : " ";
  const causeText = typed(frame, cause, start + 18, 0.8);
  const done = causeText.length >= cause.length;

  return (
    <div
      style={{
        width,
        background: `linear-gradient(180deg, ${hexA("#0b1620", 0.92)}, ${hexA("#070d14", 0.92)})`,
        border: `1px solid ${hexA(C.cyan, 0.35)}`,
        borderRadius: 12,
        padding: 26,
        backdropFilter: "blur(8px)",
        opacity: inP,
        transform: `translateX(${(1 - inP) * 40}px)`,
        boxShadow: `0 24px 80px ${hexA("#000", 0.6)}, 0 0 0 1px ${hexA(C.cyan, 0.05)}`,
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <EyeMark />
        <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, color: C.textHi, letterSpacing: 1 }}>
          FACADIA VISION
        </span>
        <Mono size={11} dim spacing={3} glowPx={0}>
          PROPRIETARY VLM · ZERO-SHOT
        </Mono>
        <div style={{ flex: 1 }} />
        <Mono size={12} color={C.cyan}>
          {defectClass.toUpperCase()}
        </Mono>
      </div>

      <div style={{ fontFamily: FONTS.body, fontSize: 21, lineHeight: 1.5, color: C.textHi, minHeight: 96 }}>
        <span style={{ color: C.cyan, fontFamily: FONTS.mono, fontSize: 14 }}>CAUSE › </span>
        {causeText}
        {!done ? <span style={{ color: C.cyan }}>{caret}</span> : null}
      </div>

      {/* chips */}
      <div style={{ display: "flex", gap: 12, marginTop: 18, opacity: done ? 1 : 0.25, transition: "opacity 0.3s" }}>
        <Chip k="ANCHOR" v={anchor} />
        <Chip k="ACTION" v={action} accent />
      </div>
    </div>
  );
};

const Chip: React.FC<{ k: string; v: string; accent?: boolean }> = ({ k, v, accent }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 3,
      padding: "8px 14px",
      borderRadius: 8,
      background: accent ? hexA(C.amber, 0.12) : hexA(C.cyan, 0.08),
      border: `1px solid ${hexA(accent ? C.amber : C.cyan, 0.4)}`,
    }}
  >
    <Mono size={9} dim spacing={3} glowPx={0}>
      {k}
    </Mono>
    <Mono size={13} color={accent ? C.amber : C.cyan} glowPx={0}>
      {v}
    </Mono>
  </div>
);

const EyeMark: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" style={{ filter: `drop-shadow(0 0 6px ${hexA(C.cyan, 0.9)})` }}>
    <path d="M2 13 C6 6 20 6 24 13 C20 20 6 20 2 13 Z" stroke={C.cyan} strokeWidth="1.6" fill={hexA(C.cyan, 0.08)} />
    <circle cx="13" cy="13" r="4.4" stroke={C.cyan} strokeWidth="1.6" />
    <circle cx="13" cy="13" r="1.6" fill={C.cyan} />
  </svg>
);
