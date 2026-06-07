import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Dashboard } from "../components/Dashboard";
import { useFade } from "../util/anim";

export const S6_Report: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = useFade(durationInFrames, 12, 18);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Dashboard frame={frame} />
    </AbsoluteFill>
  );
};
