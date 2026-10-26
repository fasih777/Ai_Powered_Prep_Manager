/**
 * Authoritative 2026 Inbound Packaging & Prep Requirements Reference Document
 * Ingested into the VLM Large Context Window for deterministic grounding.
 * Based on Amazon FBA, 3PL Fulfillment Standards, 16 CFR § 1500, and ISO packaging specs.
 */

export interface PrepDocumentSection {
  id: string;
  title: string;
  category: string;
  rules: string[];
  verbatimClauses: string[];
  visuallyVerifiable: boolean;
  notes: string;
}

export const DENSE_PREP_DOCUMENTATION: PrepDocumentSection[] = [
  {
    id: "SEC-01-POLYBAG",
    title: "1. Polybag Packaging and Sealing Specifications",
    category: "General Packaging",
    rules: [
      "All products requiring polybagging must be completely enclosed in a transparent polybag.",
      "Polybag opening must be completely sealed using a heat-seal seam or tamper-evident adhesive tape. Zipper or unsealed fold-over flaps are strictly prohibited.",
      "The polybag must not protrude more than 3 inches (7.6 cm) past the dimensions of the product.",
      "The bag must be clean, unwrinkled, and allow full visibility of the product inside unless hazmat/opaque shielding is specifically authorized."
    ],
    verbatimClauses: [
      "Clause 1.2.1: Polybags must be completely sealed (either heat-sealed or taped shut). Openings left unfastened will trigger an immediate inbound prep defect (DEFECT_UNSEALED_BAG).",
      "Clause 1.2.4: Excess polybag overhang exceeding 3 inches must be neatly taped down against the unit."
    ],
    visuallyVerifiable: true,
    notes: "Visual perception checks bag boundary, seam presence, and seal closure line."
  },
  {
    id: "SEC-02-SUFFOCATION-WARNING",
    title: "2. Suffocation Warning Requirements & Typography",
    category: "Safety Compliance",
    rules: [
      "Any polybag with an opening of 5 inches (12.7 cm) or larger (measured when flat) must have a suffocation warning printed directly on the bag or applied as a prominent label.",
      "The warning must be legible and placed in a prominent location on the exterior face of the packaging.",
      "Required Warning Verbatim: 'WARNING: To avoid danger of suffocation, keep this plastic bag away from babies and children. Do not use this bag in cribs, beds, carriages, or playpens. This bag is not a toy.' (or approved regional equivalents).",
      "Minimum Font Size Table: Opening < 30 in -> 10 pt; 30-39 in -> 14 pt; 40-59 in -> 18 pt; >= 60 in -> 24 pt."
    ],
    verbatimClauses: [
      "Clause 2.1.0: Failure to apply a suffocation warning on bags >= 5 inches is a critical safety violation (SAFETY_DEFECT_NO_SUFFOCATION_WARN).",
      "Clause 2.1.3: Warning must be clearly legible with strong contrast against background. Faded or obscured text constitutes a failure."
    ],
    visuallyVerifiable: true,
    notes: "OCR perception extracts text, verifies keyword presence ('suffocation', 'danger', 'cribs', 'toy'), and measures contrast."
  },
  {
    id: "SEC-03-FNSKU-PLACEMENT",
    title: "3. FNSKU Label Placement & Geometric Surface Requirements",
    category: "Labelling & Tracking",
    rules: [
      "Each unit must have an individual, scannable FNSKU (Fulfillment Network Stock Keeping Unit) label applied to the exterior.",
      "The FNSKU label must be placed on a smooth, flat surface. It must NEVER be placed across seams, corners, curved edges, bag closures, or folds.",
      "The label must not wrap around a package edge (which causes barcode distortion and unreadability by fixed automated warehouse laser scanners).",
      "Label must maintain a minimum 0.25 inch (6.35 mm) quiet zone margin around all barcode edges."
    ],
    verbatimClauses: [
      "Clause 3.4.2: FNSKU labels affixed over package seams, zipper tracks, or curved contours > 15 degrees angle are rejected (DEFECT_LABEL_ON_SEAM).",
      "Clause 3.4.5: The barcode must be 100% flat with zero wrinkles, bubble ridges, or scuffs."
    ],
    visuallyVerifiable: true,
    notes: "Spatial geometry module calculates surface normal deviation and seam intersection."
  },
  {
    id: "SEC-04-BARCODE-COVERAGE",
    title: "4. Manufacturer Barcode Coverage (UPC / EAN / ISBN)",
    category: "Labelling & Tracking",
    rules: [
      "The original manufacturer barcode (UPC, EAN, ISBN, or JAN) must be completely covered and unreadable.",
      "The FNSKU label should ideally be placed directly over the original barcode, or an opaque blank white label must be applied over the original barcode before applying the FNSKU elsewhere.",
      "No secondary scannable 1D barcode may remain exposed on the exterior of the packaging. Exposing both UPC and FNSKU causes scanner mis-reads and mis-receipts."
    ],
    verbatimClauses: [
      "Clause 4.1.1: If the manufacturer barcode is even partially visible (peeking out from under a misaligned label), the unit is deemed non-compliant (DEFECT_UNCOVERED_ORIGINAL_BARCODE).",
      "Clause 4.1.3: Barcode coverage must be 100% opaque. Translucent labels allowing laser penetration are prohibited."
    ],
    visuallyVerifiable: true,
    notes: "Barcode reader scans for active manufacturer barcodes; collision analyzer calculates IoU and coverage %."
  },
  {
    id: "SEC-05-EXPIRY-DATES",
    title: "5. Expiration Date Formatting & Visibility",
    category: "Perishables & Topicals",
    rules: [
      "All perishable products, topicals, ingestibles, and items with a limited shelf life must have an expiration date clearly visible on the outer packaging.",
      "If the product is enclosed in a polybag or bubble wrap, the expiration date must be printed on the outside of the prep packaging or be fully legible through transparent wrapping.",
      "Acceptable formats: MM-YYYY, MM/DD/YYYY, or YYYY-MM-DD. Dates must be printed in a minimum 36-point font or clearly legible human-readable format.",
      "Covering the expiration date with an FNSKU or prep label is an immediate critical defect."
    ],
    verbatimClauses: [
      "Clause 5.2.2: Covered or illegible expiration dates will result in immediate disposal or return of inventory at seller expense (DEFECT_EXPIRY_DATE_OBSCURED)."
    ],
    visuallyVerifiable: true,
    notes: "OCR checks presence of date strings matching standard regex patterns and verifies it is uncovered."
  },
  {
    id: "SEC-06-HANDLING-MARKS",
    title: "6. Handling Marks, Fragile, and Orientation Labels",
    category: "Specialized Categories",
    rules: [
      "Glass, ceramic, liquid containers, or delicate items must display a 'Fragile - Handle with Care' label on the exterior.",
      "Liquid products and products with orientation sensitivity must display 'This Side Up' directional arrows on two opposite sides.",
      "Multi-item sets or bundles packaged together must feature a prominent 'Sold as Set - Do Not Separate' or 'Ready to Ship' label.",
      "Labels must be affixed to the outer layer of packaging (e.g. outside the bubble wrap or polybag)."
    ],
    verbatimClauses: [
      "Clause 6.3.1: Bundled units without 'Sold as Set' label will be opened and separated by inbound receivers (DEFECT_MISSING_SET_LABEL).",
      "Clause 6.1.4: Liquid containers lacking orientation arrows are subject to prep rejection."
    ],
    visuallyVerifiable: true,
    notes: "Perception detects icon/text tokens for 'Fragile', 'This Side Up', 'Sold as Set'."
  },
  {
    id: "SEC-07-NON-VISUAL-GUARDRAILS",
    title: "7. Non-Visually Verifiable Attributes (Strict Guardrails)",
    category: "System Integrity",
    rules: [
      "Polybag film thickness (minimum 1.5 mil / 0.0381 mm rating) CANNOT be measured reliably from 2D photographs.",
      "Adhesive tensile strength and chemical peel resistance CANNOT be verified visually.",
      "Internal liquid seal airtightness (pressure drop testing) CANNOT be verified visually.",
      "CRITICAL DIRECTIVE: The AI agent MUST report any check corresponding to these attributes as 'UNCERTAIN / NOT VERIFIABLE FROM IMAGE'. The agent must NEVER guess or output PASS/FAIL for non-visual criteria."
    ],
    verbatimClauses: [
      "System Directive 7.0: If an attribute requires physical instrumentation (calipers, micrometer, pressure gauge), output verdict UNCERTAIN with reason 'Attribute is non-visually verifiable from optical photographs'."
    ],
    visuallyVerifiable: false,
    notes: "Enforced at the rule engine level with visually_verifiable: false."
  }
];

export const FULL_DOCUMENTATION_TEXT = DENSE_PREP_DOCUMENTATION.map(
  (sec) => `=== [${sec.id}] ${sec.title} ===\nCategory: ${sec.category}\nVisually Verifiable: ${sec.visuallyVerifiable}\nRules:\n${sec.rules.map(r => ` - ${r}`).join('\n')}\nVerbatim Clauses:\n${sec.verbatimClauses.map(c => ` * ${c}`).join('\n')}\nSystem Notes: ${sec.notes}\n`
).join('\n\n');
