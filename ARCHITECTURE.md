# Architecture

Facadia has two independent modules that share one product story: read a building
façade from drone footage, and turn it into (a) a graded, report-ready defect
record and (b) a navigable 3D model. Each module is self-contained — its own deps,
its own entry point, its own viewer — so they can be built and demoed separately.

```
                                  drone footage (any drone, any operator)
                                                 │
            ┌────────────────────────────────────┴────────────────────────────────────┐
            ▼                                                                            ▼
┌──────────────────────────── survey/  (the AI surveyor) ─────────────────────────────┐  ┌──── recon3d/ (3D) ─────┐
│                                                                                       │  │                        │
│  frames.py      detect.py                 reason.py            score.py  report.py     │  │  VGGT poses + depth     │
│  sharp frame ─▶ CV measurement ─▶ Claude (Opus 4.8) grades ─▶ health ─▶ report.json   │  │       │                 │
│  sampling       cracks: width/len          class · severity      0–100   + annotated   │  │       ▼                 │
│  (or stills)    spalling: area (rust)      cause · confidence            + draft MBIS   │  │  point cloud  OR        │
│                 px→mm via GSD              MBIS category · RI flag        + dashboard    │  │  AnySplat splat (live)  │
│                 (gsd.py)                   structured output (Pydantic)                  │  │       │                 │
│                                                                                         │  │       ▼                 │
└─────────────────────────────────────────────────────────────────────────────────────┘  │  GLB / fly-through MP4   │
            │                                                                              └────────────────────────┘
            ▼
   human Registered Inspector verifies & signs ✍  (legally required — we are assistive, not autonomous)
```

## survey/ — the hybrid surveyor (Mac, CPU)

The core IP is the split between a **ruler** and a **surveyor**:

| Stage | File | What | Why this split |
| --- | --- | --- | --- |
| Frames | `core/frames.py` | sharpest frame per window (variance-of-Laplacian), or a stills folder | motion blur ruins measurement |
| **Ruler** | `core/detect.py` | classical CV: cracks → medial-axis **width/length** (with Hough straight-line suppression so it tracks the crack, not rooflines); rust-stain → spalling/corrosion **area** | a VLM can't reliably count pixels; CV gives defensible mm |
| Scale | `core/gsd.py` | pixels → millimetres via ground sampling distance | the rubric is written in mm |
| **Surveyor** | `core/reason.py` | Claude grades: class, severity 1–5, cause, confidence, MBIS category, RI flag, drafted paragraph — measurements handed in as **fact** | reasoning + report + zero-shot on novel defects; never invents a measurement |
| Score | `core/score.py` | 0–100 building-health, super-linear severity penalty | a few critical defects must dominate; seeds the risk score |
| Report | `core/report.py` | annotated frames + `report.json` + draft MBIS `report.md` | the surface the dashboard renders and the RI signs |
| View | `dashboard/index.html` | self-contained Palantir-style console | no build step, offline-safe |

**Guardrails (assistive, not autonomous):** Claude never invents a measurement (mm
passed in as ground truth), every finding carries a confidence, anything tripping an
MBIS detailed-investigation trigger is flagged for the RI, and false positives
(window frames, joints, ground, people) are dropped. The RI makes the legal call.

**Grounded severity** (in the `reason.py` system prompt): HK Code of Practice for
Structural Use of Concrete 2013 (0.3 mm limit), BRE Digest 251 (width categories
0–5), BD CoP for MBIS & MWIS 2012 (detailed-investigation triggers).

## recon3d/ — the 3D layer (NVIDIA GPU)

Drone video → 3D. Two paths: an **optimization** path (VGGT poses/depth → point
cloud GLB, optionally Splatfacto Gaussian splatting for a photoreal fly-through),
and a **feed-forward live** path in `recon3d/inference/` that implements **AnySplat**
([arXiv:2505.23716](https://arxiv.org/abs/2505.23716)) — uncalibrated photos → 3D
Gaussians + camera poses in one forward pass, in seconds, no COLMAP. See
[`docs/anysplat.md`](docs/anysplat.md).

## Key decisions

- **CPU-first surveyor.** The whole grading pipeline runs on a laptop; only Claude
  needs the network. The GPU-heavy 3D work is a separate module.
- **Hardware-agnostic ingest.** Any drone footage or stills (`--clip` / `--images-dir`).
- **Structured output.** Claude returns a validated Pydantic object (`messages.parse`),
  so the report is machine-checkable, not free text.
- **Committed showcase.** `survey/demo/` holds a real run so the repo demos on clone.
