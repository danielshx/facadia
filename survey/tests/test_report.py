"""Report assembly: annotation writes a file, report.json has the right shape,
and the draft MBIS markdown carries the key facts."""

import json

import cv2
import numpy as np

from core import report as R
from core.score import building_health


def _defect(frame_path):
    return {
        "id": "demo-D1", "frame": frame_path, "frame_name": "demo",
        "bbox": [120, 120, 80, 60],
        "measurement": {"width_mm": 2.4, "length_mm": 180.0, "area_mm2": 432.0},
        "geom_px": {}, "defect_type": "crack", "severity": 4,
        "severity_label": "Serious", "confidence": 0.82,
        "cause": "differential movement", "recommended_action": "repair soon",
        "rubric_anchor": "BRE category 3", "mbis_category": "external_walls",
        "ri_flag": True, "report_text": "A serious crack was recorded.",
    }


def test_annotate_writes_image(tmp_path):
    frame = str(tmp_path / "demo.jpg")
    cv2.imwrite(frame, np.full((400, 400, 3), 200, np.uint8))
    ann = R.annotate_frames([_defect(frame)], str(tmp_path))
    assert "demo" in ann
    out = ann["demo"]
    img = cv2.imread(out)
    assert img is not None and img.shape[0] > 0


def test_build_report_shape_and_markdown(tmp_path):
    frame = str(tmp_path / "demo.jpg")
    cv2.imwrite(frame, np.full((400, 400, 3), 200, np.uint8))
    d = _defect(frame)
    health = building_health([d])
    ann = R.annotate_frames([d], str(tmp_path))
    rep = R.build_report({"name": "Test Tower"}, [d], health, ann)

    assert set(rep) >= {"building", "health", "defects", "disclaimer"}
    assert rep["defects"][0]["annotated"].endswith(".jpg")
    assert "Facadia" in rep["disclaimer"]

    jpath, mpath = R.write_all(rep, str(tmp_path))
    md = open(mpath).read()
    assert "Test Tower" in md and "demo-D1" in md and "DRAFT" in md
    assert json.load(open(jpath))["health"]["n_defects"] == 1
