"""Optional barcode decoding backends. Decodes are evidence, not compliance verdicts."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from .image_pipeline import preprocess_variants


@dataclass(frozen=True)
class BarcodeEvidence:
    value: str
    symbology: str
    backend: str
    bbox: tuple[int, int, int, int] | None
    confidence: float | None = None


def _bbox(left: int, top: int, width: int, height: int) -> tuple[int, int, int, int]:
    return (left, top, width, height)


def decode_with_pyzbar(image: np.ndarray) -> list[BarcodeEvidence]:
    try:
        from pyzbar.pyzbar import decode
    except ImportError as exc:  # pragma: no cover - optional dependency
        raise RuntimeError("Install prep-manager-rule-engine[barcodes] to use pyzbar") from exc
    found: dict[tuple[str, str, tuple[int, int, int, int] | None], BarcodeEvidence] = {}
    for variant in preprocess_variants(image).values():
        for item in decode(variant):
            value = item.data.decode("utf-8", errors="replace").strip()
            rect = item.rect
            box = _bbox(rect.left, rect.top, rect.width, rect.height)
            evidence = BarcodeEvidence(value, item.type, "pyzbar", box)
            found[(value, item.type, box)] = evidence
    return list(found.values())


def decode_with_zxing(image: np.ndarray) -> list[BarcodeEvidence]:
    try:
        import zxingcpp
    except ImportError as exc:  # pragma: no cover - optional dependency
        raise RuntimeError("Install prep-manager-rule-engine[barcodes] to use zxing-cpp") from exc
    found: dict[tuple[str, str, tuple[int, int, int, int] | None], BarcodeEvidence] = {}
    for variant in preprocess_variants(image).values():
        for item in zxingcpp.read_barcodes(variant):
            value = item.text.strip()
            pos = item.position
            xs = [pos.top_left.x, pos.top_right.x, pos.bottom_left.x, pos.bottom_right.x]
            ys = [pos.top_left.y, pos.top_right.y, pos.bottom_left.y, pos.bottom_right.y]
            box = _bbox(min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)) if pos else None
            fmt = str(item.format)
            confidence = getattr(item, "confidence", None)
            evidence = BarcodeEvidence(value, fmt, "zxing-cpp", box,
                                       float(confidence) if confidence is not None else None)
            found[(value, fmt, box)] = evidence
    return list(found.values())


def decode_barcodes(image: np.ndarray, *, backends: tuple[str, ...] = ("zxing-cpp", "pyzbar")) -> list[dict[str, Any]]:
    """Run installed decoders, combining duplicate reads while retaining provenance."""
    decoders = {"pyzbar": decode_with_pyzbar, "zxing-cpp": decode_with_zxing}
    unknown = set(backends) - decoders.keys()
    if unknown:
        raise ValueError(f"Unsupported barcode backend(s): {', '.join(sorted(unknown))}")
    results = []
    errors = []
    for backend in backends:
        try:
            results.extend(decoders[backend](image))
        except RuntimeError as exc:
            errors.append(str(exc))
    if errors and len(errors) == len(backends):
        raise RuntimeError("No barcode decoder available. " + "; ".join(errors))
    combined: dict[tuple[str, str, tuple[int, int, int, int] | None], dict[str, Any]] = {}
    for result in results:
        key = (result.value, result.symbology, result.bbox)
        row = combined.setdefault(key, {"value": result.value, "symbology": result.symbology,
                                        "bbox": result.bbox, "backends": [], "confidence": result.confidence})
        row["backends"].append(result.backend)
    return list(combined.values())
