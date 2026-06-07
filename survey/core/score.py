"""Roll graded defects up into a 0–100 building-health score.

Code-grounded weighting: a few severe defects must dominate many cosmetic ones —
a single falling-hazard panel matters more than fifty hairline cracks. We start
at 100 (pristine) and subtract a per-defect penalty that grows sharply with
severity. Tracked across repeated inspections, the trend becomes the predictive
building-risk score that is the data-layer moat (jury Q&A T10).
"""

from __future__ import annotations

# Severity -> health penalty. Super-linear so severity 5 dominates (jury Q&A T10).
SEVERITY_PENALTY = {1: 1.0, 2: 3.0, 3: 8.0, 4: 18.0, 5: 35.0}

SEVERITY_LABEL = {1: "Cosmetic", 2: "Minor", 3: "Moderate", 4: "Serious", 5: "Critical"}


def building_health(defects: list[dict]) -> dict:
    """Return {score, band, counts, worst_severity, ri_flags} from graded defects.

    ``defects`` are the post-Claude records (each has a ``severity`` 1–5 and an
    ``ri_flag``); ``not_a_defect`` regions are expected to be filtered out already.
    """
    if not defects:
        return {"score": 100, "band": "A — no defects found",
                "counts": {}, "worst_severity": 0, "ri_flags": 0, "n_defects": 0}

    penalty = sum(SEVERITY_PENALTY.get(d["severity"], 0.0) for d in defects)
    score = max(0, round(100 - penalty))

    counts: dict[str, int] = {}
    for d in defects:
        counts[SEVERITY_LABEL[d["severity"]]] = counts.get(SEVERITY_LABEL[d["severity"]], 0) + 1

    worst = max(d["severity"] for d in defects)
    ri_flags = sum(1 for d in defects if d.get("ri_flag"))

    return {
        "score": score,
        "band": _band(score),
        "counts": counts,
        "worst_severity": worst,
        "ri_flags": ri_flags,
        "n_defects": len(defects),
    }


def _band(score: int) -> str:
    if score >= 90:
        return "A — good condition"
    if score >= 75:
        return "B — minor maintenance"
    if score >= 55:
        return "C — repairs needed this cycle"
    if score >= 35:
        return "D — serious defects, prompt action"
    return "E — critical, urgent action / detailed investigation"
