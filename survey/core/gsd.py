"""Ground Sampling Distance — how many millimetres of facade one pixel covers.

This is what turns a crack measured in *pixels* into a crack measured in *mm*,
which is what the severity rubric (BRE Digest 251, the 0.3 mm concrete design
limit) is written against. See jury Q&A T2: the mm number is not magic, it comes
from the camera and how far the drone stood off the wall, so flight distance and
resolution are *planned*, not accidental.

    GSD (mm/px) = (sensor_width_mm * standoff_m * 1000) / (focal_mm * image_width_px)

Defaults below are a reasonable DJI-class wide camera; override per flight. The
honest framing for the pitch: this is an *estimate* with ~1 px error, tightened
by knowing the real standoff (from the flight log / RTK) on a production run.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class CameraModel:
    """Minimal pinhole model: just enough to get mm-per-pixel at a given range."""

    sensor_width_mm: float = 6.3   # ~1/1.3" class DJI wide sensor
    focal_mm: float = 6.7          # 24 mm-equiv on that sensor
    image_width_px: int = 1920     # 1080p frame width

    def gsd_mm_per_px(self, standoff_m: float) -> float:
        """Real-world mm covered by one pixel at ``standoff_m`` metres from the wall."""
        return (self.sensor_width_mm * standoff_m * 1000.0) / (
            self.focal_mm * self.image_width_px
        )


def gsd_from_args(
    standoff_m: float,
    image_width_px: int,
    *,
    sensor_width_mm: float | None = None,
    focal_mm: float | None = None,
    gsd_override: float | None = None,
) -> float:
    """Resolve a GSD: explicit override wins, else compute from the camera model."""
    if gsd_override is not None:
        return gsd_override
    cam = CameraModel(image_width_px=image_width_px)
    if sensor_width_mm is not None:
        cam.sensor_width_mm = sensor_width_mm
    if focal_mm is not None:
        cam.focal_mm = focal_mm
    return cam.gsd_mm_per_px(standoff_m)
