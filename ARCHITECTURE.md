# Implementation Architecture

## Runtime boundaries

1. The VS Code extension owns editor events, debounce, cancellation, and inline rendering.
2. A completion service owns model/provider calls and returns `[{"text": "...", "range": ...}]`-compatible suggestions.
3. The prep review API owns image ingestion and orchestration.
4. Perception emits evidence only. The Python rule engine emits verdicts.
5. Supabase stores tenant-scoped metadata, immutable review outputs, evidence references, rule versions, and human overrides. Image bytes live in Supabase Storage.

## Authentication flow

- Operator signs in with Supabase Auth using email/password, magic link, or an enterprise OIDC provider.
- The client sends the Supabase access token as `Authorization: Bearer` to the API.
- The API validates the JWT and derives `user_id`; clients never submit an authoritative user identity.
- Membership is checked against `organization_members` before creating or reading a review.
- Reviewer overrides require a reviewer or manager membership role in the API service. RLS remains the final database boundary.
- Service-role keys are backend-only and never shipped in the editor or browser client.

## Completion endpoint contract

`POST /v1/completions` accepts `{document, language, position, prefix, suffix, trigger}` and returns `{items: [{insertText, rangeStart, rangeEnd}]}`. The extension cancels stale requests and only displays completions for configured languages.

## Rule lifecycle

A compliance owner authors a YAML rule set, reviews it, stores its normalized JSON in `rule_sets.definition`, activates one version per category, and keeps every review pinned to the exact rule-set row. No prompt or model response can change a verdict.
