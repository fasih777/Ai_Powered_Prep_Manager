export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface BarcodeCoverageAssessment {
  coverageStatus: 'FULLY_COVERED' | 'PARTIALLY_EXPOSED' | 'UNCOVERED' | 'NO_MFG_BARCODE_DETECTED';
  coverageRatio: number;
  occlusionIoU: number;
  scannerCollisionRisk: 'NONE' | 'HIGH' | 'MEDIUM';
  diagnosticExplanation: string;
}

export class BarcodePerceptionEngine {
  /**
   * Calculates the coverage collision between manufacturer barcode and FNSKU sticker
   * using Intersection over Union (IoU) geometric analysis
   */
  static calculateCoverageCollision(
    mfgBox: BoundingBox,
    stickerBox: BoundingBox | undefined,
    mfgBarcode: string,
    fnsku: string
  ): BarcodeCoverageAssessment {
    if (!stickerBox) {
      return {
        coverageStatus: 'UNCOVERED',
        coverageRatio: 0,
        occlusionIoU: 0,
        scannerCollisionRisk: 'NONE',
        diagnosticExplanation: 'No FNSKU sticker present - manufacturer barcode is fully exposed.'
      };
    }

    // Calculate intersection
    const xOverlap = Math.max(0, Math.min(mfgBox.xmax, stickerBox.xmax) - Math.max(mfgBox.xmin, stickerBox.xmin));
    const yOverlap = Math.max(0, Math.min(mfgBox.ymax, stickerBox.ymax) - Math.max(mfgBox.ymin, stickerBox.ymin));
    const intersectionArea = xOverlap * yOverlap;

    // Calculate union
    const mfgArea = (mfgBox.xmax - mfgBox.xmin) * (mfgBox.ymax - mfgBox.ymin);
    const stickerArea = (stickerBox.xmax - stickerBox.xmin) * (stickerBox.ymax - stickerBox.ymin);
    const unionArea = mfgArea + stickerArea - intersectionArea;

    // Calculate IoU
    const iou = unionArea > 0 ? intersectionArea / unionArea : 0;

    // Calculate coverage ratio (how much of mfg barcode is covered)
    const coverageRatio = mfgArea > 0 ? intersectionArea / mfgArea : 0;

    // Determine coverage status
    const coverageStatus = coverageRatio >= 0.95 ? 'FULLY_COVERED' : 
                          coverageRatio >= 0.5 ? 'PARTIALLY_EXPOSED' : 'UNCOVERED';

    // Determine scanner collision risk
    const scannerCollisionRisk = coverageRatio >= 0.95 ? 'HIGH' : 
                                 coverageRatio >= 0.5 ? 'MEDIUM' : 'NONE';

    const diagnosticExplanation = this.generateDiagnosticExplanation(
      coverageRatio,
      iou,
      mfgBarcode,
      fnsku,
      coverageStatus
    );

    return {
      coverageStatus,
      coverageRatio,
      occlusionIoU: iou,
      scannerCollisionRisk,
      diagnosticExplanation
    };
  }

  private static generateDiagnosticExplanation(
    coverageRatio: number,
    iou: number,
    mfgBarcode: string,
    fnsku: string,
    status: string
  ): string {
    const coveragePct = (coverageRatio * 100).toFixed(1);
    const iouPct = (iou * 100).toFixed(1);
    
    if (status === 'FULLY_COVERED') {
      return `Manufacturer barcode ${mfgBarcode} is ${coveragePct}% occluded by FNSKU ${fnsku}. IoU: ${iouPct}%. Dual-scanner collision risk is HIGH - laser scanners may read either code unpredictably. PASS: FNSKU fully covers original barcode.`;
    } else if (status === 'PARTIALLY_EXPOSED') {
      return `Manufacturer barcode ${mfgBarcode} is ${coveragePct}% occluded by FNSKU ${fnsku}. IoU: ${iouPct}%. Partial exposure creates MEDIUM collision risk - scanners may intermittently read both codes. FAIL: Incomplete coverage.`;
    } else {
      return `Manufacturer barcode ${mfgBarcode} is ${coveragePct}% occluded by FNSKU ${fnsku}. IoU: ${iouPct}%. Original barcode remains visible with NO collision risk. FAIL: Manufacturer barcode must be fully covered.`;
    }
  }

  /**
   * Generates a simulated 1D laser scanline waveform for visualization
   * Returns array of 80 luminance values (0-255)
   */
  static generateScanlineWaveform(isFullyCovered: boolean): number[] {
    const waveform: number[] = [];
    const length = 80;

    for (let i = 0; i < length; i++) {
      // Simulate barcode pattern with bars (dark) and spaces (light)
      if (isFullyCovered) {
        // FNSKU pattern - different spacing
        const isBar = i % 4 === 0 || i % 4 === 1;
        waveform.push(isBar ? 50 : 220);
      } else {
        // Mixed pattern - collision scenario
        const isBar = i % 3 === 0;
        waveform.push(isBar ? 80 : 200);
      }
    }

    return waveform;
  }
}
