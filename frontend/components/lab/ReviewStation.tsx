'use client';

import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  ZoomIn,
  Eye,
  EyeOff,
  UserCheck,
  Send,
  Sparkles,
  Camera,
  Upload,
  Info,
  Maximize2
} from 'lucide-react';
import { PRELOADED_SCENARIOS, TestScenario } from '@/lib/lab/scenarios/testScenarios';
import { PrepReviewOutput, DetectedEntity } from '@/lib/lab/rules/ruleEngine';


interface ReviewStationProps {
  currentScenario: TestScenario;
  onSelectScenario: (scenario: TestScenario) => void;
  reviewResult: PrepReviewOutput | null;
  isLoading: boolean;
  onRunSyncEvaluation: () => void;
  onEnqueueAsyncTask: (priority?: boolean) => void;
  onOpenOverrideModal: () => void;
  onCustomImageUpload: (dataUrl: string, category: string) => void;
}

export const ReviewStation: React.FC<ReviewStationProps> = ({
  currentScenario,
  onSelectScenario,
  reviewResult,
  isLoading,
  onRunSyncEvaluation,
  onEnqueueAsyncTask,
  onOpenOverrideModal,
  onCustomImageUpload
}) => {
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(currentScenario.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedEntity = reviewResult?.evidence?.detections?.find(
    d => d.id === selectedEntityId
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCustomImageUpload(event.target.result as string, activeCategory);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Color mapping for bounding box types
  const getBoxColor = (type: string) => {
    switch (type) {
      case 'fnsku':
        return { border: 'border-purple-400', bg: 'bg-purple-500/20', text: 'text-purple-300' };
      case 'polybag':
        return { border: 'border-sky-400', bg: 'bg-sky-500/10', text: 'text-sky-300' };
      case 'seam':
        return { border: 'border-cyan-400 border-dashed', bg: 'bg-cyan-500/15', text: 'text-cyan-300' };
      case 'suffocation_warning':
        return { border: 'border-amber-400', bg: 'bg-amber-500/20', text: 'text-amber-300' };
      case 'expiry_date':
        return { border: 'border-emerald-400', bg: 'bg-emerald-500/20', text: 'text-emerald-300' };
      case 'mfg_barcode':
        return { border: 'border-rose-400', bg: 'bg-rose-500/25', text: 'text-rose-300' };
      case 'handling_mark':
        return { border: 'border-orange-400', bg: 'bg-orange-500/20', text: 'text-orange-300' };
      default:
        return { border: 'border-zinc-400', bg: 'bg-zinc-500/20', text: 'text-zinc-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Selector & Controls Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Select Acceptance Test Scenario (PRD §11 Ground Truth Suite)
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={currentScenario.id}
                onChange={(e) => {
                  const sc = PRELOADED_SCENARIOS.find(s => s.id === e.target.value);
                  if (sc) onSelectScenario(sc);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {PRELOADED_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} ({sc.expectedOverallStatus})
                  </option>
                ))}
              </select>

              {/* Upload Custom Image Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 whitespace-nowrap transition-colors"
                title="Upload package photo"
              >
                <Upload className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Upload Photo</span>
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">
              <span className="text-zinc-300 font-medium">Scenario Description: </span>
              {currentScenario.description}
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center space-x-2 self-end lg:self-center">
            <button
              onClick={onRunSyncEvaluation}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white font-medium text-xs rounded-lg shadow-sm transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isLoading ? 'Evaluating...' : 'Run Sync Evaluation'}</span>
            </button>

            <button
              onClick={() => onEnqueueAsyncTask(false)}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium text-xs rounded-lg shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enqueue Celery Job</span>
            </button>

            <button
              onClick={onOpenOverrideModal}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors"
              title="Human Override (PRD FR10)"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Override</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Visual Canvas & Perception Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Canvas & RoI Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {/* Canvas Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-zinc-200">Packaging Optical Feed</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {currentScenario.category.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowOverlays(!showOverlays)}
                  className={`p-1.5 rounded text-xs transition-colors flex items-center space-x-1 ${
                    showOverlays
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={showOverlays ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
                >
                  {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-medium">{showOverlays ? 'Boxes ON' : 'Boxes OFF'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Image Viewport */}
            <div className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              <img
                src={currentScenario.imageUrl}
                alt={currentScenario.name}
                className="w-full h-full object-contain select-none"
              />

              {/* Bounding Box Overlays */}
              {showOverlays &&
                reviewResult?.evidence?.detections?.map((det) => {
                  const style = getBoxColor(det.type);
                  const isSelected = selectedEntityId === det.id;

                  // Normalize 0-1000 coordinate scale to percentage
                  const top = `${(det.box.ymin / 1000) * 100}%`;
                  const left = `${(det.box.xmin / 1000) * 100}%`;
                  const width = `${((det.box.xmax - det.box.xmin) / 1000) * 100}%`;
                  const height = `${((det.box.ymax - det.box.ymin) / 1000) * 100}%`;

                  return (
                    <div
                      key={det.id}
                      onClick={() => setSelectedEntityId(det.id)}
                      style={{ top, left, width, height }}
                      className={`absolute border-2 ${style.border} ${style.bg} cursor-pointer transition-all duration-150 ${
                        isSelected ? 'ring-2 ring-white scale-[1.01] z-20' : 'hover:opacity-100 opacity-90'
                      }`}
                    >
                      <div
                        className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight whitespace-nowrap bg-zinc-900 border ${style.border} ${style.text} shadow-md`}
                      >
                        {det.type.toUpperCase()} ({(det.confidence * 100).toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Canvas Legend & RoI Inspector Card */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-xs">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] text-zinc-400 font-semibold">Active Classes:</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  FNSKU
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Polybag
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Seam
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Warning
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Mfg Barcode
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Expiry
                </span>
              </div>

              {selectedEntity ? (
                <div className="mt-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                    <span>Selected Entity: {selectedEntity.type.toUpperCase()}</span>
                    <span className="font-mono text-sky-400">
                      Confidence: {(selectedEntity.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-zinc-400 grid grid-cols-2 gap-1">
                    <div>ymin: {selectedEntity.box.ymin}, xmin: {selectedEntity.box.xmin}</div>
                    <div>ymax: {selectedEntity.box.ymax}, xmax: {selectedEntity.box.xmax}</div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 italic">
                  Tip: Click on any bounding box above to inspect perception metadata.
                </p>
              )}
            </div>
          </div>

          {/* Quick Perception Signals Summary */}
          {reviewResult?.evidence && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs space-y-2">
              <h4 className="font-semibold text-zinc-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Perception Signals & Spatial Reasoning</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block">FNSKU Surface:</span>
                  <span className={reviewResult.evidence.spatialGeometry.fnskuSurface === 'flat' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {reviewResult.evidence.spatialGeometry.fnskuSurface.toUpperCase()} ({reviewResult.evidence.spatialGeometry.fnskuCurvatureAngleDeg.toFixed(1)}°)
                  </span>
                </div>

                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block">Seam Crossing:</span>
                  <span className={reviewResult.evidence.spatialGeometry.intersectsSeam ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {reviewResult.evidence.spatialGeometry.intersectsSeam ? 'YES (COLLISION)' : 'NO (CLEAR)'}
                  </span>
                </div>

                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block">Barcode Coverage:</span>
                  <span className={
                    reviewResult.evidence.barcodeAnalysis.coverageStatus === 'FULLY_COVERED' ||
                    reviewResult.evidence.barcodeAnalysis.coverageStatus === 'NO_MFG_BARCODE_DETECTED'
                      ? 'text-emerald-400 font-bold'
                      : 'text-rose-400 font-bold'
                  }>
                    {reviewResult.evidence.barcodeAnalysis.coverageStatus}
                  </span>
                </div>

                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block">Laplacian Blur Score:</span>
                  <span className={reviewResult.evidence.quality.isBlurry ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {reviewResult.evidence.quality.sharpnessScore.toFixed(1)} {reviewResult.evidence.quality.isBlurry ? '(BLURRY)' : '(SHARP)'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Deterministic Rule Verdicts (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Overall PREP STATUS Banner (PRD §6) */}
          {reviewResult ? (
            <div
              className={`rounded-xl p-5 border shadow-md transition-all ${
                reviewResult.overallStatus === 'PASS'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                  : reviewResult.overallStatus === 'FAIL'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase tracking-wider font-mono font-semibold text-zinc-400">
                      Overall Assessment
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-700 text-zinc-300">
                      Rule Set v{reviewResult.ruleSetVersion}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 mt-1.5">
                    {reviewResult.overallStatus === 'PASS' && (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                    )}
                    {reviewResult.overallStatus === 'FAIL' && (
                      <XCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
                    )}
                    {reviewResult.overallStatus === 'UNCERTAIN' && (
                      <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
                    )}
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">
                        PREP STATUS: {reviewResult.overallStatus}
                      </h2>
                    </div>
                  </div>
                </div>

                {reviewResult.humanOverride && (
                  <div className="px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/50 text-[11px] text-indigo-300 text-right">
                    <span className="font-bold block">HUMAN OVERRIDE</span>
                    <span>By: {reviewResult.humanOverride.reviewerId}</span>
                  </div>
                )}
              </div>

              <p className="mt-3 text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/60 pt-3">
                {reviewResult.summary}
              </p>
            </div>
          ) : (
            <div className="rounded-xl p-8 border border-zinc-800 bg-zinc-900/50 text-center text-zinc-400">
              <Play className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium">No evaluation result generated yet.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Click "Run Sync Evaluation" or "Enqueue Celery Job" to test against the rule engine.
              </p>
            </div>
          )}

          {/* Per-Check Verdict List (PRD §4 & §6) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-200">
                Authoritative Visual Checks Breakdown ({reviewResult?.checks?.length || 0})
              </h3>
              <span className="text-xs text-zinc-400">
                PRD Rule: FAIL &gt; UNCERTAIN &gt; PASS
              </span>
            </div>

            {reviewResult?.checks?.map((check) => (
              <div
                key={check.checkId}
                className={`p-4 rounded-xl border transition-all ${
                  check.verdict === 'PASS'
                    ? 'bg-zinc-900/70 border-emerald-500/25 hover:border-emerald-500/40'
                    : check.verdict === 'FAIL'
                    ? 'bg-zinc-900/90 border-rose-500/35 hover:border-rose-500/50'
                    : 'bg-zinc-900/70 border-amber-500/30 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    {check.verdict === 'PASS' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : check.verdict === 'FAIL' ? (
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    )}

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-zinc-100">
                          {check.name}
                        </span>
                        {check.isNonVisualRequirement && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Non-Visual Spec
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Rule ID: {check.citedRuleId}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                      check.verdict === 'PASS'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : check.verdict === 'FAIL'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {check.verdict}
                  </span>
                </div>

                {/* Reason (when FAIL or UNCERTAIN) */}
                {check.reason && (
                  <div className="mt-2.5 pl-7 text-xs text-rose-300 font-medium">
                    <span className="text-zinc-400 font-normal">Reason: </span>
                    {check.reason}
                  </div>
                )}

                {/* Evidence citation */}
                <div className="mt-2 pl-7 text-xs text-zinc-400 font-mono">
                  <span className="text-zinc-400 font-normal">Visual Evidence: </span>
                  {check.evidenceSummary}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
