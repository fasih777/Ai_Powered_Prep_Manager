import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  Search,
  Code2,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  FileText
} from 'lucide-react';
import { DENSE_PREP_DOCUMENTATION, PrepDocumentSection } from '../docs/prepRequirementsDocs';
import { VLM_SYSTEM_INSTRUCTION, VLM_ANALYSIS_PROMPT } from '../lib/vlm/promptTemplates';
import { TestScenario } from '../lib/scenarios/testScenarios';

interface VlmContextWorkbenchProps {
  currentScenario: TestScenario;
}

export const VlmContextWorkbench: React.FC<VlmContextWorkbenchProps> = ({ currentScenario }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('SEC-01-POLYBAG');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePromptTab, setActivePromptTab] = useState<'system' | 'schema' | 'sandbox'>('system');
  const [sandboxPrompt, setSandboxPrompt] = useState<string>(VLM_ANALYSIS_PROMPT(currentScenario.category));
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const filteredSections = DENSE_PREP_DOCUMENTATION.filter(
    sec =>
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.rules.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeSection = DENSE_PREP_DOCUMENTATION.find(s => s.id === activeSectionId) || DENSE_PREP_DOCUMENTATION[0];

  const handleRunSandbox = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setSandboxResponse(
        JSON.stringify(
          {
            perceptionMetadata: {
              model: 'gemini-3.8-flash',
              contextTokensIngested: 31200,
              latencyMs: 740,
              guardrailsTriggered: ['SEC-07-NON-VISUAL-GUARDRAILS']
            },
            detections: currentScenario.evidence.detections,
            spatialGeometry: currentScenario.evidence.spatialGeometry,
            barcodeAnalysis: currentScenario.evidence.barcodeAnalysis,
            ocrResults: currentScenario.evidence.ocrResults
          },
          null,
          2
        )
      );
      setIsExecuting(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white">
                VLM Large Context Ingestion & Prompt Engineering Workbench
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Ingests dense 2026 Inbound Prep Standard manuals (Amazon FBA, 16 CFR § 1500) into a large context window for spatial reasoning, OCR extraction, and strict non-visual guardrail compliance.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
              <span className="text-zinc-500">Ingested Context: </span>
              <span className="text-sky-400 font-bold">~31.2k Tokens</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
              <span className="text-zinc-500">Active Category: </span>
              <span className="text-indigo-400 font-bold">{currentScenario.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Dense Documentation Browser (Left) vs Prompt Engineering Workbench (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Authoritative Framework Documentation Explorer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                Authoritative Rule Manual (v2026.09.1)
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {DENSE_PREP_DOCUMENTATION.length} Ingested Chapters
              </span>
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-zinc-800 bg-zinc-950">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search rules, clauses, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-700 text-xs rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Chapter List */}
            <div className="divide-y divide-zinc-800/80 max-h-56 overflow-y-auto">
              {filteredSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left p-3 text-xs transition-colors flex items-start justify-between ${
                    activeSectionId === sec.id
                      ? 'bg-sky-500/15 text-white'
                      : 'hover:bg-zinc-800/50 text-zinc-400'
                  }`}
                >
                  <div>
                    <div className="font-bold truncate">{sec.title}</div>
                    <div className="text-[10px] text-zinc-400">{sec.category}</div>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      sec.visuallyVerifiable
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {sec.visuallyVerifiable ? 'VISUAL' : 'NON-VISUAL'}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Chapter Details */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3 text-xs">
              <h4 className="font-bold text-sky-400">{activeSection.title}</h4>

              <div>
                <span className="font-semibold text-zinc-300 block mb-1">Standard Requirements:</span>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[11px]">
                  {activeSection.rules.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-zinc-300 block mb-1">Verbatim Enforceable Clauses:</span>
                <div className="space-y-1">
                  {activeSection.verbatimClauses.map((c, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 italic">
                <span className="font-semibold text-zinc-300">VLM Directive: </span>
                {activeSection.notes}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prompt Engineering Tabs & Sandbox (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {/* Tabs Bar */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-4 pt-2">
              <button
                onClick={() => setActivePromptTab('system')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  activePromptTab === 'system'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                System Instruction & Directives
              </button>
              <button
                onClick={() => setActivePromptTab('schema')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  activePromptTab === 'schema'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Structured JSON Perception Schema
              </button>
              <button
                onClick={() => setActivePromptTab('sandbox')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  activePromptTab === 'sandbox'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Live VLM Test Sandbox
              </button>
            </div>

            {/* Tab 1: System Instruction */}
            {activePromptTab === 'system' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400">Model: gemini-3.8-flash</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    System-Level Grounding
                  </span>
                </div>
                <pre className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                  {VLM_SYSTEM_INSTRUCTION}
                </pre>
              </div>
            )}

            {/* Tab 2: Structured JSON Schema */}
            {activePromptTab === 'schema' && (
              <div className="p-4 space-y-3">
                <p className="text-xs text-zinc-400">
                  Enforces normalized bounding boxes (0-1000 scale), confidence thresholds, OCR text strings, and spatial surface classification.
                </p>
                <pre className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-[11px] text-sky-300 overflow-x-auto max-h-96 leading-relaxed">
{`{
  "detections": [
    {
      "id": "det_fnsku_1",
      "type": "fnsku" | "polybag" | "seam" | "suffocation_warning" | "expiry_date" | "mfg_barcode",
      "box": { "ymin": 0-1000, "xmin": 0-1000, "ymax": 0-1000, "xmax": 0-1000 },
      "confidence": 0.0-1.0,
      "label": "string"
    }
  ],
  "spatialGeometry": {
    "fnskuSurface": "flat" | "seam" | "curved_edge" | "opening" | "wrinkled" | "unknown",
    "fnskuCurvatureAngleDeg": number,
    "distanceToNearestSeamPx": number,
    "intersectsSeam": boolean,
    "polybagSealed": boolean,
    "sealType": "heat_seal" | "tamper_evident_tape" | "unsealed_open" | "zipper"
  },
  "barcodeAnalysis": {
    "fnskuFound": boolean,
    "fnskuValue": string,
    "mfgBarcodeFound": boolean,
    "coverageStatus": "FULLY_COVERED" | "PARTIALLY_EXPOSED" | "UNCOVERED" | "NO_MFG_BARCODE_DETECTED",
    "coverageRatio": number (0.0 - 1.0)
  },
  "ocrResults": {
    "suffocationWarningText": string,
    "suffocationKeywordsDetected": string[],
    "isSuffocationLegible": boolean,
    "expiryDateString": string,
    "expiryFound": boolean,
    "expiryUncovered": boolean
  }
}`}
                </pre>
              </div>
            )}

            {/* Tab 3: Live Sandbox */}
            {activePromptTab === 'sandbox' && (
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    VLM Prompt Execution Buffer:
                  </label>
                  <textarea
                    rows={4}
                    value={sandboxPrompt}
                    onChange={(e) => setSandboxPrompt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-zinc-400">
                    Target: {currentScenario.name}
                  </span>
                  <button
                    onClick={handleRunSandbox}
                    disabled={isExecuting}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white font-medium text-xs rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isExecuting ? 'Running VLM Inference...' : 'Execute VLM Query'}</span>
                  </button>
                </div>

                {sandboxResponse && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center space-x-1">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Structured Evidence Response:</span>
                    </span>
                    <pre className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-72 whitespace-pre-wrap">
                      {sandboxResponse}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
