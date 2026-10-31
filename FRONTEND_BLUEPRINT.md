# Frontend Blueprint: AI-Powered Prep Manager

Version 1.0 · Companion to PRD v1.0, TRD v1.0, Roadmap v1.0 and PROJECT_STATUS_REVIEW (2026-09-26) · Repo: github.com/fasih777/Ai_Powered_Prep_Manager, folder frontend/

## 0. How an AI model must use this document

This file is the single source of truth for rebuilding the frontend. Treat it as a specification, not as inspiration.

1. Read the whole document before writing code. Refer to sections by number (for example "§2 I1", "§8 S3").
2. MUST and MUST NOT are hard rules. SHOULD is a strong default. MAY is optional.
3. Precedence when instructions conflict: §2 Invariants, then this document, then existing code, then your own preferences.
4. Work one phase at a time (§13). Do not start phase N+1 until the acceptance checklist of phase N passes.
5. Never invent backend endpoints, response fields, rule IDs or compliance logic. If the backend does not provide something this document needs, build against the adapter layer (§6.4), leave a `// TODO(contract): <what is missing>` comment, and list it in your phase report. §16 lists every known gap.
6. Before changing any existing file, read it. The existing frontend was not visible when this blueprint was written (see §1.4), so Phase F0 starts with an audit.
7. At the end of every phase, report: files created or changed, how to run and verify, acceptance checklist with pass/fail per line, and open TODO(contract) items.
8. Prefer small, typed, reusable components. No file over 300 lines. No `any`. No inline hex colors; use tokens (§3).

## 1. Context snapshot

### 1.1 What the product is

An AI-assisted packaging compliance reviewer for FBA/3PL prep stations. An operator photographs a prepared unit; the backend extracts visual evidence with a VLM (Gemini); a deterministic Python rule engine, driven by versioned YAML rules, returns a verdict per check (PASS, FAIL, UNCERTAIN) and an overall PREP STATUS. Humans can override with an audit note. Everything is auditable.

Core promise the UI must protect: AI supplies evidence, rules produce verdicts, humans can correct them, and nothing is hidden. A false PASS is the worst outcome (PRD §9), so the interface is conservative by design.

### 1.2 Users

| Role | Source | Main job | Device |
| --- | --- | --- | --- |
| operator | `organization_members.role` | Photograph a unit, get a verdict in seconds, fix and retake | Phone or tablet at the prep bench, bright light, often gloves |
| reviewer | same | Work the FAIL and UNCERTAIN list, inspect evidence, override with a note | Desktop |
| manager | same | Watch quality trends, audit trail, rule sets, system health | Desktop |

### 1.3 Stack that is already in place (from README)

Next.js 14.1 App Router, React 18.2, TypeScript 5.3, Tailwind 3.4, lucide-react, motion 13, Supabase SSR auth (`middleware.ts`, server client, login actions), Next.js API routes under `app/api/` that proxy to FastAPI. Backend: FastAPI + Pydantic v2, endpoints in §6.2. Categories: `electronics_small`, `apparel`, `liquids_consumables`, `fragile_glass`. Async jobs run on Celery + Redis with states PENDING, STARTED, SUCCESS, FAILURE, RETRY.

Current frontend inventory: `app/page.tsx` (shell with 6 tabs), `app/login/`, `components/ReviewStation.tsx`, `OpenCVPipelineLab.tsx`, `BarcodeCoverageEngine.tsx`, `VlmContextWorkbench.tsx`, `CeleryQueueMonitor.tsx`, `AuditTrailView.tsx`, `HumanOverrideModal.tsx`, `Header.tsx`, `lib/rules/ruleEngine.ts`, `lib/cv/imagePreprocessing.ts`, `lib/scenarios/testScenarios.ts`, `types/api.ts`.

### 1.4 Honest limits of this blueprint

I reviewed the PRD, TRD, Roadmap, README and PROJECT_STATUS_REVIEW. I did not read the frontend source files, ARCHITECTURE.md or TEST_REPORT.md. Where this document says "current frontend does X" it is inferred from those documents. Phase F0 verifies every such claim.

### 1.5 Diagnosis: why the current frontend feels wrong

| # | Problem | Evidence | Consequence |
| --- | --- | --- | --- |
| P1 | Six flat tabs in one page mix the operator workflow with developer lab tools (OpenCV lab, VLM workbench, Celery monitor) | README §7, `app/page.tsx` | Nobody's job is served well; the product looks like a demo |
| P2 | No URL per review | Tabs, no `/review/[id]` | Cannot deep-link, share, bookmark or audit one review |
| P3 | A second rule engine lives in the browser | `lib/rules/ruleEngine.ts`, status review P1 | Verdict drift; violates "rules are the sole authority" |
| P4 | Demo and preset data look like real results | `testScenarios.ts`, `ALLOW_DEV_PRESETS` | Risk of a false PASS being trusted |
| P5 | No real capture and upload flow | Status review FR1 | Operators cannot use it at the bench |
| P6 | No async job UX | Celery states exist, no matching screen | Waiting feels broken |
| P7 | Audit and override are detached from the review they belong to | Separate tab and modal | Reviewers lose context |
| P8 | No manager view of quality trends | PRD §3 and §10 metrics have no screen | Success metrics unobservable |
| P9 | Copy and model naming drift (frontend mentions a different Gemini model than the backend) | Status review | Erodes trust |
| P10 | No evident design system | Inferred | Inconsistent look, slow iteration |

## 2. Invariants (non-negotiable UI truthfulness rules)

These protect the product promise. Any violation is a bug, even if it looks nicer.

| ID | Rule |
| --- | --- |
| I1 | Verdicts come only from the API (`checks[].verdict`, `overall_status`). The UI MUST NOT compute, upgrade, downgrade, recolor or infer a verdict. It MAY count checks for display. If `overall_status` is missing, show "Unavailable", never a guess. |
| I2 | `lib/rules/ruleEngine.ts` MUST NOT be imported by any production route. It may live only under `/lab` (§8 S10). |
| I3 | Demo, preset and mock data MUST be visibly marked. If the API reports `evidence_source` other than `vlm` (or a preset flag), show a persistent `DemoBanner` and disable override and export. Production builds MUST NOT bundle MSW or scenario fixtures outside `/lab`. |
| I4 | The three verdicts are never distinguished by color alone: each has its own shape, glyph and word (§3.4). UNCERTAIN is never green and never styled as "almost pass". |
| I5 | Lists sort FAIL, then UNCERTAIN, then PASS. FAIL and UNCERTAIN checks are expanded by default and always show reason, rule ID and evidence without an extra click. |
| I6 | Overrides never replace the AI-path verdict visually. Always show both: "Rules: FAIL → Reviewer override: PASS, by name, time, note". Note is mandatory (minimum 10 characters). Reviewer identity comes from the session, never from an editable field. |
| I7 | Role-based hiding is a convenience. The backend is authoritative, so every mutation MUST handle 401 and 403 gracefully. |
| I8 | Only `NEXT_PUBLIC_*` publishable values reach the browser. Service-role keys never do. |
| I9 | Developer lab routes exist only when `NEXT_PUBLIC_ENABLE_LAB === 'true'` and the user is a manager; otherwise `notFound()`. They are absent from production navigation. |
| I10 | Every review screen shows `rule_set_version` and each check's `rule_id` when provided. |
| I11 | Non-verifiable checks (`visually_verifiable: false`) display as "Not verifiable from image", a distinct UNCERTAIN subtype, never as low confidence and never as PASS. |
| I12 | No optimistic updates for anything that changes a verdict or audit record. Wait for the server. |
| I13 | OCR text, VLM strings and notes are untrusted. Render as plain text only; never `dangerouslySetInnerHTML`. |
| I14 | The browser never decides that a photo is "good enough". Client-side blur or size hints are advisory warnings only; the backend quality gate decides. |

## 3. Design system: "Inspection Bench"

### 3.1 Direction

The product is used under warehouse lighting, with gloves, on phones and tablets at the bench, and on desktops for review. The look is a clean QC bench: matte paper surfaces, label-stock white panels, ink-dark text, one confident blue, and a single memorable element, the Verdict Seal (§3.5). Light theme is default; dark theme is supported and is preferred by reviewers for long photo sessions. The evidence canvas (where photos are shown) is always dark neutral so photos read accurately in either theme.

The interface is calm and quiet so that verdicts are the loudest thing on screen. No gradients, no decorative illustrations, no glassmorphism, no emoji, no uniform card grid. Structure comes from borders and spacing; shadows appear only on floating layers.

### 3.2 Color tokens

Define as CSS variables in `app/globals.css`, map in `tailwind.config.ts` (`bg-bg`, `text-ink`, `border-line`, `bg-verdict-fail-bg`, and so on). Never use raw hex in components.

```css
:root {
  --bg: #F2F3F0; /* bench paper */
  --surface: #FFFFFF; /* label stock */
  --surface-sunken: #E9EBE6;
  --ink: #17212B;
  --ink-muted: #526070; /* 6.6:1 on surface */
  --line: #D5D9D2;
  --line-strong: #B5BCB3;
  --brand: #1B4DB8; /* label blue */
  --brand-hover: #153D93;
  --brand-soft: #E3EBFA;
  --on-brand: #FFFFFF;
  --focus: #1B4DB8;
  --pass-fg: #14673F; --pass-bg: #E2F3E9; --pass-line: #8CCBA6;
  --fail-fg: #B42318; --fail-bg: #FDE8E6; --fail-line: #F0A8A1;
  --unc-fg: #8A5A00; --unc-bg: #FFF1D1; --unc-line: #E9C46A;
  --canvas: #0B0F12; /* evidence canvas, same in both themes */
  --overlay-shadow: 0 8px 24px rgba(15,20,24,.16);
}

.dark {
  --bg: #0F1418; --surface: #161D23; --surface-sunken: #0B0F12;
  --ink: #E8ECEF; --ink-muted: #9AA7B3;
  --line: #26313A; --line-strong: #3A4955;
  --brand: #6F9BFF; --brand-hover: #8FB0FF; --brand-soft: #1A2740; --on-brand: #0B0F12;
  --focus: #8FB0FF;
  --pass-fg: #5FD39A; --pass-bg: #12291F; --pass-line: #1E6B49;
  --fail-fg: #FF8A7F; --fail-bg: #331715; --fail-line: #7A2C26;
  --unc-fg: #F2C14E; --unc-bg: #2E2410; --unc-line: #7A5C16;
  --overlay-shadow: 0 8px 24px rgba(0,0,0,.5);
}
```

Rules: body text uses `--ink` on `--bg` or `--surface`; secondary text uses `--ink-muted` and never below 14px. Verdict colors are used only for verdict UI (badges, seals, bbox outlines, row accents), never for decoration or generic buttons. Brand blue is for primary actions, links and focus. Theme is stored in a cookie (`theme=system|light|dark`) and applied server-side to avoid flash.

### 3.3 Typography

| Role | Font | Notes |
| --- | --- | --- |
| UI and body | Public Sans (400, 500, 600, 700) via `next/font/google`, variable `--font-sans` | Tabular numerals (`font-variant-numeric: tabular-nums`) on tables, counts, timings |
| Identifiers | JetBrains Mono (400, 500), variable `--font-mono` | Only for rule IDs, check IDs, review IDs, hashes, bbox coordinates, JSON. Not for generic labels |

Scale (size / line height): 12/16 caption, 13/18 small, 15/22 base, 17/26 large, 20/28 title-3, 26/32 title-2, 34/40 title-1. Weights: 400 body, 500 labels, 600 headings and buttons, 700 only for the verdict word. Sentence case everywhere. Paragraph measure at most 70 characters. Do not use ALL CAPS labels or tracked-out eyebrows; the only uppercase words in the product are the verdict tokens PASS, FAIL, UNCERTAIN and the field name FNSKU.

### 3.4 Verdict visual language (the system's core)

| Verdict | Shape container | Glyph | Word | Tokens | Meaning shown to users |
| --- | --- | --- | --- | --- | --- |
| PASS | circle | check | PASS | `--pass-*` | Rule satisfied with enough confidence |
| FAIL | octagon | cross | FAIL | `--fail-*` | Rule violated |
| UNCERTAIN | diamond | question mark | UNCERTAIN | `--unc-*` | Evidence insufficient or not verifiable. Needs a human |

Implement the three shapes as one SVG component `VerdictIcon` (custom paths; do not rely on stock lucide icons for the containers). A verdict is always rendered as icon plus word. Icon-only is allowed only with an accessible name and a tooltip, and only in dense table cells.

### 3.5 Signature element: Verdict Seal

A label-shaped panel, 64px tall on desktop, 56px on mobile: left edge has a small notch (like perforated label stock), verdict icon at 32px, verdict word at 24px weight 700, and below the word a 13px sentence-case caption ("Prep status"). Background `--*-bg`, 1.5px border `--*-line`, text `--*-fg`. It appears in exactly two places: the top of Review detail (§8 S3) and the capture result handoff. On first render of a completed review it "stamps" once: scale 1.06 to 1.00 and opacity 0.0 to 1.0 over 180ms ease-out using `motion`. This is the only non-user-triggered animation in the product. Under `prefers-reduced-motion` it renders statically.

### 3.6 Spacing, shape, elevation, motion

| Aspect | Spec |
| --- | --- |
| Spacing | 4px base; use 4, 8, 12, 16, 24, 32, 48, 64 |
| Radius | 4px chips, inputs and table cells; 8px panels; 12px dialogs and sheets; seal and octagon use their own geometry. Do not apply one radius to everything |
| Borders | 1px `--line` for structure; `--line-strong` for inputs and focused containers |
| Elevation | None on page content. `--overlay-shadow` only on popovers, menus, dialogs, toasts |
| Touch targets | At least 44px; 48px on `/review/new` |
| Motion | Only in response to a user action (open, expand, confirm), 120 to 200ms, ease-out. No scroll-triggered entrances, no hover transforms on cards. Skeletons use a static fill when reduced motion is on |
| Icons | lucide-react, 20px, stroke 1.75, color inherits |
| Focus | 2px `--focus` ring with 2px offset on every interactive element, never removed |

### 3.7 Voice and vocabulary

Active voice, plain verbs, sentence case, no apologies, no jargon. One name per concept, used everywhere:

| Use | Never |
| --- | --- |
| Review (one submitted unit) | Job, run, analysis, scan |
| Check (one rule outcome) | Test, item |
| Evidence | Proof, findings |
| Prep status (overall) | Final result, score |
| Rule set | Config, policy |
| Override | Edit verdict, fix |
| Run review (button) | Submit, Go |
| Retake photo | Redo |
| Not verifiable from image | N/A, skipped |

Errors say what happened and what to do: "Photo upload failed. Check your connection and try again." Empty states invite action: "No reviews yet. Start a review to see results here."

### 3.8 Anti-patterns (reject these in your own output)

Cream background with serif display and terracotta accent; black background with neon accent; identical rounded cards with the same soft shadow in a grid; gradient washes; one accented word in a headline; ALL CAPS eyebrows above headings; numbered 01/02/03 markers on non-sequential content; middle-dot meta strings ("A · B · C"); arrows appended to buttons; hover-lift on cards; fade-up on every section.

## 4. Information architecture

### 4.1 Routes

| Route | Screen | Roles | Purpose |
| --- | --- | --- | --- |
| `/login` | S1 | public | Sign in (email and password, magic link, SSO) |
| `/auth/callback` | none | public | Magic link and OIDC return |
| `/review/new` | S2 | operator, reviewer, manager | Capture photos and run a review |
| `/review/[id]` | S3 | all (operator: own only) | Flagship result page |
| `/reviews` | S4 | all (operator: own only) | Searchable history |
| `/queue` | S5 | reviewer, manager | Worklist of FAIL and UNCERTAIN needing a human |
| `/insights` | S6 | manager | Quality trends |
| `/audit` | S7 | reviewer (read), manager | Append-only audit log |
| `/rules` and `/rules/[category]` | S8 | all (read-only) | Rule sets in force |
| `/status` | S9 | manager | System health |
| `/settings` | S11 | all | Profile, theme, density, sign out |
| `/lab/*` | S10 | manager, gated (I9) | Developer tools, demo data |

### 4.2 Navigation

Desktop (1024px and up): fixed left sidebar, 240px, collapsible to 64px icon rail. Mobile and tablet portrait: bottom tab bar (max 4 items) plus top bar. Items by role:

| Role | Items (in order) | Home route |
| --- | --- | --- |
| operator | New review, My reviews, Rules, Settings | `/review/new` |
| reviewer | Queue (with count badge), All reviews, New review, Rules, Audit | `/queue` |
| manager | Insights, Queue, All reviews, New review, Audit, Rules, Status, Settings (Lab only when enabled) | `/insights` |

Top bar: organization name, environment badge shown only when not production ("Staging", "Local"), theme toggle, user menu (name, role chip, sign out). Breadcrumbs only on `/review/[id]` and `/rules/[category]`.

## 5. Target project structure

```
frontend/
app/
  layout.tsx                     fonts, theme cookie, Providers
  globals.css                    tokens (§3.2)
  login/                         S1 (keep existing server actions)
  auth/callback/route.ts
  (app)/                         authenticated group, AppShell layout
    layout.tsx                   role guard, nav, DemoBanner slot
    review/new/page.tsx          S2
    review/[id]/page.tsx         S3
    reviews/page.tsx             S4
    queue/page.tsx               S5
    insights/page.tsx            S6
    audit/page.tsx               S7
    rules/page.tsx, rules/[category]/page.tsx S8
    status/page.tsx              S9
    settings/page.tsx            S11
    lab/...                      S10, gated
  api/                           keep BFF proxy routes; attach Supabase JWT server-side
components/
  ui/                            Radix-based primitives: Button, Input, Select, Dialog, Sheet, Tabs, Tooltip, Popover, Toast, Skeleton, Table, Chip
  verdict/                       VerdictIcon, VerdictBadge, VerdictSeal, ConfidenceMeter, RuleChip
  review/                        CheckRow, CheckList, EvidenceViewer, ImageStrip, JobStatus, OverrideDialog, OverrideTrail, ReportView
  capture/                       CategoryPicker, PhotoSlot, CaptureForm
  data/                          ReviewTable, FilterBar, Pagination, StatTile, charts
  shell/                         AppShell, Sidebar, BottomNav, TopBar, UserMenu, DemoBanner, RoleGate
  states/                        EmptyState, ErrorState, ForbiddenState, Skeletons
lib/
  api/                           client.ts, endpoints.ts, errors.ts, adapters.ts, schemas.ts (zod), queries.ts
  auth/                          session.ts, roles.ts
  format/                        report.ts (PRD text report), time.ts, ids.ts
  verdict.ts                     sort order and labels only, no decision logic
  lab/                           legacy ruleEngine.ts, cv/, scenarios/ (moved here, §12)
types/api.ts                     canonical TS types (§6.1)
tests/                           unit, component, e2e
```

## 6. Data contracts and API layer

### 6.1 Canonical TypeScript types (`types/api.ts`)

```typescript
export type Verdict = 'PASS' | 'FAIL' | 'UNCERTAIN';
export type JobState = 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY';
export type Role = 'operator' | 'reviewer' | 'manager';
export type Category = 'electronics_small' | 'apparel' | 'liquids_consumables' | 'fragile_glass';
// [ymin, xmin, ymax, xmax], integers 0..1000, relative to the image, origin top-left
export type BBox = [number, number, number, number];

export interface Evidence {
  image_id?: string;
  value?: string | number | boolean | null;
  confidence?: number; // 0..1
  bbox?: BBox | null;
  extracted_text?: string; // untrusted (I13)
}

export interface OverrideRecord {
  override_id: string;
  corrected_verdict: Verdict;
  note: string;
  reviewer_id: string;
  reviewer_name: string; // display only
  created_at: string; // ISO 8601
}

export interface CheckResult {
  check_id: string;
  name?: string; // fall back to humanized check_id
  verdict: Verdict; // rule engine output (I1)
  reason: string;
  rule_id?: string;
  visually_verifiable?: boolean; // false => 'Not verifiable from image' (I11)
  min_confidence?: number;
  evidence: Evidence[];
  override?: OverrideRecord | null;
}

export interface ReviewImage {
  image_id: string;
  url: string; // signed, short-lived
  thumb_url?: string;
  angle?: string;
  quality_flags?: string[]; // e.g. 'blurry', 'underexposed'
}

export interface Review {
  review_id: string;
  category: Category;
  rule_set_version: string;
  job_state: JobState;
  overall_status?: Verdict; // absent until job_state === 'SUCCESS'
  checks: CheckResult[];
  metrics?: { total_checks: number; passed: number; failed: number; uncertain: number };
  images: ReviewImage[];
  work_order_ref?: string;
  evidence_source?: 'vlm' | 'preset' | 'mock'; // see §16 C1
  created_at: string;
  created_by?: { id: string; name: string };
  latency_ms?: number;
  error?: { code: string; message: string }; // when job_state === 'FAILURE'
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: { id: string; name: string; role: Role } | 'system';
  action: string;
  target_type: string;
  target_id: string;
  details?: Record<string, unknown>;
}

export interface RuleCheckDef {
  check_id: string;
  name: string;
  description: string;
  visually_verifiable: boolean;
  min_confidence?: number;
  pass_values?: string[];
  fail_values?: string[];
}

export interface RuleSet {
  rule_set_id: string;
  version: string;
  category: Category;
  checks: RuleCheckDef[];
  checksum?: string;
}
```

### 6.2 Endpoints the frontend consumes

Source: README. The browser never calls FastAPI directly; it calls Next.js route handlers in `app/api/*`, which attach the Supabase JWT server-side and forward to `PYTHON_API_URL` (existing pattern, keep it).

| Purpose | Backend endpoint | Notes |
| --- | --- | --- |
| Create review | `POST /v1/reviews` | README shows `/v1/reviews`; PRD and TRD say `/v1/prep-review`. Define both in `lib/api/endpoints.ts` as one constant and confirm with the backend (§16 C11) |
| List reviews | `GET /v1/reviews` | Paginated; filters needed (§16 C5) |
| Get review | `GET /v1/reviews/{id}` | Polled while `job_state` is not terminal |
| Override | `POST /v1/reviews/{id}/overrides` | Body: `check_id`, `corrected_verdict`, `note`. Do not send `reviewer_name` (I6, §16 C9) |
| Rule sets | `GET /v1/rules`, `GET /v1/rules/{category}` | Read-only |
| Audit log | `GET /v1/audit-log` | Paginated, filterable |
| System status | `GET /v1/system/status` | Redis, Gemini key, workers |
| Current user | `GET /v1/me` (does not exist yet, §16 C4) | Fallback: read role from Supabase `organization_members` server-side |

### 6.3 Fetching, polling, errors

- Use TanStack Query v5. Query keys: `['review', id]`, `['reviews', filters]`, `['rules', category]`, `['audit', filters]`, `['insights', range]`.
- Polling: while `job_state` is PENDING, STARTED or RETRY, refetch every 1500ms, backing off to 4000ms after 20s. Stop on SUCCESS or FAILURE. After 90s without a terminal state show "This is taking longer than usual" with a Keep waiting button; never auto-fail.
- Mutations (create review, override) are not optimistic (I12). On success, invalidate `['review', id]`, `['reviews']`, `['audit']`.
- All errors become `ApiError { status, code, message, requestId? }` in `lib/api/errors.ts`. Mapping: 401 redirects to `/login?next=<path>`; 403 renders `ForbiddenState`; 404 renders "Review not found"; 422 maps field errors onto the form; 429 shows retry-after; 5xx and network errors render `ErrorState` with Retry and the request ID (`X-Request-ID`) when present.

### 6.4 Adapter layer (`lib/api/adapters.ts`)

Every response passes through a zod schema and an adapter before reaching components.
- README shows evidence on a check as one object (`{ value, confidence }`); TRD shows `evidence[]`. The adapter always outputs an array.
- Missing optional fields stay `undefined`; never fabricate `rule_id`, `confidence` or `bbox`.
- Unknown verdict strings are rejected, not mapped. The review shows an ErrorState: "The server returned a result this app can't read."
- In development, schema failures throw with a readable diff. In production they are logged and shown as ErrorState.
- Unknown extra fields are ignored.

### 6.5 Photo upload strategy

Implement a single function `submitReview({ category, files, workOrderRef })` so the transport can change without touching screens.
- Preferred: multipart POST to the BFF, which forwards to FastAPI (requires backend to persist bytes, §16 C8).
- Fallback if the backend only accepts URLs: upload each file to Supabase Storage via a signed upload URL from a BFF route, then submit the object paths.
- Client preprocessing before upload: fix EXIF orientation, downscale so the longest edge is at most 2048px, JPEG quality 0.85. Limits: 1 to 4 images, 10 MB each before preprocessing, `image/jpeg`, `image/png`, `image/webp`. Reject other types with: "This file type isn't supported. Use a JPEG, PNG or WebP photo."
- Advisory only (I14): if the image is under 800px on its short edge, or a quick Laplacian-variance estimate is low, show a non-blocking hint on the thumbnail: "This photo may be blurry. Retake it for a reliable result."

### 6.6 Text report formatter (`lib/format/report.ts`)

Pure formatting of API data into the PRD §6 output format, used by Copy report and the print view. It must never change a verdict.

```
Polybag presence: PASS
Suffocation warning: FAIL
Reason: Warning text not found on bag opening.
Evidence: Front image, region [120, 80, 340, 410], no text detected.
...
PREP STATUS: FAIL
```

Format: one block per check in API order, Reason and Evidence lines only for FAIL and UNCERTAIN, blank line between blocks, final PREP STATUS line from `overall_status`. Overrides add a line `Override: <verdict> by <name> on <date>: <note>`.

## 7. Component specifications

Build components in `components/` per §5. All are typed, keyboard accessible, themed by tokens, and exercised on `/lab/components` (a gallery route behind I9).

| ID | Component | Props (essential) | Behavior and rules |
| --- | --- | --- | --- |
| C1 | VerdictIcon | `verdict`, `size` (16, 20, 32) | Circle check / octagon cross / diamond question (§3.4). `aria-hidden` when next to its word |
| C2 | VerdictBadge | `verdict`, `subtype?: 'not_verifiable'`, `size: 'sm' \| 'md'` | Bordered badge using tokens |
| C3 | VerdictSeal | `status`, `animateOnce?: boolean` | §3.5. Stamp animation plays at most once per review per session (track in memory by `review_id`) |
| C4 | ConfidenceMeter | `value`, `threshold?` | Text first: "92% confidence". 4px bar in `--ink-muted`, tick at threshold with label "minimum 80%" when provided. Neutral color, not verdict color, so confidence is not mistaken for the verdict |
| C5 | RuleChip | `ruleId`, `version?` | Mono text, 4px radius, copy on click, tooltip "Copy rule ID" |
| C6 | CheckRow | `check`, `selected`, `expanded`, `onSelect` | Collapsed row: VerdictBadge, check name, one-line reason (truncate with title), override marker. Expanded: reason, evidence list (value, ConfidenceMeter, OCR text in a quoted plain-text block), RuleChip, evidence image thumbnails, Override button (role-gated). Left 3px accent bar in the verdict line color |
| C7 | CheckList | `checks`, `selectedId` | Sorted by I5. Group headers "Failed (n)", "Needs a human (n)", "Passed (n)". Passed group collapsed when any FAIL or UNCERTAIN exists, expanded otherwise. Arrow keys move selection |
| C8 | EvidenceViewer | `images`, `checks`, `selectedCheckId`, `onSelectCheck` | See §7.1 |
| C9 | ImageStrip | `images`, `activeId` | Thumbnails with angle label and quality chip from `quality_flags` |
| C10 | JobStatus | `state`, `startedAt` | Truthful stepper limited to known states: Queued (PENDING), Running (STARTED), Retrying (RETRY), Done, Failed. Elapsed timer. `aria-live=polite`. Never shows invented stage names |
| C11 | OverrideDialog | `review`, `check` | Radix Dialog. Shows rule verdict and reason read-only, radio for corrected verdict (PASS, FAIL, UNCERTAIN), required note (min 10 chars, 500 max) with counter, reviewer shown read-only from session. Buttons: Cancel, Save override. On confirm, disabled until server responds. If corrected verdict is PASS, add a warning line: "This replaces a rule result with a human decision and is recorded in the audit log." |
| C12 | OverrideTrail | `override` | Two-line layered display per I6 |
| C13 | CategoryPicker | `value`, `onChange`, `ruleCounts?` | Four large selectable tiles (min 96px tall) with name and "10 checks apply" when counts are known. Radio-group semantics |
| C14 | PhotoSlot | `label`, `hint`, `file`, `onChange` | Empty: large dashed target with camera icon and hint. Filled: preview, Retake, Remove. `<input type=file accept=image/* capture=environment>` plus a Choose from gallery action |
| C15 | DemoBanner | `source` | Full-width, `--unc-bg`, text "Demo data. These results are not real compliance decisions." Cannot be dismissed (I3) |
| C16 | ReviewTable | `rows`, `sort`, `onSort` | Real `<table>` with sticky header; rows are links; at under 768px render as stacked list items |
| C17 | FilterBar | `filters`, `onChange` | State lives in the URL search params. Chips for active filters with Clear all |
| C18 | StatTile | `label`, `value`, `delta?` | Plain bordered box, label above value, no gradients. Tiles vary in width by importance; not an equal grid of identical cards |
| C19 | EmptyState, ErrorState, ForbiddenState, Skeleton* | per §9 | Layout-matched skeletons; every ErrorState has Retry |
| C20 | RoleGate | `allow: Role[]`, `fallback?` | Hides children; server routes still enforce (I7) |

### 7.1 EvidenceViewer specification (C8)

```
+--------------------------------------------------------------+
| [Overview] [Label close-up] [Seal]      Regions [on] [ ]    |
| dark canvas (--canvas)                                       |
|   +------------------------+                                 |
|   | photo                  |  outline = verdict line color   |
|   |   +--------+           |  FAIL solid, UNCERTAIN dashed   |
|   |   | bbox   |           |  PASS thin solid                |
|   |   +--------+           |  corner label = check name      |
|   +------------------------+                                 |
|   - 100% +   Fit   Fullscreen                                |
+--------------------------------------------------------------+
```

- Photo is displayed with `object-fit: contain` on `--canvas`. The bbox overlay is an SVG with `viewBox='0 0 1000 1000'` and `preserveAspectRatio='none'`, sized to exactly the rendered image rectangle (not the container) and placed inside the same zoom and pan transform. Coordinates are `[ymin, xmin, ymax, xmax]`, so `x = xmin`, `y = ymin`, `width = xmax - xmin`, `height = ymax - ymin`. Use `vector-effect: non-scaling-stroke`, 2px stroke.
- Selecting a check in the list jumps to the image named in its first evidence item that has a bbox and highlights that box; other boxes dim to 35% opacity. Clicking a box selects its check.
- Zoom 1x to 6x, pan by drag, pinch on touch, `+`, `-`, arrow keys and `0` for reset. Use `react-zoom-pan-pinch`.
- Checks with no bbox show a note under the viewer: "No region was located for this check." (never invent a box).
- Toggle "Regions" (default on) hides all overlays so the raw photo can be inspected.
- Images with quality flags show a chip such as "Blurry" on the thumbnail and a line under the viewer.
- Signed URL expiry: on image load error, request a fresh review fetch once; if it still fails show "This photo is no longer available."
- Accessibility: the viewer is a labeled region; the CheckList is the accessible equivalent of the overlays. Each overlay has `<title>` with check name and verdict.

## 8. Screen specifications

### S1. Sign in (`/login`)
Centered 400px panel on `--bg`. Title "Sign in to Prep Manager". Fields: Email, Password. Actions: Sign in (primary), Email me a sign-in link, Continue with company SSO. Keep the existing Supabase server actions. States: submitting (button spinner, fields disabled), invalid credentials ("Email or password is incorrect."), magic link sent ("Check your inbox. The link expires in 1 hour."), SSO unavailable (button hidden when not configured). No marketing copy.

### S2. New review (`/review/new`), operator home, phone-first
Order: Category, Photos, Work order. Run review is sticky at the bottom on mobile; disabled until a category and at least one photo exist. Helper under the button states what is missing.
Category is required with no default. Show "The category decides which checks apply.". When rules load, show the check count and a link View rules. If the user picks a category with no rule set (API 404 or empty), disable Run review and say "This category has no rule set yet."
Photo slots and hints: Overview ("Show the whole unit in its bag."), Label and barcode close-up ("Fill the frame with the label. Avoid glare."), Bag opening and seal ("Show the seal or opening and any warning text."), Other ("Add any angle that shows a required surface."). Only one photo is required; the hint text under the button reminds: "More angles mean fewer UNCERTAIN results."
On Run review: POST, then navigate to `/review/[id]` immediately (processing state lives there). Preserve selected files in memory if submission fails; show retry.
Offline: banner "You're offline. Photos are kept; reconnect to run the review."
Acceptance: operator can complete the flow on a 360px wide phone with one hand; every control at least 48px; total taps from home to submitted review at most 6 with a single photo.

### S3. Review detail (`/review/[id]`), the flagship screen
Desktop: Header, Hero with VerdictSeal from `overall_status`, summary line, who and when. Two columns: EvidenceViewer (58%) and CheckList (42%). Tabs below: Activity, Details, Raw response (manager only).
Mobile: header, seal, summary, EvidenceViewer (height 45vh, collapsible), CheckList, tabs.
Processing state (`job_state` PENDING, STARTED, RETRY): hero shows JobStatus instead of the seal; submitted photos show in ImageStrip; no placeholder checks. On SUCCESS the seal stamps in and checks render. On FAILURE show ErrorState with `error.message`, Retry review when supported, and Contact details with the review ID.
Overrides (C11, C12): opens OverrideDialog. After success, check shows OverrideTrail and toast "Override saved.". Seal continues to show rule engine's `overall_status`.

### S4. Reviews list (`/reviews`)
PageHeader "Reviews", FilterBar (search by ID or work order, Status: All, FAIL, UNCERTAIN, PASS, Category, Date range, Submitted by, Overridden: Any, Yes, No), ReviewTable. Server pagination, 25 per page, page in URL. Operator sees only their own reviews. Row click opens S3.

### S5. Queue (`/queue`)
Reviewer worklist of reviews with `overall_status` FAIL or UNCERTAIN and no human decision, oldest first. Same table as S4 with an Age column and a keyboard-first list: `j` and `k` move, `Enter` opens, `?` shows shortcuts. Count badge in navigation.

### S6. Insights (`/insights`), manager
Range selector (7, 30, 90 days) and Category filter in the URL. Content: Verdict mix (stacked bar with pattern fills + table toggle), UNCERTAIN rate over time, Most failed checks, StatTiles, Category by check matrix. Use Recharts.

### S7. Audit log (`/audit`)
Read-only table: Time, Actor, Action, Target (link to review), Summary; drawer with full JSON details. Caption: "Entries can't be edited or deleted."

### S8. Rules (`/rules`, `/rules/[category]`)
List of four categories with rule set version and check count. Detail: table of checks with rule IDs, verifiable from photo, confidence, pass/fail values. Read-only.

### S9. System status (`/status`), manager
Vertical list: API, Queue (Redis), Workers, Vision model key, Database. Refresh every 15s.

### S10. Developer lab (`/lab/*`), gated by I9
Scenario simulator, OpenCV pipeline lab, Barcode coverage engine, VLM context workbench, Queue monitor, `/lab/components` gallery. Fixed band: "Developer lab. Demo data. Nothing here affects real reviews."

### S11. Settings (`/settings`)
Profile (read-only), Appearance (Theme: System, Light, Dark; Density: Comfortable, Compact, stored in cookie), Sign out.

## 9. States catalog

Every screen implements all applicable states: Loading (layout-matched skeleton), Empty (first run), Empty (filtered), Error (network or 5xx with Retry and request ID), Forbidden (403), Not found (404), Session expired (401 redirect to `/login?next=`), Offline banner, Processing, Job failed, Stale data, Demo data (`DemoBanner`), Mutation pending.

## 10. Accessibility, responsiveness, performance

- WCAG 2.2 AA floor. Contrast at least 4.5:1. Verdicts never color-only (I4).
- Keyboard: every action reachable, 2px focus ring with 2px offset.
- Responsive breakpoints: 360, 640, 1024, 1440. No horizontal scroll.
- Performance: LCP < 2.5s, INP < 200ms. Initial JS per route < 200 KB gzip (lazy-load EvidenceViewer and Recharts).

## 11. Auth, roles and security in the frontend

- Supabase SSR auth with `middleware.ts`. Middleware protects `(app)` routes.
- Role checks in `(app)/layout.tsx` server component and privileged pages; client `RoleGate` only hides UI.
- Browser never holds service-role key (I8).
- Treat all API strings as untrusted (I13). Validate with zod.
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PYTHON_API_URL` (server only), `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_ENABLE_LAB`.

## 12. Migration map from the current frontend

| Current | Action | Target |
| --- | --- | --- |
| `app/page.tsx` (6-tab shell) | Replace with a redirect to role home route; delete after F9 | `(app)` routes |
| `components/ReviewStation.tsx` | Split: capture and result parts rebuilt (S2, S3); 10-scenario simulator moves to lab | `components/capture`, `components/review`, `/lab/scenarios` |
| `components/AuditTrailView.tsx` | Rebuild as S7 and Activity tab of S3 | `app/(app)/audit`, `components/review` |
| `components/HumanOverrideModal.tsx` | Rebuild as C11 | `components/review/OverrideDialog.tsx` |
| `components/OpenCVPipelineLab.tsx` | Move unchanged | `/lab/opencv` |
| `components/BarcodeCoverageEngine.tsx` | Move unchanged | `/lab/barcode` |
| `components/VlmContextWorkbench.tsx` | Move; fix model name copy | `/lab/vlm` |
| `components/CeleryQueueMonitor.tsx` | Move; reconcile with queue | `/lab/queue` |
| `components/Header.tsx` | Replace with TopBar, Sidebar, BottomNav | `components/shell` |
| `lib/rules/ruleEngine.ts` | Move; forbid imports outside `lib/lab` and `/lab` (I2) | `lib/lab/rules` |
| `lib/scenarios/testScenarios.ts` | Move; production build must tree-shake it | `lib/lab/scenarios` |
| `lib/cv/imagePreprocessing.ts` | Keep only advisory blur hint (§6.5); rest moves to lab | `lib/capture`, `lib/lab/cv` |
| `types/api.ts` | Replace with §6.1 types; keep old names exported as deprecated aliases until F9 | `types/api.ts` |
| `app/globals.css`, Tailwind config | Replace with tokens §3.2 | §3.2 |
| `lucide-react`, `motion` | Keep. `motion` used only by VerdictSeal | n/a |

## 13. Phased build plan

- F0. Audit (no feature code)
- F1. Foundation (§3, 4, 5, 11, 12)
- F2. API layer (§6, 14)
- F3. Verdict components and gallery (§3.4, 3.5, 7)
- F4. Capture and review detail (§2, 6, 7, 8 S2 and S3, 9, 10)
- F5. Lists, queue and audit (§8 S4, S5, S7, 9)
- F6. Rules, insights, status, settings (§8 S6, S8, S9, S11)
- F7. Polish and print (§3.7, 6.6, 10)
- F8. Testing, CI, budgets (§10.3, 14)
- F9. Lab restyle and cleanup (§12, 15)

## 14. Testing strategy
Unit (Vitest), Component (Vitest + Testing Library), End to end (Playwright), Accessibility (axe in Playwright), Visual (Playwright screenshots), Performance (Lighthouse CI), Safety (Lint and tests).

## 15. Definition of done (whole frontend)
All 14 invariants verified, operator captures in <= 6 taps on 360px phone, reviewer identifies and overrides in <= 30s and <= 5 clicks, manager insights un-fabricated, no production route imports lab code, demo data marked, light & dark pass axe, CI green.

## 16. Backend contract requests, assumptions and open questions

Contract requests C1 to C13 detailed in document.

Assumptions to verify in F0:
- roles are exactly operator, reviewer, manager
- BBox format matches §6.1
- categories are the four listed
- the BFF proxy exists for every endpoint in §6.2
- no production code imports ruleEngine.ts today
