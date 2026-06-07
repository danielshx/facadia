"""Building-health scoring: a few severe defects must dominate many cosmetic ones."""

from core.score import building_health


def _d(sev, ri=False):
    return {"severity": sev, "ri_flag": ri}


def test_no_defects_is_perfect():
    h = building_health([])
    assert h["score"] == 100
    assert h["band"].startswith("A")
    assert h["n_defects"] == 0


def test_severity_penalty_is_super_linear():
    one_critical = building_health([_d(5)])["score"]
    five_cosmetic = building_health([_d(1)] * 5)["score"]
    # one Critical defect must hurt the score more than five Cosmetic ones
    assert one_critical < five_cosmetic


def test_score_clamps_at_zero():
    h = building_health([_d(5)] * 10)
    assert h["score"] == 0
    assert h["band"].startswith("E")


def test_counts_and_flags():
    h = building_health([_d(4, ri=True), _d(4, ri=True), _d(2)])
    assert h["n_defects"] == 3
    assert h["ri_flags"] == 2
    assert h["worst_severity"] == 4
    assert h["counts"]["Serious"] == 2
    assert h["counts"]["Minor"] == 1


def test_bands_are_ordered():
    scores = [building_health([_d(s)])["score"] for s in (1, 2, 3, 4, 5)]
    assert scores == sorted(scores, reverse=True)
