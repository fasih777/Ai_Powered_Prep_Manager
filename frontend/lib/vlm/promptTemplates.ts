/**
 * VLM System Instruction
 * Provides grounding context for the Vision Language Model
 */
export const VLM_SYSTEM_INSTRUCTION = `You are an expert quality control inspector for Amazon FBA inbound preparation. Your task is to analyze product packaging images and extract structured evidence for compliance checks.

You must:
1. Identify all visible elements: FNSKU labels, manufacturer barcodes, suffocation warnings, expiry dates, handling marks, polybag seals
2. Provide precise bounding box coordinates (0-1000 scale relative to image dimensions)
3. Classify surface geometry and spatial relationships
4. Extract OCR text with high accuracy
5. Assess confidence levels for each detection
6. Apply conservative UNCERTAIN judgment when evidence is ambiguous or insufficient

Return only valid JSON matching the provided schema. Do not include explanatory text outside the JSON structure.`;

/**
 * VLM Analysis Prompt Generator
 * Generates category-specific analysis prompts
 */
export function VLM_ANALYSIS_PROMPT(category: string): string {
  const categoryInstructions: Record<string, string> = {
    'liquids': `Analyze this liquid product packaging for FBA preparation compliance. Focus on:
- Polybag seal integrity (heat seal vs unsealed)
- Suffocation warning presence and legibility
- FNSKU label placement and surface classification
- Manufacturer barcode visibility and coverage
- Expiry date visibility and OCR extraction
- Any handling marks or special requirements

Return structured evidence for all applicable checks.`,
    
    'fragile': `Analyze this fragile/glass product packaging for FBA preparation compliance. Focus on:
- Polybag seal integrity and suffocation warning
- FNSKU label placement (avoid seams if possible)
- Manufacturer barcode coverage assessment
- Fragile handling mark presence and legibility
- Expiry date if applicable
- Packaging integrity and bubble wrap visibility

Return structured evidence for all applicable checks.`,
    
    'general': `Analyze this product packaging for FBA preparation compliance. Focus on:
- Polybag seal state and type
- Suffocation warning presence and legibility
- FNSKU label placement and surface classification
- Manufacturer barcode visibility and coverage
- Expiry date if applicable
- Handling marks or special labels
- Overall packaging condition

Return structured evidence for all applicable checks.`
  };

  return categoryInstructions[category] || categoryInstructions['general'];
}

/**
 * VLM Schema Documentation
 * This is the expected JSON structure for VLM responses
 */
export const VLM_RESPONSE_SCHEMA = {
  detections: [
    {
      id: 'string',
      type: 'fnsku | polybag | seam | suffocation_warning | expiry_date | mfg_barcode | handling_mark',
      box: {
        ymin: 'number (0-1000)',
        xmin: 'number (0-1000)',
        ymax: 'number (0-1000)',
        xmax: 'number (0-1000)'
      },
      confidence: 'number (0.0-1.0)',
      label: 'string'
    }
  ],
  spatialGeometry: {
    fnskuSurface: 'flat | seam | curved_edge | opening | wrinkled | unknown',
    fnskuCurvatureAngleDeg: 'number',
    distanceToNearestSeamPx: 'number',
    intersectsSeam: 'boolean',
    polybagSealed: 'boolean',
    sealType: 'heat_seal | tamper_evident_tape | unsealed_open | zipper'
  },
  barcodeAnalysis: {
    fnskuFound: 'boolean',
    fnskuValue: 'string',
    mfgBarcodeFound: 'boolean',
    coverageStatus: 'FULLY_COVERED | PARTIALLY_EXPOSED | UNCOVERED | NO_MFG_BARCODE_DETECTED',
    coverageRatio: 'number (0.0-1.0)'
  },
  ocrResults: {
    suffocationWarningText: 'string',
    suffocationKeywordsDetected: 'string[]',
    isSuffocationLegible: 'boolean',
    expiryDateString: 'string',
    expiryFound: 'boolean',
    expiryUncovered: 'boolean'
  }
};
