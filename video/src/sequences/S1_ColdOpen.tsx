import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTS, hexA } from "../theme";
import { CLIPS } from "../data/config";
import { Mono, Dot, Pill } from "../components/hud/primitives";
import { Vignette } from "../components/Effects";
import { useFade, ramp } from "../util/anim";

export const S1_ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const fade = useFade(durationInFrames, 8, 18);
  const blink = Math.floor(frame / 14) % 2 === 0;

  // SHOT 1 — pilot launches the drone (0 → ~3.4s)
  const pilotOut = interpolate(frame, [86, 102], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pilotLabel = interpolate(frame, [14, 30, 86, 102], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // SHOT 2 — DJI controller + live drone feed (~3 → ~7s)
  const ctrlIn = interpolate(frame, [88, 104], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctrlOut = interpolate(frame, [196, 212], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctrlVis = ctrlIn * ctrlOut;
  const ctrlLabel = interpolate(frame, [106, 122, 196, 212], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const coverTop = Math.max(pilotOut, ctrlVis);

  // AERIAL + TITLE (from ~7s)
  const scale = interpolate(frame, [200, durationInFrames], [1.04, 1.16]);
  const TITLE_AT = 224;
  const titleP = ramp(frame, TITLE_AT, TITLE_AT + 34);
  const titleOut = interpolate(frame, [durationInFrames - 40, durationInFrames - 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = ramp(frame, TITLE_AT + 8, TITLE_AT + 46) * 320;

  return (
    <AbsoluteFill style={{ background: C.bgDeep, opacity: fade }}>
      {/* establishing aerial (underneath) */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile("real.mp4")}
          trimBefore={Math.round(CLIPS.realEstablish.startSec * fps)}
          playbackRate={0.7}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})`, filter: "contrast(1.06) saturate(0.96) brightness(0.82)" }}
        />
      </AbsoluteFill>

      {/* SHOT 1 — pilot launch (vertical clip, blur-filled) */}
      {frame < 104 ? (
        <AbsoluteFill style={{ opacity: pilotOut, background: C.bgDeep }}>
          <OffthreadVideo
            src={staticFile("pilot.mp4")}
            trimBefore={Math.round(CLIPS.pilot.startSec * fps)}
            playbackRate={0.9}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)", filter: "blur(36px) brightness(0.4) saturate(1.1)" }}
          />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <OffthreadVideo
              src={staticFile("pilot.mp4")}
              trimBefore={Math.round(CLIPS.pilot.startSec * fps)}
              playbackRate={0.9}
              muted
              style={{ height: "100%", objectFit: "contain", filter: "contrast(1.05) saturate(1.02)" }}
            />
          </AbsoluteFill>
          <Vignette strength={0.7} />
          <CaptureLabel left blink={blink} opacity={pilotLabel} kicker="FIELD TEST" text="TUM GARCHING, MUNICH" pill="ANY DRONE · ANY OPERATOR" />
        </AbsoluteFill>
      ) : null}

      {/* SHOT 2 — DJI controller + live drone feed (landscape, full-frame) */}
      {frame >= 84 && frame < 214 ? (
        <AbsoluteFill style={{ opacity: ctrlVis, background: C.bgDeep }}>
          <OffthreadVideo
            src={staticFile("controller.mp4")}
            trimBefore={Math.round(CLIPS.controller.startSec * fps)}
            playbackRate={0.85}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.06) saturate(1.03) brightness(0.96)" }}
          />
          <Vignette strength={0.7} />
          <CaptureLabel blink={blink} opacity={ctrlLabel} kicker="LIVE FEED" text="DJI · IN FLIGHT" pill="STREAMED TO FACADIA" />
        </AbsoluteFill>
      ) : null}

      {/* aerial vignette + title scrim */}
      <AbsoluteFill style={{ opacity: 1 - coverTop }}>
        <Vignette strength={0.82} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: titleP * titleOut, background: `radial-gradient(46% 40% at 50% 50%, ${hexA("#000", 0.62)} 0%, transparent 70%)` }} />

      {/* title lockup */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: titleP * titleOut }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${(1 - titleP) * 14}px)` }}>
          <Mono size={15} color={C.cyan} spacing={6}>
            BUILT FOR HONG KONG · MBIS MANDATE
          </Mono>
          <div style={{ height: 1, width: lineW, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, margin: "20px 0 18px" }} />
          <h1 style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 96, letterSpacing: 8, color: C.white, margin: 0, textShadow: `0 0 40px ${hexA(C.cyan, 0.35)}` }}>
            FACADIA
          </h1>
          <Mono size={20} color={C.textMid} spacing={8} glowPx={0} style={{ marginTop: 6 }}>
            AI BUILDING SURVEYOR
          </Mono>
          <div style={{ display: "flex", gap: 22, marginTop: 22, opacity: ramp(frame, TITLE_AT + 26, TITLE_AT + 56) }}>
            {[["39,000", "HK buildings"], ["10,000", "over 50 years"], ["10-yr", "inspection cycle"]].map(([n, l], i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 26, color: C.cyan }}>{n}</span>
                <Mono size={11} dim spacing={1} glowPx={0}>{l}</Mono>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CaptureLabel: React.FC<{
  opacity: number;
  blink: boolean;
  kicker: string;
  text: string;
  pill: string;
  left?: boolean;
}> = ({ opacity, blink, kicker, text, pill }) => (
  <>
    <div style={{ position: "absolute", left: 92, top: 96, display: "flex", alignItems: "center", gap: 12, opacity }}>
      <Dot color={C.red} on={blink} />
      <Mono size={14} color={C.red} spacing={2}>{kicker}</Mono>
      <Mono size={14} color={C.textHi} glowPx={0}>{text}</Mono>
    </div>
    <div style={{ position: "absolute", left: 92, bottom: 150, opacity }}>
      <Pill color={C.cyan} size={13}>{pill}</Pill>
    </div>
  </>
);
