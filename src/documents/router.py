from typing import Annotated

from fastapi import APIRouter, Depends, Query, UploadFile, status

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.documents import dependencies, review, schemas, service, utils
from src.documents.exceptions import DuplicateFile
from src.documents.models import (
    ConfirmResponse,
    ReviewResponse,
    ReviewUpdateRequest,
    ReviewUpdateResponse,
)
from src.processing.constants import BusinessCardScanStatus
from src.processing.models import BusinessCardScan
from src.processing.pipeline import run_ocr_pipeline

CurrentUser = Annotated[User, Depends(get_current_user)]
UploadFileDep = Annotated[UploadFile, Depends(dependencies.valid_upload_file)]
OptionalUploadFileDep = Annotated[
    UploadFile | None,
    Depends(dependencies.valid_optional_upload_file),
]
SkipQuery = Annotated[int, Query(ge=0, description="Number of records to skip")]
LimitQuery = Annotated[int, Query(ge=1, le=100, description="Max records to return")]
StatusQuery = Annotated[str | None, Query(description="Filter by document status")]

router = APIRouter(prefix="/documents")


@router.get("/health", tags=["health"])
async def intake_health() -> dict:
    return {"module": "intake", "status": "ready"}


@router.post(
    "",
    response_model=schemas.UploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload 1 or 2 document images for OCR processing",
)
async def upload_document(
    file: UploadFileDep,
    current_user: CurrentUser,
    file2: OptionalUploadFileDep = None,
) -> schemas.UploadResponse:
    """Upload 1 or 2 images in a single request."""
    files_to_process = [f for f in [file, file2] if f is not None]

    upload_data = []
    seen_hashes = set()

    for f in files_to_process:
        content = await f.read()
        f_hash = utils.sha256_of_file(content)

        if f_hash in seen_hashes:
            raise DuplicateFile("Two identical files provided in the same request")

        await service.dedupe_by_hash(f_hash, str(current_user.id))

        seen_hashes.add(f_hash)
        upload_data.append((f, content, f_hash))

    processing_id = utils.generate_processing_id()
    entries: list[schemas.FileEntry] = []

    for f, content, f_hash in upload_data:
        doc, url = await service.ingest_single_file(
            str(current_user.id),
            f,
            processing_id,
            content,
            f_hash,
        )
        entries.append(
            schemas.FileEntry(original_filename=doc.original_filename, file_url=url)
        )

    return schemas.UploadResponse(processing_id=processing_id, files=entries)


@router.get(
    "",
    response_model=schemas.DocumentListResponse,
    summary="List documents uploaded by the current user",
)
async def list_documents(
    current_user: CurrentUser,
    skip: SkipQuery = 0,
    limit: LimitQuery = 20,
    status: StatusQuery = None,
) -> schemas.DocumentListResponse:
    """Return a paginated list of documents owned by the authenticated user."""
    docs = await service.list_documents(
        user_id=str(current_user.id),
        skip=skip,
        limit=limit,
        status_filter=status,
    )

    items = [
        schemas.DocumentSummary(
            processing_id=doc.processing_id,
            original_filename=doc.original_filename,
            mime_type=doc.mime_type,
            file_size=doc.file_size,
            status=doc.status.value,
            uploaded_at=doc.uploaded_at,
            file_urls=[doc.file_url] if doc.file_url else [],
        )
        for doc in docs
    ]

    return schemas.DocumentListResponse(
        items=items,
        total=len(items),
        skip=skip,
        limit=limit,
    )


@router.delete(
    "",
    response_model=schemas.QueueClearResponse,
    summary="Clear the current user's scan queue",
)
async def clear_document_queue(current_user: CurrentUser) -> schemas.QueueClearResponse:
    """Delete uploaded scan queue artifacts while preserving saved contacts."""
    deleted_count = await service.clear_document_queue(user_id=str(current_user.id))
    return schemas.QueueClearResponse(deleted_count=deleted_count)


@router.get(
    "/contacts",
    response_model=schemas.ContactListResponse,
    summary="List finalized contacts saved by the current user",
)
async def list_contacts(current_user: CurrentUser) -> schemas.ContactListResponse:
    """Return contacts created after OCR review confirmation."""
    contacts = await service.list_contacts(user_id=str(current_user.id))
    items = []
    for contact in contacts:
        image_urls = await service.get_contact_image_urls(
            processing_id=contact.processing_id,
            user_id=str(current_user.id),
        )
        items.append(schemas.ContactSummary(**service.contact_to_summary(contact, image_urls=image_urls)))

    return schemas.ContactListResponse(items=items, total=len(items))


@router.post(
    "/contacts",
    response_model=schemas.ContactSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Create a contact manually",
)
async def create_contact(
    body: schemas.ContactCreateRequest,
    current_user: CurrentUser,
) -> schemas.ContactSummary:
    """Create a business-card contact without running OCR."""
    contact = await service.create_manual_contact(
        user_id=str(current_user.id),
        data=body.model_dump(),
    )
    return schemas.ContactSummary(**service.contact_to_summary(contact, image_urls=[]))


@router.delete(
    "/contacts/{contact_id}",
    response_model=schemas.ContactDeleteResponse,
    summary="Delete one finalized contact",
)
async def delete_contact(
    contact_id: str,
    current_user: CurrentUser,
) -> schemas.ContactDeleteResponse:
    """Delete a contact saved from an OCR review confirmation."""
    await service.delete_contact(
        contact_id=contact_id,
        user_id=str(current_user.id),
    )
    return schemas.ContactDeleteResponse(id=contact_id)


@router.get(
    "/digital-card",
    response_model=schemas.DigitalCardResponse | None,
    summary="Get the current user's digital business card",
)
async def get_digital_card(current_user: CurrentUser) -> schemas.DigitalCardResponse | None:
    """Return the user's shareable digital business card profile."""
    card = await service.get_digital_card(user_id=str(current_user.id))
    if card is None:
        return None
    return schemas.DigitalCardResponse(**service.digital_card_to_response(card))


@router.put(
    "/digital-card",
    response_model=schemas.DigitalCardResponse,
    summary="Create or update the current user's digital business card",
)
async def upsert_digital_card(
    body: schemas.DigitalCardRequest,
    current_user: CurrentUser,
) -> schemas.DigitalCardResponse:
    """Save a public digital business card profile for the current user."""
    card = await service.upsert_digital_card(
        user_id=str(current_user.id),
        data=body.model_dump(),
    )
    return schemas.DigitalCardResponse(**service.digital_card_to_response(card))


@router.get(
    "/digital-cards/{slug}/public",
    response_model=schemas.PublicDigitalCardResponse,
    summary="Get a public digital business card by slug",
)
async def get_public_digital_card(slug: str) -> schemas.PublicDigitalCardResponse:
    """Return a public digital card profile by custom slug."""
    card = await service.get_public_digital_card(slug)
    return schemas.PublicDigitalCardResponse(**service.public_digital_card_to_response(card))


@router.get(
    "/{doc_id}/image",
    summary="Get Cloudinary URLs for the original uploaded image(s)",
)
async def get_document_image(doc_id: str, current_user: CurrentUser) -> dict[str, list[str]]:
    """Return Cloudinary URLs for the original images."""
    urls = await service.get_image_urls(
        processing_id=doc_id,
        user_id=str(current_user.id),
    )
    return {"urls": urls}


@router.delete(
    "/{doc_id}",
    response_model=schemas.DeleteResponse,
    summary="Hard-delete a document",
)
async def delete_document(doc_id: str, current_user: CurrentUser) -> schemas.DeleteResponse:
    """Permanently delete a document and all related data from DB and Cloudinary."""
    await service.hard_delete(processing_id=doc_id, user_id=str(current_user.id))
    return schemas.DeleteResponse(processing_id=doc_id)


@router.post(
    "/{processing_id}/ocr",
    response_model=ReviewResponse,
    summary="Run OCR for a document and return the review session",
)
async def run_document_ocr(
    processing_id: str,
    current_user: CurrentUser,
) -> ReviewResponse:
    """Run PaddleOCR + Gemini extraction for one uploaded document."""
    await service.ensure_document_owner(
        processing_id=processing_id,
        user_id=str(current_user.id),
    )

    scan = await BusinessCardScan.find_one(
        BusinessCardScan.processing_id == processing_id,
        BusinessCardScan.status == BusinessCardScanStatus.COMPLETED,
    )
    if scan is None:
        await run_ocr_pipeline(processing_id=processing_id, user=current_user)

    return await review.get_or_create_review_session(
        processing_id=processing_id,
        user_id=current_user.id,
    )


@router.get(
    "/{processing_id}/review",
    response_model=ReviewResponse,
    summary="Get or create a document result review session",
)
async def get_review_session(
    processing_id: str,
    current_user: CurrentUser,
) -> ReviewResponse:
    """Return the structured JSON and review metadata for one document."""
    return await review.get_or_create_review_session(
        processing_id=processing_id,
        user_id=current_user.id,
    )


@router.patch(
    "/{processing_id}/review",
    response_model=ReviewUpdateResponse,
    summary="Update reviewed document fields",
)
async def update_review_session(
    processing_id: str,
    body: ReviewUpdateRequest,
    current_user: CurrentUser,
) -> ReviewUpdateResponse:
    """Apply JSON field edits and persist audit logs."""
    return await review.update_review_session(
        processing_id=processing_id,
        updates=body.updates,
        context=body.context,
        edited_by=str(current_user.id),
    )


@router.post(
    "/{processing_id}/confirm",
    response_model=ConfirmResponse,
    summary="Finalize the reviewed result and lock the document",
)
async def confirm_review_session(
    processing_id: str,
    current_user: CurrentUser,
) -> ConfirmResponse:
    """Validate the final JSON and create immutable downstream data."""
    return await review.confirm_review_session(processing_id)
