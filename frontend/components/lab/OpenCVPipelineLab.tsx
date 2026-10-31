'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ZoomIn
} from 'lucide-react';
import {
  OpenCVPreprocessingPipeline,
  DEFAULT_PREPROCESS_PARAMS,
  PreprocessingParameters,
  PreprocessingPipelineResult
} from '@/lib/lab/cv/imagePreprocessing';
import { TestScenario } from '@/lib/lab/scenarios/testScenarios';

interface OpenCVPipelineLabProps {
  currentScenario: TestScenario;
}

export const OpenCVPipelineLab: React.FC<OpenCVPipelineLabProps> = ({ currentScenario }) => {
  const [params, setParams] = useState<PreprocessingParameters>(DEFAULT_PREPROCESS_PARAMS);
  const [activeStage, setActiveStage] = useState<number>(1);
  const [pipelineResult, setPipelineResult] = useState<PreprocessingPipelineResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Run the pipeline whenever parameters or scenario change
  useEffect(() => {
    runPipelineOnScenario();
  }, [currentScenario, params]);

  const runPipelineOnScenario = async () => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentScenario.imageUrl;

    img.onload = () => {
      const width = 360;
      const height = 360;
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);

      const pipeline = new OpenCVPreprocessingPipeline(params);
      const res = pipeline.processImageData(imgData.data, width, height);

      // Render the selected stage onto canvas
      renderStageToCanvas(imgData, res, activeStage, width, height);
      setPipelineResult(res);
      setIsProcessing(false);
    };
  };

  // Re-render canvas when stage changes
  useEffect(() => {
    if (!pipelineResult) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentScenario.imageUrl;
    img.onload = () => {
      const width = 360;
      const height = 360;
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      renderStageToCanvas(imgData, pipelineResult, activeStage, width, height);
    };
  }, [activeStage]);

  const renderStageToCanvas = (
    originalImageData: ImageData,
    result: PreprocessingPipelineResult,
    stage: number,
    w: number,
    h: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputImageData = ctx.createImageData(w, h);
    const outData = outputImageData.data;
    const srcData = originalImageData.data;

    if (stage === 1) {
      // Stage 1: Original Image
      ctx.putImageData(originalImageData, 0, 0);
      return;
    }

    if (stage === 2) {
      // Stage 2: Grayscale + Contrast Stretch (enhancedGray)
      for (let i = 0; i < w * h; i++) {
        const val = result.enhancedGray[i];
        outData[i * 4] = val;
        outData[i * 4 + 1] = val;
        outData[i * 4 + 2] = val;
        outData[i * 4 + 3] = 255;
      }
      ctx.putImageData(outputImageData, 0, 0);
      return;
    }

    if (stage === 3) {
      // Stage 3: Laplacian Blur Heatmap
      const gray = result.enhancedGray;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const val = Math.abs(
            gray[(y - 1) * w + x] +
            gray[(y + 1) * w + x] +
            gray[y * w + (x - 1)] +
            gray[y * w + (x + 1)] -
            4 * gray[idx]
          );
          outData[idx * 4] = Math.min(255, val * 3);
          outData[idx * 4 + 1] = Math.min(255, val * 4);
          outData[idx * 4 + 2] = Math.min(255, 120 + val * 2);
          outData[idx * 4 + 3] = 255;
        }
      }
      ctx.putImageData(outputImageData, 0, 0);
      return;
    }

    if (stage === 4) {
      // Stage 4: Adaptive Gaussian Threshold & Morphological Close
      for (let i = 0; i < w * h; i++) {
        const val = result.binarizedMap[i];
        outData[i * 4] = val;
        outData[i * 4 + 1] = val;
        outData[i * 4 + 2] = val;
        outData[i * 4 + 3] = 255;
      }
      ctx.putImageData(outputImageData, 0, 0);
      return;
    }

    if (stage === 5) {
      // Stage 5: Canny / Sobel Edges & Seams
      for (let i = 0; i < w * h; i++) {
        const isEdge = result.edgeMap[i] > 0;
        outData[i * 4] = isEdge ? 56 : 9;       // #38bdf8 cyan edge on dark background
        outData[i * 4 + 1] = isEdge ? 189 : 9;
        outData[i * 4 + 2] = isEdge ? 248 : 11;
        outData[i * 4 + 3] = 255;
      }
      ctx.putImageData(outputImageData, 0, 0);

      // Overlay detected horizontal seam candidates
      result.seamCandidates.forEach((seam) => {
        ctx.strokeStyle = '#06b6d4';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(seam.xStart, seam.y);
        ctx.lineTo(seam.xEnd, seam.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      return;
    }

    if (stage === 6) {
      // Stage 6: Candidate Region Proposals (ROIs)
      ctx.putImageData(originalImageData, 0, 0);
      // Draw proposal boxes
      result.candidateRegions.forEach((reg, i) => {
        ctx.strokeStyle =
          reg.typeHint === 'barcode_candidate'
            ? '#a855f7'
            : reg.typeHint === 'seam_candidate'
            ? '#06b6d4'
            : '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(reg.x, reg.y, reg.width, reg.height);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(reg.x, Math.max(0, reg.y - 18), 120, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`ROI #${i + 1}: ${reg.typeHint.split('_')[0]}`, reg.x + 3, Math.max(12, reg.y - 6));
      });
      return;
    }
  };

  const stages = [
    { id: 1, name: '1. Optical Capture', desc: 'Raw packaging frame' },
    { id: 2, name: '2. Grayscale & CLAHE', desc: 'Luma & contrast stretch' },
    { id: 3, name: '3. Laplacian Blur Heatmap', desc: 'Sharpness gate variance' },
    { id: 4, name: '4. Adaptive Threshold', desc: 'Binarized barcode strips' },
    { id: 5, name: '5. Canny Edges & Seams', desc: 'Edge contour tracing' },
    { id: 6, name: '6. Region Proposals (ROIs)', desc: 'Bounding box proposals' }
  ];

  return (
    <div className="space-y-6">
      {/* Title & Stage Navigator */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">
                OpenCV Image Preprocessing Pipeline Lab
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold">
                Pure C++ / Algorithmic Port
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Visualizes step-by-step OpenCV computer vision algorithms: Laplacian sharpness quality gates, adaptive local binarization, morphological closing, and seam contour proposals.
            </p>
          </div>

          <button
            onClick={() => setParams(DEFAULT_PREPROCESS_PARAMS)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700 transition-colors self-start md:self-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default Parameters</span>
          </button>
        </div>

        {/* 6 Stage Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5">
          {stages.map((stg) => (
            <button
              key={stg.id}
              onClick={() => setActiveStage(stg.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                activeStage === stg.id
                  ? 'bg-sky-500/15 border-sky-500/50 text-white ring-1 ring-sky-500/30'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="text-xs font-bold truncate">{stg.name}</div>
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">{stg.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Pipeline Canvas View & Parameter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Canvas View & Stage Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <span className="text-xs font-semibold text-zinc-200">
                Pipeline Stage Output: {stages.find(s => s.id === activeStage)?.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Processing Latency: {pipelineResult?.executionTimeMs.toFixed(1) || '0.0'}ms
              </span>
            </div>

            <div className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center p-4">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full rounded-lg shadow-md border border-zinc-800"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center text-xs text-sky-400">
                  Processing pipeline filters...
                </div>
              )}
            </div>

            {/* Diagnostic Metrics Strip */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 grid grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase font-mono">
                  Laplacian Sharpness Variance
                </span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className="text-base font-black font-mono text-zinc-100">
                    {pipelineResult?.sharpnessScore.toFixed(1) || '--'}
                  </span>
                  {pipelineResult && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        pipelineResult.isBlurry
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {pipelineResult.isBlurry ? 'BLURRY (FAIL)' : 'SHARP (PASS)'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase font-mono">
                  Mean Luminance
                </span>
                <span className="text-base font-black font-mono text-zinc-100 block mt-1">
                  {pipelineResult?.meanLuminance.toFixed(1) || '--'}{' '}
                  <span className="text-xs font-normal text-zinc-400">({pipelineResult?.exposureQuality || 'good'})</span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase font-mono">
                  Candidate ROIs
                </span>
                <span className="text-base font-black font-mono text-sky-400 block mt-1">
                  {pipelineResult?.candidateRegions.length || 0} Proposals
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Algorithmic Tuning Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-zinc-100">
                Pipeline Filter Parameters
              </h3>
            </div>

            {/* Slider 1: Laplacian Blur Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Laplacian Blur Threshold (cv::Laplacian)</span>
                <span className="text-sky-400 font-bold">{params.laplacianBlurThreshold}</span>
              </div>
              <input
                type="range"
                min="20"
                max="250"
                step="5"
                value={params.laplacianBlurThreshold}
                onChange={(e) =>
                  setParams({ ...params, laplacianBlurThreshold: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-zinc-400">
                Below this variance value, images are rejected as blurry, forcing UNCERTAIN.
              </p>
            </div>

            {/* Slider 2: Adaptive Threshold Window */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Adaptive Block Size (cv::adaptiveThreshold)</span>
                <span className="text-sky-400 font-bold">{params.adaptiveBlockSize} px</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="2"
                value={params.adaptiveBlockSize}
                onChange={(e) =>
                  setParams({ ...params, adaptiveBlockSize: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-zinc-400">
                Local neighborhood window size for compensating non-uniform warehouse glare.
              </p>
            </div>

            {/* Slider 3: Morphological Kernel */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Morphological Kernel Size (cv::morphologyEx)</span>
                <span className="text-sky-400 font-bold">{params.morphKernelSize}x{params.morphKernelSize}</span>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                step="2"
                value={params.morphKernelSize}
                onChange={(e) =>
                  setParams({ ...params, morphKernelSize: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-zinc-400">
                Kernel for morphological closing: fuses vertical barcode lines into solid proposal bounding boxes.
              </p>
            </div>

            {/* Slider 4: Canny Hysteresis High */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Canny High Threshold (cv::Canny)</span>
                <span className="text-sky-400 font-bold">{params.cannyHighThreshold}</span>
              </div>
              <input
                type="range"
                min="80"
                max="220"
                step="5"
                value={params.cannyHighThreshold}
                onChange={(e) =>
                  setParams({ ...params, cannyHighThreshold: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-zinc-400">
                Gradient magnitude limit for bag heat-seal seam and edge detection.
              </p>
            </div>

            {/* Checkbox: Contrast Normalization */}
            <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800">
              <input
                type="checkbox"
                id="clahe_toggle"
                checked={params.contrastEnhancement}
                onChange={(e) =>
                  setParams({ ...params, contrastEnhancement: e.target.checked })
                }
                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="clahe_toggle" className="text-xs text-zinc-300 font-medium">
                Enable 2% Cumulative Histogram Equalization (CLAHE)
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
