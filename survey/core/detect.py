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
    """Binary mask of thin dark crack-like features.

    Cracks are dark, thin, and *irregular*. The big confusers on a real facade are
    long, perfectly straight lines — rooflines, brick courses, window frames,
    cladding seams. We detect those with a Hough transform and erase them, so the
    detector tracks the jagged crack instead of the architecture around it.
    """
    H, W = gray.shape
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    eq = clahe.apply(gray)
    # Black-hat: bright where there are thin dark features smaller than the kernel.
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    blackhat = cv2.morphologyEx(eq, cv2.MORPH_BLACKHAT, k)
    blackhat = cv2.normalize(blackhat, None, 0, 255, cv2.NORM_MINMAX)
    _, th = cv2.threshold(blackhat, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE,
                          cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))

    # Erase long straight lines (architecture), keep jagged cracks.
    long_line = int(0.33 * max(H, W))
    lines = cv2.HoughLinesP(th, 1, np.pi / 180, threshold=80,
                            minLineLength=long_line, maxLineGap=8)
    if lines is not None:
        for x1, y1, x2, y2 in lines[:, 0]:
            cv2.line(th, (x1, y1), (x2, y2), 0, 7)
    return th


def detect_defects(
    frame_path: str,
    out_dir: str,
    gsd_mm_per_px: float,
    *,
    max_defects: int = 5,
    min_length_px: int = 60,
    crop_pad: int = 56,
    max_span_frac: float = 0.9,
    max_area_frac: float = 0.12,
) -> list[Defect]:
    """Find + measure up to ``max_defects`` candidate defects on one frame.

    ``max_span_frac`` / ``max_area_frac`` reject components that span almost the
    whole frame or cover a large fraction of it — those are structural edges
    (rooflines, cladding seams, building outlines), not defects. This is what
    stops a far-away overview shot from reporting a "335 m crack".
    """
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
        if area < min_length_px:                       # too small to be a real defect
            continue
        if w > max_span_frac * W and h > max_span_frac * H:
            continue                                   # spans the whole frame -> structure
        if area > max_area_frac * W * H:               # too big to be a thin defect
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


def detect_corrosion(
    frame_path: str,
    out_dir: str,
    gsd_mm_per_px: float,
    *,
    max_regions: int = 2,
    min_area_frac: float = 0.004,
    max_area_frac: float = 0.22,
    crop_pad: int = 70,
) -> list[Defect]:
    """Find rust-stained spalling/corrosion patches by their orange-brown colour.

    Cracks are dark thin lines; spalling with corroding rebar is a rough, rust-
    coloured *patch* — a different signature. This fires only where there is real
    rust staining, so it adds the spalling/corrosion defect without false-firing on
    clean crack walls. Measured by AREA (spalling extent), not width.
    """
    img = cv2.imread(frame_path)
    if img is None:
        raise FileNotFoundError(frame_path)
    H, W = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, (5, 60, 40), (25, 255, 225))      # orange-brown rust
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE,
                            cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))

    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    crops = Path(out_dir) / "crops"
    crops.mkdir(parents=True, exist_ok=True)
    stem = Path(frame_path).stem

    regions = []
    for lbl in range(1, n):
        x, y, w, h, area = stats[lbl]
        if not (min_area_frac * W * H <= area <= max_area_frac * W * H):
            continue   # too small to matter, or so big it's the wall material (e.g. brick)
        regions.append((area, x, y, w, h))
    regions.sort(reverse=True)

    out: list[Defect] = []
    for i, (area, x, y, w, h) in enumerate(regions[:max_regions], start=1):
        cx0, cy0 = max(0, x - crop_pad), max(0, y - crop_pad)
        cx1, cy1 = min(W, x + w + crop_pad), min(H, y + h + crop_pad)
        cp = crops / f"{stem}-C{i}.jpg"
        cv2.imwrite(str(cp), img[cy0:cy1, cx0:cx1], [cv2.IMWRITE_JPEG_QUALITY, 92])
        out.append(Defect(
            id=f"{stem}-C{i}", frame=frame_path, frame_name=stem,
            bbox=[int(x), int(y), int(w), int(h)], crop_path=str(cp),
            geom_px={"area_px": int(area)},
            measurement={"area_mm2": round(area * gsd_mm_per_px ** 2, 1),
                         "extent_mm": round((area ** 0.5) * gsd_mm_per_px, 1)},
            elongation=0.0,
        ))
    if out:
        print(f"[detect] {stem}: {len(out)} corrosion/spalling region(s) (rust-stain)")
    return out
