import * as vscode from "vscode";

type CompletionItem = {
  insertText: string;
  rangeStart?: { line: number; character: number };
  rangeEnd?: { line: number; character: number };
};

type CompletionResponse = { items?: CompletionItem[] };

let enabled = true;

export function activate(context: vscode.ExtensionContext): void {
  enabled = vscode.workspace.getConfiguration("prepManager").get("enabled", true);
  const provider = vscode.languages.registerInlineCompletionItemProvider(
    [{ language: "typescript" }, { language: "typescriptreact" }, { language: "javascript" }, { language: "javascriptreact" }, { language: "python" }],
    { provideInlineCompletionItems },
  );
  const toggle = vscode.commands.registerCommand("prepManager.toggleCompletions", () => {
    enabled = !enabled;
    vscode.window.setStatusBarMessage(`Prep Manager completions ${enabled ? "enabled" : "disabled"}`, 2000);
  });
  context.subscriptions.push(provider, toggle);
}

async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  _context: vscode.InlineCompletionContext,
  token: vscode.CancellationToken,
): Promise<vscode.InlineCompletionItem[]> {
  if (!enabled || token.isCancellationRequested) return [];
  const configuration = vscode.workspace.getConfiguration("prepManager");
  const endpoint = configuration.get<string>("completionEndpoint");
  if (!endpoint) return [];

  const prefix = document.getText(new vscode.Range(new vscode.Position(Math.max(0, position.line - 80), 0), position));
  const suffix = document.getText(new vscode.Range(position, new vscode.Position(Math.min(document.lineCount - 1, position.line + 20), 0)));
  const controller = new AbortController();
  token.onCancellationRequested(() => controller.abort());

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        document: document.uri.toString(),
        language: document.languageId,
        position: { line: position.line, character: position.character },
        prefix,
        suffix,
        trigger: "inline",
      }),
      signal: controller.signal,
    });
    if (!response.ok || token.isCancellationRequested) return [];
    const payload = (await response.json()) as CompletionResponse;
    return (payload.items ?? []).slice(0, 3).map((item) => {
      const start = item.rangeStart ? new vscode.Position(item.rangeStart.line, item.rangeStart.character) : position;
      const end = item.rangeEnd ? new vscode.Position(item.rangeEnd.line, item.rangeEnd.character) : position;
      return new vscode.InlineCompletionItem(item.insertText, new vscode.Range(start, end));
    });
  } catch {
    return [];
  }
}

export function deactivate(): void {}
