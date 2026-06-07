# Facadia — 2-min Technical Demo Video (Remotion)

Cinematic technical pitch video for the **AI Building Surveyor**. Real drone
footage flies a façade → **scan-wipe cutover** into the 3D digital-twin (gaussian
splat) → Iron-Man HUD scans a defect, measures it in mm, Claude grades severity,
the façade is mapped in 3D, and an auto-drafted MBIS report appears. 1920×1080 · 30fps · 120s.

## Quick start

```bash
cd video
npm install
npm run dev          # open Remotion Studio to preview/scrub
npm run render       # final MP4 → out/facadia.mp4
npm run render:fast  # half-res preview → out/facadia_preview.mp4
npm run render:loop  # short ~36s README loop → out/facadia-loop.mp4
```

## Two compositions

| ID | Length | Purpose | Source |
|----|--------|---------|--------|
| `Facadia` | 120s | the cinematic technical pitch film | `src/Main.tsx` + `src/sequences/` |
| `FacadiaLoop` | 36s | the silent, looping **README GIF** | `src/loop/LoopMain.tsx` |

`FacadiaLoop` is built entirely from the same components as the film, just
re-choreographed for an autoplaying GitHub GIF (big readable beats, no film grain —
grain wrecks GIF palettes — and a fade-to-black seam so the loop is seamless).

### Rebuilding the README GIF (`docs/img/demo.gif`)

```bash
npm run render:loop                       # out/facadia-loop.mp4 (1080p)
SRC=out/facadia-loop.mp4
# two-pass palette → crisp, small GIF; then a lossy pass to shave ~30%
ffmpeg -y -i "$SRC" -vf "fps=12,scale=800:-1:flags=lanczos,palettegen=stats_mode=diff:max_colors=200" /tmp/pal.png
ffmpeg -y -i "$SRC" -i /tmp/pal.png -lavfi "fps=12,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4" /tmp/demo.gif
gifsicle -O3 --lossy=60 /tmp/demo.gif -o ../docs/img/demo.gif   # ~12 MB, 800×450
```

## Timeline (edit in `src/data/config.ts → T`)

| Seq | Time | What |
|-----|------|------|
| S1 ColdOpen | 0–14.5s | **Pilot launches drone → DJI controller live-feed** → aerial + FACADIA title + HK stats |
| S2 Cutover  | 13.7–23s | Real façade → scan-wipe → **digital twin** |
| S3 Scan     | 23–47s | Scan line · reticle lock · bounding box · **1.8 mm** |
| S4 Reasoning| 46.7–68s | Claude reasoning card + **Severity 4** gauge |
| S5 Overview | 68–88s | Twin orbit + defect heatmap (full coverage) |
| S6 Report   | 87.7–102.7s | Auto-drafted MBIS dashboard + health score |
| S8 Delivery | 101.6–109.5s | **Documents delivered** → inspector · owner · insurer |
| S7 Tagline  | 108.7–120s | "They detect cracks. We write the inspection." |

## ⬇️ Drop your assets in — then flip the flags in `src/data/config.ts`

| Asset | Put it at | Then set |
|-------|-----------|----------|
| **VO lines** (English, 1 file per line) | `public/audio/vo/01.m4a … 09.m4a` | `ASSETS.hasVO = true` |
| **Music** (cinematic, royalty-free) | `public/audio/music.mp3` | `ASSETS.hasMusic = true` |
| **Macro defect clip** (real crack/spall) | `public/macro/hero.mp4` | `ASSETS.heroIsVideo = true` |
| **Real survey output** (mm, severity, report) | overwrite `src/defect.json` | — |

VO line texts + exact cue frames live in `src/data/script.ts` (also drives the captions).
Until assets arrive the video renders fully: silent, with a placeholder defect
(the water-stain on your own building's concrete canopy) and `defect.json` demo numbers.

## The numbers are data-driven

Everything the HUD shows — crack width, GSD, severity, confidence, health score,
the report lines, the heatmap — comes from `src/defect.json`. Replace it with real
output from `survey/` (`gsd.py` → mm, `score.py` → severity, `report.py` → text)
and the video updates itself. **Nothing is hard-coded into the visuals.**

## Tuning the cutover (the hero shot)

- Which real moment wipes into the twin: `CLIPS.realFacade.startSec` in `config.ts`.
- Wipe timing: `WIPE_START` / `WIPE_END` in `src/sequences/S2_Cutover.tsx`.
- The twin's hologram look (blur, scanlines, RGB-split, cyan tint): `src/components/DigitalTwin.tsx`.

## Structure

```
src/
  Main.tsx              master timeline (composes all sequences + overlays)
  Root.tsx / index.ts   Remotion composition registration
  theme.ts              colours, fonts, severity ramp
  data/
    config.ts           timeline T, asset flags, clip trims
    script.ts           VO cues + captions (single source of truth)
  defect.json           survey output → drives every HUD number
  sequences/            S1…S7
  components/
    DigitalTwin.tsx     splat flythrough + hologram treatment
    HeroDefect.tsx      the macro defect that gets scanned
    Dashboard.tsx       auto-drafted inspection report UI
    Effects.tsx         grain / vignette / scanlines / grid
    hud/                ScanLine, Reticle, BoundingBox, SeverityGauge,
                        HealthScore, ReasoningCard, Caption, HudFrame, primitives
```

Large media (`public/real.mp4`, `public/sim.mp4`, audio) is git-ignored.
