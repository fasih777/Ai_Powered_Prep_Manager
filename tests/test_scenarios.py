from pathlib import Path
import pytest
from rule_engine import evaluate_review, load_rule_set

ELECTRONICS_RULES = load_rule_set(Path(__file__).parents[1] / "rules/v1/electronics_small.yaml")
APPAREL_RULES = load_rule_set(Path(__file__).parents[1] / "rules/v1/apparel.yaml")
LIQUIDS_RULES = load_rule_set(Path(__file__).parents[1] / "rules/v1/liquids_consumables.yaml")
FRAGILE_RULES = load_rule_set(Path(__file__).parents[1] / "rules/v1/fragile_glass.yaml")


def make_evidence(**kwargs):
    """Helper to generate evidence payload with default 0.95 confidence"""
    return {
        key: (
            val if isinstance(val, dict)
            else {"value": val, "confidence": 0.95}
        )
        for key, val in kwargs.items()
    }


def fully_compliant_electronics_evidence():
    return make_evidence(
        polybag_presence="present",
        polybag_seal="sealed",
        suffocation_warning="present",
        suffocation_warning_legibility="legible",
        fnsku_placement="flat",
        fnsku_surface="flat",
        manufacturer_barcode="covered",
        expiry_date="visible",
        handling_marks="present",
    )


# Scenario 1: Correctly sealed polybag -> PASS across polybag checks
def test_scenario_1_correctly_sealed_polybag():
    ev = fully_compliant_electronics_evidence()
    result = evaluate_review(ELECTRONICS_RULES, ev)
    checks = {c["check_id"]: c for c in result["checks"]}
    assert checks["polybag_presence"]["verdict"] == "PASS"
    assert checks["polybag_sealing"]["verdict"] == "PASS"


# Scenario 2: Missing warning -> FAIL, Suffocation Warning
def test_scenario_2_missing_warning():
    ev = fully_compliant_electronics_evidence()
    ev["suffocation_warning"] = {"value": "missing", "confidence": 0.95}
    result = evaluate_review(ELECTRONICS_RULES, ev)
    assert result["overall_status"] == "FAIL"
    warning_check = next(c for c in result["checks"] if c["check_id"] == "suffocation_warning_presence")
    assert warning_check["verdict"] == "FAIL"
    assert "missing" in warning_check["reason"].lower()


# Scenario 3: Obscured warning -> FAIL / UNCERTAIN depending on legibility
def test_scenario_3_obscured_warning():
    ev = fully_compliant_electronics_evidence()
    ev["suffocation_warning_legibility"] = {"value": "obscured", "confidence": 0.92}
    result = evaluate_review(ELECTRONICS_RULES, ev)
    assert result["overall_status"] == "FAIL"
    legibility_check = next(c for c in result["checks"] if c["check_id"] == "warning_legibility")
    assert legibility_check["verdict"] == "FAIL"


# Scenario 4: Incorrect FNSKU placement -> FAIL, FNSKU
def test_scenario_4_incorrect_fnsku_placement():
    ev = fully_compliant_electronics_evidence()
    ev["fnsku_placement"] = {"value": "misplaced", "confidence": 0.88}
    result = evaluate_review(ELECTRONICS_RULES, ev)
    assert result["overall_status"] == "FAIL"
    placement_check = next(c for c in result["checks"] if c["check_id"] == "fnsku_placement")
    assert placement_check["verdict"] == "FAIL"


# Scenario 5: FNSKU on a seam -> FAIL, FNSKU surface
def test_scenario_5_fnsku_on_seam():
    ev = fully_compliant_electronics_evidence()
    ev["fnsku_surface"] = {"value": "seam", "confidence": 0.94}
    result = evaluate_review(ELECTRONICS_RULES, ev)
    assert result["overall_status"] == "FAIL"
    surface_check = next(c for c in result["checks"] if c["check_id"] == "fnsku_surface")
    assert surface_check["verdict"] == "FAIL"
    assert "seam" in surface_check["reason"].lower()


# Scenario 6: Original barcode visible/uncovered -> FAIL, Original Barcode
def test_scenario_6_original_barcode_visible():
    ev = fully_compliant_electronics_evidence()
    ev["manufacturer_barcode"] = {"value": "visible", "confidence": 0.96}
    result = evaluate_review(ELECTRONICS_RULES, ev)
    assert result["overall_status"] == "FAIL"
    barcode_check = next(c for c in result["checks"] if c["check_id"] == "manufacturer_barcode_covered")
    assert barcode_check["verdict"] == "FAIL"
    assert "visible" in barcode_check["reason"].lower()


# Scenario 7: Covered expiry date -> FAIL
def test_scenario_7_covered_expiry_date():
    ev = fully_compliant_electronics_evidence()
    ev["expiry_date"] = {"value": "covered", "confidence": 0.91}
    result = evaluate_review(ELECTRONICS_RULES, ev)
    assert result["overall_status"] == "FAIL"
    expiry_check = next(c for c in result["checks"] if c["check_id"] == "expiry_date_visibility")
    assert expiry_check["verdict"] == "FAIL"


# Scenario 8: Missing handling mark -> FAIL, Handling Marks
def test_scenario_8_missing_handling_marks():
    ev = fully_compliant_electronics_evidence()
    ev["handling_marks"] = {"value": "missing", "confidence": 0.89}
    result = evaluate_review(ELECTRONICS_RULES, ev)
    assert result["overall_status"] == "FAIL"
    mark_check = next(c for c in result["checks"] if c["check_id"] == "handling_marks")
    assert mark_check["verdict"] == "FAIL"


# Scenario 9: Fully correct preparation -> overall PASS (evaluating visual criteria)
def test_scenario_9_fully_correct_preparation():
    ev = fully_compliant_electronics_evidence()
    result = evaluate_review(ELECTRONICS_RULES, ev, ignore_non_visual_for_overall=True)
    assert result["overall_status"] == "PASS"
    assert all(
        c["verdict"] == "PASS"
        for c in result["checks"]
        if c["visually_verifiable"]
    )


# Scenario 10: Visually ambiguous / missing angle -> UNCERTAIN, never guessed PASS/FAIL
def test_scenario_10_visually_ambiguous_evidence():
    # Only partial evidence supplied, manufacturer barcode not captured
    ev = make_evidence(
        polybag_presence="present",
        polybag_seal="sealed",
    )
    result = evaluate_review(ELECTRONICS_RULES, ev, ignore_non_visual_for_overall=True)
    assert result["overall_status"] == "UNCERTAIN"
    missing_check = next(c for c in result["checks"] if c["check_id"] == "manufacturer_barcode_covered")
    assert missing_check["verdict"] == "UNCERTAIN"
    assert "missing" in missing_check["reason"].lower()


# Multi-category validation: Liquids and Consumables
def test_liquids_double_seal_and_orientation():
    ev = make_evidence(
        double_seal_polybag="present",
        polybag_seal="sealed",
        suffocation_warning="present",
        expiry_date="visible",
        orientation_arrows="present",
        manufacturer_barcode="covered",
        fnsku_surface="flat",
    )
    result = evaluate_review(LIQUIDS_RULES, ev, ignore_non_visual_for_overall=True)
    assert result["overall_status"] == "PASS"


# Multi-category validation: Fragile & Glass
def test_fragile_missing_bubble_wrap():
    ev = make_evidence(
        protective_cushioning="bare",
        fragile_labels="present",
        fnsku_placement="flat",
        manufacturer_barcode="covered",
    )
    result = evaluate_review(FRAGILE_RULES, ev)
    assert result["overall_status"] == "FAIL"
    cushion_check = next(c for c in result["checks"] if c["check_id"] == "protective_cushioning")
    assert cushion_check["verdict"] == "FAIL"
