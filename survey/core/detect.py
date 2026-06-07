"""The "ruler": classical-CV defect detection + millimetre geometry.

No training, no GPU — runs on the Mac today. The job here is *measurement*, not
classification: find candidate defect regions on a facade frame and measure each
one's width / length / area in real millimetres (via the GSD). Claude does the
naming and grading downstream (core/reason.py); this module only ever reports
what it can actually measure, which is the honest half of the hybrid pitch
("specialized detector for measurable defects + VLM for reasoning").

Pipeline per frame:
  grey -> CLAHE -> black-hat (lifts thin dark cracks) -> Otsu -> close ->
  connected components -> per-component skeleton + medial-axis width.

Cracks are dark, thin, elongated, so we rank candidates by area x elongation and
keep the top-K. Window frames / expansion joints / shadows can look crack-like;
that is exactly the false-positive set Claude is asked to adjudicate downstream.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np
from skimage.morphology import medial_axis


@dataclass
class Defect:
    """One measured candidate region. Geometry is real; the label comes later."""

    id: str
    frame: str
    frame_name: str
    bbox: list[int]                       # [x, y, w, h] in pixels
    crop_path: str
    measurement: dict = field(default_factory=dict)   # width_mm / length_mm / area_mm2
    geom_px: dict = field(default_factory=dict)
    elongation: float = 0.0


def _candidate_mask(gray: np.ndarray) -> np.ndarray:
    """Binary mask of thin dark crack-like features."""
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    eq = clahe.apply(gray)
    # Black-hat: bright where there are thin dark features smaller than the kernel.
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    blackhat = cv2.morphologyEx(eq, cv2.MORPH_BLACKHAT, k)
    blackhat = cv2.normalize(blackhat, None, 0, 255, cv2.NORM_MINMAX)
    _, th = cv2.threshold(blackhat, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # Bridge small gaps along a crack so it reads as one component.
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE,
                          cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    return th


def detect_defects(
    frame_path: str,
    out_dir: str,
    gsd_mm_per_px: float,
    *,
    max_defects: int = 5,
    min_length_px: int = 60,
    crop_pad: int = 24,
) -> list[Defect]:
    """Find + measure up to ``max_defects`` candidate defects on one frame."""
    img = cv2.imread(frame_path)
    if img is None:
        raise FileNotFoundError(frame_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    H, W = gray.shape
    mask = _candidate_mask(gray)

    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    crops = Path(out_dir) / "crops"
    crops.mkdir(parents=True, exist_ok=True)
    stem = Path(frame_path).stem

    scored: list[tuple[float, Defect]] = []
    for lbl in range(1, n):
        x, y, w, h, area = stats[lbl]
        if area < min_length_px:            # too small to be a real defect
            continue
        comp = (labels[y:y + h, x:x + w] == lbl)

        # Skeleton + medial-axis distance -> crack width without opencv-contrib.
        skel, dist = medial_axis(comp, return_distance=True)
        skel_d = dist[skel]
        if skel_d.size == 0:
            continue
        length_px = float(skel.sum())                 # skeleton length ~ crack length
        width_px = float(2.0 * skel_d.mean())         # mean full width
        width_max_px = float(2.0 * skel_d.max())
        if length_px < min_length_px:
            continue
        elongation = length_px / max(width_px, 1.0)

        defect = Defect(
            id="",
            frame=frame_path,
            frame_name=stem,
            bbox=[int(x), int(y), int(w), int(h)],
            crop_path="",
            geom_px={"width_px": round(width_px, 1),
                     "width_max_px": round(width_max_px, 1),
                     "length_px": round(length_px, 1),
                     "area_px": int(area)},
            measurement={
                "width_mm": round(width_px * gsd_mm_per_px, 2),
                "width_max_mm": round(width_max_px * gsd_mm_per_px, 2),
                "length_mm": round(length_px * gsd_mm_per_px, 1),
                "area_mm2": round(area * gsd_mm_per_px ** 2, 1),
            },
            elongation=round(elongation, 1),
        )
        scored.append((area * elongation, defect))

    scored.sort(key=lambda t: t[0], reverse=True)
    out: list[Defect] = []
    for i, (_, d) in enumerate(scored[:max_defects], start=1):
        d.id = f"{stem}-D{i}"
        x, y, w, h = d.bbox
        cx0, cy0 = max(0, x - crop_pad), max(0, y - crop_pad)
        cx1, cy1 = min(W, x + w + crop_pad), min(H, y + h + crop_pad)
        crop = img[cy0:cy1, cx0:cx1]
        cp = crops / f"{d.id}.jpg"
        cv2.imwrite(str(cp), crop, [cv2.IMWRITE_JPEG_QUALITY, 92])
        d.crop_path = str(cp)
        out.append(d)

    print(f"[detect] {stem}: {len(out)} candidate defect(s) "
          f"(from {n - 1} raw components)")
    return out
