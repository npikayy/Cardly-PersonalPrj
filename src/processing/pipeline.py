"""
OCR pipeline orchestrator for the synchronous API endpoint.

This module wires together Cloudinary download, the preprocess adapter,
and the OCR service into a single callable used by ``src/processing/ocr_router.py``.

Flow
----
  1. Look up all ``UploadedImage`` records for the given ``processing_id``
     (there may be 1 or 2, representing front/back of a card).
  2. Download each image's bytes from Cloudinary.
  3. Pass the raw bytes list through the preprocess adapter,
     which returns ``images_data: list[bytes]``.
  4. Pass ``images_data`` to ``src.processing.ocr.pipline_ocr_to_llm``.
  5. Return the resulting dict to the router.

This module contains **no business logic** — it only orchestrates existing
modules and must not duplicate logic from ``src/processing`` or
``src/documents``.
"""

from __future__ import annotations

import logging
import os
from contextlib import suppress

import cv2
import httpx
import numpy as np
from fastapi import HTTPException, status

from src.auth.models import User
from src.common.enums import DocType
from src.documents.service import _cloudinary_url
from src.processing.confidence import build_field_scores, calculate_overall_score
from src.processing.constants import BusinessCardScanStatus
from src.processing.enrichment import enrich
from src.processing.mapping import normalize_fields, validate_fields
from src.processing.models import BusinessCardScan
from src.processing.ocr import pipline_ocr_to_llm
from src.processing.preprocess import preprocess_image_bytes
from src.processing.schemas import BusinessCard, ExtractionResponse

logger = logging.getLogger(__name__)

async def _download_images_from_cloudinary(processing_id: str) -> list[bytes]:
    """Fetch all image assets for *processing_id* from Cloudinary and return their bytes.

    Looks up every ``UploadedImage`` document associated with *processing_id*
    (1 or 2 files) and downloads each one through its Cloudinary URL.

    Raises
    ------
    HTTPException 404
        If no documents are found for the given ``processing_id``.
    HTTPException 502
        If a Cloudinary download fails.
    """
    from src.documents.models import ImageStatus, UploadedImage

    docs = await UploadedImage.find(
        UploadedImage.processing_id == processing_id,
        UploadedImage.status != ImageStatus.REJECTED_INVALID,
    ).to_list()

    if not docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No documents found for processing_id '{processing_id}'",
        )

    images_raw: list[bytes] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for doc in docs:
            url = _cloudinary_url(doc.storage_path)
            response = await client.get(url)
            if response.status_code == status.HTTP_404_NOT_FOUND:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Image file not found in storage: '{doc.storage_path}'",
                )
            if response.is_error:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Could not download image from Cloudinary: '{doc.storage_path}'",
                )
            logger.info(
                "Downloaded '%s' from Cloudinary (%d bytes)",
                doc.storage_path,
                len(response.content),
            )
            images_raw.append(response.content)

    return images_raw


async def run_ocr_pipeline(processing_id: str, user: User) -> tuple[BusinessCardScan, ExtractionResponse]:
    """Run the full preprocess → OCR pipeline for an already-uploaded document.

    Parameters
    ----------
    processing_id:
        The correlation key assigned at upload time.  Used to locate and
        download all associated image files from Cloudinary.

    Returns
    -------
    tuple[BusinessCardScan, ExtractionResponse]
        The persisted scan record and the fully-normalized extraction result.
    """
    logger.info("OCR pipeline started for processing_id='%s'", processing_id)
    cardscan: BusinessCardScan | None = None

    try:
        # Step 1: download raw bytes from Cloudinary
        images_raw: list[bytes] = await _download_images_from_cloudinary(processing_id)

        # Step 2: preprocess — list[bytes] → list[bytes] (processed)
        images_data: list[bytes] = await preprocess_image_bytes(images_raw)

        # Step 3: OCR + LLM extraction
        cardscan, raw_extracted_dict, ocr_blocks = await pipline_ocr_to_llm(
            images_data,
            str(user.id),
            processing_id,
        )

        # Step 4: Clean up extracted data
        cleaned_dict = normalize_fields(DocType.BUSINESS_CARD, raw_extracted_dict)
        qr_codes = _decode_qr_codes(images_raw)
        enrichment = await _run_enrichment(cleaned_dict)
        if enrichment:
            cleaned_dict.update(
                {
                    "professional_brief": enrichment.get("professional_brief"),
                    "keywords": enrichment.get("keywords") or [],
                    "highlights": enrichment.get("highlights") or [],
                    "enrichment_status": enrichment.get("generation_status"),
                }
            )
        if qr_codes:
            cleaned_dict["qr_codes"] = qr_codes

        validation_results, missing_required_fields = validate_fields(
            DocType.BUSINESS_CARD,
            cleaned_dict,
        )

        # Step 5: Score the extracted data
        field_scores = build_field_scores(
            document_type=DocType.BUSINESS_CARD,
            normalized_fields=cleaned_dict,
            validation_results=validation_results,
            ocr_blocks=ocr_blocks,
        )
        overall_score = calculate_overall_score(DocType.BUSINESS_CARD, field_scores)
        failed_fields = [
            score.field_name
            for score in field_scores
            if score.requires_manual_review or score.validation_errors
        ]

        # Step 6: Wrap in response schema
        extraction_response = ExtractionResponse(
            **cleaned_dict,
            confidence_score=overall_score,
            field_scores=[score.model_dump() for score in field_scores],
        )

        # Step 7: Save the result to MongoDB and update status
        cardscan.extracted_data = extraction_response.model_dump()
        cardscan.normalized_fields = cleaned_dict
        cardscan.validation_results = [
            result.model_dump(mode="json")
            for result in validation_results
        ]
        cardscan.field_scores = [score.model_dump(mode="json") for score in field_scores]
        cardscan.failed_fields = sorted(set(failed_fields + missing_required_fields))
        cardscan.requires_manual_review = bool(cardscan.failed_fields)
        cardscan.ocr_blocks = ocr_blocks
        cardscan.qr_codes = qr_codes
        cardscan.enrichment = enrichment
        cardscan.confidence_score = overall_score
        cardscan.status = BusinessCardScanStatus.COMPLETED
        await cardscan.save()

        await _mark_uploaded_images(processing_id, processed=True)

        logger.info("OCR pipeline completed for processing_id='%s'", processing_id)
        return cardscan, extraction_response
    except Exception:
        await _mark_uploaded_images(processing_id, processed=False)
        if cardscan is not None:
            cardscan.status = BusinessCardScanStatus.FAILED
            await cardscan.save()
        logger.exception("OCR pipeline failed for processing_id='%s'", processing_id)
        raise


async def _run_enrichment(cleaned_dict: dict) -> dict:
    """Run Gemini enrichment for extracted business-card fields."""
    card = BusinessCard(
        name=cleaned_dict.get("name") or "",
        phones=cleaned_dict.get("phones") or [],
        email=cleaned_dict.get("email") or "",
        company=cleaned_dict.get("company") or "",
        position=cleaned_dict.get("position") or "",
        address=cleaned_dict.get("address") or "",
        website=cleaned_dict.get("website") or "",
        social_profiles=cleaned_dict.get("social_profiles") or [],
        detected_languages=cleaned_dict.get("detected_languages") or [],
    )
    try:
        result = await enrich(card)
    except Exception:
        logger.exception("Enrichment failed")
        return {"generation_status": "FAILED", "professional_brief": None, "keywords": [], "highlights": []}
    return result.model_dump(mode="json")


async def _mark_uploaded_images(processing_id: str, *, processed: bool) -> None:
    from src.documents.models import ImageStatus, UploadedImage

    await UploadedImage.find(
        UploadedImage.processing_id == processing_id,
    ).update({"$set": {UploadedImage.status: ImageStatus.PROCESSED if processed else ImageStatus.FAILED}})


def _decode_qr_codes(images_raw: list[bytes]) -> list[str]:
    """Decode QR codes from raw uploaded images using OpenCV."""
    detector = cv2.QRCodeDetector()
    values: list[str] = []
    for image_data in images_raw:
        img_np = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
        if img_np is None:
            continue
        with suppress(Exception):
            ok, decoded_info, _, _ = detector.detectAndDecodeMulti(img_np)
            if ok:
                values.extend(value for value in decoded_info if value)
                continue
        with suppress(Exception):
            value, _, _ = detector.detectAndDecode(img_np)
            if value:
                values.append(value)
    return list(dict.fromkeys(values))

# ---------------------------------------------------------------------------
# DEBUG helper — remove once preprocessing issue is diagnosed
# ---------------------------------------------------------------------------

_DEBUG_DIR = "storage/debug_ocr"

def _debug_dump_images(
    processing_id: str,
    images_raw: list[bytes],
    images_data: list[bytes],
) -> None:
    """Save raw and preprocessed image bytes to *_DEBUG_DIR* for visual inspection.

    Each call writes two files per image index::

        storage/debug_ocr/<processing_id>_<idx>_raw.<ext>
        storage/debug_ocr/<processing_id>_<idx>_processed.<ext>

    The extension is inferred from the leading magic bytes so the files open
    correctly in any image viewer.
    """
    os.makedirs(_DEBUG_DIR, exist_ok=True)

    def _ext(data: bytes) -> str:
        """Guess file extension from magic bytes."""
        if data[:8] == b"\x89PNG\r\n\x1a\n":
            return "png"
        if data[:2] == b"\xff\xd8":
            return "jpg"
        if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
            return "webp"
        return "bin"

    for idx, (raw, processed) in enumerate(zip(images_raw, images_data, strict=False)):
        raw_path = os.path.join(_DEBUG_DIR, f"{processing_id}_{idx}_raw.{_ext(raw)}")
        proc_path = os.path.join(_DEBUG_DIR, f"{processing_id}_{idx}_processed.{_ext(processed)}")

        with open(raw_path, "wb") as f:
            f.write(raw)
        with open(proc_path, "wb") as f:
            f.write(processed)

        logger.info(
            "[DEBUG] Dumped image[%d] → raw=%s (%d bytes)  processed=%s (%d bytes)",
            idx, raw_path, len(raw), proc_path, len(processed),
        )
