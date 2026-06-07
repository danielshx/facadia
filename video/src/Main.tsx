import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { C } from "./theme";
import { T } from "./data/config";
import { CAPS } from "./data/script";

import { S1_ColdOpen } from "./sequences/S1_ColdOpen";
import { S2_Cutover } from "./sequences/S2_Cutover";
import { S3_Scan } from "./sequences/S3_Scan";
import { S4_Reasoning } from "./sequences/S4_Reasoning";
import { S5_Overview } from "./sequences/S5_Overview";
import { S6_Report } from "./sequences/S6_Report";
import { S8_Delivery } from "./sequences/S8_Delivery";
import { S7_Tagline } from "./sequences/S7_Tagline";

import { HudFrame } from "./components/hud/HudFrame";
import { CaptionTrack } from "./components/hud/Caption";
import { Grain, Vignette, Grade, Letterbox } from "./components/Effects";
import { AudioTrack } from "./components/AudioTrack";

const span = (s: { from: number; dur: number }) => ({ from: s.from, durationInFrames: s.dur });

export const Main: React.FC = () => {
  const gf = useCurrentFrame();

  const hudFrom = T.cutover.from + 40; // boot the chrome just after the twin is acquired
  const hudEnd = T.overview.from + T.overview.dur;

  let status = "SCANNING";
  if (gf >= T.reason.from) status = "ANALYSING";
  if (gf >= T.overview.from) status = "MAPPING";

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence {...span(T.coldOpen)}>
        <S1_ColdOpen />
      </Sequence>
      <Sequence {...span(T.cutover)}>
        <S2_Cutover />
      </Sequence>
      <Sequence {...span(T.scan)}>
        <S3_Scan />
      </Sequence>
      <Sequence {...span(T.reason)}>
        <S4_Reasoning />
      </Sequence>
      <Sequence {...span(T.overview)}>
        <S5_Overview />
      </Sequence>
      <Sequence {...span(T.report)}>
        <S6_Report />
      </Sequence>
      <Sequence {...span(T.delivery)}>
        <S8_Delivery />
      </Sequence>
      <Sequence {...span(T.tagline)}>
        <S7_Tagline />
      </Sequence>

      {/* persistent HUD chrome across the scanning phases */}
      <Sequence from={hudFrom} durationInFrames={hudEnd - hudFrom}>
        <HudFrame status={status} statusColor={C.cyan} bootStart={0} globalFrame={gf} />
      </Sequence>

      {/* global cinematic overlays */}
      <Grade />
      <Vignette strength={0.24} />
      <Grain opacity={0.03} />
      <CaptionTrack frame={gf} caps={CAPS} />
      <Letterbox height={62} />

      <AudioTrack />
    </AbsoluteFill>
  );
};
