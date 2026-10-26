"""RQ integration for asynchronous prep reviews; Redis is configured by URL."""
from __future__ import annotations

import os
from typing import Any, Callable


def _rq():
    try:
        from redis import Redis
        from rq import Queue
    except ImportError as exc:  # pragma: no cover - optional dependency
        raise RuntimeError("Install prep-manager-rule-engine[queue] to use RQ jobs") from exc
    return Redis, Queue


def enqueue_prep_review(review_id: str, *, queue_name: str = "prep-reviews",
                        redis_url: str | None = None, timeout: int = 600):
    """Queue an importable `rule_engine.worker.process_prep_review` job."""
    if not review_id or not isinstance(review_id, str):
        raise ValueError("review_id must be a non-empty string")
    Redis, Queue = _rq()
    connection = Redis.from_url(redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    queue = Queue(queue_name, connection=connection, default_timeout=timeout)
    return queue.enqueue("rule_engine.worker.process_prep_review", review_id, job_timeout=timeout,
                         result_ttl=86400, failure_ttl=604800)


def process_prep_review(review_id: str, processor: Callable[[str], Any] | None = None) -> Any:
    """Worker entry point. Bind an application processor at deployment via worker setup."""
    if processor is None:
        raise RuntimeError("Configure a prep review processor before starting workers")
    return processor(review_id)
