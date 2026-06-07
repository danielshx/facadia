import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTS, hexA } from "../../theme";
import { DEFECT } from "../../data/config";
import { Corner, Mono, Dot, Pill } from "./primitives";
import { ramp } from "../../util/anim";

const pad = (n: number, l = 2) => String(Math.floor(n)).padStart(l, "0");

/** Persistent HUD chrome: corner brackets + top/bottom status rails. */
export const HudFrame: React.FC<{
  status?: string;
  statusColor?: string;
  bootStart?: number;
  globalFrame?: number; // for a continuous timecode across sequences
}> = ({ status = "SCANNING", statusColor = C.cyan, bootStart = 0, globalFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = ramp(frame, bootStart, bootStart + 18);
  const tcFrame = globalFrame ?? frame;
  const secs = tcFrame / fps;
  const tc = `${pad(secs / 60)}:${pad(secs % 60)}:${pad((tcFrame % fps) * (100 / fps))}`;
  const blink = Math.floor(frame / 14) % 2 === 0;

  const railStyle: React.CSSProperties = {
    position: "absolute",
    left: 92,
    right: 92,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    opacity: p,
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* readability bands behind the top & bottom rails */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 128, background: `linear-gradient(180deg, ${hexA("#04070b", 0.62)}, transparent)`, opacity: p }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 128, background: `linear-gradient(0deg, ${hexA("#04070b", 0.62)}, transparent)`, opacity: p }} />

      {/* corner brackets */}
      <div style={{ position: "absolute", inset: 84 }}>
        <Corner pos="tl" p={p} color={statusColor} />
        <Corner pos="tr" p={p} color={statusColor} />
        <Corner pos="bl" p={p} color={statusColor} />
        <Corner pos="br" p={p} color={statusColor} />
      </div>

      {/* top rail */}
      <div style={{ ...railStyle, top: 88 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo color={statusColor} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 19, color: C.textHi, letterSpacing: 4 }}>
              FACADIA
            </span>
            <Mono size={11} dim spacing={3} glowPx={0}>
              AI BUILDING SURVEYOR
            </Mono>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Dot on={blink} />
          <Mono size={14} color={C.red} spacing={2}>
            REC
          </Mono>
          <Mono size={16} color={C.textHi} glowPx={0}>
            {tc}
          </Mono>
        </div>
      </div>

      {/* bottom rail */}
      <div style={{ ...railStyle, bottom: 88 }}>
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <KV k="GSD" v={`${DEFECT.gsd.mmPerPx.toFixed(2)} mm/px`} c={statusColor} />
          <KV k="STANDOFF" v={`${DEFECT.gsd.standoffM} m`} c={statusColor} />
          <KV k="SENSOR" v={DEFECT.gsd.sensor} c={statusColor} />
        </div>
        <Pill color={statusColor} filled size={13}>
          {status}
        </Pill>
      </div>
    </AbsoluteFill>
  );
};

const KV: React.FC<{ k: string; v: string; c: string }> = ({ k, v, c }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Mono size={10} dim spacing={3} glowPx={0}>
      {k}
    </Mono>
    <Mono size={15} color={c}>
      {v}
    </Mono>
  </div>
);

const Logo: React.FC<{ color: string }> = ({ color }) => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
    <circle cx="17" cy="17" r="15" stroke={hexA(color, 0.5)} strokeWidth="1.5" />
    <circle cx="17" cy="17" r="6" stroke={color} strokeWidth="2" />
    <circle cx="17" cy="17" r="2" fill={color} />
    <path d="M17 0 V8 M17 26 V34 M0 17 H8 M26 17 H34" stroke={color} strokeWidth="1.5" />
  </svg>
);
