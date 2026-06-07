# HONESTY.md

> Mandatory hackathon disclosure, cross-checked against the code, git history and the technical video. Disclosed shortcuts aren't penalized; hidden ones are. So it's all here.

## 1. Team: who did what

`git shortlog -sn` is concentrated under one account, but this is not a solo build.

| Member | GitHub | Did |
|---|---|
| Daniel | Tech integration; built `survey/` (defect pipeline + dashboard) and the `recon3d/` 3D work. Almost all commits sit under this account (the build ran on his machine, with AI coding help, see §7). |
| Geart  | AI/architecture direction for the hybrid pipeline and grading. |
| Lucas | Civil engineering: the code-grounded severity rubric and HK/BRE standards. |
| Rodrigo | Go-to-market, business model, pitch, and the business video. |

Domain, AI/architecture and GTM work landed via the rubric, research, deck and videos rather than commits.

## 2. What actually works

- **CV defect measurement** (`survey/core/detect.py`): façade frames go in, real cracks come out with mm width/length (medial-axis) and spalling/corrosion area in mm², plus cropped evidence. Pixels to mm via a real GSD calc (`core/gsd.py`). About 1.7 px MAE, tested in CI (`survey/eval/measure_accuracy.py`).
- **Grading + report** (`survey/core/reason.py`): a measured crop and its mm values become a structured verdict (class, severity 1–5, cause, confidence, MBIS category, RI flag, drafted text). The measurements are passed in as fact; the model does not invent them. The model itself is a hosted third-party VLM (see §3 / §4).
- **Health score** (`survey/core/score.py`): a real 0–100 score with a super-linear severity penalty.
- **Report + dashboard** (`survey/core/report.py`, `survey/dashboard/`): real `report.json`, a draft MBIS `report.md`, and annotated frames. The dashboard, including the 3D risk view, renders that real output.
- **3D reconstruction on a real GPU** (`recon3d/`): drone footage becomes camera poses and depth (VGGT), then we train a Gaussian splat (nerfstudio Splatfacto) and render a fly-through. This runs on a RunPod cloud GPU (RTX PRO 4000), not the laptop. The feed-forward live path implements AnySplat (arXiv:2505.23716).
- **Engineering**: 14 pytest tests, ruff, and GitHub Actions CI (green).

## 3. What is mocked or hardcoded

| Faked | Where | Why | What the real version does |
|---|---|---|---|
| "Facadia-VLM" is not our own trained model. It's a product name for a hosted third-party VLM (§4). | `survey/core/reason.py` | No time or data to train one in a hackathon. | A façade model fine-tuned on our own defect dataset (roadmap). |
| "Transmit to RI" / sign-off buttons | `survey/dashboard/index.html` | Front-end demo of the human-in-the-loop step. | A real inspector portal to verify, edit and sign. |
| 3D risk view places markers on a stylised building | `survey/dashboard/index.html` (Scene3D) | True 3D localisation isn't wired yet. | Back-project each finding onto the `recon3d` geometry via the camera poses. |
| Building-risk score / insurer data layer | concept only | Business roadmap. | A city-scale risk score served by API. (The per-inspection 0–100 score is real.) |
| Demo capture params: GSD set directly, no real drone standoff | `survey/demo/`, `run.py --gsd` | The demo runs on close-up stills. | A drone flight log sets standoff/altitude, which sets GSD. |

## 4. External APIs, services & data

| Service | Used for | Real or mocked | Auth |
|---|---|---|---|
| Anthropic Claude API (`claude-opus-4-8`) | The reasoning we present as "Facadia-VLM": grading + report. The real engine today; we have not trained our own. | Real | key in `survey/.env` (gitignored) |
| VGGT-1B / VGGT-Omega (facebookresearch) | 3D camera poses + depth in `recon3d/` | Real (on GPU) | HF token only for gated Omega |
| AnySplat (InternRobotics) | Feed-forward live 3D in `recon3d/inference/` | Real (on GPU) | None |
| nerfstudio / Splatfacto | Gaussian-splat training on a RunPod GPU | Real (on GPU) | None |
| Ultralytics YOLO | Masking moving people out of the 3D scene | Real (on GPU) | None |
| Wikimedia Commons | The demo defect photos | Downloaded once, attributed | None |

## 5. Pre-existing code

| Item | Source | How much | License |
|---|---|---|---|
| `recon3d/` 3D pipeline | The reconstruction method is the published AnySplat ([arXiv:2505.23716](https://arxiv.org/abs/2505.23716)) + VGGT, cited in `CITATION.cff` / `docs/anysplat.md`. The surrounding scaffolding (CLI, viewer, glue) was adapted from a prior personal project ("OpenEyes", an eyewitness-verification 3D tool) and rebranded for façade inspection; the off-brand references were cleaned out (see git history). The fly-through renders are new. | Scaffolding predates `survey/`; renders are new | Ours (MIT) |
| AnySplat | github.com/InternRobotics/AnySplat, integrated in `recon3d/inference/`, follows its `demo_gradio.py`. | Library + ~3 glue lines | MIT |
| VGGT / VGGT-Omega | github.com/facebookresearch/vggt | Library | model-specific (Omega: CC-BY-NC) |
| Ultralytics YOLO | pip `ultralytics` | Library | AGPL |
| Sample defect images | Wikimedia Commons (`survey/data/samples/ATTRIBUTION.md`) | 2 images | CC-BY-SA / public domain |
| `survey/` (CV + grading + scoring + report + dashboard + tests + eval) | Written during the hackathon. | The bulk of new code | Ours (MIT) |

## 6. Known limits & next steps

- Train the real Facadia-VLM on a labelled façade dataset, to replace the hosted model.
- Field precision/recall: so far we only measure *measurement* accuracy on synthetic cracks (~1.7 px MAE).
- True 3D defect localisation: back-project findings onto the `recon3d` geometry (the dashboard 3D view is illustrative).
- Hairline cracks (<~3 px) are below the detector's floor; a zoom/thermal pass is the fix.
- Productionise the human-in-the-loop (RI portal) and the insurer-facing data layer.

## 7. AI assistance

Built with AI coding assistants during the hackathon. The architecture, the grounded rubric, the standards research and the integration choices are the team's; we used AI tooling to move faster, and we have read and understood the code we are submitting.
