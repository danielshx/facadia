import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONTS, FPS, hexA } from "../theme";
import { CLIPS, DEFECT } from "../data/config";

import { DigitalTwin } from "../components/DigitalTwin";
import { HeroDefect } from "../components/HeroDefect";
import { Dashboard } from "../components/Dashboard";
import { ScanLine, Reticle } from "../components/hud/Scan";
import { BoundingBox } from "../components/hud/BoundingBox";
import { ReasoningCard } from "../components/hud/ReasoningCard";
import { SeverityGauge } from "../components/hud/SeverityGauge";
import { HudFrame } from "../components/hud/HudFrame";
import { Mono, Pill, HudTag } from "../components/hud/primitives";
import { Grade, Vignette, Letterbox } from "../components/Effects";
import { S7_Tagline } from "../sequences/S7_Tagline";
import { useFade } from "../util/anim";

/**
 * FacadiaLoop — a tight ~36s README loop.
 *
 * Built ENTIRELY from the same components as the 2-min film, but re-choreographed
 * for a silent, autoplaying, looping GitHub GIF: big readable beats, no film grain
 * (grain murders GIF palettes), and a fade-to-black seam so the loop is seamless.
 *
 * The full 120s "Facadia" composition is untouched — this is additive.
 */

const F = (sec: number) => Math.round(sec * FPS);

const LT = {
  total: F(36),
  cutover: { from: F(0), dur: F(6.4) },
  scan: { from: F(6.0), dur: F(7.6) },
  reason: { from: F(13.2), dur: F(8.0) },
  report: { from: F(20.8), dur: F(8.0) },
  tagline: { from: F(28.4), dur: F(7.6) },
};

const span = (s: { from: number; dur: number }) => ({ from: s.from, durationInFrames: s.dur });

// A shorter, punchier cause for the loop (the film uses the full sentence).
const LOOP_CAUSE =
  "Chloride-induced rebar corrosion under coastal exposure — expansive rust opens the surface crack.";

export const LoopMain: React.FC = () => {
  const gf = useCurrentFrame();

  const hudFrom = LT.scan.from;
  const hudEnd = LT.reason.from + LT.reason.dur;
  const status = gf >= LT.reason.from ? "ANALYSING" : "SCANNING";

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence {...span(LT.cutover)}>
        <LoopCutover />
      </Sequence>
      <Sequence {...span(LT.scan)}>
        <LoopScan />
      </Sequence>
      <Sequence {...span(LT.reason)}>
        <LoopReason />
      </Sequence>
      <Sequence {...span(LT.report)}>
        <LoopReport />
      </Sequence>
      <Sequence {...span(LT.tagline)}>
        <S7_Tagline />
      </Sequence>

      {/* persistent instrument chrome across the scan + reasoning beats */}
      <Sequence from={hudFrom} durationInFrames={hudEnd - hudFrom}>
        <HudFrame status={status} statusColor={C.cyan} bootStart={0} globalFrame={gf} />
      </Sequence>

      {/* cinematic overlays — NO grain (keeps the GIF clean + small) */}
      <Grade />
      <Vignette strength={0.22} />
      <Letterbox height={56} />
    </AbsoluteFill>
  );
};

/* ── B1 · drone footage → scan-wipe → digital twin ─────────────────────── */
const LoopCutover: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const fade = useFade(durationInFrames, 10, 14);

  const WIPE_START = 42;
  const WIPE_END = 98;
  const p = interpolate(frame, [WIPE_START, WIPE_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(frame, [WIPE_START + 22, WIPE_START + 28, WIPE_START + 44], [0, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const realScale = interpolate(frame, [0, durationInFrames], [1.04, 1.12]);

  // title is visible from the very first frame (great GIF poster), clears as the wipe runs
  const titleP = interpolate(frame, [4, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleOut = interpolate(frame, [WIPE_START - 6, WIPE_START + 18], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [10, 40], [0, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const acquiredP = interpolate(frame, [WIPE_END - 4, WIPE_END + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bgDeep, opacity: fade }}>
      {/* twin underneath */}
      <DigitalTwin startSec={CLIPS.simFacade.startSec} playbackRate={0.7} blur={0.6} />

      {/* real footage on top, wiped left→right to reveal the twin */}
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${p * 100}%)`, overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile("real.mp4")}
          trimBefore={Math.round(CLIPS.realFacade.startSec * fps)}
          playbackRate={0.7}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${realScale})`, filter: "contrast(1.05) saturate(0.98) brightness(0.9)" }}
        />
        <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 45%, transparent 45%, ${hexA("#000", 0.6)} 100%)` }} />
      </AbsoluteFill>

      {/* the scan-wipe line */}
      {frame >= WIPE_START && frame <= WIPE_END + 4 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${p * 100}%`, width: 4, background: C.cyanBright, boxShadow: `0 0 40px 10px ${hexA(C.cyan, 0.9)}` }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${p * 100}%`, width: 90, marginLeft: -90, background: `linear-gradient(90deg, transparent, ${hexA(C.cyan, 0.22)})` }} />
        </AbsoluteFill>
      ) : null}

      {/* white flash on crossing */}
      <AbsoluteFill style={{ background: C.white, opacity: flash, pointerEvents: "none" }} />

      {/* title lockup (poster frame) */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: titleP * titleOut, pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${(1 - titleP) * 12}px)` }}>
          <Mono size={16} color={C.cyan} spacing={6}>
            ORDINARY DRONE FOOTAGE
          </Mono>
          <div style={{ height: 1, width: lineW, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, margin: "20px 0 16px" }} />
          <h1 style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 104, letterSpacing: 8, color: C.white, margin: 0, textShadow: `0 0 40px ${hexA(C.cyan, 0.35)}` }}>
            FACADIA
          </h1>
          <Mono size={22} color={C.textMid} spacing={8} glowPx={0} style={{ marginTop: 8 }}>
            THE AI BUILDING SURVEYOR
          </Mono>
        </div>
      </AbsoluteFill>

      {/* DIGITAL TWIN acquired badge after the wipe */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 150, pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: acquiredP, transform: `translateY(${(1 - acquiredP) * 12}px)` }}>
          <Pill color={C.cyan} filled size={15}>DIGITAL TWIN · ACQUIRED</Pill>
          <Mono size={14} dim spacing={3} glowPx={0}>RECONSTRUCTED FROM A SINGLE FLY-BY</Mono>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ── B2 · scan → lock → measure in mm ──────────────────────────────────── */
const LoopScan: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade(durationInFrames, 12, 16);
  const h = DEFECT.hero;
  const cx = h.bbox.x + h.bbox.w / 2;
  const cy = h.bbox.y + h.bbox.h / 2;
  const labelP = interpolate(frame, [4, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <HeroDefect />

      <div style={{ position: "absolute", left: 92, top: 150, opacity: labelP }}>
        <HudTag>CV SEGMENTATION · MASK</HudTag>
      </div>

      <ScanLine frame={frame} start={16} end={74} />
      <Reticle frame={frame} x={cx} y={cy} lockAt={80} />
      <BoundingBox
        frame={frame}
        snapAt={88}
        box={h.bbox}
        label={h.class}
        confidence={h.confidence}
        severity={h.severity}
        widthMm={h.widthMm}
      />
    </AbsoluteFill>
  );
};

/* ── B3 · VLM reasons + grades severity ────────────────────────────────── */
const LoopReason: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade(durationInFrames, 12, 16);
  const h = DEFECT.hero;
  const labelP = interpolate(frame, [4, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <HeroDefect pushFrom={1.12} pushTo={1.2} />
      <AbsoluteFill style={{ background: "rgba(2,5,9,0.45)" }} />

      <div style={{ position: "absolute", left: 92, top: 150, opacity: labelP }}>
        <HudTag>FACADIA-VLM · REASONING</HudTag>
      </div>

      {/* keep the locked detection visible */}
      <BoundingBox frame={frame + 400} snapAt={0} box={h.bbox} label={h.class} confidence={h.confidence} severity={h.severity} widthMm={h.widthMm} showMeasure={false} />

      <div style={{ position: "absolute", left: 120, bottom: 150 }}>
        <ReasoningCard frame={frame} start={8} defectClass={h.class} cause={LOOP_CAUSE} anchor={h.anchor} action={h.action} />
      </div>

      <div style={{ position: "absolute", right: 150, bottom: 150 }}>
        <SeverityGauge frame={frame} start={92} severity={h.severity} size={300} />
      </div>
    </AbsoluteFill>
  );
};

/* ── B4 · the auto-drafted MBIS dashboard ──────────────────────────────── */
const LoopReport: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade(durationInFrames, 12, 18);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Dashboard frame={frame} />
    </AbsoluteFill>
  );
};
