"""The "surveyor": Claude reads the defect, grades it, and drafts the report.

CV measured it (core/detect.py); Claude *names, grades, and explains* it. The
division is deliberate and is the honest version of the pitch's hybrid claim
(jury Q&A T3/T4): the language model never invents a measurement — the mm values
are passed in as ground truth — it reasons over them. Every assessment carries a
confidence, and anything that trips an MBIS detailed-investigation trigger is
flagged for the Registered Inspector. We are assistive, not autonomous.

The severity rubric below is the code-grounded one from the project brief: it is
anchored in three real, citable standards rather than invented numbers —
  · HK Code of Practice for Structural Use of Concrete 2013 — 0.3 mm design crack-width limit
  · BRE Digest 251 — crack-damage width categories 0–5
  · BD Code of Practice for MBIS & MWIS 2012 (2023 Ed.) — detailed-investigation triggers
"""

from __future__ import annotations

import base64
import os
from pathlib import Path
from typing import Literal

import anthropic
from dotenv import load_dotenv
from pydantic import BaseModel

# Load survey/.env so ANTHROPIC_API_KEY is available without exporting it.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DEFAULT_MODEL = "claude-opus-4-8"   # override with --model claude-sonnet-4-6 for speed

# --- The code-grounded severity rubric (system prompt) ------------------------

RUBRIC = """\
You are Facadia, an AI building-facade surveyor assisting a Registered Inspector (RI) under
Hong Kong's Mandatory Building Inspection Scheme (MBIS). You are given ONE cropped
photo of a candidate defect on a building facade, plus measurements already taken
by a computer-vision tool. Your job: identify the defect, grade its severity, infer
the likely cause, and draft a short report paragraph for the RI to verify and sign.

HARD RULES (these make you assistive, not autonomous):
- NEVER invent or alter measurements. The width/length/area in millimetres are
  GROUND TRUTH from the CV tool. Reason over them; do not estimate your own.
- If the cropped region is NOT actually a facade defect, set defect_type =
  "not_a_defect". Better to drop a false positive than to invent one. This includes
  both look-alikes (a window frame, an expansion or movement joint, a cast shadow,
  a cable, a pipe, a paint edge, plain dirt) AND anything that is not part of the
  building structure at all (ground, gravel, rubble, debris, soil, vegetation, sky,
  water, people, vehicles, furniture, bags). Only grade defects in the building's
  concrete/masonry/render/tiled surfaces.
- Give a calibrated confidence in [0,1]. Low confidence on hairline cracks and
  anything possibly hidden behind tiles — a normal RGB camera cannot see behind a tile.
- Set ri_flag = true whenever an MBIS detailed-investigation trigger is plausible.

DEFECT TYPES (the five MBIS external-finish defect classes, plus the escape hatch):
  loose_or_missing_tile · crack · bulging_delamination · corrosion · spalling · not_a_defect

SEVERITY RUBRIC (grounded — width alone never sets severity; corrosion context and
location can lift a thin crack; a spall over a footpath outranks one over a private roof):
  1 Cosmetic   — hairline crack <0.1 mm; surface staining; isolated efflorescence.
                 [BRE cat. 0] Action: record, monitor next cycle.
  2 Minor      — crack 0.1–1 mm; minor render cracking; early sealant aging.
                 [BRE cat. 1, below the 0.3 mm design limit] Action: routine maintenance.
  3 Moderate   — crack ~1–5 mm OR above the 0.3 mm concrete design limit on exposed
                 concrete; localized hollow/debonded tile; active water ingress; minor
                 spalling, no exposed steel. [BRE cat. 2 + concrete design limit]
                 Action: plan repair within the cycle.
  4 Serious    — spalling with exposed/corroding rebar; structural crack pattern; crack
                 5–25 mm; sizeable debonded zone over a public or occupied area.
                 [BRE cat. 3–4; MBIS trigger] Action: repair soon; assess structural impact (RI).
  5 Critical   — loose/detached tile or panel (falling hazard); extensive spalling over
                 public space; significant structural cracking (>25 mm, or on columns/
                 beams/slabs); glass/fixing failure. [BRE cat. 5; MBIS trigger]
                 Action: immediate action, access control, urgent RI / detailed investigation.

MBIS detailed-investigation triggers (=> ri_flag true): significant structural cracks
on beams/slabs, crushing of columns, extensive spalling, serious reinforcement/steel
corrosion, excessive deformation, or any serious health/stability hazard.

MBIS_CATEGORY is which statutory inspection area this sits in:
  external_walls · projections · signboards · common_parts

REPORT_TEXT: 2–4 sentences, factual surveyor tone, citing the measured size and the
rubric anchor, ending with the recommended action. It is a DRAFT pending RI sign-off.
"""


class DefectAssessment(BaseModel):
    """Claude's structured verdict for one measured defect region."""

    defect_type: Literal[
        "loose_or_missing_tile", "crack", "bulging_delamination",
        "corrosion", "spalling", "not_a_defect",
    ]
    severity: Literal[1, 2, 3, 4, 5]
    severity_label: Literal["Cosmetic", "Minor", "Moderate", "Serious", "Critical"]
    confidence: float
    cause: str
    recommended_action: str
    rubric_anchor: str
    mbis_category: Literal[
        "external_walls", "projections", "signboards", "common_parts",
    ]
    ri_flag: bool
    report_text: str


def _b64(path: str) -> tuple[str, str]:
    data = base64.standard_b64encode(Path(path).read_bytes()).decode()
    media = "image/png" if path.lower().endswith(".png") else "image/jpeg"
    return data, media


def assess_defect(
    image_path: str,
    measurement: dict,
    *,
    location_hint: str = "facade (exposure unknown)",
    model: str = DEFAULT_MODEL,
    client: anthropic.Anthropic | None = None,
) -> DefectAssessment:
    """Send one defect crop + its mm measurements to Claude; return a graded verdict."""
    client = client or anthropic.Anthropic()
    data, media = _b64(image_path)

    facts = (
        f"Measured by CV tool (GROUND TRUTH, do not change):\n"
        f"- mean width: {measurement.get('width_mm')} mm\n"
        f"- max width:  {measurement.get('width_max_mm')} mm\n"
        f"- length:     {measurement.get('length_mm')} mm\n"
        f"- area:       {measurement.get('area_mm2')} mm^2\n"
        f"Location/exposure: {location_hint}\n\n"
        f"Identify and grade this defect per the rubric, then draft the report paragraph."
    )

    resp = client.messages.parse(
        model=model,
        max_tokens=2000,
        thinking={"type": "adaptive"},
        output_config={"effort": "medium"},
        system=RUBRIC,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64",
                                             "media_type": media, "data": data}},
                {"type": "text", "text": facts},
            ],
        }],
        output_format=DefectAssessment,
    )
    if resp.parsed_output is None:
        raise RuntimeError(f"Claude returned no parseable assessment for {image_path}")
    return resp.parsed_output


def check_key() -> bool:
    """True if an API key is available (used by run.py to fail fast with a clear msg)."""
    return bool(os.environ.get("ANTHROPIC_API_KEY"))
