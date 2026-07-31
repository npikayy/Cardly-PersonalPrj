from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from beanie import PydanticObjectId

from src.common.enums import DocType
from src.documents.models import (
    ConfirmResponse,
    EditLog,
    FinalizedDocument,
    JsonReviewSession,
    ReviewResponse,
    ReviewStatus,
    ReviewUpdateResponse,
)
from src.exceptions import AppException
from src.processing.constants import (
    BUSINESS_CARD_CONTACT_FIELDS,
    BUSINESS_CARD_FIELDS,
    BUSINESS_CARD_IDENTITY_FIELDS,
    BusinessCardScanStatus,
)
from src.processing.mapping import normalize_fields
from src.processing.models import BusinessCardScan


class InvalidProcessingId(AppException):
    status_code = 400
    code = "INVALID_PROCESSING_ID"
    message = "Invalid processing_id"


class ReviewSessionNotFound(AppException):
    status_code = 404
    code = "REVIEW_SESSION_NOT_FOUND"
    message = "Review session not found"


class SourceDocumentNotFound(AppException):
    status_code = 404
    code = "DOCUMENT_NOT_FOUND"
    message = "Processed document not found for review"


class DocumentAlreadyConfirmed(AppException):
    status_code = 409
    code = "DOCUMENT_ALREADY_CONFIRMED"
    message = "Document has already been confirmed and locked"


class ReviewValidationFailed(AppException):
    status_code = 422
    code = "VALIDATION_FAILED"

    def __init__(self, validation_status: dict[str, Any]):
        self.validation_status = validation_status
        severe_errors = validation_status.get("severe_errors", [])
        missing_fields = validation_status.get("missing_required_fields", [])
        super().__init__(
            "Cannot confirm document because required data is missing or invalid. "
            f"missing_required_fields={missing_fields}; severe_errors={severe_errors}"
        )


REVIEWABLE_FIELDS = (
    "name",
    "phones",
    "email",
    "company",
    "position",
    "address",
    "website",
    "phone",
    "web",
    "industry",
    "summary",
    "professional_brief",
    "keywords",
    "highlights",
    "social_profiles",
    "qr_codes",
    "enrichment_status",
)
REQUIRED_FIELD_NAMES = set(BUSINESS_CARD_IDENTITY_FIELDS + BUSINESS_CARD_CONTACT_FIELDS)
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
URL_PATTERN = re.compile(r"^(https?://)?([a-z0-9-]+\.)+[a-z]{2,}(/.*)?$", re.IGNORECASE)
LEGACY_FIELD_ALIASES = {"phones": "phone", "website": "web"}


async def get_or_create_review_session(
    processing_id: str,
    user_id: PydanticObjectId | None = None,
) -> ReviewResponse:
    """Return a review session, creating it from P5/P6 data when needed."""
    _validate_processing_id(processing_id)

    session = await JsonReviewSession.find_one(
        JsonReviewSession.processing_id == processing_id
    )
    if session is None:
        session = await _create_review_session(processing_id, user_id)

    return _to_review_response(session)


async def update_review_session(
    processing_id: str,
    updates: dict[str, Any],
    edited_by: str,
    context: dict[str, Any] | None = None,
) -> ReviewUpdateResponse:
    """Apply user edits, revalidate the JSON, and append audit logs."""
    _validate_processing_id(processing_id)
    if not updates and context is None:
        raise InvalidProcessingId("Request body must include at least one update")

    session = await _get_existing_session(processing_id)
    _ensure_editable(session)

    now = datetime.utcnow()
    edit_logs: list[EditLog] = []
    for field_name, new_value in updates.items():
        old_value = session.structured_data.get(field_name)
        if old_value == new_value:
            continue

        session.structured_data[field_name] = new_value
        edit_logs.append(
            EditLog(
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
                edited_by=edited_by,
                edited_at=now,
            )
        )

    if edit_logs:
        session.edit_logs.extend(edit_logs)

    if context is not None:
        session.context_data = _normalize_context(context)

    session.validation_status = validate_structured_data(session.structured_data)
    session.review_status = ReviewStatus.EDITED
    session.updated_at = now
    await session.save()

    return ReviewUpdateResponse(**_to_review_response(session).model_dump())


async def confirm_review_session(processing_id: str) -> ConfirmResponse:
    """Validate and lock the reviewed JSON as the final document output."""
    _validate_processing_id(processing_id)
    session = await _get_existing_session(processing_id)

    if session.review_status == ReviewStatus.CONFIRMED or session.is_locked:
        raise DocumentAlreadyConfirmed()

    validation_status = validate_structured_data(session.structured_data)
    if not validation_status["is_valid"]:
        session.validation_status = validation_status
        session.updated_at = datetime.utcnow()
        await session.save()
        raise ReviewValidationFailed(validation_status)

    now = datetime.utcnow()
    final_data = _build_final_data(session.structured_data)
    context_data = _normalize_context(session.context_data)
    session.final_data = final_data
    session.context_data = context_data
    session.validation_status = validation_status
    session.review_status = ReviewStatus.CONFIRMED
    session.is_locked = True
    session.confirmed_at = now
    session.updated_at = now
    await session.save()

    existing_final = await FinalizedDocument.find_one(
        FinalizedDocument.processing_id == processing_id
    )
    if existing_final is None:
        finalized = FinalizedDocument(
            processing_id=processing_id,
            user_id=session.user_id,
            doc_type=DocType.BUSINESS_CARD,
            final_data=final_data,
            final_json=final_data,
            context_data=context_data,
            source_review_id=session.id,
            confirmed_at=now,
        )
        await finalized.insert()

    return ConfirmResponse(
        processing_id=processing_id,
        review_status=session.review_status,
        final_data=final_data,
        confirmed_at=now,
        is_locked=session.is_locked,
    )


def validate_structured_data(structured_data: dict[str, Any]) -> dict[str, Any]:
    """Validate review JSON while preserving null fields from failed OCR."""
    field_errors: dict[str, list[str]] = {}

    for field_name in BUSINESS_CARD_FIELDS:
        source_name, value = _structured_value(structured_data, field_name)
        errors = _validate_field(source_name, value)
        if errors:
            field_errors[source_name] = errors

    missing_required_fields = _missing_required_fields(structured_data, field_errors)
    severe_errors = _required_group_errors(structured_data, field_errors)

    return {
        "is_valid": not severe_errors,
        "missing_required_fields": missing_required_fields,
        "field_errors": field_errors,
        "severe_errors": severe_errors,
        "validated_at": datetime.utcnow().isoformat(),
    }


async def _create_review_session(
    processing_id: str,
    user_id: PydanticObjectId | None,
) -> JsonReviewSession:
    scan = await BusinessCardScan.find_one(
        BusinessCardScan.processing_id == processing_id,
        BusinessCardScan.status == BusinessCardScanStatus.COMPLETED,
    )
    if scan is None:
        scan = await BusinessCardScan.find_one(
            BusinessCardScan.processing_id == processing_id
        )
    if scan is None:
        raise SourceDocumentNotFound()

    structured_data = _with_required_keys(_scan_structured_data(scan))
    now = datetime.utcnow()

    session = JsonReviewSession(
        processing_id=processing_id,
        mapped_document_id=None,
        user_id=user_id or _scan_user_id(scan),
        raw_ocr_output=_raw_ocr_payload(scan),
        structured_data=structured_data,
        context_data=_default_context(scan),
        confidence_scores=_confidence_payload(scan),
        validation_status=validate_structured_data(structured_data),
        review_status=ReviewStatus.PENDING_REVIEW,
        created_at=now,
        updated_at=now,
    )
    await session.insert()
    return session


async def _get_existing_session(processing_id: str) -> JsonReviewSession:
    session = await JsonReviewSession.find_one(
        JsonReviewSession.processing_id == processing_id
    )
    if session is None:
        raise ReviewSessionNotFound()
    return session


def _ensure_editable(session: JsonReviewSession) -> None:
    if session.review_status == ReviewStatus.CONFIRMED or session.is_locked:
        raise DocumentAlreadyConfirmed()


def _to_review_response(session: JsonReviewSession) -> ReviewResponse:
    return ReviewResponse(
        processing_id=session.processing_id,
        raw_ocr_output=session.raw_ocr_output,
        structured_data=session.structured_data,
        context_data=session.context_data,
        confidence_scores=session.confidence_scores,
        validation_status=session.validation_status,
        review_status=session.review_status,
        edit_logs=session.edit_logs,
        final_data=session.final_data,
        is_locked=session.is_locked,
        created_at=session.created_at,
        updated_at=session.updated_at,
        confirmed_at=session.confirmed_at,
    )


def _validate_processing_id(processing_id: str) -> None:
    if not processing_id or not processing_id.strip():
        raise InvalidProcessingId()
    if len(processing_id) > 120:
        raise InvalidProcessingId()


def _with_required_keys(data: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(data or {})
    for field_name in REVIEWABLE_FIELDS:
        normalized.setdefault(field_name, None)
    return normalized


def _build_final_data(structured_data: dict[str, Any]) -> dict[str, Any]:
    return _with_required_keys(structured_data)


def _scan_structured_data(scan: BusinessCardScan) -> dict[str, Any]:
    fields = dict(scan.normalized_fields or normalize_fields(DocType.BUSINESS_CARD, _scan_extracted_fields(scan.extracted_data)))
    if scan.enrichment:
        fields.update(
            {
                "professional_brief": scan.enrichment.get("professional_brief"),
                "keywords": scan.enrichment.get("keywords") or [],
                "highlights": scan.enrichment.get("highlights") or [],
                "enrichment_status": scan.enrichment.get("generation_status"),
            }
        )
    if scan.qr_codes:
        fields["qr_codes"] = scan.qr_codes
    return fields


def _default_context(scan: BusinessCardScan) -> dict[str, Any]:
    return {
        "event_name": None,
        "location": None,
        "source": "OCR",
        "tags": [],
        "notes": None,
        "scanned_at": scan.scanned_at.isoformat() if scan.scanned_at else None,
    }


def _normalize_context(context: dict[str, Any] | None) -> dict[str, Any]:
    context = context or {}
    tags = context.get("tags") or []
    if isinstance(tags, str):
        tags = [item.strip() for item in tags.split(",") if item.strip()]
    return {
        "event_name": _clean_optional(context.get("event_name")),
        "location": _clean_optional(context.get("location")),
        "source": _clean_optional(context.get("source")) or "OCR",
        "tags": [str(item).strip() for item in tags if str(item).strip()],
        "notes": _clean_optional(context.get("notes")),
        "scanned_at": context.get("scanned_at"),
    }


def _clean_optional(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _scan_extracted_fields(scan_data: dict[str, Any]) -> dict[str, Any]:
    extracted = {
        key: value
        for key, value in (scan_data or {}).items()
        if key not in {"confidence_score", "field_scores"}
    }
    if "phones" not in extracted and extracted.get("phone"):
        extracted["phones"] = [extracted.pop("phone")]
    if "website" not in extracted and "web" in extracted:
        extracted["website"] = extracted.pop("web")
    return extracted


def _scan_user_id(scan: BusinessCardScan) -> PydanticObjectId | None:
    try:
        return PydanticObjectId(scan.owner_id)
    except Exception:
        return None


def _raw_ocr_payload(scan: BusinessCardScan) -> dict[str, Any] | str | None:
    if not scan.raw_text and not scan.ocr_blocks:
        return None
    return {
        "raw_text": scan.raw_text,
        "blocks": scan.ocr_blocks,
        "overall_confidence": scan.confidence_score,
        "ocr_engine": "paddleocr",
    }


def _confidence_payload(scan: BusinessCardScan) -> dict[str, Any]:
    field_scores = scan.field_scores or scan.extracted_data.get("field_scores", [])
    if not field_scores:
        return {}
    requires_manual_review = scan.requires_manual_review or bool(scan.failed_fields)
    return {
        "overall_score": scan.confidence_score,
        "failed_fields": scan.failed_fields,
        "requires_manual_review": requires_manual_review,
        "field_scores": {
            str(field.get("field_name")): {
                "value": field.get("value"),
                "score": field.get("score"),
                "classification": field.get("classification"),
                "validation_status": field.get("validation_status"),
                "validation_errors": field.get("validation_errors", []),
                "auto_approved": field.get("auto_approved", False),
                "requires_manual_review": field.get("requires_manual_review", True),
                "note": field.get("note"),
            }
            for field in field_scores
            if isinstance(field, dict) and field.get("field_name")
        },
    }


def _validate_field(field_name: str, value: Any) -> list[str]:
    if _is_blank(value):
        return []
    if field_name == "email" and not EMAIL_PATTERN.match(str(value)):
        return ["Invalid email format"]
    if field_name in {"phone", "phones"}:
        phones = value if isinstance(value, list) else [value]
        if not phones or any(
            len(re.sub(r"\D", "", str(phone))) < 7
            for phone in phones
        ):
            return ["Invalid phone format"]
    if field_name in {"web", "website"} and not URL_PATTERN.match(str(value)):
        return ["Invalid website format"]
    return []


def _required_group_errors(
    structured_data: dict[str, Any],
    field_errors: dict[str, list[str]],
) -> list[dict[str, str]]:
    errors: list[dict[str, str]] = []
    if not _has_valid_group_value(structured_data, BUSINESS_CARD_IDENTITY_FIELDS, field_errors):
        errors.append(
            {
                "field_name": "identity",
                "rule": "required_group",
                "message": "At least one valid identity field is required: name or company",
            }
        )
    if not _has_valid_group_value(structured_data, BUSINESS_CARD_CONTACT_FIELDS, field_errors):
        errors.append(
            {
                "field_name": "contact_method",
                "rule": "required_group",
                "message": "At least one valid contact field is required: email, phone, or web",
            }
        )
    return errors


def _missing_required_fields(
    structured_data: dict[str, Any],
    field_errors: dict[str, list[str]],
) -> list[str]:
    missing: list[str] = []
    if not _has_valid_group_value(structured_data, BUSINESS_CARD_IDENTITY_FIELDS, field_errors):
        missing.extend(BUSINESS_CARD_IDENTITY_FIELDS)
    if not _has_valid_group_value(structured_data, BUSINESS_CARD_CONTACT_FIELDS, field_errors):
        missing.extend(BUSINESS_CARD_CONTACT_FIELDS)
    return missing


def _has_valid_group_value(
    structured_data: dict[str, Any],
    fields: tuple[str, ...],
    field_errors: dict[str, list[str]],
) -> bool:
    return any(
        not _is_blank(_structured_value(structured_data, field_name)[1])
        and _structured_value(structured_data, field_name)[0] not in field_errors
        for field_name in fields
    )


def _structured_value(
    structured_data: dict[str, Any],
    field_name: str,
) -> tuple[str, Any]:
    """Read current field names while preserving legacy P7 JSON compatibility."""
    if field_name in structured_data:
        return field_name, structured_data[field_name]
    alias = LEGACY_FIELD_ALIASES.get(field_name)
    if alias and alias in structured_data:
        return alias, structured_data[alias]
    return field_name, None


def _is_blank(value: Any) -> bool:
    return value in (None, [], "") or (isinstance(value, str) and not value.strip())
