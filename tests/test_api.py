import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "electronics_small" in data["loaded_categories"]


def test_list_categories():
    response = client.get("/v1/categories")
    assert response.status_code == 200
    data = response.json()
    cats = {c["category"] for c in data["categories"]}
    assert "electronics_small" in cats
    assert "apparel" in cats


def test_get_rule_set():
    response = client.get("/v1/rule-sets/electronics_small")
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "electronics_small"
    assert len(data["checks"]) >= 10


def test_create_review_compliant():
    payload = {
        "category": "electronics_small",
        "work_order_ref": "WO-99881",
        "images": [{"id": "img1", "url": "https://example.com/test.jpg", "angle": "front"}],
        "preset": "compliant",
    }
    response = client.post("/v1/prep-review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "PASS"
    assert len(data["checks"]) >= 10
    assert data["work_order_ref"] == "WO-99881"


def test_create_review_fnsku_seam_fails():
    payload = {
        "category": "electronics_small",
        "images": [{"id": "img1", "url": "https://example.com/seam.jpg"}],
        "preset": "fnsku_seam",
    }
    response = client.post("/v1/prep-review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "FAIL"
    seam_check = next(c for c in data["checks"] if c["check_id"] == "fnsku_surface")
    assert seam_check["verdict"] == "FAIL"


def test_create_review_uncovered_barcode_fails():
    payload = {
        "category": "electronics_small",
        "images": [{"id": "img1", "url": "https://example.com/barcode.jpg"}],
        "preset": "uncovered_barcode",
    }
    response = client.post("/v1/prep-review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "FAIL"
    bc_check = next(c for c in data["checks"] if c["check_id"] == "manufacturer_barcode_covered")
    assert bc_check["verdict"] == "FAIL"


def test_create_review_ambiguous_is_uncertain():
    payload = {
        "category": "electronics_small",
        "images": [{"id": "img1", "url": "https://example.com/dim.jpg"}],
        "preset": "ambiguous",
    }
    response = client.post("/v1/prep-review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "UNCERTAIN"


def test_human_override_workflow():
    # 1. Create a failing review
    payload = {
        "category": "electronics_small",
        "images": [{"id": "img1", "url": "https://example.com/barcode.jpg"}],
        "preset": "uncovered_barcode",
    }
    create_res = client.post("/v1/prep-review", json=payload)
    assert create_res.status_code == 200
    review_id = create_res.json()["review_id"]
    assert create_res.json()["overall_status"] == "FAIL"

    # 2. Reviewer overrides the barcode check to PASS
    override_payload = {
        "check_id": "manufacturer_barcode_covered",
        "corrected_verdict": "PASS",
        "note": "Human inspection confirms original barcode was masked under matte overlay",
        "reviewer_name": "QA Lead Alice",
    }
    override_res = client.post(f"/v1/prep-review/{review_id}/override", json=override_payload)
    assert override_res.status_code == 200
    updated = override_res.json()
    assert updated["overall_status"] == "PASS"
    assert len(updated["overrides"]) == 1
    assert updated["overrides"][0]["reviewer_name"] == "QA Lead Alice"

    # 3. Check audit logs
    audit_res = client.get("/v1/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()["logs"]
    assert any(log["action"] == "VERDICT_OVERRIDDEN" for log in logs)


def test_presets_disabled_in_production(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("ALLOW_DEV_PRESETS", raising=False)

    payload = {
        "category": "electronics_small",
        "images": [{"id": "img1", "url": "https://example.com/test.jpg"}],
        "preset": "compliant",
    }
    response = client.post("/v1/prep-review", json=payload)
    assert response.status_code == 400
    assert "Preset scenarios are disabled in production" in response.json()["detail"]

    override_payload = {
        "category": "electronics_small",
        "images": [{"id": "img1", "url": "https://example.com/test.jpg"}],
        "evidence_override": {"polybag_presence": {"value": "present", "confidence": 1.0}},
    }
    response_override = client.post("/v1/prep-review", json=override_payload)
    assert response_override.status_code == 400
    assert "Direct evidence overrides are disabled in production" in response_override.json()["detail"]


def test_jwt_and_rbac_override_protection(monkeypatch):
    import jwt as pyjwt
    # 1. Create a review first
    payload = {
        "category": "electronics_small",
        "images": [{"id": "img1", "url": "https://example.com/barcode.jpg"}],
        "preset": "uncovered_barcode",
    }
    create_res = client.post("/v1/prep-review", json=payload)
    review_id = create_res.json()["review_id"]

    # 2. Forge operator token (role: operator)
    operator_token = pyjwt.encode(
        {"sub": "user_operator_123", "email": "operator@warehouse.com", "app_metadata": {"role": "operator"}},
        "dummy_secret",
        algorithm="HS256"
    )

    override_payload = {
        "check_id": "manufacturer_barcode_covered",
        "corrected_verdict": "PASS",
        "note": "Operator attempting unauthorized override",
        "reviewer_name": "Bob",
    }
    res_operator = client.post(
        f"/v1/prep-review/{review_id}/override",
        json=override_payload,
        headers={"Authorization": f"Bearer {operator_token}"}
    )
    assert res_operator.status_code == 403
    assert "Insufficient permissions" in res_operator.json()["detail"]

    # 3. Forge reviewer token (role: reviewer)
    reviewer_token = pyjwt.encode(
        {"sub": "user_reviewer_456", "email": "reviewer@compliance.com", "app_metadata": {"role": "reviewer"}},
        "dummy_secret",
        algorithm="HS256"
    )
    res_reviewer = client.post(
        f"/v1/prep-review/{review_id}/override",
        json=override_payload,
        headers={"Authorization": f"Bearer {reviewer_token}"}
    )
    assert res_reviewer.status_code == 200
    assert res_reviewer.json()["overrides"][0]["reviewer_name"] == "reviewer@compliance.com"


def test_opencv_severe_blur_short_circuits_to_uncertain():
    import base64
    import cv2
    import numpy as np

    # Generate a solid / blurred image that will produce low Laplacian variance
    solid_gray = np.full((480, 640), 128, dtype=np.uint8)
    _, buffer = cv2.imencode(".jpg", solid_gray)
    b64_data = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

    payload = {
        "category": "electronics_small",
        "images": [{"id": "blurred_sample", "data": b64_data, "angle": "front"}],
    }

    res = client.post("/v1/prep-review", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["overall_status"] == "UNCERTAIN"
    # Ensure detections show the blur warning
    assert any("Blur" in d.get("label", "") for d in data["images"][0].get("detections", []))
