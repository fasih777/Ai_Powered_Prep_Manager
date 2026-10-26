from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class CheckResult:
    check_id: str
    name: str
    verdict: str  # PASS | FAIL | UNCERTAIN
    reason: str
    evidence_key: str
    evidence: dict[str, Any] | None
    rule_set_version: str
    visually_verifiable: bool = True
    description: str = ""


def load_rule_set(path: str | Path) -> dict[str, Any]:
    with Path(path).open(encoding="utf-8") as file:
        rule_set = yaml.safe_load(file)
    if not isinstance(rule_set, dict) or not rule_set.get("version"):
        raise ValueError("Rule set must be an object with a version")
    if not isinstance(rule_set.get("checks"), list):
        raise ValueError("Rule set must contain a checks list")
    return rule_set


def _result(
    rule: dict[str, Any],
    verdict: str,
    reason: str,
    evidence: dict[str, Any] | None,
    version: str,
) -> CheckResult:
    return CheckResult(
        check_id=rule["check_id"],
        name=rule["name"],
        verdict=verdict,
        reason=reason,
        evidence_key=rule["evidence_key"],
        evidence=evidence,
        rule_set_version=version,
        visually_verifiable=rule.get("visually_verifiable", True),
        description=rule.get("description", ""),
    )


def evaluate_check(
    rule: dict[str, Any],
    evidence_by_key: dict[str, dict[str, Any]],
    version: str,
) -> CheckResult:
    evidence_key = rule["evidence_key"]
    evidence = evidence_by_key.get(evidence_key)

    if not rule.get("visually_verifiable", True):
        return _result(rule, "UNCERTAIN", "Not verifiable from image evidence", evidence, version)
    if not evidence:
        return _result(rule, "UNCERTAIN", f"Required evidence '{evidence_key}' is missing", None, version)

    confidence = evidence.get("confidence")
    value = evidence.get("value")
    if not isinstance(confidence, (int, float)) or confidence < rule["min_confidence"]:
        return _result(
            rule,
            "UNCERTAIN",
            f"Evidence confidence {confidence if isinstance(confidence, (int, float)) else 0:.2f} is below threshold {rule['min_confidence']:.2f}",
            evidence,
            version,
        )
    if value in rule.get("fail_values", []):
        return _result(rule, "FAIL", f"Observed {value!r} for {rule['name']}", evidence, version)
    if value in rule.get("pass_values", []):
        return _result(rule, "PASS", f"Observed compliant {value!r} for {rule['name']}", evidence, version)
    return _result(rule, "UNCERTAIN", f"Evidence value {value!r} is not decisive", evidence, version)


def evaluate_review(
    rule_set: dict[str, Any],
    evidence_by_key: dict[str, dict[str, Any]],
    ignore_non_visual_for_overall: bool = False,
) -> dict[str, Any]:
    version = str(rule_set["version"])
    checks = [evaluate_check(rule, evidence_by_key, version) for rule in rule_set["checks"]]

    # Scope for overall status evaluation
    evaluated = [
        c for c in checks
        if not (ignore_non_visual_for_overall and not c.visually_verifiable)
    ]

    if any(check.verdict == "FAIL" for check in evaluated):
        overall_status = "FAIL"
    elif any(check.verdict == "UNCERTAIN" for check in evaluated):
        overall_status = "UNCERTAIN"
    else:
        overall_status = "PASS"

    pass_count = sum(1 for c in checks if c.verdict == "PASS")
    fail_count = sum(1 for c in checks if c.verdict == "FAIL")
    uncertain_count = sum(1 for c in checks if c.verdict == "UNCERTAIN")

    return {
        "rule_set_id": rule_set.get("rule_set_id"),
        "rule_set_version": version,
        "category": rule_set.get("category"),
        "checks": [check.__dict__ for check in checks],
        "overall_status": overall_status,
        "metrics": {
            "total_checks": len(checks),
            "passed": pass_count,
            "failed": fail_count,
            "uncertain": uncertain_count,
            "visually_verifiable_count": sum(1 for c in checks if c.visually_verifiable),
        },
    }
