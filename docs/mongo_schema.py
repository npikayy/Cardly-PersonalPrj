"""Current MongoDB collections for the simplified personal project.

Only the models registered in ``src.database.ALL_DOCUMENTS`` create active
collections. Intermediate pipeline artifacts are folded into
``business_card_scans`` and ``json_review_sessions``.
"""

from datetime import datetime
from typing import Any

from beanie import Document, PydanticObjectId
from pydantic import Field


class User(Document):
    email: str
    password_hash: str
    full_name: str
    is_active: bool = False
    created_at: datetime

    class Settings:
        name = "users"


class RefreshToken(Document):
    user_id: PydanticObjectId
    token_hash: str
    expires_at: datetime
    revoked: bool = False

    class Settings:
        name = "refresh_tokens"


class OtpCode(Document):
    email: str
    purpose: str
    code_hash: str
    expires_at: datetime
    used: bool = False

    class Settings:
        name = "otp_codes"


class PasswordResetSession(Document):
    user_id: PydanticObjectId
    token_hash: str
    expires_at: datetime
    used: bool = False

    class Settings:
        name = "password_reset_sessions"


class UploadedImage(Document):
    processing_id: str
    user_id: PydanticObjectId | None = None
    original_filename: str
    storage_path: str
    mime_type: str
    file_size: int
    file_hash_sha256: str
    width: int | None = None
    height: int | None = None
    status: str
    uploaded_at: datetime

    class Settings:
        name = "uploaded_images"


class BusinessCardScan(Document):
    owner_id: str
    processing_id: str
    raw_text: str = ""
    status: str
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
    scanned_at: datetime

    class Settings:
        name = "business_card_scans"


class JsonReviewSession(Document):
    processing_id: str
    user_id: PydanticObjectId | None = None
    raw_ocr_output: dict[str, Any] | str | None = None
    structured_data: dict[str, Any] = Field(default_factory=dict)
    context_data: dict[str, Any] = Field(default_factory=dict)
    confidence_scores: dict[str, Any] = Field(default_factory=dict)
    validation_status: dict[str, Any] = Field(default_factory=dict)
    review_status: str
    edit_logs: list[dict[str, Any]] = Field(default_factory=list)
    final_data: dict[str, Any] | None = None
    is_locked: bool = False
    created_at: datetime
    updated_at: datetime
    confirmed_at: datetime | None = None

    class Settings:
        name = "json_review_sessions"


class FinalizedDocument(Document):
    processing_id: str
    user_id: PydanticObjectId | None = None
    doc_type: str
    final_data: dict[str, Any]
    final_json: dict[str, Any]
    context_data: dict[str, Any] = Field(default_factory=dict)
    source_review_id: PydanticObjectId | None = None
    confirmed_at: datetime

    class Settings:
        name = "finalized_documents"


class DigitalBusinessCard(Document):
    user_id: PydanticObjectId
    slug: str
    full_name: str
    title: str | None = None
    company: str | None = None
    bio: str | None = None
    photo_url: str | None = None
    phone: str | None = None
    email: str | None = None
    zalo: str | None = None
    whatsapp: str | None = None
    linkedin: str | None = None
    website: str | None = None
    highlights: list[str] = Field(default_factory=list)
    is_public: bool = True
    created_at: datetime
    updated_at: datetime

    class Settings:
        name = "digital_business_cards"


ALL_DOCUMENTS = [
    User,
    RefreshToken,
    OtpCode,
    PasswordResetSession,
    UploadedImage,
    BusinessCardScan,
    JsonReviewSession,
    FinalizedDocument,
    DigitalBusinessCard,
]
