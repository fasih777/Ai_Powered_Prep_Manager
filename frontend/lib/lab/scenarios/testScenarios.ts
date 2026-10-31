/**
 * GATED LAB SCENARIO FIXTURES
 * Invariant I3: Production builds MUST NOT bundle scenario fixtures outside /lab.
 */

import type { PrepEvidenceBundle } from '../rules/ruleEngine';

export interface TestScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  expectedOverallStatus: 'PASS' | 'FAIL' | 'UNCERTAIN';
  imageUrl: string;
  evidence: PrepEvidenceBundle;
}

function scenarioImage(id: string, name: string): string {
  const hue = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720"><rect width="720" height="720" fill="#18181b"/><rect x="90" y="80" width="540" height="560" rx="24" fill="#3f3f46" stroke="hsl(${hue} 85% 55%)" stroke-width="6"/><rect x="220" y="280" width="280" height="120" rx="8" fill="#e4e4e7"/><text x="360" y="350" text-anchor="middle" fill="#18181b" font-size="24" font-family="sans-serif">${name}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function baseEvidence(): PrepEvidenceBundle {
  return {
    imageId: 'sample-front',
    quality: { sharpnessScore: 184, isBlurry: false, exposureQuality: 'good', resolutionSufficient: true },
    detections: [
      { id: 'polybag-1', type: 'polybag', box: { ymin: 70, xmin: 70, ymax: 930, xmax: 930 }, confidence: 0.96 },
      { id: 'fnsku-1', type: 'fnsku', box: { ymin: 400, xmin: 560, ymax: 650, xmax: 820 }, confidence: 0.94 },
      { id: 'warning-1', type: 'suffocation_warning', box: { ymin: 220, xmin: 300, ymax: 420, xmax: 520 }, confidence: 0.94, ocrText: 'WARNING KEEP AWAY FROM CHILDREN' },
      { id: 'expiry-1', type: 'expiry_date', box: { ymin: 560, xmin: 120, ymax: 710, xmax: 300 }, confidence: 0.9, ocrText: 'EXP 2027-12-31' },
      { id: 'handling-1', type: 'handling_mark', box: { ymin: 140, xmin: 760, ymax: 300, xmax: 900 }, confidence: 0.9, label: 'HANDLE WITH CARE' },
    ],
    barcodeAnalysis: { fnskuFound: true, fnskuValue: 'X00SAMPLE', mfgBarcodeFound: true, mfgBarcodeValue: '012345678901', coverageStatus: 'FULLY_COVERED', coverageRatio: 1, occlusionIoU: 0.92 },
    ocrResults: { suffocationWarningText: 'WARNING KEEP AWAY FROM CHILDREN', suffocationKeywordsDetected: ['warning', 'children'], isSuffocationLegible: true, expiryDateString: '2027-12-31', expiryFound: true, expiryUncovered: true, handlingMarkKeywords: ['handle with care'] },
    spatialGeometry: { fnskuSurface: 'flat', fnskuCurvatureAngleDeg: 1.2, distanceToNearestSeamPx: 42, intersectsSeam: false, polybagSealed: true, sealType: 'heat_seal' },
  };
}

function scenario(id: string, name: string, description: string, expectedOverallStatus: TestScenario['expectedOverallStatus'], mutate?: (evidence: PrepEvidenceBundle) => void): TestScenario {
  const evidence = baseEvidence();
  mutate?.(evidence);
  return { id, name, category: 'electronics_small', description, expectedOverallStatus, imageUrl: scenarioImage(id, name), evidence };
}

export const PRELOADED_SCENARIOS: TestScenario[] = [
  scenario('fully-correct', 'Fully correct preparation', 'All required visual preparation checks pass.', 'PASS'),
  scenario('missing-warning', 'Missing warning', 'The suffocation warning is absent.', 'FAIL', (e) => { e.detections = e.detections.filter((item) => item.type !== 'suffocation_warning'); e.ocrResults.suffocationKeywordsDetected = []; }),
  scenario('obscured-warning', 'Obscured warning', 'Warning text is present but not reliably legible.', 'UNCERTAIN', (e) => { e.ocrResults.isSuffocationLegible = false; }),
  scenario('incorrect-fnsku', 'Incorrect FNSKU placement', 'FNSKU is not on a valid package surface.', 'FAIL', (e) => { e.spatialGeometry.fnskuSurface = 'curved_edge'; }),
  scenario('fnsku-seam', 'FNSKU on a seam', 'FNSKU crosses a package seam.', 'FAIL', (e) => { e.spatialGeometry.fnskuSurface = 'seam'; e.spatialGeometry.intersectsSeam = true; }),
  scenario('visible-manufacturer-barcode', 'Original barcode visible', 'The original manufacturer barcode remains visible.', 'FAIL', (e) => { e.barcodeAnalysis.coverageStatus = 'UNCOVERED'; e.barcodeAnalysis.coverageRatio = 0; }),
  scenario('covered-expiry', 'Covered expiry date', 'The expiry date cannot be read.', 'FAIL', (e) => { e.ocrResults.expiryUncovered = false; }),
  scenario('missing-handling-mark', 'Missing handling mark', 'A required handling mark is absent.', 'UNCERTAIN', (e) => { e.ocrResults.handlingMarkKeywords = []; }),
  scenario('ambiguous-angle', 'Ambiguous preparation', 'The supplied angle does not support a conclusive result.', 'UNCERTAIN', (e) => { e.quality.isBlurry = true; e.quality.resolutionSufficient = false; }),
  scenario('unsealed-polybag', 'Unsealed polybag', 'The polybag opening is not sealed.', 'FAIL', (e) => { e.spatialGeometry.polybagSealed = false; e.spatialGeometry.sealType = 'unsealed_open'; }),
];
