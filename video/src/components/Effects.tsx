import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, hexA } from "../theme";

/** Subtle film grain (animated noise via SVG turbulence) + vignette. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const frame = useCurrentFrame();
  const seed = (frame % 8) + 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(120% 100% at 50% 45%, transparent 45%, ${hexA(
        "#000000",
        strength
      )} 100%)`,
    }}
  />
);

/** CRT-style scanlines — sells the "digital twin render" look. */
export const Scanlines: React.FC<{ opacity?: number; gap?: number }> = ({
  opacity = 0.18,
  gap = 3,
}) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      backgroundImage: `repeating-linear-gradient(0deg, ${hexA(
        "#000000",
        0.0
      )} 0px, ${hexA("#000000", 0.0)} ${gap}px, ${hexA(
        C.bgDeep,
        1
      )} ${gap}px, ${hexA(C.bgDeep, 1)} ${gap + 1}px)`,
      opacity,
    }}
  />
);

/** Cinematic letterbox bars (top + bottom). */
export const Letterbox: React.FC<{ height?: number }> = ({ height = 62 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height, background: "#000" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height, background: "#000" }} />
  </AbsoluteFill>
);

/** Restrained cinematic colour grade — subtle teal shadows, warm highlights. */
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {/* teal shadows / warm highlights — kept gentle so footage reads as real */}
    <AbsoluteFill
      style={{
        mixBlendMode: "soft-light",
        opacity: 0.28,
        background: `linear-gradient(180deg, ${hexA("#0e3a4a", 1)} 0%, ${hexA("#0a141c", 1)} 55%, ${hexA("#1c1206", 1)} 100%)`,
      }}
    />
  </AbsoluteFill>
);

/** A faint engineering grid. */
export const Grid: React.FC<{ opacity?: number; size?: number; color?: string }> = ({
  opacity = 0.1,
  size = 64,
  color = C.cyan,
}) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      opacity,
      backgroundImage: `linear-gradient(${hexA(color, 0.5)} 1px, transparent 1px), linear-gradient(90deg, ${hexA(
        color,
        0.5
      )} 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      maskImage:
        "radial-gradient(120% 100% at 50% 50%, black 30%, transparent 80%)",
    }}
  />
);
