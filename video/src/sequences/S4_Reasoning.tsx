import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { DEFECT } from "../data/config";
import { HeroDefect } from "../components/HeroDefect";
import { BoundingBox } from "../components/hud/BoundingBox";
import { ReasoningCard } from "../components/hud/ReasoningCard";
import { SeverityGauge } from "../components/hud/SeverityGauge";
import { HudTag } from "../components/hud/primitives";
import { useFade } from "../util/anim";

export const S4_Reasoning: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade(durationInFrames, 10, 16);
  const h = DEFECT.hero;
  const labelP = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <HeroDefect pushFrom={1.12} pushTo={1.2} />
      {/* darken further so cards read */}
      <AbsoluteFill style={{ background: "rgba(2,5,9,0.45)" }} />

      <div style={{ position: "absolute", left: 92, top: 150, opacity: labelP }}>
        <HudTag>FACADIA VISION · REASONING</HudTag>
      </div>

      {/* keep the locked detection visible, no big callout */}
      <BoundingBox frame={frame + 400} snapAt={0} box={h.bbox} label={h.class} confidence={h.confidence} severity={h.severity} widthMm={h.widthMm} showMeasure={false} />

      {/* reasoning card bottom-left */}
      <div style={{ position: "absolute", left: 120, bottom: 150 }}>
        <ReasoningCard frame={frame} start={24} defectClass={h.class} cause={h.cause} anchor={h.anchor} action={h.action} />
      </div>

      {/* severity gauge bottom-right */}
      <div style={{ position: "absolute", right: 150, bottom: 150 }}>
        <SeverityGauge frame={frame} start={300} severity={h.severity} size={260} />
      </div>
    </AbsoluteFill>
  );
};
