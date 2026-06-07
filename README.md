# Facadia

**The AI building surveyor.** A vision-language model reads a building façade from
ordinary drone footage, **explains and grades every defect, and drafts the legally
required inspection report** — with a human Registered Inspector (RI) signing off.
Underneath, every inspection feeds a compounding building-health data layer that
becomes a risk score for buildings, sold to insurers, banks and government.

> EuroTech Hong Kong Hackathon — Munich 2026 · Smart City track.
> We sell to the licensed inspectors who are legally accountable, make them faster
> and lower their liability, and stay hardware-agnostic — *"they detect cracks, we
> write the inspection."*

---

## Two modules

| | What it does | Runs on |
| --- | --- | --- |
| 🧠 **[`survey/`](survey)** | **The product.** Façade frames → measure defects in mm (CV) → **Claude** grades/explains + drafts the MBIS report → health score + dashboard. | Mac / CPU |
| 🗺️ **[`recon3d/`](recon3d)** | **The 3D layer.** Drone video → navigable 3D model (point cloud or Gaussian-splat fly-through) — scaled geometry to locate defects on, and the cinematic reveal. | NVIDIA GPU |

```
                       ┌───────────────────────────── survey/ (the surveyor) ─────────────────────────────┐
 drone footage ──┬──▶  │  detect + measure (CV, mm)  ──▶  Claude: class·severity·cause·report  ──▶  MBIS    │
                 │     │                     ground-truth mm handed to Claude as fact          report+score │
                 │     └──────────────────────────────────────────────────────────────────────────────────┘
                 │     ┌───────────────────────────── recon3d/ (the geometry) ───────────────────────────┐
                 └──▶  │  VGGT poses + depth  ──▶  point cloud / Gaussian splat  ──▶  navigable 3D model   │
                       └──────────────────────────────────────────────────────────────────────────────────┘
                                                  human Registered Inspector verifies & signs ✍
```

The hybrid is the IP: **classical CV is the ruler** (precise, defensible mm
measurements), **Claude is the surveyor** (reasoning, severity, cause, the report,
zero-shot on defects no model was trained on). Severity is grounded in real HK/BRE
standards, not invented — details in [`survey/README.md`](survey/README.md).

---

## Quickstart

**The surveyor (Mac, CPU):**
```bash
cd survey
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env          # gitignored
uv run python run.py --images-dir data/samples --out demo --gsd 0.5
python -m http.server 8000   # open http://localhost:8000/dashboard/
```
A committed showcase is already in `survey/demo/` — clone the repo and open
`survey/dashboard/` to see a real graded inspection (structural crack → *Serious*,
spalling with exposed corroding rebar → *Critical*, building-health 3/100), in a
Palantir-style console.

**The 3D layer (GPU pod):** see [`recon3d/README.md`](recon3d/README.md) — it needs
an NVIDIA GPU (RunPod), not the Mac.

---

## Why this, why Hong Kong, why now

Hong Kong is the densest, oldest-stock, most safety-pressured vertical city on
earth, with a **legal inspection mandate** (MBIS: buildings 30+ yrs must inspect
external walls every 10 years, ~2,000 designated/year), a fatal 2025 façade fire,
the end of bamboo scaffolding, a government opening its low-altitude airspace, and
an insurance industry next door that will pay for building-risk data. Manual
inspection is slow, dangerous and subjective. Facadia collapses the surveyor hours,
not just the drone flight — and compounds every inspection into a city-scale
building-risk dataset.

## Repo layout

```
Facadia/
├── survey/     # the AI building surveyor (defect grading + MBIS report)   ← start here
├── recon3d/    # 3D reconstruction (VGGT + Gaussian splatting)
└── README.md
```

Large drone videos are git-ignored (kept on disk / the GPU pod), so the repo stays
source-only. See each module's README for details.

## License

[MIT](LICENSE) for our code. Third-party models (VGGT, YOLO) and the sample defect
images keep their own licenses — see `recon3d/README.md` and
`survey/data/samples/ATTRIBUTION.md`.
