export type Verdict = 'PASS' | 'FAIL' | 'UNCERTAIN';

export interface BoundingBox { ymin: number; xmin: number; ymax: number; xmax: number; }
export type EntityType = 'polybag' | 'fnsku' | 'mfg_barcode' | 'suffocation_warning' | 'expiry_date' | 'handling_mark' | 'seam' | 'bag_opening';
export interface DetectedEntity { id: string; type: EntityType; box: BoundingBox; confidence: number; label?: string; ocrText?: string; }

export interface PrepEvidenceBundle {
  imageId: string;
  quality: { sharpnessScore: number; isBlurry: boolean; exposureQuality: 'good' | 'underexposed' | 'overexposed'; resolutionSufficient: boolean };
  detections: DetectedEntity[];
  barcodeAnalysis: { fnskuFound: boolean; fnskuValue?: string; mfgBarcodeFound: boolean; mfgBarcodeValue?: string; coverageStatus: 'FULLY_COVERED' | 'PARTIALLY_EXPOSED' | 'UNCOVERED' | 'NO_MFG_BARCODE_DETECTED'; coverageRatio: number; occlusionIoU: number };
  ocrResults: { suffocationWarningText?: string; suffocationKeywordsDetected: string[]; isSuffocationLegible: boolean; expiryDateString?: string; expiryFound: boolean; expiryUncovered: boolean; handlingMarkKeywords: string[] };
  spatialGeometry: { fnskuSurface: 'flat' | 'seam' | 'curved_edge' | 'opening' | 'wrinkled' | 'unknown'; fnskuCurvatureAngleDeg: number; distanceToNearestSeamPx: number; intersectsSeam: boolean; polybagSealed: boolean; sealType?: 'heat_seal' | 'tamper_evident_tape' | 'unsealed_open' | 'zipper' | 'unknown' };
}

export interface PrepCheckResult { checkId: string; name: string; verdict: Verdict; reason?: string; evidenceSummary: string; citedRuleId: string; isNonVisualRequirement: boolean; }
export interface PrepReviewOutput { reviewId: string; scenarioId: string; category: string; ruleSetVersion: string; overallStatus: Verdict; summary: string; checks: PrepCheckResult[]; evidence: PrepEvidenceBundle; humanOverride?: { overriddenVerdict: Verdict; reviewerId: string; reason: string; timestamp: string; }; }

export const RULE_SET_VERSION = '2026.09.1';

const result = (checkId: string, name: string, verdict: Verdict, evidenceSummary: string, citedRuleId: string, reason?: string, isNonVisualRequirement = false): PrepCheckResult => ({ checkId, name, verdict, reason, evidenceSummary, citedRuleId, isNonVisualRequirement });

export function evaluatePrepReview(scenarioId: string, category: string, evidence: PrepEvidenceBundle): PrepReviewOutput {
  const polybag = evidence.detections.find((item) => item.type === 'polybag');
  const fnsku = evidence.detections.find((item) => item.type === 'fnsku');
  const warning = evidence.detections.find((item) => item.type === 'suffocation_warning');
  const checks: PrepCheckResult[] = [];
  const lowQuality = evidence.quality.isBlurry || !evidence.quality.resolutionSufficient;

  checks.push(lowQuality ? result('polybag_presence', 'Polybag Presence', 'UNCERTAIN', 'Image quality is insufficient to verify the polybag boundary.', 'SEC-01-POLYBAG.1') : polybag && polybag.confidence >= 0.75 ? result('polybag_presence', 'Polybag Presence', 'PASS', 'Polybag boundary detected.', 'SEC-01-POLYBAG.1') : result('polybag_presence', 'Polybag Presence', 'FAIL', 'No protective polybag boundary was detected.', 'SEC-01-POLYBAG.1'));
  checks.push(evidence.spatialGeometry.sealType === 'unsealed_open' ? result('polybag_sealing', 'Polybag Sealing & Closure', 'FAIL', 'Open polybag lip detected.', 'SEC-01-POLYBAG.Clause-1.2.1') : evidence.spatialGeometry.polybagSealed ? result('polybag_sealing', 'Polybag Sealing & Closure', 'PASS', 'Polybag closure detected.', 'SEC-01-POLYBAG.Clause-1.2.1') : result('polybag_sealing', 'Polybag Sealing & Closure', 'UNCERTAIN', 'The complete sealing line is not visible.', 'SEC-01-POLYBAG.Clause-1.2.1'));
  checks.push(!warning && evidence.ocrResults.suffocationKeywordsDetected.length < 2 ? result('suffocation_warning_presence', 'Suffocation Warning Presence', 'FAIL', 'No required suffocation warning was detected.', 'SEC-02-SUFFOCATION-WARNING.Clause-2.1.0') : result('suffocation_warning_presence', 'Suffocation Warning Presence', 'PASS', 'Warning label and safety wording detected.', 'SEC-02-SUFFOCATION-WARNING.Clause-2.1.0'));
  checks.push(!evidence.ocrResults.suffocationKeywordsDetected.length ? result('suffocation_warning_legibility', 'Suffocation Warning Legibility', 'FAIL', 'OCR found no warning text.', 'SEC-02-SUFFOCATION-WARNING.Clause-2.1.3') : !evidence.ocrResults.isSuffocationLegible ? result('suffocation_warning_legibility', 'Suffocation Warning Legibility', 'UNCERTAIN', 'Warning text is obscured or has insufficient contrast.', 'SEC-02-SUFFOCATION-WARNING.Clause-2.1.3') : result('suffocation_warning_legibility', 'Suffocation Warning Legibility', 'PASS', 'Warning text is legible.', 'SEC-02-SUFFOCATION-WARNING.Clause-2.1.3'));
  checks.push(!fnsku ? result('fnsku_placement', 'FNSKU Label Presence & Positioning', 'FAIL', 'No exterior FNSKU label was detected.', 'SEC-03-FNSKU-PLACEMENT.1') : fnsku.confidence < 0.8 ? result('fnsku_placement', 'FNSKU Label Presence & Positioning', 'UNCERTAIN', 'FNSKU detection confidence is below threshold.', 'SEC-03-FNSKU-PLACEMENT.1') : result('fnsku_placement', 'FNSKU Label Presence & Positioning', 'PASS', 'FNSKU label detected on package exterior.', 'SEC-03-FNSKU-PLACEMENT.1'));
  const surface = evidence.spatialGeometry.fnskuSurface;
  checks.push(['seam', 'curved_edge', 'opening'].includes(surface) ? result('fnsku_surface', 'FNSKU Appropriate Surface', 'FAIL', `FNSKU crosses an invalid ${surface.replace('_', ' ')} surface.`, 'SEC-03-FNSKU-SURFACE.1') : surface === 'flat' ? result('fnsku_surface', 'FNSKU Appropriate Surface', 'PASS', 'FNSKU is placed on a flat surface.', 'SEC-03-FNSKU-SURFACE.1') : result('fnsku_surface', 'FNSKU Appropriate Surface', 'UNCERTAIN', 'The FNSKU surface cannot be classified.', 'SEC-03-FNSKU-SURFACE.1'));
  const coverage = evidence.barcodeAnalysis.coverageStatus;
  checks.push(coverage === 'FULLY_COVERED' ? result('manufacturer_barcode_covered', 'Original Manufacturer Barcode Covered', 'PASS', 'Manufacturer barcode is fully covered.', 'SEC-04-MFG-BARCODE.1') : coverage === 'UNCOVERED' ? result('manufacturer_barcode_covered', 'Original Manufacturer Barcode Covered', 'FAIL', 'Manufacturer barcode remains visible.', 'SEC-04-MFG-BARCODE.1') : result('manufacturer_barcode_covered', 'Original Manufacturer Barcode Covered', 'UNCERTAIN', 'Barcode coverage cannot be conclusively verified.', 'SEC-04-MFG-BARCODE.1'));
  checks.push(!evidence.ocrResults.expiryFound ? result('expiry_date_visibility', 'Expiry-Date Visibility', 'UNCERTAIN', 'No expiry-date region was identified.', 'SEC-05-EXPIRY-DATE.1') : evidence.ocrResults.expiryUncovered ? result('expiry_date_visibility', 'Expiry-Date Visibility', 'PASS', `Expiry date detected: ${evidence.ocrResults.expiryDateString ?? 'visible'}.`, 'SEC-05-EXPIRY-DATE.1') : result('expiry_date_visibility', 'Expiry-Date Visibility', 'FAIL', 'Expiry date is covered or not readable.', 'SEC-05-EXPIRY-DATE.1'));
  checks.push(evidence.ocrResults.handlingMarkKeywords.length ? result('handling_marks', 'Required Handling Marks', 'PASS', 'Required handling mark detected.', 'SEC-06-HANDLING-MARKS.1') : result('handling_marks', 'Required Handling Marks', 'UNCERTAIN', 'No applicable handling mark was detected.', 'SEC-06-HANDLING-MARKS.1'));
  checks.push(result('bag_material_thickness', 'Polybag Material Thickness', 'UNCERTAIN', 'Not verifiable from image evidence.', 'SEC-07-NON-VISUAL.1', 'Physical material thickness requires a non-visual measurement.', true));

  const visualChecks = checks.filter((item) => !item.isNonVisualRequirement);
  const overallStatus: Verdict = visualChecks.some((item) => item.verdict === 'FAIL') ? 'FAIL' : visualChecks.some((item) => item.verdict === 'UNCERTAIN') ? 'UNCERTAIN' : 'PASS';
  return { reviewId: `local-${scenarioId}`, scenarioId, category, ruleSetVersion: RULE_SET_VERSION, overallStatus, summary: overallStatus === 'PASS' ? 'All visually verifiable preparation checks passed.' : overallStatus === 'FAIL' ? 'One or more visual preparation checks failed.' : 'The supplied visual evidence is insufficient for a conclusive result.', checks, evidence };
}
