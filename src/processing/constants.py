from enum import Enum

from src.common.enums import DocType

MIN_DPI = 300
SUPPORTED_ROTATIONS = [0, 90, 180, 270]
OUTPUT_FORMAT = "png"


SUPPORTED_DOC_TYPES = ["passport_au", "medicare", "driver_licence_vic", "unknown"]

# Region labels used in AiVisionResult.detected_regions — must match mock_data exactly
REGION_LABELS_PASSPORT_AU = [
    "document_no", "type", "country_code", "surname", "given_names",
    "nationality", "date_of_birth", "sex", "place_of_birth",
    "date_of_issue", "date_of_expiry", "authority", "mrz_line1", "mrz_line2",
]

REGION_LABELS_MEDICARE = ["card_number", "irn", "full_name", "valid_to"]

REGION_LABELS_DRIVER_LICENCE_VIC = [
    "licence_no", "full_name", "address", "date_of_birth",
    "licence_expiry", "licence_type", "conditions", "state",
]

class BusinessCardScanStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

MAPPER_VERSION = "1.0.0"

REQUIRED_FIELDS: dict[str, list[str]] = {
    DocType.BUSINESS_CARD: ["name", "phones", "email"],
}


AUTO_APPROVE_FLAG = "auto_approved"
REQUIRES_REVIEW_FLAG = "requires_manual_review"

BUSINESS_CARD_FIELDS = (
    "name",
    "phones",
    "email",
    "company",
    "position",
    "address",
    "website",
)

BUSINESS_CARD_IDENTITY_FIELDS = ("name", "company")
BUSINESS_CARD_CONTACT_FIELDS = ("email", "phones", "website")
BUSINESS_CARD_CONFIDENCE_FIELDS = BUSINESS_CARD_FIELDS

BUSINESS_CARD_SCHEMA = {
    "document_type": "business_card",
    "required_groups": [
        {
            "name": "identity",
            "min_required": 1,
            "fields": list(BUSINESS_CARD_IDENTITY_FIELDS),
        },
        {
            "name": "contact_method",
            "min_required": 1,
            "fields": list(BUSINESS_CARD_CONTACT_FIELDS),
        },
    ],
    "important_fields": list(BUSINESS_CARD_FIELDS),
    "confidence_fields": list(BUSINESS_CARD_CONFIDENCE_FIELDS),
    "optional_fields": [],
}

class GenerationStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"
