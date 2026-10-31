export interface PreprocessingParameters {
  laplacianBlurThreshold: number;
  adaptiveBlockSize: number;
  morphKernelSize: number;
  cannyHighThreshold: number;
  contrastEnhancement: boolean;
}

export interface CandidateRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  typeHint: 'barcode_candidate' | 'text_candidate' | 'seam_candidate';
  confidence: number;
}

export interface SeamCandidate {
  y: number;
  xStart: number;
  xEnd: number;
  edgeDensity: number;
}

export interface PreprocessingPipelineResult {
  sharpnessScore: number;
  isBlurry: boolean;
  meanLuminance: number;
  exposureQuality: 'good' | 'underexposed' | 'overexposed';
  candidateRegions: CandidateRegion[];
  seamCandidates: SeamCandidate[];
  edgeMap: Uint8ClampedArray;
  binarizedMap: Uint8ClampedArray;
  enhancedGray: Uint8ClampedArray;
  executionTimeMs: number;
}

export const DEFAULT_PREPROCESS_PARAMS: PreprocessingParameters = {
  laplacianBlurThreshold: 100,
  adaptiveBlockSize: 15,
  morphKernelSize: 5,
  cannyHighThreshold: 150,
  contrastEnhancement: true,
};

export class OpenCVPreprocessingPipeline {
  private params: PreprocessingParameters;

  constructor(params: PreprocessingParameters = DEFAULT_PREPROCESS_PARAMS) {
    this.params = params;
  }

  processImageData(imageData: Uint8ClampedArray, width: number, height: number): PreprocessingPipelineResult {
    const startTime = performance.now();

    const gray = this.extractGrayscale(imageData);
    const meanLuminance = this.calculateMeanLuminance(gray);
    const exposureQuality = this.classifyExposure(meanLuminance);

    const enhancedGray = this.params.contrastEnhancement ? this.applyContrastStretch(gray) : gray.slice();

    const sharpnessScore = this.calculateLaplacianVariance(enhancedGray, width, height);
    const isBlurry = sharpnessScore < this.params.laplacianBlurThreshold;

    const edgeMap = this.computeEdgeMap(enhancedGray, width, height, this.params.cannyHighThreshold);

    const binaryThreshold = this.computeAdaptiveThreshold(enhancedGray, width, height, this.params.adaptiveBlockSize);
    const binarizedMap = this.morphologicalClose(binaryThreshold, width, height, this.params.morphKernelSize);

    const seamCandidates = this.detectSeamCandidates(edgeMap, width, height);
    const candidateRegions = this.extractCandidateRegions(binarizedMap, edgeMap, width, height, seamCandidates);

    const executionTimeMs = performance.now() - startTime;

    return {
      sharpnessScore,
      isBlurry,
      meanLuminance,
      exposureQuality,
      candidateRegions,
      seamCandidates,
      edgeMap,
      binarizedMap,
      enhancedGray: Uint8ClampedArray.from(enhancedGray),
      executionTimeMs,
    };
  }

  private extractGrayscale(imageData: Uint8ClampedArray): number[] {
    const gray: number[] = [];
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      gray.push(Math.round(0.299 * r + 0.587 * g + 0.114 * b));
    }
    return gray;
  }

  private calculateMeanLuminance(gray: number[]): number {
    if (gray.length === 0) return 0;
    let sum = 0;
    for (const v of gray) sum += v;
    return sum / gray.length;
  }

  private classifyExposure(meanLuminance: number): 'good' | 'underexposed' | 'overexposed' {
    if (meanLuminance < 50) return 'underexposed';
    if (meanLuminance > 200) return 'overexposed';
    return 'good';
  }

  private applyContrastStretch(gray: number[]): number[] {
    let min = 255;
    let max = 0;
    for (const v of gray) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = Math.max(1, max - min);
    return gray.map((v) => Math.round(((v - min) / range) * 255));
  }

  private calculateLaplacianVariance(gray: number[], width: number, height: number): number {
    let sum = 0;
    let sumSquared = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const laplacian = gray[idx - width] + gray[idx - 1] + gray[idx + 1] + gray[idx + width] - 4 * gray[idx];
        sum += laplacian;
        sumSquared += laplacian * laplacian;
        count++;
      }
    }

    if (count === 0) return 0;
    const mean = sum / count;
    return Math.max(0, sumSquared / count - mean * mean);
  }

  private computeEdgeMap(gray: number[], width: number, height: number, threshold: number): Uint8ClampedArray {
    const out = new Uint8ClampedArray(width * height);
    const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sx = 0;
        let sy = 0;
        let k = 0;
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            const val = gray[(y + j) * width + (x + i)];
            sx += val * gx[k];
            sy += val * gy[k];
            k++;
          }
        }
        const mag = Math.sqrt(sx * sx + sy * sy);
        out[y * width + x] = mag >= threshold ? 255 : 0;
      }
    }
    return out;
  }

  private computeAdaptiveThreshold(gray: number[], width: number, height: number, blockSize: number): Uint8ClampedArray {
    const radius = Math.max(1, Math.floor(blockSize / 2));
    const stride = width + 1;
    const integral = new Float64Array((width + 1) * (height + 1));

    for (let y = 0; y < height; y++) {
      let rowSum = 0;
      for (let x = 0; x < width; x++) {
        rowSum += gray[y * width + x];
        integral[(y + 1) * stride + (x + 1)] = integral[y * stride + (x + 1)] + rowSum;
      }
    }

    const boxSum = (x0: number, y0: number, x1: number, y1: number) => {
      const cx0 = Math.max(0, x0);
      const cy0 = Math.max(0, y0);
      const cx1 = Math.min(width - 1, x1);
      const cy1 = Math.min(height - 1, y1);
      const A = integral[cy0 * stride + cx0];
      const B = integral[cy0 * stride + (cx1 + 1)];
      const C = integral[(cy1 + 1) * stride + cx0];
      const D = integral[(cy1 + 1) * stride + (cx1 + 1)];
      return { sum: D - B - C + A, count: (cx1 - cx0 + 1) * (cy1 - cy0 + 1) };
    };

    const out = new Uint8ClampedArray(width * height);
    const C_CONST = 5;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const { sum, count } = boxSum(x - radius, y - radius, x + radius, y + radius);
        const localMean = sum / Math.max(1, count);
        out[y * width + x] = gray[y * width + x] < localMean - C_CONST ? 0 : 255;
      }
    }
    return out;
  }

  private morphologicalClose(binary: Uint8ClampedArray, width: number, height: number, kernelSize: number): Uint8ClampedArray {
    const dilated = this.separableMorph(binary, width, height, kernelSize, 'max');
    return this.separableMorph(dilated, width, height, kernelSize, 'min');
  }

  private separableMorph(
    src: Uint8ClampedArray,
    width: number,
    height: number,
    kernelSize: number,
    op: 'max' | 'min',
  ): Uint8ClampedArray {
    const radius = Math.max(1, Math.floor(kernelSize / 2));
    const temp = new Uint8ClampedArray(width * height);
    const out = new Uint8ClampedArray(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let best = op === 'max' ? 0 : 255;
        for (let k = -radius; k <= radius; k++) {
          const xx = Math.min(width - 1, Math.max(0, x + k));
          const v = src[y * width + xx];
          best = op === 'max' ? Math.max(best, v) : Math.min(best, v);
        }
        temp[y * width + x] = best;
      }
    }

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let best = op === 'max' ? 0 : 255;
        for (let k = -radius; k <= radius; k++) {
          const yy = Math.min(height - 1, Math.max(0, y + k));
          const v = temp[yy * width + x];
          best = op === 'max' ? Math.max(best, v) : Math.min(best, v);
        }
        out[y * width + x] = best;
      }
    }

    return out;
  }

  private detectSeamCandidates(edgeMap: Uint8ClampedArray, width: number, height: number): SeamCandidate[] {
    const densityThreshold = 0.3;
    const raw: SeamCandidate[] = [];

    for (let y = 0; y < height; y++) {
      let edgeCount = 0;
      let xStart = -1;
      let xEnd = -1;
      for (let x = 0; x < width; x++) {
        if (edgeMap[y * width + x] > 0) {
          edgeCount++;
          if (xStart === -1) xStart = x;
          xEnd = x;
        }
      }
      const density = edgeCount / width;
      if (density >= densityThreshold) {
        raw.push({ y, xStart, xEnd, edgeDensity: density });
      }
    }

    const merged: SeamCandidate[] = [];
    for (const seam of raw) {
      const last = merged[merged.length - 1];
      if (last && seam.y - last.y <= 2) {
        if (seam.edgeDensity > last.edgeDensity) merged[merged.length - 1] = seam;
      } else {
        merged.push(seam);
      }
    }
    return merged;
  }

  private extractCandidateRegions(
    closedMap: Uint8ClampedArray,
    edgeMap: Uint8ClampedArray,
    width: number,
    height: number,
    seamCandidates: SeamCandidate[],
  ): CandidateRegion[] {
    const visited = new Uint8Array(width * height);
    const regions: CandidateRegion[] = [];
    const minArea = Math.max(40, Math.floor(width * height * 0.003));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (visited[idx] || closedMap[idx] !== 0) continue;

        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let area = 0;
        const stack: number[] = [idx];
        visited[idx] = 1;

        while (stack.length) {
          const cur = stack.pop()!;
          const cy = Math.floor(cur / width);
          const cx = cur % width;
          area++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          const candidates: Array<[number, number]> = [
            [cx - 1, cy],
            [cx + 1, cy],
            [cx, cy - 1],
            [cx, cy + 1],
          ];
          for (const [nx, ny] of candidates) {
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const nIdx = ny * width + nx;
            if (!visited[nIdx] && closedMap[nIdx] === 0) {
              visited[nIdx] = 1;
              stack.push(nIdx);
            }
          }
        }

        if (area < minArea) continue;

        const boxWidth = maxX - minX + 1;
        const boxHeight = maxY - minY + 1;
        const fillRatio = area / (boxWidth * boxHeight);
        const aspect = boxWidth / boxHeight;

        let edgeSum = 0;
        for (let yy = minY; yy <= maxY; yy++) {
          for (let xx = minX; xx <= maxX; xx++) {
            if (edgeMap[yy * width + xx] > 0) edgeSum++;
          }
        }
        const edgeDensity = edgeSum / (boxWidth * boxHeight);

        const typeHint: CandidateRegion['typeHint'] = aspect >= 2.2 ? 'barcode_candidate' : 'text_candidate';
        const confidence = Math.min(0.98, 0.4 + fillRatio * 0.3 + edgeDensity * 0.3);

        regions.push({
          x: minX,
          y: minY,
          width: boxWidth,
          height: boxHeight,
          typeHint,
          confidence: Number(confidence.toFixed(2)),
        });
      }
    }

    for (const seam of seamCandidates) {
      regions.push({
        x: seam.xStart,
        y: Math.max(0, seam.y - 2),
        width: Math.max(1, seam.xEnd - seam.xStart),
        height: 4,
        typeHint: 'seam_candidate',
        confidence: Number(Math.min(0.99, seam.edgeDensity).toFixed(2)),
      });
    }

    regions.sort((a, b) => b.confidence - a.confidence);
    return regions.slice(0, 12);
  }
}
