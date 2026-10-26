from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any



def suggestions(language: str, prefix: str) -> list[str]:
    line = prefix.splitlines()[-1].strip()
    if language == "python":
        if line.startswith("def test_") and line.endswith(":"):
            return ["\n    assert result is not None"]
        if line.startswith("def ") and line.endswith(":"):
            return ["\n    raise NotImplementedError"]
        if "class " in line and line.endswith(":"):
            return ["\n    def __init__(self) -> None:\n        pass"]
    if language in {"typescript", "typescriptreact", "javascript", "javascriptreact"}:
        if line.startswith("export function ") and line.endswith(") {"):
            return ["\n  return null;\n}"]
        if line.startswith("describe("):
            return ["\n  it('works', () => {\n    expect(true).toBe(true);\n  });\n});"]
        if language.endswith("react") and line.startswith("export default function "):
            return ["\n  return <div />;\n}"]
    return []


class CompletionHandler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        if self.path != "/v1/completions":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("content-length", "0"))
            payload: dict[str, Any] = json.loads(self.rfile.read(length))
            items = [{"insertText": text} for text in suggestions(payload.get("language", ""), payload.get("prefix", ""))]
            body = json.dumps({"items": items}).encode("utf-8")
            self.send_response(200)
            self.send_header("content-type", "application/json")
            self.send_header("content-length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (ValueError, TypeError, json.JSONDecodeError):
            self.send_error(400, "Invalid completion request")

    def log_message(self, _format: str, *_args: object) -> None:
        return


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8787), CompletionHandler)
    print("Completion service listening on http://127.0.0.1:8787")
    server.serve_forever()
