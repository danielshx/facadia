import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { LoopMain } from "./loop/LoopMain";
import { FPS, WIDTH, HEIGHT } from "./theme";
import { T } from "./data/config";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* the full 2-min cinematic technical film */}
      <Composition
        id="Facadia"
        component={Main}
        durationInFrames={T.total}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {/* the short ~36s README loop (rendered to an embeddable GIF) */}
      <Composition
        id="FacadiaLoop"
        component={LoopMain}
        durationInFrames={Math.round(36 * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
