import os
import io
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# --- Schema Definitions for Structured Output ---

class BoundingBox(BaseModel):
    box_2d: List[int] = Field(description="[ymin, xmin, ymax, xmax] normalized 0-1000")
    label: str
    confidence: float

class ComplianceEvidence(BaseModel):
    polybag_bbox: Optional[BoundingBox] = Field(None, description="Detection of the plastic polybag")
    fnsku_bbox: Optional[BoundingBox] = Field(None, description="Detection of the FNSKU/Barcode label")
    surface_classification: Literal['flat', 'seam', 'curved_edge', 'opening'] = Field(
        ..., description="The geometry of the surface where the FNSKU is applied"
    )
    warning_text_ocr: str = Field(..., description="OCR text of the suffocation warning")
    warning_text_confidence: float = Field(..., ge=0, le=1)
    original_barcode_visible: bool = Field(
        ..., description="True if the manufacturer's original barcode is still visible/uncovered"
    )

# --- VLM Engine ---

def analyze_prep_image(image_bytes: bytes, category: str) -> ComplianceEvidence:
    """
    Analyzes an inbound warehouse image for packaging compliance using Gemini 1.5 Pro.
    
    Args:
        image_bytes: Raw bytes of the uploaded image.
        category: The product category (e.g., 'Apparel', 'Liquid', 'Fragile') to tune inspection logic.
    """
    
    # 1. Initialize Client
    # Ensure GOOGLE_API_KEY is set in your environment variables
    # Or GEMINI_API_KEY
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    model_id = "gemini-1.5-pro"

    # 2. Prepare the Image
    # The SDK can accept bytes directly using the Part API
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type="image/jpeg"
    )

    # 3. Define System Instruction
    system_instruction = """
    You are a Senior Warehouse Quality Assurance Inspector specializing in Amazon FBA and 3PL inbound compliance.
    Your task is to analyze images of packaged inventory and provide high-precision visual evidence.
    
    CRITICAL INSTRUCTIONS:
    - Bounding Boxes: Provide coordinates in [ymin, xmin, ymax, xmax] format, normalized 0-1000.
    - FNSKU Check: Identify the FNSKU barcode label. Determine if it is placed on a flat surface or across a seam/opening (which is a violation).
    - Suffocation Warning: Extract the exact OCR text for the suffocation warning required for polybags.
    - Barcode Scannability: Check if any original manufacturer barcodes (UPC/EAN) are still visible. They MUST be covered by the FNSKU.
    - Be extremely literal. If a feature is not visible, return a low confidence score or null for the bbox.
    """

    # 4. Define Prompt
    prompt = f"""
    Perform a compliance inspection for a product in the '{category}' category.
    
    1. Detect the polybag and the FNSKU label.
    2. Analyze the surface topology under the FNSKU label.
    3. Transcribe the suffocation warning text if present.
    4. Determine if the original barcode is visible or correctly covered.
    
    Return the analysis in structured JSON format.
    """

    # 5. Execute API Call with Response Schema
    response = client.models.generate_content(
        model=model_id,
        contents=[image_part, prompt],
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=ComplianceEvidence, # Forces Pydantic validation
            temperature=0.1, # Low temperature for consistent extraction
        ),
    )

    # 6. Parse and Return
    # The SDK automatically validates the JSON against the Pydantic model
    return response.parsed
