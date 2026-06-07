"""GSD (pixels -> millimetres) is the load-bearing conversion behind every mm
measurement, so it gets explicit tests."""

import math

from core.gsd import CameraModel, gsd_from_args


def test_camera_model_matches_pinhole_formula():
    cam = CameraModel(sensor_width_mm=6.3, focal_mm=6.7, image_width_px=1920)
    expected = (6.3 * 10.0 * 1000.0) / (6.7 * 1920)
    assert math.isclose(cam.gsd_mm_per_px(10.0), expected, rel_tol=1e-9)


def test_gsd_scales_linearly_with_standoff():
    cam = CameraModel()
    assert cam.gsd_mm_per_px(20.0) > cam.gsd_mm_per_px(10.0)
    assert math.isclose(cam.gsd_mm_per_px(20.0), 2 * cam.gsd_mm_per_px(10.0), rel_tol=1e-9)


def test_explicit_override_wins():
    assert gsd_from_args(standoff_m=15.0, image_width_px=1920, gsd_override=0.4) == 0.4


def test_resolution_finer_when_closer_or_higher_res():
    coarse = gsd_from_args(standoff_m=20.0, image_width_px=1920)
    fine = gsd_from_args(standoff_m=5.0, image_width_px=3840)
    assert fine < coarse
