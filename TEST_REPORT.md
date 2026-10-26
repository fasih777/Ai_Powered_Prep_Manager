# AI-Powered Prep Manager
## QA / Tester Assessment

**Test date:** 2026-09-26  
**Test scope:** PRD, TRD, Roadmap, backend rule engine/API, frontend build, authentication routes, dataset and deployment interfaces  
**Release verdict:** **FAIL - not release-ready**

## Executive Result

The deterministic Python rule engine and scenario tests are currently green, but the application cannot produce a frontend production build. The Next.js build stops on four unresolved imports, so the primary user workflow cannot be deployed.

The backend API tests also cannot be collected in the current repository virtual environment because `fastapi` is not installed there. This is both an environment defect and a CI reproducibility risk.

## Executed Checks

| Check | Result | Evidence |
|---|---|---|
| Python evaluator tests | PASS | 3 tests passed in `tests/test_evaluator.py` |
| Python scenario tests | PASS | 12 tests passed in `tests/test_scenarios.py` |
| Combined evaluator/scenario suite | PASS | **15 passed in 0.09s** |
| Python API test collection | BLOCKED | `ModuleNotFoundError: No module named 'fastapi'` |
| Next.js production build | FAIL | Four unresolved frontend imports |
| Next.js lint command | No failure output | Treat as unconfirmed until build/import failures are repaired and lint is rerun |
| Editor diagnostics for `page.tsx` | PASS | No errors reported by editor diagnostics |
| Editor diagnostics for `middleware.ts` | PASS | No errors reported by editor diagnostics |

## Release-Blocking Defects

### P0 - Frontend cannot build

The frontend production build fails with:

```text
./components/BarcodeCoverageEngine.tsx
Module not found: Can't resolve '../lib/barcode/barcodeEngine'

./components/OpenCVPipelineLab.tsx
Module not found: Can't resolve '../lib/cv/imagePreprocessing'

./components/VlmContextWorkbench.tsx
Module not found: Can't resolve '../lib/vlm/promptTemplates'

./app/api/v1/prep-review/evaluate-sync/route.ts
Module not found: Can't resolve '../../../lib/supabase/server'
```

The first three imported modules are absent from `frontend/lib/`. The Supabase server client exists under `frontend/lib/supabase/server.ts`, but the route's relative path is incorrect. Until these are fixed, the frontend cannot be deployed to Vercel or run from the production Docker image.

Affected files:

- [frontend/components/BarcodeCoverageEngine.tsx](frontend/components/BarcodeCoverageEngine.tsx)
- [frontend/components/OpenCVPipelineLab.tsx](frontend/components/OpenCVPipelineLab.tsx)
- [frontend/components/VlmContextWorkbench.tsx](frontend/components/VlmContextWorkbench.tsx)
- [frontend/app/api/v1/prep-review/evaluate-sync/route.ts](frontend/app/api/v1/prep-review/evaluate-sync/route.ts)
- [frontend/lib/supabase/server.ts](frontend/lib/supabase/server.ts)

### P0 - Backend API tests cannot start

`tests/test_api.py` fails during collection because the selected `.venv` does not contain FastAPI. The backend declares dependencies in [backend/requirements.txt](backend/requirements.txt), but the test environment has not been provisioned from that manifest.

Required test setup must install at least:

- FastAPI
- Uvicorn
- Pydantic
- python-multipart
- PyYAML
- Supabase client
- python-dotenv
- httpx
- Google GenAI SDK

### P1 - Production API still permits simulated evidence

[backend/main.py](backend/main.py) supports `preset` and `evidence_override` request fields. These are useful for deterministic tests, but they create a false-confidence risk if reachable in production. The PRD explicitly prioritizes reliability and says the model must not silently pass or fail when evidence is insufficient.

Test requirement:

- Production routes must reject or disable preset/mock evidence.
- Test-only routes or an explicit development flag should own deterministic fixtures.
- Every production verdict must be traceable to decoded image evidence.

### P1 - Real image pipeline is not fully proven

The repository contains [backend/vlm_engine.py](backend/vlm_engine.py), OpenCV utilities, barcode utilities, and dataset annotations. However, the tests do not exercise:

- multipart image bytes through the API
- OpenCV quality gating before VLM invocation
- VLM failure and timeout behavior
- multi-image/multi-angle evidence merging
- expiry-date OCR
- handling-mark extraction
- barcode decoder output mapped into the canonical evaluator evidence
- evidence bounding boxes persisted with the review

The existence of a VLM call is not sufficient for the Phase 1 exit criterion; the full image-to-verdict path needs integration tests.

### P1 - Two verdict authorities remain

The backend uses the YAML/Python evaluator, while the frontend has a separate TypeScript rule engine in [frontend/lib/rules/ruleEngine.ts](frontend/lib/rules/ruleEngine.ts). Test cases can pass in one implementation and disagree in the other.

Required test:

- Run the same evidence fixtures through the canonical engine used by the API.
- Frontend should render server results rather than independently deciding compliance.

### P1 - Authentication and RLS path lacks an end-to-end test

Frontend middleware and authenticated route handlers exist, but no test proves:

1. unauthenticated users are redirected;
2. access tokens reach FastAPI;
3. FastAPI validates the token;
4. the user identity is derived from `sub`;
5. organization membership is checked;
6. Supabase RLS permits only the correct tenant's records;
7. reviewer-only overrides reject operators.

This is especially important because the project claims Supabase is the database/auth boundary.

## Scenario Test Interpretation

The 15 passing tests validate the evaluator's deterministic behavior for:

- sealed polybag
- missing warning
- obscured warning
- incorrect FNSKU placement
- FNSKU on a seam
- visible manufacturer barcode
- covered expiry date
- missing handling marks
- fully correct preparation
- ambiguous evidence
- liquids category rules
- fragile/glass category rules

These are **logic tests with synthetic evidence dictionaries**, not image acceptance tests. They prove the evaluator behavior but do not prove that the perception layer generates correct evidence.

## PRD Acceptance Coverage

| Acceptance scenario | Logic test | Real image/API test | Status |
|---|---:|---:|---|
| Correctly sealed polybag | Yes | No | Partial |
| Missing warning | Yes | No | Partial |
| Obscured warning | Yes | No | Partial |
| Incorrect FNSKU placement | Yes | No | Partial |
| FNSKU on a seam | Yes | No | Partial |
| Original barcode visible | Yes | No | Partial |
| Covered expiry date | Yes | No | Partial |
| Missing handling mark | Yes | No | Partial |
| Fully correct preparation | Yes | No | Partial |
| Ambiguous preparation | Yes | No | Partial |

## TRD Test Gaps

### Preprocessing and quality gate

No automated test proves that a severely blurred image short-circuits VLM inference and forces all dependent checks to `UNCERTAIN`. The dataset annotation for scenario 10 describes this expected behavior, but the behavior is not verified by a pipeline test.

### Perception evidence contract

The VLM response schema does not cover every rule-engine evidence field. Missing or weakly represented fields include:

- polybag seal state
- expiry date extraction
- handling marks
- image quality flags
- per-evidence image references
- evidence provenance/backend
- multi-angle aggregation

### Persistence and audit

The backend still keeps `reviews_db` and `audit_logs` in process memory. Supabase migration tests are absent. A restart, second worker, or second backend instance will not share the same review history.

### Queue execution

The repository includes both Celery deployment commands and RQ utilities. There is no end-to-end test proving that the configured worker consumes the same queue the frontend enqueues into. This is a release blocker for the async workflow.

### Observability

The stack image specifies Sentry, but no Sentry dependency or initialization was found. There are no automated tests for error capture, latency metrics, confidence drift, or queue failure telemetry.

## Security Test Matrix

| Security test | Expected result | Current evidence |
|---|---|---|
| Missing Authorization header | 401 | No executed backend auth test found |
| Expired JWT | 401 | No executed backend auth test found |
| Invalid JWT signature | 401 | No executed backend auth test found |
| Operator creates review in own tenant | 200 | Not proven against Supabase |
| User reads another tenant's review | 403/empty | Not proven against Supabase |
| Operator submits override | 403 | Not proven end to end |
| Reviewer submits override | 200 | Schema intent exists; runtime path unverified |
| Audit log update/delete | denied | Migration trigger exists; database execution unverified |
| Client-supplied reviewer identity | ignored | Current API model still accepts reviewer fields |
| Preset/evidence override in production | rejected | Not currently demonstrated |

## Test Environment Defects

1. Repository `.venv` lacks FastAPI, preventing API test collection.
2. Frontend build fails before application tests can run.
3. No browser automation suite is configured.
4. No Supabase test project or migration smoke-test command is configured.
5. No VLM mock adapter is provided for deterministic integration testing without an API key.
6. No barcode/OCR fixture runner is present.

## Required Exit Criteria Before MVP Candidate

The following must be green before calling the project a Phase 1 MVP candidate:

- [ ] Install dependencies from one reproducible lock/manifest path.
- [ ] Full Python suite passes, including API tests.
- [ ] Frontend production build passes.
- [ ] Frontend lint passes after build errors are fixed.
- [ ] All ten acceptance scenarios pass through the canonical backend API.
- [ ] At least one real image fixture exercises the VLM path.
- [ ] Severe-blur fixture short-circuits before VLM and returns `UNCERTAIN`.
- [ ] Uploaded image bytes are persisted and associated with review records.
- [ ] Review, checks, evidence, overrides, and audit logs persist in Supabase.
- [ ] JWT, tenant isolation, and reviewer authorization tests pass.
- [ ] One queue technology is selected and worker enqueue/consume tests pass.
- [ ] No production request can inject preset or arbitrary evidence.
- [ ] Sentry or the chosen error-monitoring solution is configured and smoke-tested.
- [ ] CI runs backend tests, frontend build/lint, and dataset validation.

## Tester Recommendation

**Current recommendation: do not release.**

The rule engine is the strongest verified component: its 15 deterministic tests pass. The release remains blocked by frontend compilation, incomplete API test environment setup, unverified image-to-verdict behavior, missing durable persistence tests, and unproven authentication/RLS enforcement.

The next testing sprint should focus on restoring the frontend build and provisioning the backend test environment. Only after those are green should the team invest in browser E2E, Supabase integration, and real-image VLM regression tests.
