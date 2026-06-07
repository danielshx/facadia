"""Pull sharp facade frames out of a drone clip (CPU-only, no GPU needed).

Same variance-of-Laplacian sharpness trick as ``recon3d/core/frames.py`` —
motion blur is the enemy of a clean crack measurement. Kept self-contained so
``survey/`` runs on the Mac with just opencv (no torch / VGGT deps).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np


@dataclass
class Frame:
    path: str
    clip: str
    frame_index: int
    sharpness: float


def _sharpness(gray: np.ndarray) -> float:
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def extract_frames(
    clip: str,
    out_dir: str,
    max_frames: int = 8,
    start: float | None = None,
    end: float | None = None,
) -> list[Frame]:
    """Sample ``max_frames`` evenly across the clip, keeping the sharpest per window."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(clip)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    if total <= 0:
        cap.release()
        raise FileNotFoundError(f"Could not read frames from {clip}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    lo_f = max(0, int((start or 0) * fps))
    hi_f = min(total, int(end * fps)) if end else total
    hi_f = max(lo_f + 1, hi_f)

    windows = np.linspace(lo_f, hi_f - 1, max_frames + 1).astype(int)
    stem = Path(clip).stem
    frames: list[Frame] = []
    for w in range(max_frames):
        lo, hi = windows[w], max(windows[w] + 1, windows[w + 1])
        best = None
        for fi in np.linspace(lo, hi - 1, num=min(5, hi - lo)).astype(int):
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(fi))
            ok, img = cap.read()
            if not ok:
                continue
            s = _sharpness(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
            if best is None or s > best[0]:
                best = (s, int(fi), img)
        if best is None:
            continue
        s, fi, img = best
        dest = out / f"{stem}_{fi:06d}.jpg"
        cv2.imwrite(str(dest), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        frames.append(Frame(str(dest), stem, fi, s))

    cap.release()
    print(f"[frames] extracted {len(frames)} sharp frames -> {out}")
    return frames


def list_images(images_dir: str) -> list[Frame]:
    """Use a folder of stills directly (close-ups, test images) instead of a clip."""
    d = Path(images_dir)
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}
    imgs = sorted(p for p in d.iterdir() if p.suffix.lower() in exts)
    if not imgs:
        raise FileNotFoundError(f"No images found in {images_dir}")
    out = []
    for p in imgs:
        g = cv2.imread(str(p), cv2.IMREAD_GRAYSCALE)
        s = _sharpness(g) if g is not None else 0.0
        out.append(Frame(str(p), p.stem, 0, s))
    print(f"[frames] using {len(out)} images from {images_dir}")
    return out
