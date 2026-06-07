# recon3d — 3D reconstruction (VGGT + Gaussian Splatting)

The **3D layer of Facadia**: rebuild a building from ordinary drone footage into a
navigable 3D model — a point cloud or a photorealistic Gaussian splat. It gives the
façade a real, scaled geometry (the surface defects are located and measured on)
and the cinematic fly-through reveal for the pitch. The defect-grading AI lives in
the sibling [`survey/`](../survey) module; this folder is the geometry half.

**Self-contained by design.** This folder owns its own copy of the input clips
(`data/clips/`), its own deps, and its own viewer, so it can be developed and
demoed on its own (it needs an NVIDIA GPU — see below).

## What it does

```
data/clips/*.mp4  ──▶  frames  ──▶  VGGT(-Omega)  ──▶  out/scene.glb
  (drone pass)       sharp, sampled   poses + depth     point cloud + cameras
```

- `core/frames.py` — sample sharp frames across the clips
- `core/reconstruct.py` — run the model, normalize to a colored point cloud + camera poses
- `core/export.py` — write a GLB (renders in any web 3D viewer)
- `run.py` — CLI that wires the three together
- `viewer/index.html` — standalone GLB viewer (`<model-viewer>`, no build step)

## The model

| | repo | gated? | license |
| --- | --- | --- | --- |
| **Target** | [`facebook/VGGT-Omega`](https://huggingface.co/facebook/VGGT-Omega) (VGGT-Omega-1B-512) | yes — request access | CC-BY-NC-4.0 |
| **Fallback** | [`facebook/VGGT-1B`](https://huggingface.co/facebook/VGGT-1B) | no | — |

Build against the ungated **VGGT-1B** first to prove the pipeline; swap to
**VGGT-Omega** once access is granted — it's just `--backend omega --checkpoint ...`.

## Running (on a CUDA GPU — RunPod Pod)

This needs an NVIDIA GPU; it will **not** run on the dev Mac. A single
RTX 4090 (24 GB) is plenty (≈7 GB for 10 frames, ≈13 GB for 100).

```bash
# 1) On a RunPod PyTorch/CUDA pod, clone this folder, then install upstream:
git clone https://github.com/facebookresearch/vggt.git && pip install -e vggt   # fallback
# (for Omega: clone facebookresearch/vggt-omega, pip install -e ., download ckpt)

pip install -e .            # recon3d deps (opencv, trimesh, ...)

# 2) Reconstruct (fallback model):
python run.py --clips-dir data/clips --out out --backend vggt --max-frames 60

# 3) Reconstruct (once Omega access granted):
huggingface-cli login       # token with access to facebook/VGGT-Omega
python run.py --clips-dir data/clips --out out \
    --backend omega --checkpoint checkpoints/vggt-omega-1b-512.pt
```

Output: `out/scene.glb`. Download it from the pod, then **stop the pod**.

## Viewing

```bash
# from recon3d/, serve the folder so the viewer can fetch out/scene.glb:
python -m http.server 8080
# open http://localhost:8080/viewer/
```

The GLB is frontend-agnostic — it renders in any web 3D viewer, so it can later be
handed to a product frontend (static asset or S3) without changing this module.

The viewer has a **Cinematic** dropdown (orbit / witness-path) + speed slider —
screen-record it for the pitch, or run it live.

## One-shot pipeline (photos/clip → fly-through video)

`pipeline.py` chains everything — VGGT-Omega → Splatfacto → rendered fly-through —
with deterministic output paths:

```bash
# folder of photos -> fly-through MP4:
python pipeline.py --images-dir data/easy_data/pics --out roomtest \
    --checkpoint /workspace/checkpoints/vggt_omega_1b_512.pt

# a video clip instead:
python pipeline.py --clip data/clips/myvid.mp4 --start 6 --end 16 --out hero ...
```
Output: `roomtest/flythrough.mp4` (plus `roomtest/scene.glb`, `roomtest/nerfstudio/`,
and the trained splat under `roomtest/nerf/run/<method>/splat/`).

**Tweak the trajectory without recomputing** (seconds, reuses the trained splat):
```bash
python pipeline.py --out roomtest --skip-recon --skip-train \
    --interpolation-steps 60 --frame-rate 60          # slower, smoother
# or a fully custom path designed in the ns-viewer RENDER tab:
python pipeline.py --out roomtest --skip-recon --skip-train \
    --camera-path roomtest/nerfstudio/camera_paths/mine.json
```
Knobs: `--iterations`, `--method splatfacto-big`, `--max-frames`, `--mask-people`,
`--people-frame N`, `--voxel`, `--interpolation-steps`, `--frame-rate`,
`--pose-source train|eval`, `--order-poses`. (It sets `TORCHDYNAMO_DISABLE=1`
for you.)

## Photorealistic novel views (Gaussian Splatting)

For the "regenerate the scene from a new camera" wow, export a nerfstudio dataset
and train Splatfacto, seeded with VGGT-Omega's poses + point cloud:

```bash
# 1) trim to a short window + mask moving people, then export the splat dataset:
python run.py --clip data/clips/227a4b91-....mp4 --start 6 --end 16 \
  --out hero --max-frames 60 --voxel 0.004 --nerfstudio --mask-people \
  --backend omega --checkpoint /workspace/checkpoints/vggt_omega_1b_512.pt

# 2) train + render a novel-view fly-through (on the A40):
pip install nerfstudio
ns-train splatfacto --data hero/nerfstudio          # ~minutes; longer = sharper
ns-render camera-path --load-config outputs/.../config.yml \
  --camera-path-filename path.json --output-path hero/flythrough.mp4
```

`core/export_nerfstudio.py` writes `hero/nerfstudio/{transforms.json, images/,
masks/, sparse_pc.ply}` (VGGT extrinsics inverted to camera-to-world + OpenCV→OpenGL
axis flip; intrinsics match because we reuse the model's own frames). **No generative
models** — the splat renders only observed geometry.

**Moving people** (the scene is dynamic — 3DGS assumes static): `--mask-people`
runs YOLO-seg and writes per-frame masks so Splatfacto trains **only on the static
scene** (street/building/cars), excluding the crowd. The 3D output becomes a clean
reconstruction of the *building*, with passers-by removed.

## Tuning / troubleshooting

- **Mushy / flat scene** → it's likely dynamics (moving people) + low texture, not
  a bug. **Trim** (`--start/--end`) to a short, static-ish, laterally-moving window;
  use ONE clip; raise `--max-frames`; try `--voxel 0.004` to fuse depth sheets.
- **Sparse or noisy cloud** → lower `--conf-percentile`; raise `--max-frames`.
- **Verify the pipeline** on a clean static scene: `--clip examples/forest_road.mp4`
  (or `--images-dir <folder>`). If that's crisp, the pipeline is fine.
- **Giant blocks in viewer** → point size is in pixels now; that's already fixed.
- **Out of memory** → lower `--max-frames` or `--resolution`.
- The exact prediction keys/signatures can vary by upstream commit;
  `reconstruct.py` handles the common variants but may need a small tweak to
  match the version you `pip install -e`.

## Live endpoint (Phase 3, optional)

The same `core/` can be wrapped as a RunPod serverless worker (`handler.py`) the
Facadia app calls when footage is uploaded. Deferred — the offline GLB is the demo.

See `PLAN.md` for the full plan.
