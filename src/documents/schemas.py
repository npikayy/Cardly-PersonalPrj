from datetime import UTC, datetime

from src.common.base_model import CustomModel


class FileEntry(CustomModel):
    """Metadata for one uploaded file within a submission."""

    original_filename: str
    file_url: str


class UploadResponse(CustomModel):
    """Response returned after a successful upload (1 or 2 files, 202 Accepted)."""

    processing_id: str
    files: list[FileEntry]
    status: str = "queued"
    uploaded_at: datetime = datetime.now(tz=UTC)


class DocumentSummary(CustomModel):
    """Lightweight summary of one uploaded document, used in the list endpoint."""

    processing_id: str
    original_filename: str
    mime_type: str
    file_size: int
    status: str
    uploaded_at: datetime
    file_urls: list[str] = []


class DocumentListResponse(CustomModel):
    """Response containing a list of document summaries and pagination metadata."""

    items: list[DocumentSummary]
    total: int
    skip: int
    limit: int


class ContactSummary(CustomModel):
    """Business-card contact saved after OCR review confirmation."""

    id: str
    processing_id: str
    name: str | None = None
    company: str | None = None
    position: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    social_profiles: list[str] = []
    professional_brief: str | None = None
    keywords: list[str] = []
    highlights: list[str] = []
    event_name: str | None = None
    location: str | None = None
    source: str | None = None
    tags: list[str] = []
    notes: str | None = None
    qr_codes: list[str] = []
    public_url: str | None = None
    image_urls: list[str] = []
    confirmed_at: datetime


class ContactCreateRequest(CustomModel):
    """Manual contact payload."""

    name: str | None = None
    company: str | None = None
    position: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    social_profiles: list[str] = []
    professional_brief: str | None = None
    keywords: list[str] = []
    highlights: list[str] = []
    event_name: str | None = None
    location: str | None = None
    source: str | None = "Manual"
    tags: list[str] = []
    notes: str | None = None


class ContactUpdateRequest(ContactCreateRequest):
    """Editable contact payload."""


class ContactListResponse(CustomModel):
    """Response containing contacts saved by the current user."""

    items: list[ContactSummary]
    total: int


class ContactImportResponse(CustomModel):
    items: list[ContactSummary]
    total: int


class ContactDeleteResponse(CustomModel):
    """Response returned after deleting a finalized contact."""

    id: str
    status: str = "deleted"


class ContactBundleCreateRequest(CustomModel):
    contact_ids: list[str]


class ContactBundleResponse(CustomModel):
    id: str
    public_url: str
    qr_svg: str
    contacts: list[ContactSummary]
    total: int
    created_at: datetime


class ContactBundleListResponse(CustomModel):
    items: list[ContactBundleResponse]
    total: int


class ContactBundleDeleteResponse(CustomModel):
    id: str
    status: str = "deleted"


class QueueClearResponse(CustomModel):
    """Response returned after clearing uploaded scan queue records."""

    deleted_count: int
    status: str = "cleared"


class DigitalCardRequest(CustomModel):
    """Create or update the user's public digital business card."""

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
    address: str | None = None
    social_profiles: list[str] = []
    professional_brief: str | None = None
    keywords: list[str] = []
    tags: list[str] = []
    notes: str | None = None
    highlights: list[str] = []
    is_public: bool = True


class DigitalCardResponse(DigitalCardRequest):
    id: str
    public_url: str
    qr_svg: str
    created_at: datetime
    updated_at: datetime


class PublicDigitalCardResponse(CustomModel):
    """Public profile response by slug."""

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
    address: str | None = None
    social_profiles: list[str] = []
    professional_brief: str | None = None
    keywords: list[str] = []
    tags: list[str] = []
    notes: str | None = None
    highlights: list[str] = []
    qr_svg: str


class QrDecodeResponse(CustomModel):
    values: list[str]


class DeleteResponse(CustomModel):
    """Response returned after a successful document hard-delete."""

    processing_id: str
    status: str = "deleted"
