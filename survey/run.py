"""Hawkeye survey — drone frames -> measured defects -> Claude grades -> MBIS report.

    python run.py --clip ../DJI_0962_1080p.mp4 --out demo --standoff-m 15
    python run.py --images-dir data/closeups --out demo            # stills instead of video

Output (in ``out/``): annotated/ frames, crops/, report.json, report.md.
Open ../survey/dashboard/index.html and load out/report.json to view it.

Runs entirely on the Mac (CPU). Needs ANTHROPIC_API_KEY in survey/.env for the
Claude reasoning step.
"""

from __future__ import annotations

import argparse
import datetime as _dt
from pathlib import Path

import cv2

from core import frames as F
from core import report as R
from core import score as S
from core.detect import detect_defects
from core.gsd import gsd_from_args
from core.reason import DEFAULT_MODEL, assess_defect, check_key


def main() -> None:
    p = argparse.ArgumentParser(description="Hawkeye AI building surveyor")
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--clip", help="drone video (.mp4)")
    src.add_argument("--images-dir", help="folder of facade stills instead of a clip")
    p.add_argument("--out", default="demo", help="output folder")
    p.add_argument("--max-frames", type=int, default=8)
    p.add_argument("--start", type=float, help="clip trim start (s)")
    p.add_argument("--end", type=float, help="clip trim end (s)")
    p.add_argument("--standoff-m", type=float, default=15.0,
                   help="drone distance to the wall (sets mm/px); estimate per flight")
    p.add_argument("--gsd", type=float, help="override mm/px directly (skip the camera model)")
    p.add_argument("--max-defects", type=int, default=4, help="candidates per frame")
    p.add_argument("--model", default=DEFAULT_MODEL,
                   help=f"Claude model (default {DEFAULT_MODEL}; e.g. claude-sonnet-4-6)")
    p.add_argument("--building-name", default="Subject Building (demo)")
    p.add_argument("--address", default="—")
    p.add_argument("--location-hint", default="external wall over public footpath",
                   help="exposure context handed to Claude (affects severity weighting)")
    p.add_argument("--inspection-date", default=_dt.date.today().isoformat())
    args = p.parse_args()

    if not check_key():
        raise SystemExit("ANTHROPIC_API_KEY not set. Put it in survey/.env "
                         "(ANTHROPIC_API_KEY=sk-ant-...) and re-run.")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    # 1) Frames ----------------------------------------------------------------
    if args.clip:
        frame_specs = F.extract_frames(args.clip, out / "frames",
                                       max_frames=args.max_frames,
                                       start=args.start, end=args.end)
        footage = Path(args.clip).name
    else:
        frame_specs = F.list_images(args.images_dir)
        footage = args.images_dir
    if not frame_specs:
        raise SystemExit("No frames to analyse.")

    # 2) GSD (mm per pixel) ----------------------------------------------------
    first = cv2.imread(frame_specs[0].path)
    img_w = first.shape[1] if first is not None else 1920
    gsd = gsd_from_args(args.standoff_m, img_w, gsd_override=args.gsd)
    print(f"[gsd] {gsd:.3f} mm/px  (standoff {args.standoff_m} m, frame width {img_w}px)")

    # 3) Detect + measure ------------------------------------------------------
    candidates: list = []
    for fs in frame_specs:
        candidates += detect_defects(fs.path, str(out), gsd, max_defects=args.max_defects)
    print(f"[detect] {len(candidates)} candidate region(s) across {len(frame_specs)} frame(s)")
    if not candidates:
        print("No candidate defects detected — try closer/sharper frames or a stills folder.")

    # 4) Claude grades + drafts each ------------------------------------------
    defects: list[dict] = []
    for c in candidates:
        try:
            a = assess_defect(c.crop_path, c.measurement,
                              location_hint=args.location_hint, model=args.model)
        except Exception as e:                       # one bad call shouldn't kill the run
            print(f"  ! {c.id}: assessment failed ({e}); skipping")
            continue
        if a.defect_type == "not_a_defect":
            print(f"  - {c.id}: Claude judged not a defect (conf {a.confidence:.2f}) — dropped")
            continue
        print(f"  ✓ {c.id}: {a.defect_type} S{a.severity} ({a.severity_label}) "
              f"conf {a.confidence:.2f}{'  ⚠RI' if a.ri_flag else ''}")
        defects.append({
            "id": c.id, "frame": c.frame, "frame_name": c.frame_name,
            "bbox": c.bbox, "crop": c.crop_path,
            "measurement": c.measurement, "geom_px": c.geom_px,
            **a.model_dump(),
        })

    # 5) Score + assemble ------------------------------------------------------
    health = S.building_health(defects)
    annotated = R.annotate_frames(defects, str(out))
    building = {
        "name": args.building_name, "address": args.address,
        "inspection_date": args.inspection_date, "footage": footage,
        "standoff_m": args.standoff_m, "gsd_mm_per_px": round(gsd, 3),
        "model": args.model,
    }
    report = R.build_report(building, defects, health, annotated)
    jpath, mpath = R.write_all(report, str(out))

    print("\n" + "=" * 60)
    print(f"  Building-health score: {health['score']}/100  ({health['band']})")
    print(f"  Defects: {health['n_defects']}  ·  flagged for RI: {health['ri_flags']}")
    print(f"  report.json -> {jpath}")
    print(f"  report.md   -> {mpath}")
    print("  View: open survey/dashboard/index.html and load this report.json")
    print("=" * 60)


if __name__ == "__main__":
    main()
