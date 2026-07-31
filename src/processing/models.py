from datetime import UTC, datetime
from enum import Enum
from typing import Any

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, ConfigDict, Field

from src.common.enums import DocType, ProcessingStage, StageStatus
from src.processing.constants import BusinessCardScanStatus


class PreprocessingStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"


class PreprocessedImage(Document):
    """Post-preprocessing artifact. Original image is preserved unchanged."""

    processing_id: Indexed(str)  # type: ignore[valid-type]
    source_image_id: PydanticObjectId
    processed_storage_path: str
    resolution_dpi: int
    rotation_applied: int = 0
    brightness_delta: float = 0.0
    contrast_delta: float = 0.0
    output_format: str = "png"
    preprocessing_status: PreprocessingStatus = PreprocessingStatus.PENDING
    steps_applied: list[str] = []
    error_message: str | None = None
    processed_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "preprocessed_images"


class OcrBlock(BaseModel):
    """A single recognized text block from the OCR engine."""

    id: str | None = None
    text: str
    bbox: list[float] = Field(default_factory=list)
    confidence: float


class OcrResult(Document):
    """Raw OCR output kept verbatim for audit / re-review."""

    processing_id: Indexed(str)  # type: ignore[valid-type]
    preprocessed_image_id: PydanticObjectId
    ocr_engine: str
    raw_text: str
    blocks: list[OcrBlock] = []
    overall_confidence: float
    language_detected: str | None = None
    ocr_version: str
    processed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "ocr_results"


class VisionRegion(BaseModel):
    """A semantic region returned by the vision model."""

    label: str
    bbox: list[float]
    confidence: float
    extra: dict[str, Any] = {}


class AiVisionResult(Document):
    """AI-Vision output: document classification + semantic regions."""

    model_config = {"protected_namespaces": ()}

    processing_id: Indexed(str)  # type: ignore[valid-type]
    preprocessed_image_id: PydanticObjectId
    doc_type: DocType
    doc_type_confidence: float
    detected_regions: list[VisionRegion] = []
    model_name: str
    model_version: str
    processed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "ai_vision_results"


class BusinessCardScan(Document):
    owner_id: Indexed(str)  # type: ignore[valid-type]
    processing_id: Indexed(str)  # type: ignore[valid-type]
    raw_text: str = ""
    status: BusinessCardScanStatus = BusinessCardScanStatus.PENDING
    extracted_data: dict[str, Any] = Field(default_factory=dict)
    normalized_fields: dict[str, Any] = Field(default_factory=dict)
    validation_results: list[dict[str, Any]] = Field(default_factory=list)
    field_scores: list[dict[str, Any]] = Field(default_factory=list)
    failed_fields: list[str] = Field(default_factory=list)
    requires_manual_review: bool = False
    ocr_blocks: list[dict[str, Any]] = Field(default_factory=list)
    qr_codes: list[str] = Field(default_factory=list)
    enrichment: dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = 0.0
    scanned_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "business_card_scans"


class MappingStatus(str, Enum):
    PENDING = "pending"
    MAPPED = "mapped"
    PARTIAL = "partial"
    FAILED = "failed"


class FieldValidationResult(BaseModel):
    field_name: str
    rule: str
    passed: bool
    message: str | None = None


class MappedDocument(Document):
    """Structured business data mapped from OCR + Vision results."""

    processing_id: Indexed(str, unique=True)  # type: ignore[valid-type]
    doc_type: DocType
    user_id: PydanticObjectId
    extracted_fields: dict[str, Any]
    normalized_fields: dict[str, Any]
    validation_results: list[FieldValidationResult] = []
    field_block_refs: dict[str, list[str]] = {}
    missing_required_fields: list[str] = []
    mapping_status: MappingStatus = MappingStatus.PENDING
    mapper_version: str
    mapped_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "mapped_documents"


class ConfidenceClass(str, Enum):
    HIGH = "high_confidence"
    LOW = "low_confidence"
    FAILED = "failed_confidence"


class OverallClassification(str, Enum):
    SUCCESS = "success"
    PARTIAL_SUCCESS = "partial_success"
    FAILED = "failed"


class FieldConfidence(BaseModel):
    field_name: str
    value: Any | None = None
    score: float
    classification: ConfidenceClass
    validation_status: str = "passed"
    validation_errors: list[str] = Field(default_factory=list)
    auto_approved: bool = False
    requires_manual_review: bool = False
    note: str | None = None


class ConfidenceReport(Document):
    """Per-document confidence summary used to gate downstream workflows."""

    processing_id: Indexed(str, unique=True)  # type: ignore[valid-type]
    mapped_document_id: PydanticObjectId
    document_type: DocType
    raw_ocr_output: dict[str, Any] | None = None
    normalized_fields: dict[str, Any] = Field(default_factory=dict)
    validation_results: Any = None
    field_scores: list[FieldConfidence]
    overall_score: float
    classification: OverallClassification
    flags: dict[str, bool] = Field(default_factory=dict)
    failed_fields: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    scored_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "confidence_reports"


class ProcessingHistory(Document):
    """Append-only audit log; one row per stage transition per processing_id."""

    processing_id: Indexed(str)  # type: ignore[valid-type]
    stage: ProcessingStage
    status: StageStatus
    details: dict[str, Any] = Field(default_factory=dict)
    ocr_version: str | None = None
    ai_model_version: str | None = None
    duration_ms: int | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "processing_history"


class EnrichmentResultDocument(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    contact_id: str
    professional_brief: str | None = None
    keywords: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    generation_status: str | None = None

    model_config = ConfigDict(populate_by_name=True)
