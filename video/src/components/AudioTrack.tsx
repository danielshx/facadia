import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { ASSETS } from "../data/config";
import { VO } from "../data/script";

/**
 * Conditional audio. Renders nothing until the assets exist (flags in config.ts).
 * Music ducks under VO automatically is handled by recording levels; here we
 * just lay music at a bed level and VO at full.
 */
export const AudioTrack: React.FC = () => (
  <>
    {ASSETS.hasMusic ? (
      <Audio src={staticFile(ASSETS.music)} volume={0.32} loop />
    ) : null}

    {ASSETS.hasVO
      ? VO.map((v) => (
          <Sequence key={v.file} from={v.from} durationInFrames={v.dur}>
            <Audio src={staticFile(`audio/vo/${v.file}`)} volume={1} />
          </Sequence>
        ))
      : null}
  </>
);
