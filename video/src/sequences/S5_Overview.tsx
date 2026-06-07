import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTS, hexA, SEVERITY_COLORS } from "../theme";
import { DEFECT } from "../data/config";
import { HudTag, Mono } from "../components/hud/primitives";
import { Vignette } from "../components/Effects";
import { useFade, countUp } from "../util/anim";

export const S5_Overview: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade(durationInFrames, 10, 18);
  const mapped = Math.round(countUp(frame, DEFECT.defects.length, 40, 150));

  // shared Ken-Burns so the photo AND the markers move together (markers stay anchored)
  const kb = interpolate(frame, [0, durationInFrames], [1.06, 1.15]);
  const panX = interpolate(frame, [0, durationInFrames], [1.5, -2.5]);
  const panY = interpolate(frame, [0, durationInFrames], [0.5, -1.5]);

  // one-time scan sweep early
  const sweep = interpolate(frame, [16, 70], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sweepFade = interpolate(frame, [62, 74], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fade, background: C.bgDeep }}>
      {/* real aerial photo + anchored markers share one transform */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${kb}) translate(${panX}%, ${panY}%)`, transformOrigin: "50% 52%" }}>
          <Img src={staticFile("overview.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.05) saturate(0.98) brightness(0.78)" }} />

          {/* defect markers — inside the transformed group, so they track the building */}
          {DEFECT.defects.map((d, i) => {
            const a = interpolate(frame, [40 + i * 9, 40 + i * 9 + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const col = SEVERITY_COLORS[d.severity - 1];
            const r = 13 + d.severity * 3;
            const pulse = 1 + 0.08 * Math.sin((frame - i * 7) / 9);
            return (
              <div key={i} style={{ position: "absolute", left: `${d.x * 100}%`, top: `${d.y * 100}%`, transform: `translate(-50%,-50%) scale(${a})`, opacity: a }}>
                <div style={{ width: r * 2, height: r * 2, borderRadius: "50%", border: `2px solid ${col}`, background: hexA(col, 0.12), boxShadow: `0 0 ${r}px ${hexA(col, 0.7)}`, transform: `scale(${pulse})` }} />
                <div style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: 4, marginLeft: -2, marginTop: -2, borderRadius: "50%", background: col }} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* one-time scan sweep */}
      {frame < 76 ? (
        <AbsoluteFill style={{ pointerEvents: "none", opacity: sweepFade }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sweep}%`, width: 3, background: C.cyanBright, boxShadow: `0 0 24px 5px ${hexA(C.cyan, 0.8)}` }} />
        </AbsoluteFill>
      ) : null}

      <Vignette strength={0.5} />

      {/* top-left label + count (stacked, off the caption line) */}
      <div style={{ position: "absolute", left: 92, top: 150, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <HudTag>3D DEFECT MAP · BUILDING-RISK SCORE</HudTag>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 10, padding: "8px 16px", background: hexA("#04070b", 0.62), border: `1px solid ${hexA(C.cyan, 0.3)}`, borderRadius: 6, backdropFilter: "blur(3px)" }}>
          <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 30, color: C.cyan }}>{mapped}</span>
          <Mono size={14} color={C.textHi} glowPx={0} spacing={1}>/ {DEFECT.defects.length} DEFECTS · FULL FAÇADE COVERAGE</Mono>
        </div>
      </div>
    </AbsoluteFill>
  );
};
