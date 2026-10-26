# Prep Manager Inline Completions

This extension is the editor-side half of the completion architecture. It uses VS Code's `registerInlineCompletionItemProvider`, sends the current prefix/suffix to a completion service, cancels stale requests, and renders up to three ghost-text candidates.

The completion backend should implement:

```http
POST /v1/completions
Content-Type: application/json

{"document":"file:///...","language":"python","position":{"line":12,"character":4},"prefix":"...","suffix":"...","trigger":"inline"}
```

```json
{"items":[{"insertText":"    return result\n","rangeStart":{"line":12,"character":4},"rangeEnd":{"line":12,"character":4}}]}
```

No API key is stored by the extension. Put authentication in the local completion service or a VS Code secret-backed configuration when the backend contract is finalized.
