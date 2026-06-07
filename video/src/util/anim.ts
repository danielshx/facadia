import {
  interpolate,
  Easing,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1); // smooth "expo-out"
export const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);

/** Fade a sequence in at the start and out before the end. */
export const useFade = (durationInFrames: number, inF = 14, outF = 14) => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, inF, durationInFrames - outF, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IO }
  );
};

/** 0→1 eased progress over [start,end] frames. */
export const ramp = (
  frame: number,
  start: number,
  end: number,
  easing = EASE
) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Spring that starts at `delay`. */
export const useSpringAt = (delay: number, config = { damping: 18, mass: 0.7 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

/** Number of characters of `text` to reveal for a typewriter effect. */
export const typed = (
  frame: number,
  text: string,
  start: number,
  charsPerFrame = 0.9
) => {
  const n = Math.floor(Math.max(0, frame - start) * charsPerFrame);
  return text.slice(0, n);
};

/** Counts a number up from 0 → value over [start,end]. */
export const countUp = (
  frame: number,
  value: number,
  start: number,
  end: number
) => interpolate(frame, [start, end], [0, value], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: EASE,
});
