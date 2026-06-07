# HONESTY.md

> Mandatory disclosure for the hackathon. This file lives at the root of your repository. Judges cross-check it against your code and your technical video.
>
> **The deal:** disclosed shortcuts are **not** penalized — that is the entire point of this file. Hidden ones are. Undisclosed pre-built code is heavily penalized, each undisclosed mock carries a small penalty, and a faked demo is heavily penalized. Telling the truth here costs you nothing.

---

## 1. Team — who did what
Judges compare this against `git shortlog -sn`, so keep it honest.

| Member | GitHub handle | Main contributions |
|---|---|---|
| Daniel | danielshx | Tech-stack integration; built the `survey/` defect pipeline + dashboard and the `recon3d/` 3D work. **Almost all git commits are under this account** (the build ran on his machine, with AI coding assistance — see §7). |
| Geart | _(add)_ | AI/architecture direction for the hybrid pipeline and grading approach. |
| Lucas | _(add)_ | Civil engineering & materials: the code-grounded severity rubric and HK/BRE standards research. |
| Rodrigo | _(add)_ | Go-to-market, business model, pitch narrative, and the business/demo video. |

> Honest note: the commit history is concentrated under one account; it does **not** reflect a solo build. Domain (Lucas), AI/architecture (Geart) and GTM/pitch (Rodrigo) contributions landed via the rubric, research, deck and videos rather than via commits.

---

## 2. What is fully working
Features that run end-to-end on the live app, with real data and real logic.

- **CV defect measurement** (`survey/core/detect.py`): input = façade frames or stills → output = detected cracks with **real mm width/length** (medial-axis) and rust-stained spalling/corrosion patches with **mm² area**, plus cropped evidence. Pixels→mm via a real ground-sampling-distance calc (`core/gsd.py`). Tested + quantified (~1.7 px MAE, `survey/eval/measure_accuracy.py`, in CI).
- **Defect grading + report drafting** (`survey/core/reason.py`): input = a measured crop + its mm values → output = a structured verdict (class, severity 1–5, cause, confidence, MBIS category, RI flag, drafted paragraph). Measurements are passed in as fact; the model does not invent them. *(See §3 / §4 — the model is a hosted third-party VLM, not our own.)*
- **Health scoring** (`survey/core/score.py`): real 0–100 score with a super-linear severity penalty.
- **Report + dashboard** (`survey/core/report.py`, `survey/dashboard/`): real `report.json`, draft MBIS `report.md`, and annotated frames; the dashboard (incl. the 3D risk view) renders that real output.
- **3D reconstruction** (`recon3d/`): genuinely reconstructs a building from drone footage (VGGT point cloud / Gaussian-splat fly-through); the live path implements AnySplat (arXiv:2505.23716). Runs on an NVIDIA GPU, not the laptop.
- **Engineering**: 14 pytest tests + ruff + GitHub Actions CI (green).

---

## 3. What is mocked, stubbed, or hardcoded
**Undisclosed mocks carry a small penalty each. Anything listed here = free.**

| What is faked | Where (file:line or folder) | Why we mocked it | What the real version would do |
|---|---|---|---|
| **"Facadia-VLM" is not our own trained model** — it's a product name for a hosted frontier third-party VLM (see §4). | `survey/core/reason.py` | No time/data to train a model in a hackathon. | A proprietary façade model fine-tuned on our city-scale defect dataset (roadmap). |
| **"Transmit to RI" / RI sign-off** buttons | `survey/dashboard/index.html` | Front-end demo of the human-in-the-loop step. | A real inspector portal where the RI verifies, edits and signs. |
| **3D risk view** places defect markers on a **stylised** building | `survey/dashboard/index.html` (Scene3D) | True 3D localisation isn't wired yet. | Back-project each finding onto the reconstructed `recon3d` geometry via the camera poses. |
| **Building-risk score / data layer** (the insurer-facing product) | concept only | It's the business roadmap. | A city-scale time-series risk score served by API. (The per-inspection 0–100 health score *is* real.) |
| **Demo capture parameters** — GSD set directly; no real drone standoff | `survey/demo/`, `run.py --gsd` | The demo runs on close-up stills (see §4), not a metered flight. | A drone flight log sets standoff/altitude → GSD. |

---

## 4. External APIs, services & data sources

| Service / API / dataset | Used for | Real call or mocked? | Auth |
|---|---|---|---|
| **Anthropic Claude API** (`claude-opus-4-8`) | The reasoning layer we present as "Facadia-VLM": defect grading + report drafting. **This is the real engine today; we have not trained our own model.** | **Real call** | API key in `survey/.env` (git-ignored) |
| Hugging Face — **VGGT-1B** (facebookresearch) | 3D camera poses + depth in `recon3d/` | Real (on GPU pod) | None (ungated); HF token only for gated VGGT-Omega |
| Hugging Face — **AnySplat** (InternRobotics) | Feed-forward live 3D in `recon3d/inference/` | Real (on GPU pod) | None |
| **Ultralytics YOLO** | Masking moving people out of the 3D scene | Real (on GPU pod) | None |
| **Wikimedia Commons** | Source of the demo defect photos | Downloaded once, attributed | None |

---

## 5. Pre-existing code
**Undisclosed pre-built code is heavily penalized. Anything listed here = free.**

| Item | Source (URL or description) | Roughly how much | License |
|---|---|---|---|
| `recon3d/` 3D pipeline | Adapted from a **prior personal project** (originally an eyewitness-verification 3D-reconstruction tool, "OpenEyes"); repurposed and rebranded for façade inspection during the hackathon. The off-brand references were cleaned out (see git history). | Module-sized; predates the `survey/` work | Ours (MIT) |
| AnySplat | github.com/InternRobotics/AnySplat — installed & integrated in `recon3d/inference/`; follows its `demo_gradio.py`. | Library + ~3 glue lines | MIT |
| VGGT / VGGT-Omega | github.com/facebookresearch/vggt — model + inference path. | Library | model-specific (Omega: CC-BY-NC) |
| Ultralytics YOLO | pip `ultralytics` | Library | AGPL |
| Sample defect images | Wikimedia Commons (see `survey/data/samples/ATTRIBUTION.md`) | 2 images | CC-BY-SA / public domain |
| `survey/` module (CV + grading + scoring + report + dashboard + tests + eval) | **Written during the hackathon window.** | The bulk of new code | Ours (MIT) |

---

## 6. Known limitations & next steps

- **Train the real Facadia-VLM** on a labelled façade dataset, to replace the hosted third-party model with our own.
- **Field-validated precision/recall**: today we only measure *measurement* accuracy on synthetic cracks (~1.7 px MAE); real detection precision/recall needs a ground-truth-annotated façade set.
- **True 3D defect localisation**: back-project findings onto the `recon3d` geometry (the dashboard 3D view is currently illustrative).
- **Hairline cracks (<~3 px)** are below the detector's reliable floor — roadmap fix is a zoom/thermal pass.
- **Productionise the human-in-the-loop**: a real RI portal, and the insurer-facing building-risk data layer/API.

---

## 7. AI assistance

This repository was built with the help of AI coding assistants during the hackathon
window. The architecture, the grounded rubric, the standards research and the
integration choices are the team's; we used AI tooling to move faster and have read
and understood the code we are submitting.
