import asyncio
import json
import logging
from typing import Any

import cv2
import numpy as np
from google.genai import errors as genai_errors
from google.genai.types import GenerateContentConfig

from src.processing.clients import get_gemini_client
from src.processing.config import ocr_settings

from .clients import get_ocr_engine
from .constants import BusinessCardScanStatus
from .exceptions import AiModelUnavailable, CardNotDetected, OcrFailed
from .models import BusinessCardScan
from .schemas import BusinessCard

logger = logging.getLogger(__name__)


async def save_ocr_raw_text(
    owner_id: str,
    processing_id: str,
    raw_text: str,
) -> BusinessCardScan:
    scan = BusinessCardScan(
        owner_id=owner_id,
        processing_id=processing_id,
        raw_text=raw_text,
        status=BusinessCardScanStatus.PROCESSING,
    )
    await scan.insert()
    return scan

async def pipline_ocr_to_llm(
    images_data: list[bytes],
    owner_id: str,
    processing_id: str,
) -> tuple[BusinessCardScan, dict[str, Any], list[dict[str, Any]]]:
    # Step 1: Run full OCR on the image
    ocr_engine = get_ocr_engine()
    result = []

    # Chạy OCR cho từng ảnh
    for image_data in images_data:
        img_np = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
        result.append(ocr_engine.ocr(img_np))

    print("OCR Result: ", json.dumps(result, indent=4))

    # Chuẩn bị dữ liệu đầu vào cho LLM
    # Also build a flat list of OCR blocks for confidence resolution
    ocr_texts: list[str] = []
    ocr_blocks: list[dict[str, Any]] = []
    for page in result:
        if not page or page[0] is None:
            continue
        for block in page[0]:
            text: str = block[1][0]
            confidence: float = float(block[1][1])
            ocr_texts.append(text)
            ocr_blocks.append({"text": text, "confidence": confidence})

    ocr_text = "\n".join(ocr_texts)

    if not ocr_text.strip():
        raise CardNotDetected

    try:
        # BusinessCardScan.extracted_data requires a dict; wrap the PaddleOCR
        # list under a "pages" key so the raw output is still fully preserved.
        scan = await save_ocr_raw_text(owner_id, processing_id, ocr_text)
    except Exception as e: 
        raise RuntimeError(f"Failed to save OCR result to DB: {e}") from e

    # Step 2: Send the extracted text to LLM
    client = get_gemini_client()
        
    prompt = """
        You are an AI expert in Document Information Extraction.
        If a field is not present or cannot be read, set value to null and confidence to 0.0.
        The confidence score should reflect how certain you are that the extracted value is correct based on the OCR text.
        Preserve the original language and Unicode characters from the OCR text.
        For Vietnamese business cards, keep Vietnamese diacritics exactly as written whenever they appear in OCR text.
        Do not translate names, positions, company names, addresses, or other extracted fields into English.
        Detect the language of the card and include it in detected_languages using codes such as "vi" or "en".
    """
    
    response = await _generate_business_card_json(
        client=client,
        prompt=prompt,
        ocr_text=ocr_text,
    )
    
    # Parse the JSON response
    response_text = response.text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:-3]
    elif response_text.startswith("```"):
        response_text = response_text[3:-3]

    try:
        return scan, json.loads(response_text), ocr_blocks
    except json.JSONDecodeError as e:
        raise OcrFailed(f"LLM returned invalid JSON: {e}") from e


async def _generate_business_card_json(client, prompt: str, ocr_text: str):
    """Call Gemini with retry/fallback for transient model pressure."""
    model_candidates = [
        "gemini-3.1-flash-lite",
        ocr_settings.MODEL_NAME,
        "gemini-1.5-flash",
    ]
    models = list(dict.fromkeys(model for model in model_candidates if model))
    last_error: Exception | None = None

    for model in models:
        for attempt in range(2):
            try:
                return client.models.generate_content(
                    model=model,
                    contents=[prompt, ocr_text],
                    config=GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=BusinessCard.model_json_schema(),
                        temperature=0.0,
                    ),
                )
            except genai_errors.ServerError as exc:
                last_error = exc
                status_code = getattr(exc, "status_code", None)
                logger.warning("Gemini model %s failed with status %s on attempt %d", model, status_code, attempt + 1)
                if status_code == 503:
                    await asyncio.sleep(1.0 + attempt)
                    continue
                break
            except genai_errors.APIError as exc:
                last_error = exc
                logger.warning("Gemini model %s API error: %s", model, exc)
                break

    if isinstance(last_error, genai_errors.ServerError) and getattr(last_error, "status_code", None) == 503:
        raise AiModelUnavailable() from last_error
    raise OcrFailed(str(last_error) if last_error else "LLM extraction failed")
