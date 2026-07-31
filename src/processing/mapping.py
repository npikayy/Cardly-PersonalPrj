import re
from datetime import datetime
from typing import Any

from beanie import PydanticObjectId

from src.common.enums import DocType
from src.processing.constants import MAPPER_VERSION, REQUIRED_FIELDS
from src.processing.models import FieldValidationResult, MappedDocument

NULL_LIKE_VALUES = {"", "null", "none", "n/a", "na", "not available"}


def normalize_null_like(value: str | None) -> str | None:
    """Convert empty and placeholder strings returned by OCR/LLM to None."""
    if value is None:
        return None
    stripped = value.strip()
    return None if stripped.lower() in NULL_LIKE_VALUES else stripped


def normalize_phone(value: str | None) -> str | None:
    """Standardize phone format: remove spaces/formatting, convert 0... to +84..."""
    value = normalize_null_like(value)
    if value is None:
        return None
    # Keep only digits and '+'
    cleaned = re.sub(r"[^\d+]", "", value.strip())
    # Convert local Vietnamese format (e.g. 0912345678) to international (+84912345678)
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "+84" + cleaned[1:]
    return cleaned


def normalize_email(value: str | None) -> str | None:
    """Trim and lowercase email addresses."""
    value = normalize_null_like(value)
    if value is None:
        return None
    return value.lower()


def normalize_web(value: str | None) -> str | None:
    """Ensure web/URL starts with https:// if protocol is missing."""
    value = normalize_null_like(value)
    if value is None:
        return None
    cleaned = value
    if not re.match(r"^https?://", cleaned, re.IGNORECASE):
        cleaned = "https://" + cleaned
    return cleaned


def clean_text(value: str | None) -> str | None:
    """Strip leading/trailing whitespace and collapse internal spaces."""
    value = normalize_null_like(value)
    if value is None:
        return None
    return " ".join(value.split())


def normalize_fields(doc_type: DocType, extracted: dict[str, Any]) -> dict[str, Any]:
    """Apply all normalizations appropriate for the given doc_type."""
    normalized: dict[str, Any] = {}

    for key, value in extracted.items():
        v = value
        if key == "phone" and isinstance(v, str):
            v = normalize_phone(v)
        elif key == "phones" and isinstance(v, list):
            v = [
                normalized_phone
                for item in v
                if isinstance(item, str)
                for normalized_phone in [normalize_phone(item)]
                if normalized_phone
            ]
        elif key == "email" and isinstance(v, str):
            v = normalize_email(v)
        elif (key == "web" or key == "website") and isinstance(v, str):
            v = normalize_web(v)
        elif isinstance(v, str):
            v = clean_text(v)
        elif isinstance(v, list):
            # E.g. keywords, highlights
            v = [clean_text(item) for item in v if isinstance(item, str)]
        normalized[key] = v

    return normalized

def validate_email_format(value: str | None) -> bool:
    """Validate email format using a standard regex."""
    if not value:
        return False
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(email_regex, value.strip()))


def validate_phone_format(value: str | list[str] | None) -> bool:
    """Validate phone format: optionally starts with +, followed by 7-15 digits."""
    if not value:
        return False
    if isinstance(value, list):
        return bool(value) and all(validate_phone_format(item) for item in value)
    # Keep only digits and '+' to evaluate clean phone length
    cleaned = re.sub(r"[^\d+]", "", value.strip())
    phone_regex = r"^\+?\d{7,15}$"
    return bool(re.match(phone_regex, cleaned))


def validate_url_format(value: str | None) -> bool:
    """Validate website/URL format."""
    if not value:
        return False
    # URL should start with http:// or https:// (normally added by normalizer)
    url_regex = r"^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$"
    return bool(re.match(url_regex, value.strip(), re.IGNORECASE))


RULES: dict[str, list[tuple[str, Any]]] = {
    DocType.BUSINESS_CARD: [
        ("email", [("email_format", validate_email_format)]),
        ("phones", [("phone_format", validate_phone_format)]),
        ("website", [("url_format", validate_url_format)]),
    ],
}


def validate_fields(
    doc_type: DocType,
    normalized: dict[str, Any],
) -> tuple[list[FieldValidationResult], list[str]]:
    """Run all validation rules for the given doc_type.
    Returns (validation_results, missing_required_fields).
    """
    results: list[FieldValidationResult] = []
    required = REQUIRED_FIELDS.get(doc_type, [])
    missing: list[str] = [f for f in required if not normalized.get(f)]

    for field_name, rules in RULES.get(doc_type, []):
        val = normalized.get(field_name)
        # Only run format validation rules if the field is present/non-empty
        if val not in (None, ""):
            for rule_name, rule_fn in rules:
                passed = rule_fn(val)
                results.append(FieldValidationResult(
                    field_name=field_name,
                    rule=rule_name,
                    passed=passed,
                ))

    return results, missing


def bbox_overlap(a: list[float], b: list[float]) -> float:
    """Return intersection-over-union of two [x, y, w, h] bounding boxes."""
    ax1, ay1, ax2, ay2 = a[0], a[1], a[0] + a[2], a[1] + a[3]
    bx1, by1, bx2, by2 = b[0], b[1], b[0] + b[2], b[1] + b[3]

    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)

    if ix2 <= ix1 or iy2 <= iy1:
        return 0.0

    intersection = (ix2 - ix1) * (iy2 - iy1)
    union = (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - intersection
    return intersection / union if union else 0.0

async def map_document_fields(
    processing_id: str,
    doc_type: DocType,
    ocr_result: dict,
    vision_result: dict,
    user_id: str,
) -> MappedDocument:
    """Entry point called by pipeline/stages.py.

    Steps:
      1. Select mapper by doc_type
      2. mapper.extract() → extracted_fields
      3. normalize() → normalized_fields
      4. validate() → validation_results + missing_required_fields
      5. Persist and return MappedDocument
    """
    from src.processing.mappers.business_card import BusinessCardMapper

    mapper_map = {
        DocType.BUSINESS_CARD: BusinessCardMapper,
    }

    mapper_cls = mapper_map.get(doc_type)
    if mapper_cls is None:
        from src.processing.exceptions import UnknownDocType
        raise UnknownDocType(f"Unsupported doc_type: {doc_type}")

    mapper = mapper_cls(ocr_result=ocr_result, vision_result=vision_result)

    # Step 1: extract raw fields
    extracted = mapper.extract()

    # Step 2: normalize
    normalized = normalize_fields(doc_type, extracted)

    # Step 3: validate
    validation_results, missing = validate_fields(doc_type, normalized)

    doc_data = {
        "processing_id": processing_id,
        "doc_type": doc_type,
        "user_id": PydanticObjectId(user_id),
        "extracted_fields": extracted,
        "normalized_fields": normalized,
        "validation_results": validation_results,
        "missing_required_fields": missing,
        "mapping_status": "mapped" if not missing else "partial",
        "mapper_version": MAPPER_VERSION,
        "mapped_at": datetime.utcnow(),
    }

    existing = await MappedDocument.find_one(MappedDocument.processing_id == processing_id)
    if existing:
        for field_name, value in doc_data.items():
            setattr(existing, field_name, value)
        await existing.save()
        return existing

    doc = MappedDocument(**doc_data)
    await doc.insert()
    return doc
