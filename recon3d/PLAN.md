# Plan — `recon3d` (the 3D layer of Facadia)

## Goal

Turn ordinary drone footage of a building into a **navigable 3D model** — first a
fast point cloud (`scene.glb`), then, if time allows, a photorealistic Gaussian
splat fly-through. This gives the façade a real, scaled geometry to anchor the
defect findings on, plus the cinematic reveal for the pitch. The defect-grading
AI is the sibling [`survey/`](../survey) module; this folder is geometry only.

## Approach

Feed-forward multi-view geometry with **VGGT** (Meta/Oxford VGG): one pass infers
camera poses + dense depth, which we unproject into a coloured point cloud and
export as a GLB any web viewer can open. For photorealism, seed **Splatfacto**
(nerfstudio Gaussian Splatting) with those poses + points and render a novel-view
fly-through.

- **Model:** build against ungated **`facebook/VGGT-1B`** (works immediately);
  optionally swap to the gated **VGGT-Omega-1B-512** once HF access is granted —
  it's a `--backend omega --checkpoint …` change, nothing structural.
- **Where it runs:** an NVIDIA GPU (RunPod Pod, e.g. RTX 4090/A40) — not the dev
  Mac. The Mac holds the code and views the finished GLB.
- **Self-contained:** this folder owns its own clips, deps, and viewer; it neither
  reads nor writes sibling modules at runtime.

## Build order

1. **Point cloud first (the reliable win).** `core/frames.py` → `core/reconstruct.py`
   (VGGT) → `core/export.py` → `out/scene.glb`; eyeball it in `viewer/`.
2. **Fly-through (if time).** `pipeline.py` chains VGGT → Splatfacto → rendered MP4
   with deterministic output paths; `--mask-people` (YOLO-seg) excludes moving
   people so the splat fits only the static building.
3. **Live endpoint (optional, deferred).** Wrap `core/` as a RunPod serverless
   worker the Facadia app calls on upload; the offline GLB stays the demo fallback.

## Critical files

`core/{frames,reconstruct,export,export_nerfstudio,masks}.py`, `run.py` (CLI),
`pipeline.py` (one-shot), `viewer/index.html` (standalone GLB viewer).

## Risks & mitigations

- **Gated Omega weights** → develop on ungated VGGT-1B; checkpoint is a CLI arg.
- **Dynamic scene (people/traffic)** corrupts 3DGS → `--mask-people`; trim to a
  short, laterally-moving window with `--start/--end`.
- **CUDA deps won't install on macOS** → expected; all heavy work runs on the pod.
- **Mushy/sparse output** → fewer dynamics, more frames, `--voxel` fuse, lower
  `--conf-percentile`. See README → *Tuning / troubleshooting*.

## Verification

`python run.py --clips-dir data/clips --out out --backend vggt` produces
`out/scene.glb` without errors; the viewer orbits a recognizable building; the
predicted cameras ring the scene consistently with the flight path.
