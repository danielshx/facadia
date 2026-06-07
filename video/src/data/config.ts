import { FPS } from "../theme";
import defect from "../defect.json";

export const DEFECT = defect;

/**
 * Asset flags — flip these to true as real assets land. The video renders
 * fully WITHOUT any of them (uses the still placeholder + no audio).
 */
export const ASSETS = {
  hasVO: true, // public/audio/vo/01..09.m4a present
  hasMusic: false, // set true once public/audio/music.mp3 exists
  music: "audio/music.mp3",

  // The "hero" defect that gets scanned. If heroIsVideo=false, the still is used.
  heroIsVideo: false,
  heroVideo: "macro/hero.mp4",
  heroStill: "macro/placeholder.jpg",
};

const s = (sec: number) => Math.round(sec * FPS);

/**
 * Master timeline (seconds). Sequences overlap slightly for crossfades.
 * Tweak these freely — everything else keys off them.
 */
export const T = {
  total: s(120),

  coldOpen: { from: s(0), dur: s(14.5) },
  cutover: { from: s(13.7), dur: s(9.6) },
  scan: { from: s(23.0), dur: s(24.0) },
  reason: { from: s(46.7), dur: s(21.6) },
  overview: { from: s(68.0), dur: s(20.0) },
  report: { from: s(87.7), dur: s(15.0) },
  delivery: { from: s(101.6), dur: s(8.0) },
  tagline: { from: s(108.7), dur: s(11.3) },
};

/**
 * Trim windows into the source clips (in seconds of the source video).
 * Adjust if you want a different moment for the cold-open / cutover.
 */
export const CLIPS = {
  // Pilot launching the drone (IMG_5566.mov → pilot.mp4, vertical, 6s)
  pilot: { startSec: 0, label: "field capture · pilot launch" },
  // DJI controller + live drone feed on the phone screen (Drone_Controller.mp4, 720p landscape, 15s)
  controller: { startSec: 2.0, label: "live feed · DJI controller" },
  // Real drone footage (DJI_0962_1080p.mp4, ~290s, 30fps)
  realEstablish: { startSec: 40, label: "aerial sweep" },
  realFacade: { startSec: 198, label: "frontal façade → canopy" },
  // Simulation flythrough (drone_sim_flythrough.mp4, ~45s, ~60fps)
  simFacade: { startSec: 0, label: "twin frontal façade" },
  simOrbit: { startSec: 8, label: "twin orbit" },
};

export { s as sec };
