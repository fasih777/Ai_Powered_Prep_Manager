import React, { useState } from 'react';
import {
  Barcode,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Sliders,
  Scan,
  Activity,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { BarcodePerceptionEngine, BarcodeCoverageAssessment } from '../lib/barcode/barcodeEngine';
import { PRELOADED_SCENARIOS, TestScenario } from '../lib/scenarios/testScenarios';

interface BarcodeCoverageEngineProps {
  currentScenario?: TestScenario;
}

export const BarcodeCoverageEngine: React.FC<BarcodeCoverageEngineProps> = ({ currentScenario }) => {
  const [activeScenario, setActiveScenario] = useState<TestScenario>(
    currentScenario || PRELOADED_SCENARIOS[0]
  );
  const [activeMode, setActiveMode] = useState<'simulation' | 'scenario'>('scenario');

  // Synchronize when currentScenario changes from parent
  React.useEffect(() => {
    if (currentScenario) {
      setActiveScenario(currentScenario);
    }
  }, [currentScenario]);

  // Interactive Simulation Controls
  const [stickerOffsetX, setStickerOffsetX] = useState<number>(0);
  const [stickerOffsetY, setStickerOffsetY] = useState<number>(0);
  const [stickerPresent, setStickerPresent] = useState<boolean>(true);

  // Scenario Barcode Data
  const scenarioBarcode = activeScenario?.evidence?.barcodeAnalysis;
  const isScenarioCovered = scenarioBarcode?.coverageStatus === 'FULLY_COVERED' || scenarioBarcode?.coverageStatus === 'NO_MFG_BARCODE_DETECTED';

  // Simulation Bounding Boxes
  const mfgBox = { ymin: 200, xmin: 200, ymax: 320, xmax: 440 };
  const stickerBox = stickerPresent
    ? {
        ymin: 200 + stickerOffsetY,
        xmin: 200 + stickerOffsetX,
        ymax: 320 + stickerOffsetY,
        xmax: 440 + stickerOffsetX
      }
    : undefined;

  const simAssessment: BarcodeCoverageAssessment = BarcodePerceptionEngine.calculateCoverageCollision(
    mfgBox,
    stickerBox,
    'UPC-A 793573194012',
    'X003A4V9L1'
  );

  const scenarioAssessment: BarcodeCoverageAssessment = {
    coverageStatus: scenarioBarcode?.coverageStatus || 'FULLY_COVERED',
    coverageRatio: scenarioBarcode?.coverageRatio ?? (isScenarioCovered ? 1.0 : 0.0),
    occlusionIoU: scenarioBarcode?.occlusionIoU ?? (isScenarioCovered ? 0.92 : 0.0),
    scannerCollisionRisk: isScenarioCovered ? 'NONE' : 'HIGH',
    diagnosticExplanation: isScenarioCovered
      ? `Original manufacturer barcode (${scenarioBarcode?.mfgBarcodeValue || '012345678901'}) is completely masked by opaque FNSKU overlay (${scenarioBarcode?.fnskuValue || 'X003A4V9L1'}).`
      : `Original manufacturer barcode (${scenarioBarcode?.mfgBarcodeValue || '012345678901'}) is exposed and unmasked! Laser scan will trigger dual-reflection collisions.`
  };

  const assessment = activeMode === 'scenario' ? scenarioAssessment : simAssessment;

  const waveform = BarcodePerceptionEngine.generateScanlineWaveform(
    assessment.coverageStatus === 'FULLY_COVERED' || assessment.coverageStatus === 'NO_MFG_BARCODE_DETECTED'
  );

  return (
    <div className="space-y-6">
      {/* Title Header with Mode Switcher */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Barcode className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white">
                pyzbar / zxing-cpp Barcode Decoding & Coverage Collision Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold">
                PRD Check #6 & #7
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Detects original manufacturer barcodes (UPC-A, EAN-13), verifies FNSKU Code-128 quiet zones, and calculates geometric occlusion IoU to prevent simultaneous laser scanner mis-reads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {activeMode === 'scenario' && (
              <select
                value={activeScenario.id}
                onChange={(e) => {
                  const sc = PRELOADED_SCENARIOS.find(s => s.id === e.target.value);
                  if (sc) setActiveScenario(sc);
                }}
                className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
              >
                {PRELOADED_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setActiveMode('scenario')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeMode === 'scenario'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Input Image Mode</span>
              </button>
              <button
                onClick={() => setActiveMode('simulation')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeMode === 'simulation'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Interactive Calibrator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Simulation Canvas vs Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Barcode Collision Canvas (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <span className="text-xs font-semibold text-zinc-200">
                {activeMode === 'scenario' ? `Scenario Surface: ${activeScenario.name}` : 'Spatial Overlap & Occlusion Viewport'}
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  assessment.coverageStatus === 'FULLY_COVERED' || assessment.coverageStatus === 'NO_MFG_BARCODE_DETECTED'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}
              >
                STATUS: {assessment.coverageStatus}
              </span>
            </div>

            {/* Packaging Surface View */}
            <div className="relative h-72 w-full bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-800 p-4">
              {activeMode === 'scenario' && activeScenario?.imageUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={activeScenario.imageUrl}
                    alt={activeScenario.name}
                    className="max-h-full max-w-full object-contain rounded-md select-none"
                  />
                  {/* Visual Barcode Overlays */}
                  <div
                    style={{ top: '35%', left: '30%', width: '40%', height: '22%' }}
                    className="absolute border-2 border-purple-400 bg-purple-500/15 rounded flex items-center justify-between p-1.5"
                  >
                    <span className="text-[9px] font-mono text-purple-300 font-bold bg-zinc-950/80 px-1 py-0.5 rounded border border-purple-400/40">
                      FNSKU: {scenarioBarcode?.fnskuValue || 'X003A4V9L1'}
                    </span>
                    <span className="text-[8px] font-mono text-purple-200 bg-purple-900/60 px-1 py-0.5 rounded">
                      Code-128
                    </span>
                  </div>

                  {!isScenarioCovered && (
                    <div
                      style={{ bottom: '10%', right: '12%', width: '38%', height: '22%' }}
                      className="absolute border-2 border-rose-500 bg-rose-500/20 rounded flex items-center justify-between p-1.5 animate-pulse"
                    >
                      <span className="text-[9px] font-mono text-rose-300 font-bold bg-zinc-950/80 px-1 py-0.5 rounded border border-rose-500/40">
                        ORIGINAL UPC: {scenarioBarcode?.mfgBarcodeValue || '793573194012'}
                      </span>
                      <span className="text-[8px] font-mono text-rose-200 bg-rose-900/60 px-1 py-0.5 rounded">
                        EXPOSED!
                      </span>
                    </div>
                  )}

                  {/* Dynamic Telemetry Badge */}
                  <div className="absolute top-2 left-2 bg-zinc-900/90 border border-zinc-700 rounded px-2.5 py-1.5 text-[10px] font-mono text-zinc-300 space-y-0.5 shadow-lg">
                    <div>FNSKU: <span className="text-purple-300 font-semibold">{scenarioBarcode?.fnskuValue || 'X003A4V9L1'}</span></div>
                    <div className={isScenarioCovered ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                      Original UPC: {scenarioBarcode?.mfgBarcodeValue || (isScenarioCovered ? 'Covered (012345678901)' : 'EXPOSED')}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Product Background */}
                  <div className="absolute inset-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-center">
                    <span className="text-xs text-zinc-700 font-mono">PRODUCT EXTERIOR CARDBOARD SURFACE</span>
                  </div>

                  {/* Manufacturer Barcode (Original UPC-A) */}
                  <div
                    style={{ width: '200px', height: '100px' }}
                    className="absolute border-2 border-rose-500 bg-white rounded p-2 flex flex-col justify-between shadow-lg"
                  >
                    <div className="flex justify-between text-[9px] font-mono text-zinc-900 font-bold">
                      <span>ORIGINAL UPC-A</span>
                      <span>793573194012</span>
                    </div>
                    <div className="h-10 w-full flex items-center justify-between px-1 overflow-hidden">
                      {Array.from({ length: 38 }).map((_, i) => (
                        <div
                          key={i}
                          style={{ width: (i % 3 === 0 ? '3px' : '1.5px'), height: '100%' }}
                          className="bg-black"
                        />
                      ))}
                    </div>
                    <div className="text-center text-[8px] font-mono text-zinc-600">
                      7 93573 19401 2
                    </div>
                  </div>

                  {/* Prep Sticker (FNSKU or Opaque Blank Cover) */}
                  {stickerPresent && (
                    <div
                      style={{
                        width: '200px',
                        height: '100px',
                        transform: `translate(${stickerOffsetX}px, ${stickerOffsetY}px)`
                      }}
                      className="absolute border-2 border-purple-500 bg-zinc-100 rounded p-2 flex flex-col justify-between shadow-2xl opacity-90 transition-transform duration-75"
                    >
                      <div className="flex justify-between text-[9px] font-mono text-purple-900 font-bold">
                        <span>FNSKU CODE-128</span>
                        <span>X003A4V9L1</span>
                      </div>
                      <div className="h-10 w-full flex items-center justify-between px-1 overflow-hidden">
                        {Array.from({ length: 34 }).map((_, i) => (
                          <div
                            key={i}
                            style={{ width: (i % 2 === 0 ? '2.5px' : '1px'), height: '100%' }}
                            className="bg-purple-950"
                          />
                        ))}
                      </div>
                      <div className="text-center text-[8px] font-mono text-purple-900">
                        X003A4V9L1
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Slider Controls for Manual Alignment Testing */}
            {activeMode === 'simulation' && (
              <div className="p-4 bg-zinc-950 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300">
                    Interactive Sticker Offset Simulation
                  </span>
                  <button
                    onClick={() => {
                      setStickerOffsetX(0);
                      setStickerOffsetY(0);
                      setStickerPresent(true);
                    }}
                    className="text-[10px] text-sky-400 hover:underline font-mono"
                  >
                    Center Alignment (100% Covered)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">Horizontal Offset (ΔX):</span>
                      <span className="text-sky-400">{stickerOffsetX} px</span>
                    </div>
                    <input
                      type="range"
                      min="-160"
                      max="160"
                      value={stickerOffsetX}
                      onChange={(e) => setStickerOffsetX(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-sky-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">Vertical Offset (ΔY):</span>
                      <span className="text-sky-400">{stickerOffsetY} px</span>
                    </div>
                    <input
                      type="range"
                      min="-70"
                      max="70"
                      value={stickerOffsetY}
                      onChange={(e) => setStickerOffsetY(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-sky-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mathematical Collision Metrics & Scanline Waveform (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Barcode Collision Assessment</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block uppercase">Coverage Ratio</span>
                <span
                  className={`text-xl font-black mt-0.5 block ${
                    assessment.coverageRatio >= 0.95 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {(assessment.coverageRatio * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Threshold: &gt;= 95%</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block uppercase">Occlusion IoU</span>
                <span className="text-xl font-black text-sky-400 mt-0.5 block">
                  {assessment.occlusionIoU.toFixed(3)}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Intersection / Union</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block uppercase">Dual-Scanner Risk</span>
                <span
                  className={`text-base font-bold mt-0.5 block ${
                    assessment.scannerCollisionRisk === 'NONE'
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {assessment.scannerCollisionRisk}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block uppercase">Rule #6 Verdict</span>
                <span
                  className={`text-base font-bold mt-0.5 block ${
                    assessment.coverageStatus === 'FULLY_COVERED' || assessment.coverageStatus === 'NO_MFG_BARCODE_DETECTED'
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {assessment.coverageStatus === 'FULLY_COVERED' || assessment.coverageStatus === 'NO_MFG_BARCODE_DETECTED' ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
              <span className="text-zinc-400 text-[10px] font-mono uppercase block mb-1">
                Diagnostic Explanation
              </span>
              <p className="text-zinc-300 text-xs leading-relaxed">
                {assessment.diagnosticExplanation}
              </p>
            </div>

            {/* Laser Waveform Visualization */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400 text-[11px]">1D Laser Reflection Waveform</span>
                <span className="text-sky-400 text-[11px]">
                  {assessment.coverageStatus === 'FULLY_COVERED' ? 'Single FNSKU Signal' : 'Colliding Dual Reflections'}
                </span>
              </div>
              <div className="h-16 w-full bg-zinc-950 rounded border border-zinc-800 flex items-end px-2 py-1 gap-1 overflow-hidden">
                {waveform.map((val, i) => (
                  <div
                    key={i}
                    style={{ height: `${(val / 255) * 100}%` }}
                    className={`flex-1 rounded-t-sm transition-all duration-150 ${
                      assessment.scannerCollisionRisk === 'HIGH' && val < 100 ? 'bg-rose-500' : 'bg-sky-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
