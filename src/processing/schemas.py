from typing import Any

from pydantic import BaseModel, Field

from src.common.base_model import CustomModel
from src.processing.constants import GenerationStatus


class BusinessCard(BaseModel):
    name: str = Field(description="The name of the person")
    phones: list[str] = Field(description="The phone number of the person")
    email: str = Field(description="The email address of the person")
    company: str = Field(description="The company name of the person")
    position: str = Field(description="The position of the person")
    address: str = Field(description="The address of the person")
    website: str = Field(description="The website of the person")
    social_profiles: list[str] = Field(
        default_factory=list,
        description="Social profile URLs found on the card (LinkedIn, Facebook, Zalo, etc.)",
    )
    detected_languages: list[str] = Field(
        default_factory=list,
        description="List of detected language codes (e.g., 'vi', 'en', 'other')",
    )


class ExtractionResponse(BaseModel):
    name: str | None = Field(None, description="The name of the person")
    phones: list[str] = Field(default_factory=list, description="The phone number of the person")
    email: str | None = Field(None, description="The email address of the person")
    company: str | None = Field(None, description="The company name of the person")
    position: str | None = Field(None, description="The position of the person")
    address: str | None = Field(None, description="The address of the person")
    website: str | None = Field(None, description="The website of the person")
    social_profiles: list[str] = Field(
        default_factory=list,
        description="Social profile URLs found on the card (LinkedIn, Facebook, Zalo, etc.)",
    )
    detected_languages: list[str] = Field(
        default_factory=list,
        description="List of detected language codes (e.g., 'vi', 'en', 'other')",
    )
    confidence_score: float = Field(0.0, description="Overall confidence score (0.0 to 1.0)")
    field_scores: list[Any] = Field(default_factory=list, description="Detailed scores for each field")


class BusinessCardFields(BaseModel):
    """Extracted and enriched fields from a business card."""

    name: str | None = None
    phone: str | None = None
    email: str | None = None
    web: str | None = None
    position: str | None = None
    company: str | None = None
    industry: str | None = None
    summary: str | None = None
    keywords: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)


class FieldConfidenceSchema(CustomModel):
    field_name: str
    value: Any | None = None
    score: float
    classification: str
    validation_status: str = "passed"
    validation_errors: list[str] = Field(default_factory=list)
    auto_approved: bool
    requires_manual_review: bool
    note: str | None = None


class ConfidenceResponse(CustomModel):
    overall_score: float
    classification: str
    field_scores: list[FieldConfidenceSchema]
    failed_fields: list[str] = Field(default_factory=list)
    requires_manual_review: bool


class DocumentFullStateResponse(CustomModel):
    processing_id: str
    document_type: str | None = None
    status: str
    doc_type: str | None = None
    doc_type_confidence: float | None = None
    confidence_score: float | None = None
    uploaded_at: str | None = None
    processed_at: str | None = None
    raw_ocr_output: Any | None = None
    normalized_fields: dict[str, Any] | None = None
    extracted_fields: dict[str, Any] | None = None
    validation_results: Any | None = None
    confidence_report: ConfidenceResponse | None = None
    confidence: ConfidenceResponse | None = None
    validation: dict[str, Any] | None = None
    processing_history: list[dict[str, Any]] = Field(default_factory=list)


class EnrichmentResultBase(BaseModel):
    professional_brief: str | None = None
    keywords: list[str] | None = None
    highlights: list[str] | None = None


class EnrichmentRequest(BaseModel):
    name: str = Field(description="The name of the person")
    phones: list[str] = Field(description="The phone number of the person")
    email: str = Field(description="The email address of the person")
    company: str = Field(description="The company name of the person")
    position: str = Field(description="The position of the person")
    address: str = Field(description="The address of the person")
    website: str = Field(description="The website of the person")
    social_profiles: list[str] = Field(
        default_factory=list,
        description="Social profile URLs found on the card (LinkedIn, Facebook, Zalo, etc.)",
    )


class EnrichmentResponse(EnrichmentResultBase):
    generation_status: GenerationStatus
