# AI-Powered Prep Manager
## PRD / TRD / Roadmap Project Status Review

**Review date:** 2026-09-26  
**Review type:** Project-management delivery and architecture review  
**Status:** Prototype progressing toward MVP; Phase 1 exit criteria are not yet met

## Executive Summary

The project now has a credible full-stack prototype shape and most of the planned technology choices are represented:

- Next.js and TypeScript frontend
- FastAPI and Python backend
- Supabase schema, Storage/Auth integration points, and RLS migrations
- Gemini structured-output VLM integration
- OpenCV preprocessing utilities
- pyzbar/zxing-cpp barcode utilities
- Celery/Redis deployment direction plus an RQ utility layer
- Versioned YAML rule sets and deterministic Python evaluation
- Scenario annotations and an interactive review/audit UI

The project is **not production-ready** and should not yet be marked as having completed the Phase 1 MVP. The largest gap is the boundary between the real backend pipeline and the demo/fallback paths: uploaded images are not consistently persisted and processed end to end, the backend still supports preset/mock evidence, the Supabase database is not the authoritative persistence path for reviews, and the frontend contains a second rule engine separate from the YAML/Python authority.

## Overall RAG Status

| Area | Status | Project-manager assessment |
|---|---|---|
| Product requirements | Amber | Core workflow is represented, but production evidence and operational workflows are incomplete. |
| Technical architecture | Amber | Major components exist, but several boundaries are duplicated or disconnected. |
| Phase 0 foundations | Amber | Rules, schema, and dataset annotations exist; compliance approval and dataset completeness are not proven. |
| Phase 1 MVP | Red/Amber | API and VLM path exist, but real image ingestion, persistence, and acceptance validation are incomplete. |
| Phase 2 coverage | Amber | Multiple categories and check definitions exist, but actual model/evidence coverage is not validated. |
| Phase 3 trust | Red/Amber | RLS hardening exists, but backend auth/persistence/immutability integration is incomplete. |
| Phase 4 scale | Red | Observability, drift metrics, latency evidence, and automated regression gates are missing. |
| Deployment | Red/Amber | Docker and Render definitions exist, but worker/runtime consistency and end-to-end deployment need verification. |

## PRD Traceability

| PRD requirement | Evidence in repository | Status | Notes |
|---|---|---|---|
| FR1: accept images and category metadata | `backend/main.py`, frontend review flow | Partial | Request models exist; multipart uploads currently create placeholder paths and do not consistently persist bytes. |
| FR2: select applicable checks by category | `rules/v1/*.yaml`, `backend/main.py` | Partial | Multiple categories load, but applicability rules are mostly unconditional and fallback behavior can silently use a default category. |
| FR3: per-check verdict, reason, evidence | `rule_engine/evaluator.py`, `backend/vlm_engine.py`, frontend UI | Partial | Structured output exists; final evidence mapping is incomplete for several checks. |
| FR4: OCR warning and expiry | `backend/vlm_engine.py`, dataset annotations | Partial | VLM OCR field exists, but the quality gate and full expiry/handling OCR path are not consistently wired into verdicts. |
| FR5: FNSKU spatial reasoning | `surface_classification`, frontend geometry UI | Partial | VLM returns a surface class, but there is no demonstrated calibrated geometry model or multi-angle reconciliation. |
| FR6: manufacturer barcode coverage | `rule_engine/barcodes.py`, frontend collision engine | Partial | Utility and UI exist; backend VLM maps visibility but does not demonstrate real barcode decoding/IoU evidence for every review. |
| FR7: conservative UNCERTAIN | Python evaluator, scenario 10 annotation | Partial | Policy exists, but preset fallback paths can manufacture evidence and the non-visual overall-status decision needs one consistent policy. |
| FR8: aggregate PREP STATUS | Python evaluator and frontend rule engine | Partial | Aggregation exists in two implementations, creating a single-source-of-truth risk. |
| FR9: audit every decision | Supabase `audit_logs`, in-memory backend logs, audit UI | Partial | Schema is designed for it, but current backend writes process-local audit records rather than durable Supabase records. |
| FR10: human override and calibration | Override endpoint, Supabase override table, UI | Partial | Flow exists, but reviewer identity/authorization and durable persistence must be enforced at runtime. |

## TRD Traceability

### System boundaries

The intended boundary is sound:

1. Frontend captures category and images.
2. FastAPI orchestrates review.
3. OpenCV performs quality/preprocessing.
4. VLM extracts evidence.
5. Python rule engine decides verdicts.
6. Supabase stores review state and audit data.

The current implementation does not fully enforce that boundary. The frontend has its own deterministic rule engine in [frontend/lib/rules/ruleEngine.ts](frontend/lib/rules/ruleEngine.ts), while the backend uses YAML loaded by [rule_engine/evaluator.py](rule_engine/evaluator.py). These implementations use different rule IDs, evidence shapes, and logic. The YAML/Python path should become authoritative, with the frontend limited to display and local test tooling.

### Perception

[backend/vlm_engine.py](backend/vlm_engine.py) provides a real Gemini structured-output call with bounding boxes, surface classification, OCR text, and manufacturer-barcode visibility. This is a meaningful implementation step.

However:

- Gemini is hard-coded to `gemini-1.5-pro`, while frontend copy references `gemini-3.8-flash`.
- The VLM schema does not return every evidence field required by the YAML rules, such as seal state, expiry date, handling marks, quality flags, and explicit confidence for each check.
- `generate_perception_evidence` in [backend/main.py](backend/main.py) still supports preset/mock evidence and maps only a subset of fields.
- There is no proven pre-VLM quality-gate short circuit for the annotated severe-blur scenario.
- Only the first image is processed in the shown path, so multiple-angle input is not yet a real evidence fusion workflow.

### Data and Supabase

The schema is substantially more mature than the original foundation. It includes:

- organizations and membership roles
- versioned rule sets with checksum
- reviews and review images
- check results and perceptual evidence
- human overrides and calibration status
- audit logs
- RLS hardening migration

The important remaining integration issue is that [backend/main.py](backend/main.py) still declares `reviews_db` and `audit_logs` in memory. The Supabase client helpers exist in [backend/supabase_client.py](backend/supabase_client.py), but the review and override endpoints are not consistently using them for durable writes and reads.

Migration 002 is directionally correct, but it should be applied and tested against a real Supabase project. Its comments explicitly contain assumptions about column layout and policy state, so migration execution must be part of the release gate.

### Authentication and authorization

Frontend session handling is present through [frontend/middleware.ts](frontend/middleware.ts), the server Supabase client, login actions, and authenticated route handlers.

The backend still needs a verified, enforced JWT dependency on the actual deployed API path. Relying only on frontend middleware does not secure direct calls to FastAPI. The backend must validate the bearer token, derive `sub`, check organization membership/role, and pass the user token to Supabase for RLS evaluation.

### Async processing

The repository contains both:

- Celery-oriented backend deployment/configuration
- RQ-oriented `rule_engine/jobs.py` and `rule_engine/worker.py`

That is a delivery risk. The project must choose one queue implementation for MVP. Current environment/configuration references Celery, while the Python utility layer documents RQ. Worker commands, task names, queues, retries, and monitoring must use one consistent contract.

### Observability

The supplied stack image specifies Sentry. No Sentry dependency, initialization, error boundary, event capture, or deployment configuration was found in the reviewed source/configuration. Monitoring is therefore not implemented according to the stated stack.

## Roadmap Assessment

### Phase 0: Foundations

**Status: Partially complete.**

Implemented or present:

- Versioned YAML rules for multiple categories
- Core data schema and RLS migrations
- Dataset annotation files, including a severe-blur quality-gate scenario
- Python evaluator tests and API tests
- Basic evidence and review contracts

Still required before exit:

- Confirm the authoritative rule owner and approval record
- Confirm the dataset count and that at least 50 labeled images are physically present, not only JSON annotations
- Add a reproducible dataset validation command
- Ensure YAML checks and dataset labels use one canonical check-ID/evidence vocabulary

### Phase 1: MVP

**Status: Not complete; highest priority.**

Present:

- `POST /v1/prep-review`
- FastAPI response models
- Real VLM call path
- Deterministic rule evaluator
- Frontend review station
- Scenario tests and API tests

Blocking items:

1. Upload bytes must be stored and processed, not converted to placeholder URLs.
2. OpenCV quality gating must run before VLM inference.
3. Evidence must be generated for all four MVP checks from real image inputs.
4. Review/check/evidence/audit records must be persisted in Supabase.
5. The Python YAML evaluator must be the only verdict authority.
6. Four-check acceptance tests must run against actual fixture images with a zero-false-PASS result.
7. The API must reject or explicitly mark unsupported categories instead of silently falling back to a default rule set.

### Phase 2: Full check coverage

**Status: Partially scaffolded, not validated.**

Multiple rule sets and UI panels exist, but there is no evidence that all ten scenarios work against real photographs across two categories. FNSKU geometry, barcode decoding, expiry OCR, warning legibility, and handling marks need calibrated test results rather than simulated UI output.

### Phase 3: Reliability and human review

**Status: Partially implemented.**

The override UI, override endpoint, schema, RLS policies, and audit trigger are present. Runtime trust is still blocked by:

- backend JWT and role enforcement
- durable Supabase review writes
- append-only audit verification in a real database
- reviewer identity derived from authenticated claims, not request fields
- recalculation of overall status after overrides using an explicit policy
- calibration export and review workflow

### Phase 4: Scale and observability

**Status: Not started.**

Missing or unproven:

- Sentry integration
- verdict/confidence drift dashboards
- p95 latency measurements for up to four images
- model/rule regression automation
- rule-set activation/hot-reload policy in production
- category rollout gates
- production SLA evidence

## Technology Stack Assessment

| Stated choice | Repository implementation | Assessment |
|---|---|---|
| Next.js + TypeScript | Present in `frontend/` | Good fit; build and route wiring require final CI verification. |
| Vercel frontend | Not represented by a dedicated Vercel config | Acceptable, but deployment environment variables and rewrites must be documented. |
| FastAPI + Python | Present in `backend/` | Good fit; needs dependency/auth/persistence cleanup. |
| Render or Railway backend | Render and Railway files exist | Too many deployment paths; select one release target and test it. |
| Supabase DB/Storage/Auth | Schema, client helper, middleware present | Direction is correct; runtime persistence and backend JWT enforcement remain incomplete. |
| Claude/GPT-4V-class VLM MVP | Gemini is implemented instead | Viable alternative, but update the TRD/architecture decision and standardize model/version. |
| Fine-tuned YOLO scale phase | No YOLO implementation found | Correctly deferred; requires labeled data and a model decision later. |
| OpenCV | Python and frontend preprocessing utilities present | Useful foundation; backend quality gate is not fully integrated. |
| pyzbar/zxing-cpp | Python barcode adapters present | Optional dependencies exist; integration and real-image tests remain. |
| Celery or RQ + Redis | Both directions appear | Choose one. Current mixed architecture is a release risk. |
| Custom Python rule engine | Present and tested | Strongest architectural piece, but remove the competing frontend authority. |
| Sentry | Not found in source/config | Missing stack commitment. |

## Highest Risks

| Priority | Risk | Impact | Mitigation / owner action |
|---|---|---|---|
| P0 | False PASS from fallback/preset evidence | Compliance defect and financial exposure | Disable presets in production; require image-derived evidence and default to UNCERTAIN. |
| P0 | Reviews not durable in Supabase | No auditability or multi-user operation | Make Supabase the write/read path before MVP sign-off. |
| P0 | Backend auth not enforced on direct API | Unauthorized review/override access | Add FastAPI JWT dependency and role/membership checks. |
| P1 | Two rule engines | Behavioral drift and inconsistent verdicts | Keep YAML/Python authoritative; remove or constrain TypeScript evaluator. |
| P1 | Celery/RQ ambiguity | Jobs may not run in deployment | Select one queue and align all commands, task names, and monitors. |
| P1 | VLM/model contract mismatch | Evidence fields may be missing or stale | Version the model/schema and map every required evidence field explicitly. |
| P1 | No Sentry/operational telemetry | Failures invisible in production | Add Sentry and structured latency/verdict metrics. |
| P2 | Dataset acceptance not reproducible | Cannot prove zero false-PASS | Add fixture validation, dataset manifest, and CI regression job. |
| P2 | Deployment config drift | Deployments fail or run wrong service | Choose Vercel + Render or Vercel + Railway and delete/disable unused paths. |

## Recommended Execution Sequence

### Gate A: Make the MVP truthful

1. Disable preset/mock evidence for production routes.
2. Decode uploaded image bytes.
3. Run OpenCV quality gate before VLM.
4. Process all supplied angles and merge evidence conservatively.
5. Map the VLM response into the canonical Python evidence schema.
6. Evaluate exclusively with the YAML/Python engine.

### Gate B: Make the result durable and secure

1. Add backend JWT validation using the Supabase access token.
2. Derive `user_id` and role from authenticated context.
3. Persist reviews, images, checks, evidence, overrides, and audit logs in Supabase.
4. Pass the user token through Supabase calls so RLS applies.
5. Apply and integration-test both SQL migrations.

### Gate C: Prove Phase 1

1. Create a dataset manifest with image paths, scenario IDs, categories, and ground truth.
2. Run the four MVP checks against real fixtures.
3. Assert zero false PASS and correct ambiguous-case UNCERTAIN behavior.
4. Record latency for one to four images.
5. Run the suite in CI on every rule/model change.

### Gate D: Stabilize operations

1. Choose Celery or RQ.
2. Add Sentry and structured metrics.
3. Verify Docker, worker, Redis, Supabase, and frontend deployment together.
4. Add reviewer override and audit smoke tests against a real Supabase project.

## Release Recommendation

Do not release this as a compliance-blocking production system yet. It is suitable for an internal prototype/demo and architecture validation. The next release milestone should be named **Phase 1 MVP Candidate**, and it should be blocked until real image evidence, Supabase persistence, backend authentication, one queue implementation, and zero-false-PASS fixture tests are demonstrated together.

**Project-manager conclusion:** The team is moving in the correct architectural direction, but the project is currently in an **Amber/Red integration phase**. The next work should reduce truthfulness, security, and persistence risk before adding more UI or more categories.
