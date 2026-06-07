# Implementing AnySplat — feed-forward 3D from drone photos

Facadia's **instant 3D** path implements **AnySplat: Feed-forward 3D Gaussian
Splatting from Unconstrained Views** (Jiang et al., *ACM Transactions on Graphics*
44(6), 2025 — [arXiv:2505.23716](https://arxiv.org/abs/2505.23716), paper bundled at
[`docs/papers/AnySplat-2505.23716v2.pdf`](papers/AnySplat-2505.23716v2.pdf)).

## Why this paper

A building inspection has to be *fast* and work with *whatever footage exists* — an
operator's drone clip, a property manager's phone photos, a few frames from a QR
upload at the demo booth. Classical reconstruction (COLMAP + per-scene NeRF/3DGS
optimization) needs accurate camera calibration and minutes-to-hours of training
per scene. That doesn't fit on-site inspection.

AnySplat removes exactly those blockers. From the abstract: a **single feed-forward
pass** takes **uncalibrated, unposed** multi-view images (from a single view up to
hundreds) and predicts **3D Gaussian primitives + per-image camera intrinsics and
extrinsics** at once — *"instantly lift uncalibrated 2D to ready-to-view 3D"* — with
no SfM, no per-scene optimization, and real-time rendering. That is the right
primitive for a hardware-agnostic, on-site product.

## What the paper contributes (and how we use it)

| AnySplat contribution | How Facadia uses it |
| --- | --- |
| **Feed-forward reconstruction + rendering** — Gaussians + poses in one pass, seconds | the live/QR demo path: a handful of façade photos → a fly-around in seconds, no calibration step |
| **Pseudo-label knowledge distillation from a pretrained VGGT** — trains on RGB only, no SfM/MVS ground truth | why it generalizes to arbitrary, uncalibrated drone/phone capture in the wild |
| **Differentiable voxel-guided Gaussian pruning** — clusters pixel-wise Gaussians into voxels, drops 30–70% of redundant primitives | keeps the output light enough to render live and to hand to a web viewer |

## Where it lives in this repo

[`recon3d/inference/`](../recon3d/inference) is the AnySplat integration (isolated in
its own `.venv-anysplat`, torch 2.2/cu121, VGGT-1B backbone):

- `anysplat_recon.py` — loads the AnySplat model and runs the feed-forward pass
  (folder of images → 3D Gaussians + poses → rendered fly-through), following the
  upstream `AnySplat/demo_gradio.py`.
- `live.py` / `app.py` / `serve.py` — the live demo surfaces: fetch a batch of
  audience/operator photos (incl. a QR-upload flow on a warm server), reconstruct,
  and return one clean 1080p sweep.
- `setup.sh` — clones [InternRobotics/AnySplat](https://github.com/InternRobotics/AnySplat)
  and builds the isolated environment on the GPU pod.

The optimization path in `recon3d/` (VGGT → Splatfacto) is kept alongside for the
higher-fidelity, non-real-time hero render; AnySplat is the *instant* path.

## Citation

```bibtex
@article{jiang2025anysplat,
  title   = {AnySplat: Feed-forward 3D Gaussian Splatting from Unconstrained Views},
  author  = {Jiang, Lihan and Mao, Yucheng and Xu, Linning and Lu, Tao and Ren, Kerui
             and Jin, Yichen and Xu, Xudong and Yu, Mulin and Pang, Jiangmiao
             and Zhao, Feng and Lin, Dahua and Dai, Bo},
  journal = {ACM Transactions on Graphics},
  volume  = {44}, number = {6}, year = {2025},
  doi     = {10.1145/3763326},
  note    = {arXiv:2505.23716}
}
```

License note: AnySplat is MIT-licensed upstream; the bundled PDF is the arXiv
preprint, redistributed for reference.
