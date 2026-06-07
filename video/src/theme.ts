import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const FONTS = {
  display: inter.fontFamily,
  body: inter.fontFamily,
  mono: mono.fontFamily,
};

/** Cinematic HUD palette — deep near-black with a scanner-cyan accent. */
export const C = {
  bg: "#04070B",
  bgDeep: "#020407",
  panel: "rgba(9, 15, 21, 0.72)",
  panelSolid: "#0A1118",
  line: "rgba(45, 226, 214, 0.28)",
  lineFaint: "rgba(45, 226, 214, 0.12)",

  cyan: "#2DE2D6",
  cyanBright: "#8BFFF3",
  cyanDim: "#1B8E88",

  amber: "#FFB627",
  red: "#FF4D5E",

  textHi: "#EAF6F6",
  textMid: "#9FB4BA",
  textDim: "rgba(234, 246, 246, 0.45)",

  white: "#FFFFFF",
};

/** Severity 1–5 color ramp (BRE / MBIS grounded). */
export const SEVERITY_COLORS = [
  "#38D39F", // 1 cosmetic
  "#9BD64A", // 2 minor
  "#FFC53D", // 3 moderate
  "#FF7A45", // 4 serious
  "#FF3B5C", // 5 critical
];

export const SEVERITY_LABELS = [
  "Cosmetic",
  "Minor",
  "Moderate",
  "Serious",
  "Critical",
];

export const glow = (color: string, px = 14, opacity = 0.9) =>
  `drop-shadow(0 0 ${px}px ${hexA(color, opacity)})`;

export const textGlow = (color: string, px = 10, opacity = 0.85) =>
  `0 0 ${px}px ${hexA(color, opacity)}`;

/** Apply alpha to a hex color. */
export function hexA(hex: string, alpha: number) {
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
