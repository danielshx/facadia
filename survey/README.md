# survey — the Facadia AI building surveyor

Reads a building façade from ordinary drone footage (or stills), **measures** each
defect in millimetres, has **Claude** name/grade/explain it, and drafts the
legally-required MBIS inspection report — with a human Registered Inspector (RI)
signing off. This is the core of Facadia. The sibling [`recon3d/`](../recon3d)
module is the 3D-geometry layer.

> Runs entirely on a Mac (CPU) — no GPU needed. Only the Claude reasoning step
> needs network + an API key.

![Facadia dashboard](../docs/img/dashboard.png)

## The hybrid: a ruler and a surveyor

```
drone frames ─▶ detect + measure (CV) ─▶ Claude grades & drafts ─▶ score ─▶ report + dashboard
 (frames.py)      cracks → width/length      class · severity 1–5      health     report.json
                  corrosion → area (mm)       cause · confidence        0–100      + annotated
                  via GSD (gsd.py)            MBIS category · RI flag              + draft MBIS .md
```

- **The ruler — `core/detect.py` (classical CV, no training).** Cracks are dark,
  thin, irregular: CLAHE → black-hat → Otsu → connected components → medial-axis
  width, with long straight Hough lines (rooflines, brick courses, window frames)
  erased so it tracks the crack, not the architecture. A second detector finds
  rust-stained **spalling/corrosion** patches by colour and measures their area.
  Pixels → millimetres via the **ground sampling distance** (`core/gsd.py`). It
  only ever reports what it can actually measure — the honest half of the hybrid.
- **The surveyor — `core/reason.py` (Claude).** Each measured crop + its mm
  numbers go to Claude (Opus 4.8 by default), which returns a structured verdict:
  defect class (the five MBIS finish-defect types), severity, likely cause,
  confidence, MBIS category, an RI flag, and a drafted report paragraph. Guardrails:
  it never invents a measurement (mm are passed in as fact), flags any MBIS
  detailed-investigation trigger for the RI, and drops false positives (window
  frames, joints, ground, rubble, people). Assistive, not autonomous.
- **Scoring — `core/score.py`.** A 0–100 building-health score with a super-linear
  severity penalty, so a few critical defects dominate many cosmetic ones (the seed
  of the city-scale risk score).
- **Report + dashboard — `core/report.py` + `dashboard/`.** Annotated frames, a
  machine-readable `report.json`, and a draft MBIS report grouped by statutory
  category, stamped *DRAFT — pending RI sign-off*. The dashboard renders it.

## Grounded severity rubric

Severity is not invented — it's anchored in three real, citable standards (encoded
in the Claude system prompt in `core/reason.py`):

- **HK Code of Practice for Structural Use of Concrete 2013** — 0.3 mm design
  crack-width limit.
- **BRE Digest 251** — crack-damage width categories 0–5.
- **BD Code of Practice for MBIS & MWIS 2012 (2023 Ed.)** — detailed-investigation
  triggers (→ "refer to RI").

Width alone never sets severity; corrosion context and location (a spall over a
public footpath outranks one over a private roof) can lift it.

## Run it

```bash
# 1) put your Claude key in survey/.env  (gitignored)
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env

# 2) install deps (CPU-only)
uv run python -c "import cv2, skimage, anthropic"     # first run syncs the venv

# 3a) on a folder of façade stills:
uv run python run.py --images-dir data/samples --out demo --gsd 0.5

# 3b) or straight from a drone clip:
uv run python run.py --clip ../DJI_0962_1080p.mp4 --out demo --standoff-m 15

# 4) view it
python -m http.server 8000      # then open http://localhost:8000/dashboard/
```

Key flags: `--gsd <mm/px>` (or `--standoff-m` to derive it from the camera model),
`--max-defects` per frame, `--model claude-sonnet-4-6` (faster/cheaper than the
Opus default), `--location-hint` (exposure context, affects severity),
`--building-name`. Output lands in `demo/` (`report.json`, `report.md`,
`annotated/`).

## Accuracy & tests

The measurement half is testable. `eval/measure_accuracy.py` draws synthetic cracks
of known width and measures them — **mean absolute error ≈ 1.7 px** on the reliable
band (≥4 px), i.e. sub-millimetre at a typical close-range drone GSD. Hairline
cracks below ~3 px are the stated limit (jury Q&A T6/T7).

```bash
uv run python eval/measure_accuracy.py        # prints the accuracy table
uv run --extra dev pytest                       # 14 fast, network-free tests
uv run --extra dev ruff check .                 # lint
```

CI runs `ruff` + `pytest` on every push (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).

## What's committed as a demo

`data/samples/` holds three open-licensed façade-defect photos (see
[`ATTRIBUTION.md`](data/samples/ATTRIBUTION.md)); the team's own drone footage is a
modern, defect-free building, so these stand in for an aging façade. `demo/` is a
**committed showcase** of a real run over them — clone the repo, open `dashboard/`,
and you see a graded inspection (structural crack → Serious, spalling with exposed
corroding rebar → Critical, building-health 3/100). Re-running `run.py` overwrites
it.

## Layout

```
survey/
├── run.py              # CLI: frames → detect+measure → Claude → score → report
├── core/
│   ├── frames.py       # sharp frame sampling (clip) / stills loader
│   ├── gsd.py          # ground sampling distance → pixels to millimetres
│   ├── detect.py       # CV crack measurement + rust/spalling detector
│   ├── reason.py       # Claude grading + the code-grounded severity rubric
│   ├── score.py        # 0–100 building-health score
│   └── report.py       # annotated frames + report.json + draft MBIS report.md
├── dashboard/index.html# self-contained viewer (loads ../demo/report.json)
├── eval/               # measurement-accuracy harness
├── tests/              # pytest suite (run in CI)
├── data/samples/       # open-licensed demo defect images (+ ATTRIBUTION.md)
└── demo/               # committed showcase output
```
