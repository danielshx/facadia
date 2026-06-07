"""Measurement-accuracy harness for the CV "ruler".

We draw synthetic cracks of *known* width on a textured concrete-like background,
run the detector, and compare the measured width against ground truth. This
quantifies the precision of the mm measurement (the honest, testable half of the
hybrid) — the number behind the pitch's accuracy slide (jury Q&A Q7 / T5).

    uv run python eval/measure_accuracy.py

It prints a Markdown table; nothing here touches the VLM or the network.
"""

from __future__ import annotations

import cv2
import numpy as np

from core.detect import detect_defects

GSD = 1.0  # mm/px for this synthetic test, so mm == px (isolates the measurement)


def _concrete(h: int = 420, w: int = 420) -> np.ndarray:
    """A plausibly-textured light-grey wall (deterministic — fixed seed)."""
    rng = np.random.default_rng(0)
    base = rng.normal(205, 4, (h, w)).clip(180, 235).astype(np.uint8)
    return cv2.cvtColor(base, cv2.COLOR_GRAY2BGR)


def _draw_crack(img: np.ndarray, width_px: int) -> np.ndarray:
    """A jagged dark crack of the given stroke width (jagged to survive Hough)."""
    out = img.copy()
    pts = np.array([[210, 50], [228, 150], [196, 250], [222, 350], [205, 390]], np.int32)
    cv2.polylines(out, [pts], False, (40, 40, 40), width_px, cv2.LINE_AA)
    return out


def main() -> None:
    bg = _concrete()
    rows, abs_err = [], []
    import tempfile
    tmp = tempfile.mkdtemp()

    for truth in (4, 6, 8, 10, 12):
        img = _draw_crack(bg, truth)
        p = f"{tmp}/crack_{truth}.jpg"
        cv2.imwrite(p, img)
        ds = detect_defects(p, tmp, gsd_mm_per_px=GSD, max_defects=1)
        measured = ds[0].measurement["width_mm"] if ds else float("nan")
        err = abs(measured - truth) if ds else float("nan")
        if ds:
            abs_err.append(err)
        rows.append((truth, measured, err))

    print("\n## CV ruler — crack-width measurement accuracy (synthetic, GSD = 1.0 mm/px)\n")
    print("| True width (mm) | Measured (mm) | Abs. error (mm) |")
    print("| ---: | ---: | ---: |")
    for truth, measured, err in rows:
        print(f"| {truth:.1f} | {measured:.2f} | {err:.2f} |")
    if abs_err:
        mae = sum(abs_err) / len(abs_err)
        print(f"\n**Mean absolute error: {mae:.2f} mm** "
              f"(~{mae / GSD:.1f} px) across {len(abs_err)} cracks.")
    print("\n> Cracks finer than ~3 px (hairline) fall below the detector's reliable "
          "floor — a stated limitation (jury Q&A T6/T7); a zoom/thermal pass is the "
          "roadmap fix. Real-world detection recall/precision needs a labelled field "
          "set (future work); this isolates the *measurement* precision of the ruler.")


if __name__ == "__main__":
    main()
