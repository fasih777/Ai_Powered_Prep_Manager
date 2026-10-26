"""OpenCV image preparation and quality measurements for prep-review evidence."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np


@dataclass(frozen=True)
class ImageQuality:
    width: int
    height: int
    blur_score: float
    mean_brightness: float
    low_quality: bool
    flags: tuple[str, ...]

    def as_dict(self) -> dict[str, Any]:
        return {"width": self.width, "height": self.height, "blur_score": self.blur_score,
                "mean_brightness": self.mean_brightness, "low_quality": self.low_quality,
                "flags": list(self.flags)}


def _cv2():
    try:
        import cv2
    except ImportError as exc:  # pragma: no cover - depends on optional extra
        raise RuntimeError("Install prep-manager-rule-engine[vision] to use image processing") from exc
    return cv2


def decode_image(source: str | Path | bytes | bytearray | np.ndarray) -> np.ndarray:
    """Decode a path, encoded bytes, or accept an already-decoded BGR image."""
    cv2 = _cv2()
    if isinstance(source, np.ndarray):
        image = source
    elif isinstance(source, (bytes, bytearray)):
        image = cv2.imdecode(np.frombuffer(source, dtype=np.uint8), cv2.IMREAD_COLOR)
    else:
        image = cv2.imread(str(source), cv2.IMREAD_COLOR)
    if image is None or image.size == 0 or image.ndim not in (2, 3):
        raise ValueError("Image could not be decoded or is empty")
    if image.ndim == 3 and image.shape[2] not in (3, 4):
        raise ValueError("Expected a grayscale, BGR, or BGRA image")
    if image.dtype != np.uint8:
        image = cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    if image.ndim == 3 and image.shape[2] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    return image


def assess_quality(image: np.ndarray, *, min_width: int = 640, min_height: int = 480,
                   min_blur_score: float = 50.0, brightness_range: tuple[float, float] = (35.0, 220.0)) -> ImageQuality:
    """Compute capture quality signals; flags indicate uncertainty risk, never a verdict."""
    cv2 = _cv2()
    if image is None or image.size == 0:
        raise ValueError("image must be a non-empty decoded image")
    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image
    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())
    flags = []
    if width < min_width or height < min_height:
        flags.append("low_resolution")
    if blur < min_blur_score:
        flags.append("blur")
    if brightness < brightness_range[0]:
        flags.append("underexposed")
    elif brightness > brightness_range[1]:
        flags.append("overexposed")
    return ImageQuality(width, height, blur, brightness, bool(flags), tuple(flags))


def preprocess_variants(image: np.ndarray, *, max_dimension: int = 2400) -> dict[str, np.ndarray]:
    """Produce conservative color, grayscale, and contrast-enhanced OCR candidates."""
    cv2 = _cv2()
    if image is None or image.size == 0:
        raise ValueError("image must be a non-empty decoded image")
    h, w = image.shape[:2]
    scale = min(1.0, max_dimension / max(h, w))
    if scale < 1.0:
        image = cv2.resize(image, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image.copy()
    enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    return {"color": image, "gray": gray, "clahe": enhanced}


def propose_barcode_regions(image: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Return candidate (x, y, width, height) regions from OpenCV's barcode detector."""
    cv2 = _cv2()
    detector_type = getattr(cv2, "barcode_BarcodeDetector", None)
    if detector_type is None:
        return []
    detector = detector_type()
    result = detector.detect(image)
    if not result or not result[0] or result[1] is None:
        return []
    regions = []
    for points in result[1]:
        points = np.asarray(points).reshape(-1, 2)
        x0, y0 = np.floor(points.min(axis=0)).astype(int)
        x1, y1 = np.ceil(points.max(axis=0)).astype(int)
        regions.append((max(0, x0), max(0, y0), min(image.shape[1], x1) - max(0, x0),
                        min(image.shape[0], y1) - max(0, y0)))
    return [box for box in regions if box[2] > 0 and box[3] > 0]
