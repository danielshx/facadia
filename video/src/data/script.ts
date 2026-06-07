import { Cap } from "../components/hud/Caption";

/**
 * Single source of truth for narration timing.
 * VO[i].file → public/audio/vo/<file>; record each line separately.
 * Frames are GLOBAL (composition frames @30fps).
 */
export const VO: { file: string; from: number; dur: number; line: string }[] = [
  { file: "01.m4a", from: 30, dur: 258, line: "This is ordinary drone footage. No special hardware — just a building, and its defects, hidden in plain sight." },
  { file: "02.m4a", from: 450, dur: 138, line: "Watch what happens when our AI looks at it." },
  { file: "03.m4a", from: 715, dur: 276, line: "It pulls sharp frames, tiles them, and segments every pixel. A crack — located, outlined, measured." },
  { file: "04.m4a", from: 1010, dur: 282, line: "From the camera and its distance to the wall, one pixel becomes a real-world millimetre. This crack: one-point-eight millimetres wide." },
  { file: "05.m4a", from: 1430, dur: 396, line: "Then our own vision-language model reasons over the measurement — naming the defect, inferring the cause, grading severity against Hong Kong code. Severity four. Serious." },
  { file: "06.m4a", from: 2070, dur: 291, line: "Across the entire façade, every defect is mapped in 3D — full, systematic coverage no manual inspection can match." },
  { file: "07.m4a", from: 2660, dur: 201, line: "And it drafts the legally-required inspection report — for a Registered Inspector to verify and sign." },
  { file: "08.m4a", from: 3060, dur: 234, line: "The report, the defect map, the building-health record — delivered to the inspector, the owner, and the insurer." },
  { file: "09.m4a", from: 3340, dur: 129, line: "Facadia. See the building. Know the risk." },
];

/** Chunked captions (subtitle for muted viewing + key-term emphasis). */
// Sparse key-term accents — the VO carries the narration, captions just punctuate.
export const CAPS: Cap[] = [
  { text: "No special hardware.", from: 110, dur: 150, accent: true },
  { text: "One pixel → one real-world millimetre", from: 1130, dur: 160, accent: true },
  { text: "SEVERITY 4 · SERIOUS", from: 1745, dur: 150, accent: true },
  { text: "No manual inspection can match this.", from: 2250, dur: 185 },
  { text: "Delivered · inspector · owner · insurer", from: 3150, dur: 170, accent: true },
];
