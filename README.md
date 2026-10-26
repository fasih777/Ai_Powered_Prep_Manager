# 🤖 AI-Powered Prep Manager

> **Enterprise-grade, AI-driven packaging compliance review system for Amazon FBA / 3PL warehouses.**
> Built with a **deterministic rule engine** at its core — AI provides *evidence*, rules produce *verdicts*. No model response can ever directly change a compliance decision.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth+DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-1.5_Pro-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)

---

## 📖 Table of Contents

1. [What Is This Project?](#-what-is-this-project)
2. [Core Philosophy](#-core-philosophy)
3. [Architecture Overview](#-architecture-overview)
4. [Directory Structure](#-directory-structure)
5. [Components Deep Dive](#-components-deep-dive)
6. [Tech Stack](#-tech-stack)
7. [Rule System](#-rule-system)
8. [10 Compliance Scenarios](#-10-compliance-scenarios)
9. [API Reference](#-api-reference)
10. [Authentication & Security](#-authentication--security)
11. [Running Locally](#-running-locally)
12. [Docker Deployment](#-docker-deployment)
13. [Cloud Deployment](#-cloud-deployment)
14. [Testing](#-testing)

---

## 🎯 What Is This Project?

The **AI-Powered Prep Manager** is a full-stack, production-ready system designed to **automate and audit packaging compliance** at Amazon FBA prep centers and third-party logistics (3PL) warehouses.

**The problem it solves:**
- Warehouse operators must manually inspect thousands of items per day to ensure they meet Amazon's inbound compliance standards (polybag presence, barcode masking, suffocation warnings, FNSKU placement, etc.).
- Manual inspection is slow, inconsistent, error-prone, and unauditable.

**The solution:**
- Operators upload product images → **Gemini 1.5 Pro** analyzes them visually and extracts structured *evidence* (bounding boxes, OCR text, surface classifications).
- The **deterministic Python rule engine** applies category-specific YAML rules to produce `PASS`, `FAIL`, or `UNCERTAIN` verdicts — the AI model **never** decides the verdict directly.
- Every decision is **immutable, auditable**, and **overridable** by authorized human reviewers.
- The entire system is multi-tenant, role-based, and deployable via Docker or Railway/Render.

---

## 🧠 Core Philosophy

```
Perception (VLM) → Evidence → Rule Engine → Verdict
```

| Layer | Responsibility | Technology |
|---|---|---|
| **Perception** | Extract visual facts from images | Gemini 1.5 Pro (structured JSON output) |
| **Evidence** | Structured confidence-scored observations | Pydantic models |
| **Rule Engine** | Deterministic pass/fail evaluation | Python + YAML rules |
| **Verdict** | `PASS` / `FAIL` / `UNCERTAIN` | Never touches a model |
| **Override** | Human correction with mandatory audit note | Supabase + RBAC |

> **Key guarantee:** No prompt manipulation, no model hallucination, no jailbreak can ever directly produce a `PASS` verdict. Rules are the sole authority.

---

## 🏛️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  Next.js 14 App  │  VS Code Extension  │  REST Clients  │
└───────────────┬──────────────────┬────────────────┬──────┘
                │ HTTP             │ HTTP           │ HTTP
                ▼                  ▼                ▼
┌──────────────────────────────────────────────────────────┐
│              FastAPI API Layer (Python 3.11+)            │
│  POST /v1/reviews      GET /v1/reviews/{id}              │
│  POST overrides        GET /v1/audit-log                 │
│  GET  /v1/rules        GET /v1/system/status             │
└────────────────────────┬─────────────────────────────────┘
                         │
         ┌───────────────┼──────────────────┐
         ▼               ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌───────────────────┐
│ VLM Engine  │  │ Rule Engine  │  │  Image Pipeline   │
│ Gemini 1.5  │  │ Python YAML  │  │ OpenCV + pyzbar   │
│ Structured  │  │ PASS/FAIL/   │  │ Sharpness/Barcode │
│ JSON output │  │ UNCERTAIN    │  │ Decode            │
└─────────────┘  └──────────────┘  └───────────────────┘
                         │
         ┌───────────────┼──────────────────┐
         ▼               ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌───────────────────┐
│   Celery    │  │  Redis 7     │  │   Supabase        │
│   Workers   │  │  (Broker)    │  │   Auth + DB       │
│   (Async Q) │  │              │  │   + Storage       │
└─────────────┘  └──────────────┘  └───────────────────┘
```

---

## 📁 Directory Structure

```
AI-Powered-Prep-Manager/
│
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # 1,055-line API server (all endpoints)
│   ├── vlm_engine.py           # Gemini 1.5 Pro structured image analysis
│   ├── auth.py                 # JWT validation, role-based access
│   ├── supabase_client.py      # Supabase connection factory
│   └── requirements.txt        # Python dependencies
│
├── rule_engine/                # Deterministic compliance evaluator
│   ├── evaluator.py            # Core PASS/FAIL/UNCERTAIN logic
│   ├── image_pipeline.py       # OpenCV image preprocessing
│   ├── barcodes.py             # pyzbar + zxing-cpp barcode decoder
│   ├── jobs.py                 # RQ job helpers
│   └── worker.py               # Celery worker definition
│
├── rules/v1/                   # YAML rule sets (one per category)
│   ├── electronics_small.yaml  # 10 checks for small electronics
│   ├── apparel.yaml            # Apparel-specific rules
│   ├── liquids_consumables.yaml# Liquid / consumable rules
│   └── fragile_glass.yaml      # Fragile/glass packaging rules
│
├── frontend/                   # Next.js 14 + TypeScript + Tailwind
│   ├── app/
│   │   ├── page.tsx            # Main application shell (6 tabs)
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Global styles
│   │   ├── login/              # Auth login page
│   │   └── api/                # Next.js API routes (proxy to backend)
│   ├── components/
│   │   ├── ReviewStation.tsx        # 10-scenario compliance review UI
│   │   ├── OpenCVPipelineLab.tsx    # Image preprocessing visualization
│   │   ├── BarcodeCoverageEngine.tsx # Barcode IoU + collision engine
│   │   ├── VlmContextWorkbench.tsx  # VLM prompt engineering workbench
│   │   ├── CeleryQueueMonitor.tsx   # Real-time task queue dashboard
│   │   ├── AuditTrailView.tsx       # Audit log + override history
│   │   ├── HumanOverrideModal.tsx   # Override submission modal
│   │   └── Header.tsx               # Navigation header
│   ├── lib/
│   │   ├── rules/ruleEngine.ts      # Client-side rule evaluator (TypeScript)
│   │   ├── cv/imagePreprocessing.ts # OpenCV preprocessing params
│   │   ├── scenarios/testScenarios.ts # 10 PRD test scenarios
│   │   └── supabase/               # Supabase SSR client
│   └── types/api.ts                # Shared TypeScript API types
│
├── supabase/migrations/        # SQL schema migrations
│   └── 001_initial_schema.sql  # Multi-tenant schema + RLS policies
│
├── completion_service/         # Local AI code completion server
│   └── server.py               # FastAPI server for VS Code extension
│
├── editor-extension/           # VS Code extension
│   └── src/                    # TypeScript extension source
│
├── tests/                      # pytest test suite
├── dataset/                    # Sample images and test data
├── .github/                    # CI/CD workflows
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Full stack orchestration
├── railway.toml                # Railway deployment config
├── render.yaml                 # Render deployment config
├── pyproject.toml              # Python project config + optional deps
└── dev.ps1                     # PowerShell dev startup script
```

---

## 🔍 Components Deep Dive

### 1. Backend (FastAPI) — `backend/main.py` (1,055 lines)

The API server is the central orchestrator. Key endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/reviews` | Submit images for compliance review |
| `GET`  | `/v1/reviews` | List all reviews (paginated) |
| `GET`  | `/v1/reviews/{id}` | Get a specific review with all checks |
| `POST` | `/v1/reviews/{id}/overrides` | Submit a human override (reviewer role required) |
| `GET`  | `/v1/rules` | List all active rule sets |
| `GET`  | `/v1/rules/{category}` | Get rule set for a specific category |
| `GET`  | `/v1/audit-log` | Paginated, filterable audit trail |
| `GET`  | `/v1/system/status` | Health check (Redis, Gemini key, workers) |
| `POST` | `/v1/completions` | Code completion for VS Code extension |

**Key design decisions:**
- **Lifespan management:** Rule sets are loaded into memory at startup via `@asynccontextmanager` — no cold-path YAML parsing on requests.
- **Evidence pipeline:** `generate_perception_evidence()` calls the VLM engine for production; in dev, mock presets can be injected via `ALLOW_DEV_PRESETS=true`.
- **Seeded audit data:** On startup, 5 representative review scenarios are seeded into the in-memory database.
- **Pydantic v2 models:** All request/response schemas are fully typed — `PrepReviewRequest`, `PrepReviewResponse`, `CheckResult`, `OverrideRequest`, `AuditLogEntry`.

### 2. VLM Engine (Gemini 1.5 Pro) — `backend/vlm_engine.py`

```python
def analyze_prep_image(image_bytes: bytes, category: str) -> ComplianceEvidence:
```

- Sends raw image bytes + category context to **Gemini 1.5 Pro**
- Uses `response_schema=ComplianceEvidence` — forces Gemini to return **structured JSON validated by Pydantic**
- `temperature=0.1` — near-deterministic extraction
- Returns: bounding boxes, surface classification, OCR text, confidence scores

```python
class ComplianceEvidence(BaseModel):
    polybag_bbox: Optional[BoundingBox]          # [ymin, xmin, ymax, xmax] 0-1000
    fnsku_bbox: Optional[BoundingBox]            # FNSKU label location
    surface_classification: Literal['flat', 'seam', 'curved_edge', 'opening']
    warning_text_ocr: str                        # Extracted suffocation warning
    warning_text_confidence: float               # 0.0 - 1.0
    original_barcode_visible: bool               # True = compliance violation
```

**Critical:** The VLM output is *evidence only*. It never returns `PASS` or `FAIL`.

### 3. Rule Engine (Python) — `rule_engine/evaluator.py`

Pure Python, zero AI dependencies:

```python
def evaluate_check(rule, evidence_by_key, version) -> CheckResult:
    # 1. Not visually_verifiable → UNCERTAIN
    # 2. Evidence missing → UNCERTAIN
    # 3. confidence < min_confidence → UNCERTAIN
    # 4. value in fail_values → FAIL
    # 5. value in pass_values → PASS
    # 6. Otherwise → UNCERTAIN
```

**Verdict aggregation:** Any `FAIL` → `FAIL`. Any `UNCERTAIN` (no FAIL) → `UNCERTAIN`. All `PASS` → `PASS`.

### 4. Image Pipeline (OpenCV) — `rule_engine/image_pipeline.py`

Pre-processes inbound images before barcode/OCR analysis:
- **Blur detection:** Laplacian variance — below threshold → flag as `UNCERTAIN`
- **Exposure analysis:** Histogram-based over/underexposure detection
- **Preprocessing variants:** Grayscale, CLAHE, adaptive binarization, Canny edges

### 5. Barcode Engine (pyzbar / zxing-cpp) — `rule_engine/barcodes.py`

Dual-library barcode decoder with IoU collision detection:
- Supports: QR Code, Code 128, EAN-13, UPC-A, Data Matrix, PDF417
- **IoU (Intersection over Union):** Detects FNSKU label overlapping manufacturer barcode
- **Collision risk scoring:** Quantifies how much original barcode is occluded
- A failed decode ≠ barcode absent — always returns confidence-scored evidence

### 6. Task Queue (Celery + Redis)

- **Broker:** Redis 7 (`prep_review.default` + `prep_review.priority` queues)
- **Workers:** Celery processes `enqueue_prep_review(review_id)` tasks asynchronously
- **State machine:** `PENDING → STARTED → SUCCESS / FAILURE / RETRY`
- **RQ alternative:** `rule_engine/jobs.py` provides a dependency-free alternative

### 7. Frontend (Next.js 14) — 6-Tab Application

| Tab | Component | Description |
|-----|-----------|-------------|
| 1 | `ReviewStation.tsx` | 10-scenario compliance review with visual canvas |
| 2 | `OpenCVPipelineLab.tsx` | Interactive image preprocessing visualization |
| 3 | `BarcodeCoverageEngine.tsx` | IoU overlap calculator + 1D waveform |
| 4 | `VlmContextWorkbench.tsx` | Gemini prompt engineering interface |
| 5 | `CeleryQueueMonitor.tsx` | Real-time task queue dashboard |
| 6 | `AuditTrailView.tsx` | Filterable audit log + override history |

### 8. Supabase — Multi-tenant Database + Auth + Storage

```sql
-- Core tables
organizations          -- Multi-tenant root
organization_members   -- User ↔ org with role (operator/reviewer/manager)
rule_sets              -- Versioned YAML rule definitions
prep_reviews           -- Immutable review outputs
prep_review_images     -- Storage object paths (bytes NOT in Postgres)
evidence_items         -- Per-check evidence blobs
human_overrides        -- Auditable corrections
audit_log              -- Append-only event log
```

**Auth flows:** Email/password, magic link (passwordless), enterprise OIDC (SSO).

### 9. VS Code Extension — `editor-extension/`

- Inline AI completions for Python and TypeScript warehouse prep code
- Debounced requests, stale request cancellation
- Configurable via `prepManager.completionEndpoint`
- Press `F5` in VS Code to launch Extension Development Host

### 10. Completion Service — `completion_service/server.py`

```
POST /v1/completions
Body:    { document, language, position, prefix, suffix, trigger }
Returns: { items: [{ insertText, rangeStart, rangeEnd }] }
```

Lightweight local FastAPI server — runs without cloud API keys. Powers the VS Code extension.

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Core backend language |
| FastAPI | 0.104+ | Async REST API framework |
| Pydantic v2 | 2.5+ | Data validation + API schemas |
| PyYAML | 6.0+ | YAML rule set parsing |
| google-genai | 2.0+ | Gemini 1.5 Pro SDK |
| OpenCV | 4.8+ | Image preprocessing (headless) |
| pyzbar | latest | 1D/2D barcode decoding |
| zxing-cpp | latest | Multi-format barcode decoding |
| Celery | latest | Distributed task queue |
| Redis | 7 | Message broker + result backend |
| RQ | latest | Lightweight Redis queue alternative |
| Supabase | 2.0+ | Auth + database client |
| httpx | 0.26+ | Async HTTP client |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.1 | React framework (App Router) |
| React | 18.2 | UI library |
| TypeScript | 5.3 | Type-safe JavaScript |
| Tailwind CSS | 3.4 | Utility-first CSS framework |
| @google/genai | 2.24+ | Gemini client-side SDK |
| @supabase/supabase-js | 2.117+ | Supabase JS client |
| lucide-react | 0.300+ | Icon library |
| motion | 13+ | Animation library |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker + Compose | Containerization + local orchestration |
| Supabase | PostgreSQL + Auth + Storage |
| Redis 7-alpine | Queue broker |
| Railway | Cloud deployment (backend) |
| Render | Cloud deployment (alternative) |
| GitHub Actions | CI/CD pipeline |

---

## 📋 Rule System

Rules are defined in versioned YAML files under `rules/v1/`:

```yaml
rule_set_id: prep-electronics-v1
version: "2026.09.1"
category: electronics_small
checks:
  - check_id: polybag_presence
    name: Polybag presence
    description: Unit must be enclosed in a protective transparent polybag
    visually_verifiable: true        # false → always UNCERTAIN
    evidence_key: polybag_presence   # key in evidence dict from VLM
    pass_values: [present]           # any of these → PASS
    fail_values: [missing]           # any of these → FAIL
    min_confidence: 0.80            # below this → UNCERTAIN
```

### Product Categories & Rule Sets

| Category | File | Key Checks |
|----------|------|-----------|
| `electronics_small` | `electronics_small.yaml` | Polybag, FNSKU seam, barcode mask, warning, expiry, handling marks, bag thickness (10 checks) |
| `apparel` | `apparel.yaml` | Category-specific apparel checks |
| `liquids_consumables` | `liquids_consumables.yaml` | Includes expiry date checks |
| `fragile_glass` | `fragile_glass.yaml` | Cushioning + fragile iconography |

---

## 🎭 10 Compliance Scenarios

| # | Scenario | Verdict |
|---|----------|---------|
| 1 | Fully compliant sealed polybag, covered barcode, clear warning | ✅ `PASS` |
| 2 | Missing suffocation warning on 12-inch bag opening | ❌ `FAIL` |
| 3 | Polybag open / unsealed | ❌ `FAIL` |
| 4 | Manufacturer UPC barcode exposed (not covered by FNSKU) | ❌ `FAIL` |
| 5 | FNSKU placed across polybag heat-seal seam | ❌ `FAIL` |
| 6 | Original barcode scannable through FNSKU label | ❌ `FAIL` |
| 7 | Expiry date covered/obscured | ❌ `FAIL` |
| 8 | Suffocation warning present but illegible | ❌ `FAIL` |
| 9 | Multiple evidence keys at borderline confidence (~0.50) | ⚠️ `UNCERTAIN` |
| 10 | Severe motion blur on inbound image | ⚠️ `UNCERTAIN` |

---

## 🔌 API Reference

### Submit a Review

```http
POST /v1/reviews
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "category": "electronics_small",
  "images": [{ "id": "img-001", "url": "https://...", "angle": "front" }],
  "work_order_ref": "WO-2026-001234"
}
```

**Response:**
```json
{
  "review_id": "rev-uuid",
  "rule_set_version": "2026.09.1",
  "overall_status": "FAIL",
  "checks": [
    {
      "check_id": "polybag_presence",
      "verdict": "PASS",
      "reason": "Observed compliant 'present'",
      "evidence": { "value": "present", "confidence": 0.95 }
    }
  ],
  "metrics": { "total_checks": 10, "passed": 8, "failed": 1, "uncertain": 1 }
}
```

### Submit a Human Override

```http
POST /v1/reviews/{review_id}/overrides
Authorization: Bearer <reviewer_jwt>

{
  "check_id": "fnsku_surface",
  "corrected_verdict": "PASS",
  "note": "Supervisor verified scanner reads through seam cleanly.",
  "reviewer_name": "Quality Lead Marcus T."
}
```

---

## 🔐 Authentication & Security

- **Auth provider:** Supabase Auth (JWT-based)
- **Token flow:** Client → Supabase login → JWT → `Authorization: Bearer` to API
- **Role enforcement:** `require_role("reviewer")` guards override endpoints
- **Database boundary:** RLS policies are the final security layer
- **Image bytes:** Never stored in PostgreSQL — only Storage object paths in DB
- **Service-role keys:** Backend-only, never shipped to browser or extension

---

## 🚀 Running Locally

### Backend

```powershell
python -m venv .venv && .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cp .env.example .env   # Edit: SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY, REDIS_URL
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend && npm install
# Edit .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, PYTHON_API_URL
npm run dev   # → http://localhost:3000
```

### Celery Worker

```powershell
celery -A backend.worker worker --loglevel=info -Q prep_review.default,prep_review.priority
```

### Apply Supabase migration

```bash
supabase db push
```

---

## 🐳 Docker Deployment

```powershell
docker-compose up --build
# backend → http://localhost:8000
# frontend → http://localhost:3000
# redis → localhost:6379
```

---

## ☁️ Cloud Deployment

- **Railway:** `railway.toml` pre-configured — run `railway up`
- **Render:** `render.yaml` pre-configured — connect GitHub repo for auto-deploy

---

## 🧪 Testing

```powershell
python -m pytest          # All tests
python -m pytest -v       # Verbose
```

Covers: rule engine (all 10 scenarios), barcode decoder, image pipeline, API endpoints, override workflow.

---

## 📄 Documents

- **PRD** — Product Requirements Document (10 scenarios, user stories, acceptance criteria)
- **TRD** — Technical Requirements Document (system design, data contracts, rule schema)
- **Roadmap** — Feature roadmap and milestones
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Runtime boundaries and auth flow
- **[PROJECT_STATUS_REVIEW.md](PROJECT_STATUS_REVIEW.md)** — Detailed implementation status
- **[TEST_REPORT.md](TEST_REPORT.md)** — Scenario test results

---

## 👤 Author

**Fasihuddin** — [@fasih777](https://github.com/fasih777)
