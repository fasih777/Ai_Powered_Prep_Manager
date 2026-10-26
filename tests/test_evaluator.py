from pathlib import Path

from rule_engine import evaluate_review, load_rule_set


RULES = load_rule_set(Path(__file__).parents[1] / "rules/v1/electronics_small.yaml")


def evidence(**values):
    return {key: {"value": value, "confidence": 0.99} for key, value in values.items()}


def test_fully_compliant_unit_is_uncertain_for_non_visual_requirement():
    result = evaluate_review(
        RULES,
        evidence(
            polybag_presence="present",
            polybag_seal="sealed",
            suffocation_warning="present",
            suffocation_warning_legibility="legible",
            fnsku_surface="flat",
            manufacturer_barcode="covered",
            expiry_date="visible",
            handling_marks="present",
        ),
    )
    assert result["overall_status"] == "UNCERTAIN"
    assert result["checks"][-1]["reason"] == "Not verifiable from image evidence"


def test_visible_manufacturer_barcode_fails_overall_review():
    result = evaluate_review(
        RULES,
        evidence(
            polybag_presence="present",
            polybag_seal="sealed",
            suffocation_warning="present",
            suffocation_warning_legibility="legible",
            fnsku_surface="flat",
            manufacturer_barcode="visible",
            expiry_date="visible",
            handling_marks="present",
        ),
    )
    assert result["overall_status"] == "FAIL"
    barcode_check = next(check for check in result["checks"] if check["check_id"] == "manufacturer_barcode_covered")
    assert barcode_check["verdict"] == "FAIL"


def test_low_confidence_never_passes():
    result = evaluate_review(
        RULES,
        {"polybag_presence": {"value": "present", "confidence": 0.2}},
    )
    assert result["checks"][0]["verdict"] == "UNCERTAIN"
