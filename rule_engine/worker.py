"""RQ worker process entry point; application setup must configure the processor."""
from __future__ import annotations

import importlib
import os
from typing import Any, Callable

_processor: Callable[[str], Any] | None = None


def _load_configured_processor() -> None:
    """Load `module:function` from PREP_REVIEW_PROCESSOR in each worker process."""
    target = os.getenv("PREP_REVIEW_PROCESSOR")
    if not target:
        return
    module_name, separator, attribute = target.partition(":")
    if not separator or not module_name or not attribute:
        raise RuntimeError("PREP_REVIEW_PROCESSOR must use the format package.module:function")
    candidate = getattr(importlib.import_module(module_name), attribute)
    configure_processor(candidate)


def configure_processor(processor: Callable[[str], Any]) -> None:
    global _processor
    _processor = processor


def process_prep_review(review_id: str) -> Any:
    if _processor is None:
        _load_configured_processor()
    if _processor is None:
        raise RuntimeError("No prep-review processor configured in this worker")
    return _processor(review_id)
