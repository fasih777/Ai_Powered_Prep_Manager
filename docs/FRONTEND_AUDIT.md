# Phase F0: Frontend Audit Report

**Date:** 2026-10-31  
**Auditor:** Senior Frontend Engineer & Design-System Lead  
**Scope:** `frontend/` directory, build system, dependencies, data contracts, and alignment with `FRONTEND_BLUEPRINT.md`.  
**Rules & Constraints:** No changes made to source files in `frontend/`.

---

## 1. Executive Summary

This audit establishes the baseline facts of `frontend/` before executing Phase F1. The existing frontend is a flat, prototype-style single-page shell (`app/page.tsx`) with 6 tabs mixing operator workflow with developer lab experiments.

Key findings:
1. **Rule Engine & Invariants Violation (I1, I2, I3):** `frontend/lib/rules/ruleEngine.ts` contains a complete client-side rule evaluation engine (`evaluatePrepReview`) that calculates verdicts and overall status in the browser. It is directly executed in `app/page.tsx` on initial load and scenario selection, and used as a fallback on API errors.
2. **Missing BFF Proxy Endpoints:** Blueprint §6.2 assumed Next.js route handlers proxy all FastAPI endpoints. In reality, **only one** BFF route exists (`app/api/v1/prep-review/evaluate-sync/route.ts`). All other endpoints are either called directly from the client via axios (`lib/api.ts`) or do not exist in the BFF.
3. **Roles Inconsistency:** Blueprint §6.1 assumes roles are strictly `operator | reviewer | manager`. However, the Supabase schema (`member_role` enum) and backend auth (`backend/auth.py`) also define and use `'admin'`.
4. **Code Quality & File Sizes:** 8 files currently exceed the 300-line limit (Blueprint §0.8).
5. **Design System & Tokens:** Current styles use generic shadcn HSL variables and default Tailwind palettes; the "Inspection Bench" token system (§3.2) is not yet implemented.

---

## 2. File Inventory & Line Count Audit

All files within `frontend/` (excluding `node_modules` and `.next`):

| File Path | Lines | Size (Bytes) | Over 300 Lines? | Primary Purpose / Notes |
|---|---|---|---|---|
| `app/globals.css` | 60 | 1,560 | No | Generic shadcn HSL tokens; lacks §3.2 tokens |
| `app/layout.tsx` | 23 | 489 | No | Root layout with Inter font |
| `app/page.tsx` | 395 | 15,230 | **YES (395)** | 6-tab shell; evaluates client rule engine |
| `app/api/v1/prep-review/evaluate-sync/route.ts` | 26 | 819 | No | The only existing BFF proxy route |
| `app/login/actions.ts` | 23 | 566 | No | Server action for Supabase password sign-in |
| `app/login/page.tsx` | 43 | 1,826 | No | Login form (email/password); lacks magic link & SSO UI |
| `components/AuditTrailView.tsx` | 278 | 14,310 | No | Standalone audit trail tab; imports `PrepReviewOutput` |
| `components/BarcodeCoverageEngine.tsx` | 385 | 19,988 | **YES (385)** | Lab IoU calculator; imports `testScenarios` |
| `components/CeleryQueueMonitor.tsx` | 355 | 16,738 | **YES (355)** | Lab queue monitor |
| `components/Header.tsx` | 169 | 6,847 | No | Global header with 6 tabs; contains gradients |
| `components/HumanOverrideModal.tsx` | 167 | 6,239 | No | Override modal; allows manual reviewer ID editing |
| `components/OpenCVPipelineLab.tsx` | 421 | 18,632 | **YES (421)** | Lab OpenCV canvas; imports `testScenarios` |
| `components/ReviewStation.tsx` | 473 | 23,028 | **YES (473)** | Scenario reviewer & canvas; imports `ruleEngine` |
| `components/VlmContextWorkbench.tsx` | 334 | 15,010 | **YES (334)** | Lab VLM prompt sandbox; references `gemini-3.8-flash` |
| `docs/prepRequirementsDocs.ts` | 135 | 8,785 | No | Hardcoded regulatory text reference |
| `lib/api.ts` | 103 | 3,132 | No | Direct client Axios client to `http://localhost:8000` |
| `lib/supabase.ts` | 7 | 298 | No | Browser client using `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `lib/utils.ts` | 5 | 169 | No | `clsx` + `tailwind-merge` helper |
| `lib/barcode/barcodeEngine.ts` | 106 | 4,328 | No | Client barcode occlusion math |
| `lib/cv/imagePreprocessing.ts` | 376 | 11,916 | **YES (376)** | Client canvas OpenCV simulation & blur detection |
| `lib/queue/celeryQueueEngine.ts` | 318 | 9,741 | **YES (318)** | Simulated queue state generator |
| `lib/rules/ruleEngine.ts` | 47 | 8,189 | No | Client rule evaluation engine (`evaluatePrepReview`) |
| `lib/scenarios/testScenarios.ts` | 48 | 4,748 | No | 10 preset scenario fixtures |
| `lib/supabase/server.ts` | 28 | 747 | No | SSR Supabase client (`@supabase/ssr`) |
| `lib/vlm/promptTemplates.ts` | 92 | 3,767 | No | VLM prompt template generators |
| `types/api.ts` | 97 | 2,036 | No | Legacy frontend TypeScript API definitions |
| `middleware.ts` | 56 | 1,530 | No | SSR middleware; only protects `/dashboard` |
| `next.config.js` | 46 | 1,364 | No | Config with image domains and remote patterns |
| `package.json` | 36 | 835 | No | Frontend dependencies & scripts |
| `tailwind.config.ts` | 43 | 1,159 | No | Generic Tailwind configuration |
| `tsconfig.json` | 27 | 598 | No | TypeScript compiler options |
| `.env.local` | 4 | 190 | No | Local environment variables |

---

## 3. Dependency Versions & Audit

From `package.json`:
- `next`: `14.1.0` (App Router)
- `react`: `^18.2.0`
- `react-dom`: `^18.2.0`
- `typescript`: `^5.3.0`
- `tailwindcss`: `^3.4.0`
- `@supabase/ssr`: `^0.12.7`
- `@supabase/supabase-js`: `^2.117.2`
- `lucide-react`: `^0.300.0`
- `motion`: `^13.4.4`
- `axios`: `^1.6.0`
- `clsx`: `^2.1.0`
- `tailwind-merge`: `^2.2.0`
- `@google/genai`: `^2.24.0`

### Packages to Add in Future Phases (as permitted by Blueprint §13):
- **Phase F1:** `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-popover`, `class-variance-authority`, `sonner`
- **Phase F2:** `@tanstack/react-query`, `zod`
- **Phase F4/F6/F7:** `react-zoom-pan-pinch`, `recharts`, `date-fns`
- **Dev/Test:** `vitest`, `@testing-library/react`, `@testing-library/user-event`, `msw`, `@playwright/test`, `@axe-core/playwright`, `eslint-plugin-jsx-a11y`

---

## 4. Environment Variables Audit

| Variable Name | Location | Present? | Matches Blueprint §11? | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Yes | Yes | `https://bzkaapukdxfsgszsfszk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Yes | Yes | Set in `.env.local` and used in `middleware.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.example` / `lib/supabase.ts` | Partial | Discrepancy | Used in `lib/supabase.ts`; need consistency with `PUBLISHABLE_KEY` |
| `PYTHON_API_URL` | `.env.local` | Yes | Yes | `http://localhost:8000` (server only) |
| `NEXT_PUBLIC_API_URL` | `.env.example` / `lib/api.ts` | Present | Discrepancy | Bypasses BFF proxy; should be removed in F2 |
| `NEXT_PUBLIC_APP_ENV` | Blueprint §11 | **NO** | Missing | Must be added (`local`, `staging`, `production`) |
| `NEXT_PUBLIC_ENABLE_LAB` | Blueprint §11 | **NO** | Missing | Must be added (`true` in local/staging, `false` in prod) |

---

## 5. Verification of Assumptions (§1.4 and §16)

| Assumption Statement | Verified Status | Evidence & Reality | Proposed Remediation in Implementation |
|---|---|---|---|
| **1. Roles are exactly `operator`, `reviewer`, `manager`** | **CORRECTED** | `supabase/migrations/001_initial_schema.sql` (line 9) defines enum `public.member_role` as `('operator', 'reviewer', 'manager', 'admin')`. `backend/auth.py` also supports `admin`. | In `types/api.ts`, role union should include `'admin'` or treat `admin` as having full `manager` privileges in role guards (`RoleGate`). |
| **2. BBox format matches §6.1** | **CONFIRMED (Backend) / CORRECTED (Lab Engine)** | Backend `vlm_engine.py` and `types/api.ts` use normalized `[ymin, xmin, ymax, xmax]` (integers 0..1000). However, legacy `lib/rules/ruleEngine.ts` uses `{ymin, xmin, ymax, xmax}` object. | In F1/F2 adapter layer, normalize all bounding boxes strictly to `[number, number, number, number]` per §6.1. |
| **3. Categories are the four listed** | **CONFIRMED** | `rules/v1/` contains exactly `electronics_small.yaml`, `apparel.yaml`, `liquids_consumables.yaml`, `fragile_glass.yaml`. | Maintain strict typing in `types/api.ts` for these four categories. |
| **4. BFF proxy exists for every endpoint in §6.2** | **CORRECTED** | Only `app/api/v1/prep-review/evaluate-sync/route.ts` exists. The remaining 7 endpoints are called directly via client axios or not implemented in BFF. | Build complete Next.js BFF proxy routes in Phase F2 attaching Supabase session JWT. |
| **5. No production code imports `ruleEngine.ts` today** | **CORRECTED / REFUTED** | `app/page.tsx` imports and executes `evaluatePrepReview` on every scenario switch. `ReviewStation.tsx`, `AuditTrailView.tsx`, and `HumanOverrideModal.tsx` also import types. | In Phase F1, move `ruleEngine.ts` to `lib/lab/rules/` and isolate legacy components under `/lab`. Enforce ESLint `no-restricted-imports` on production routes (I2). |

---

## 6. Verification of Inferred Claims in Blueprint §1

| Claim / Problem | Status | Evidence |
|---|---|---|
| **P1. Six flat tabs in one page mix workflows** | **CONFIRMED** | `app/page.tsx` renders tabs for `review`, `opencv`, `barcode`, `vlm`, `celery`, `audit` simultaneously in a single client layout. |
| **P2. No URL per review** | **CONFIRMED** | Only `/` and `/login` exist. There are no routes for `/review/[id]`, `/reviews`, `/queue`, etc. |
| **P3. Second rule engine lives in browser** | **CONFIRMED** | `lib/rules/ruleEngine.ts` contains 47 lines of hardcoded rule evaluation logic (`evaluatePrepReview`) computing checks and overall status. |
| **P4. Demo and preset data look like real results** | **CONFIRMED** | `testScenarios.ts` has 10 preloaded scenarios evaluated client-side with no warning banner. |
| **P5. No real capture and upload flow** | **CONFIRMED** | `ReviewStation.tsx` only offers clicking scenario presets or uploading a single image as base64. |
| **P6. No async job UX** | **CONFIRMED** | `CeleryQueueMonitor.tsx` simulates task states, but review submission has no real polling/job state screen. |
| **P7. Audit and override detached from review** | **CONFIRMED** | Audit is an isolated tab; override is a detached modal overriding whole status rather than individual checks. |
| **P8. No manager view of quality trends** | **CONFIRMED** | No analytics, metrics, or insights view exists in the current application. |
| **P9. Copy and model naming drift** | **CONFIRMED** | `VlmContextWorkbench.tsx` hardcodes `'gemini-3.8-flash'`, whereas `backend/vlm_engine.py` runs `'gemini-1.5-pro'`. |
| **P10. No evident design system** | **CONFIRMED** | Styles use raw Tailwind colors, gradients, and shadcn defaults instead of the Inspection Bench design system. |

---

## 7. Data Fetching & API Shapes Actually Used

Currently:
1. `lib/api.ts` uses `axios` targeting `http://localhost:8000` with endpoints:
   - `POST /v1/prep-review`
   - `POST /v1/prep-review/upload`
   - `POST /v1/prep-review/{reviewId}/override`
   - `GET /v1/categories`
   - `GET /v1/rule-sets/{category}`
   - `GET /v1/scenarios`
   - `GET /v1/prep-reviews`
   - `GET /v1/audit-logs`
   - `GET /health`
2. `app/api/v1/prep-review/evaluate-sync/route.ts` proxies POST requests to `${PYTHON_API_URL}/v1/prep-review/evaluate-sync`.
3. `app/page.tsx` calls `fetch('/api/v1/system/status')` (which actually 404s in Next.js because no route handler exists for it) and falls back to optimistic defaults.

---

## 8. Build & Lint Execution Results

### `npm install`
- **Command:** `npm install`
- **Result:** Success (code 0)
- **Summary:** Audited 451 packages in 1m. Found 21 vulnerabilities (mostly in legacy transitive dev tools).

### `npm run build`
- **Command:** `npm run build`
- **Result:** Success (code 0)
- **Output:**
  - Route `/`: 30.3 kB (First Load JS: 114 kB)
  - Route `/_not-found`: 882 B (First Load JS: 85 kB)
  - Route `/api/v1/prep-review/evaluate-sync`: 0 B
  - Route `/login`: 137 B (First Load JS: 84.3 kB)
  - Middleware: 239 kB
- **Warnings:** 4 React Hook `useEffect` dependency warnings in `app/page.tsx`, `components/CeleryQueueMonitor.tsx`, and `components/OpenCVPipelineLab.tsx`.

### `npm run lint`
- **Command:** `npm run lint`
- **Result:** Success (code 0) with the same 4 `react-hooks/exhaustive-deps` warnings.

---

## 9. Discrepancies Between Reality and Blueprint & Handling Strategy

| Reality | Blueprint Expectation | Handling Proposal for Upcoming Phases |
|---|---|---|
| **Role `admin` exists in DB & backend** | Only `operator`, `reviewer`, `manager` defined in §6.1 | Add `'admin'` to `Role` type in `types/api.ts` and map `admin` to full manager access in route guards and navigation. |
| **BFF proxy routes missing** | Blueprint §6.2 assumes existing BFF routes forward requests | In Phase F2, construct the Next.js route handlers under `app/api/*` that attach the Supabase access token and forward to FastAPI. |
| **Backend endpoint naming differences** | Blueprint §6.2 has `/v1/reviews`, `/v1/audit-log`, `/v1/rules`; backend has `/v1/prep-reviews`, `/v1/audit-logs`, `/v1/rule-sets` | In Phase F2 `lib/api/endpoints.ts`, define canonical constants and build adapter aliases so the frontend handles both transparently without breaking backend. |
| **8 files exceed 300 lines** | Blueprint §0.8: No file over 300 lines | These files will be relocated to `/lab` in F1 and refactored/split in subsequent phases (e.g., F1, F4, F9). |
| **Client rule engine in `app/page.tsx`** | Blueprint I2: `lib/rules/ruleEngine.ts` must never be in production routes | In Phase F1, move `app/page.tsx` legacy tabs to `/lab/scenarios`, configure ESLint `no-restricted-imports`, and establish the `(app)` route structure. |

---

## 10. Conclusion

Phase F0 Audit is complete. Every assumption in Blueprint §1.4 and §16 has been verified and cataloged. No source files were modified during this phase. The project is ready for Phase F1 (Foundation).
