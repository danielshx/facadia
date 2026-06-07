<div align="center">

# Facadia

**The AI building surveyor** — reads a façade from ordinary drone footage,
grades every defect, and drafts the legally required inspection report.

[![CI](https://github.com/danielshx/Hawkeye/actions/workflows/ci.yml/badge.svg)](https://github.com/danielshx/Hawkeye/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Runs on CPU](https://img.shields.io/badge/surveyor-runs%20on%20CPU-success.svg)
![Built with Claude](https://img.shields.io/badge/built%20with-Claude%20Opus%204.8-d97757.svg)

![Facadia dashboard](docs/img/dashboard.png)

</div>

A vision-language model reads a building façade from ordinary drone footage,
**explains and grades every defect, and drafts the legally required MBIS inspection
report** — with a human Registered Inspector (RI) signing off. Every inspection
feeds a compounding building-health data layer that becomes a risk score for
buildings, sold to insurers, banks and government.

> EuroTech Hong Kong Hackathon — Munich 2026 · Smart City track.
> We sell to the licensed inspectors who are legally accountable, make them faster
> and lower their liability, and stay hardware-agnostic — *"they detect cracks, we
> write the inspection."*

---

## Two modules

| | What it does | Runs on |
| --- | --- | --- |
| 🧠 **[`survey/`](survey)** | **The product.** Façade frames → measure defects in mm (CV) → **Claude** grades/explains + drafts the MBIS report → health score + dashboard. | Mac / CPU |
| 🗺️ **[`recon3d/`](recon3d)** | **The 3D layer.** Drone video → navigable 3D model (point cloud or Gaussian-splat fly-through). The live path **implements [AnySplat](docs/anysplat.md)** (arXiv:2505.23716). | NVIDIA GPU |

The hybrid is the IP: **classical CV is the ruler** (precise, defensible mm
measurements), **Claude is the surveyor** (reasoning, severity, cause, the report,
zero-shot on defects no model was trained on). Severity is grounded in real HK/BRE
standards, not invented. Full design: **[ARCHITECTURE.md](ARCHITECTURE.md)**.

```
 drone footage ─▶ detect + measure (CV, mm) ─▶ Claude: class·severity·cause·report ─▶ MBIS report + health score
                       ground-truth mm handed to Claude as fact          ↳ human Registered Inspector signs ✍
```

---

## Quickstart — the surveyor (Mac, CPU)

```bash
cd survey
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env          # gitignored
uv run python run.py --images-dir data/samples --out demo --gsd 0.5
python -m http.server 8000     # open http://localhost:8000/dashboard/
```

A committed showcase already lives in `survey/demo/` — **clone the repo, open
`survey/dashboard/`**, and you see a real graded inspection (structural crack →
*Serious*, spalling with exposed corroding rebar → *Critical*, building-health
3/100) in the Palantir-style console above.

The 3D layer needs a GPU — see [`recon3d/README.md`](recon3d/README.md).

---

## Does it actually measure? (accuracy)

The "ruler" is testable. `survey/eval/measure_accuracy.py` draws synthetic cracks of
known width and measures them:

| True width | Measured | Abs. error |
| ---: | ---: | ---: |
| 4 mm | 5.8 mm | 1.8 mm |
| 6 mm | 7.7 mm | 1.7 mm |
| 8 mm | 9.8 mm | 1.8 mm |
| 10 mm | 11.5 mm | 1.5 mm |
| 12 mm | 10.2 mm | 1.8 mm |

**Mean absolute error ≈ 1.7 px** (sub-millimetre at a typical close-range drone GSD).
Hairline cracks below ~3 px are the stated limit — a zoom/thermal pass is the
roadmap fix (jury Q&A T6/T7). Claude never invents a measurement; the mm come from
CV and are handed to it as fact.

---

## Engineering

- **Tested + linted in CI** — `pytest` over the deterministic core (GSD, scoring,
  detection, report) + `ruff`, on every push ([workflow](.github/workflows/ci.yml)).
  Run locally: `cd survey && uv run --extra dev pytest`.
- **Structured output** — Claude returns a validated Pydantic object
  (`messages.parse`), so the report is machine-checkable, not free text.
- **CPU-first** — the whole grading pipeline runs on a laptop; only Claude needs
  the network. Reproducible via `uv` (`uv.lock` committed).
- **Source-only repo** — multi-GB drone videos are git-ignored; the demo ships as a
  small committed showcase.

## Why Hong Kong, why now

Hong Kong is the densest, oldest-stock, most safety-pressured vertical city on
earth, with a **legal inspection mandate** (MBIS: buildings 30+ yrs must inspect
external walls every 10 years, ~2,000 designated/year), a fatal 2025 façade fire,
the end of bamboo scaffolding, a government opening its low-altitude airspace, and
an insurance industry next door that pays for building-risk data. Manual inspection
is slow, dangerous and subjective. Facadia collapses the surveyor hours — not just
the drone flight — and compounds every inspection into a city-scale risk dataset.

## Repo layout

```
Facadia/
├── survey/        # the AI building surveyor (defect grading + MBIS report)  ← start here
│   ├── core/      #   frames · gsd · detect · reason (Claude) · score · report
│   ├── dashboard/ #   self-contained Palantir-style viewer
│   ├── eval/      #   measurement-accuracy harness
│   ├── tests/     #   pytest suite (CI)
│   └── demo/      #   committed showcase output
├── recon3d/       # 3D reconstruction (VGGT + Gaussian splatting; AnySplat live path)
├── docs/          # ARCHITECTURE, AnySplat write-up + paper, screenshots
├── ARCHITECTURE.md
└── CITATION.cff
```

## License

[MIT](LICENSE) for our code. Third-party models (VGGT, AnySplat, YOLO) and the
sample defect images keep their own licenses — see
[`docs/anysplat.md`](docs/anysplat.md), [`recon3d/README.md`](recon3d/README.md) and
[`survey/data/samples/ATTRIBUTION.md`](survey/data/samples/ATTRIBUTION.md).
