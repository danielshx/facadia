import React from "react";
import { C, FONTS, hexA, textGlow } from "../../theme";

export const Mono: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  dim?: boolean;
  weight?: number;
  spacing?: number;
  glowPx?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 18, color = C.cyan, dim, weight = 500, spacing = 2, glowPx = 6, style }) => (
  <span
    style={{
      fontFamily: FONTS.mono,
      fontSize: size,
      color: dim ? C.textDim : color,
      fontWeight: weight,
      letterSpacing: spacing,
      textShadow: glowPx ? textGlow(color, glowPx, 0.5) : undefined,
      ...style,
    }}
  >
    {children}
  </span>
);

/** Animated L-shaped corner bracket. `p` = 0..1 draw progress. */
export const Corner: React.FC<{
  pos: "tl" | "tr" | "bl" | "br";
  size?: number;
  thickness?: number;
  color?: string;
  p?: number;
  len?: number;
}> = ({ pos, size = 46, thickness = 3, color = C.cyan, p = 1, len }) => {
  const L = (len ?? size) * p;
  const vert: React.CSSProperties = {
    position: "absolute",
    width: thickness,
    height: L,
    background: color,
    boxShadow: `0 0 8px ${hexA(color, 0.8)}`,
  };
  const horz: React.CSSProperties = {
    position: "absolute",
    height: thickness,
    width: L,
    background: color,
    boxShadow: `0 0 8px ${hexA(color, 0.8)}`,
  };
  const corner = {
    tl: { top: 0, left: 0 },
    tr: { top: 0, right: 0 },
    bl: { bottom: 0, left: 0 },
    br: { bottom: 0, right: 0 },
  }[pos];
  return (
    <div style={{ position: "absolute", width: size, height: size, ...corner }}>
      <div style={{ ...vert, ...(pos[0] === "t" ? { top: 0 } : { bottom: 0 }), ...(pos[1] === "l" ? { left: 0 } : { right: 0 }) }} />
      <div style={{ ...horz, ...(pos[0] === "t" ? { top: 0 } : { bottom: 0 }), ...(pos[1] === "l" ? { left: 0 } : { right: 0 }) }} />
    </div>
  );
};

export const Pill: React.FC<{
  children: React.ReactNode;
  color?: string;
  filled?: boolean;
  size?: number;
}> = ({ children, color = C.cyan, filled, size = 15 }) => (
  <span
    style={{
      fontFamily: FONTS.mono,
      fontSize: size,
      fontWeight: 600,
      letterSpacing: 2.5,
      color: filled ? C.bgDeep : color,
      background: filled ? color : hexA(color, 0.1),
      border: `1px solid ${hexA(color, 0.6)}`,
      borderRadius: 4,
      padding: "4px 10px",
      textTransform: "uppercase",
      boxShadow: filled ? `0 0 16px ${hexA(color, 0.6)}` : "none",
    }}
  >
    {children}
  </span>
);

/** A blinking REC-style dot. */
export const Dot: React.FC<{ color?: string; on?: boolean; size?: number }> = ({
  color = C.red,
  on = true,
  size = 10,
}) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      opacity: on ? 1 : 0.25,
      boxShadow: `0 0 10px ${hexA(color, 0.9)}`,
    }}
  />
);

/** A phase label with a dark backing chip so it stays readable over bright footage. */
export const HudTag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({
  children,
  color = C.cyan,
  size = 15,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 14px",
      background: hexA("#04070b", 0.62),
      border: `1px solid ${hexA(color, 0.3)}`,
      borderRadius: 6,
      backdropFilter: "blur(3px)",
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
    <span style={{ fontFamily: FONTS.mono, fontSize: size, color, letterSpacing: 2.5, fontWeight: 600 }}>{children}</span>
  </div>
);

/** Tick-mark ruler row. */
export const TickRow: React.FC<{ count?: number; color?: string; w?: number }> = ({
  count = 40,
  color = C.cyan,
  w = 400,
}) => (
  <div style={{ display: "flex", gap: (w - count) / count, alignItems: "flex-end", height: 14 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          width: 1,
          height: i % 5 === 0 ? 14 : 7,
          background: hexA(color, i % 5 === 0 ? 0.7 : 0.35),
        }}
      />
    ))}
  </div>
);
