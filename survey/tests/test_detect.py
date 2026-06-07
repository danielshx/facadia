"""Detector tests on synthetic images — crack measurement and rust/spalling.

Synthetic so they're deterministic and need no network. The crack is drawn
*jagged* on purpose: the detector erases long straight Hough lines (architecture),
so a real-crack test must zig-zag to survive that step.
"""

import cv2
import numpy as np

from core.detect import detect_corrosion, detect_defects


def _save(img, path):
    cv2.imwrite(str(path), img)
    return str(path)


def test_detects_and_measures_a_jagged_crack(tmp_path):
    img = np.full((400, 400, 3), 235, np.uint8)          # light wall
    pts = np.array([[200, 60], [212, 150], [192, 240], [206, 330]], np.int32)
    cv2.polylines(img, [pts], False, (30, 30, 30), 6)    # dark jagged crack, ~6 px wide
    p = _save(img, tmp_path / "crack.jpg")

    defects = detect_defects(p, str(tmp_path), gsd_mm_per_px=1.0, max_defects=3)

    assert defects, "should detect the synthetic crack"
    top = defects[0]
    assert top.measurement["length_mm"] > 100        # spans most of the image height
    assert 2.0 <= top.measurement["width_mm"] <= 14.0  # ~6 px wide at 1 mm/px


def test_blank_wall_has_no_cracks(tmp_path):
    img = np.full((400, 400, 3), 220, np.uint8)
    p = _save(img, tmp_path / "blank.jpg")
    assert detect_defects(p, str(tmp_path), gsd_mm_per_px=1.0) == []


def test_corrosion_detector_fires_on_rust_only(tmp_path):
    img = np.full((400, 400, 3), 150, np.uint8)          # plain grey concrete
    clean = _save(img, tmp_path / "clean.jpg")
    assert detect_corrosion(clean, str(tmp_path), gsd_mm_per_px=1.0) == []

    cv2.rectangle(img, (140, 140), (260, 260), (40, 100, 165), -1)  # orange-brown rust (BGR)
    rusty = _save(img, tmp_path / "rusty.jpg")
    regions = detect_corrosion(rusty, str(tmp_path), gsd_mm_per_px=1.0)
    assert regions, "should flag the rust patch"
    assert regions[0].measurement["area_mm2"] > 1000     # ~120x120 px at 1 mm/px
