from __future__ import annotations

import base64
import io
import re
from collections.abc import Iterator
from contextlib import suppress
from datetime import datetime
from typing import TYPE_CHECKING
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from PIL import Image

from src.config import settings

from . import config as intake_cfg
from .exceptions import DuplicateFile

if TYPE_CHECKING:
    from .models import UploadedImage


async def validate_mime(mime_type: str) -> None:
    if mime_type not in intake_cfg.intake_settings.ALLOWED_MIMES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"MIME type {mime_type} not allowed",
        )


async def validate_size(content_length: int) -> None:
    max_bytes = intake_cfg.intake_settings.MAX_SIZE_MB * 1024 * 1024
    if content_length > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds max size of {intake_cfg.intake_settings.MAX_SIZE_MB} MB",
        )


async def detect_corrupted(file_content: bytes, mime_type: str) -> None:
    if mime_type.startswith("image/"):
        try:
            img = Image.open(io.BytesIO(file_content))
            img.verify()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded image is corrupted or unreadable",
            ) from exc


async def validate_file_format(file_content: bytes, mime_type: str) -> None:
    """Validate that the uploaded bytes match the declared MIME type."""
    if mime_type.startswith("image/"):
        try:
            Image.open(io.BytesIO(file_content)).verify()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match declared image MIME type",
            ) from exc


async def dedupe_by_hash(file_hash: str, user_id: str) -> None:
    """Raise 409 if a document with the same SHA-256 hash already exists in DB for this user."""
    # Local import to avoid circular dependency with models.py
    from beanie import PydanticObjectId

    from src.documents.models import FinalizedDocument, ImageStatus, UploadedImage

    criteria = [
        UploadedImage.file_hash_sha256 == file_hash,
        UploadedImage.status != ImageStatus.REJECTED_DUPLICATE
    ]

    if user_id != "MOCK_USER":
        try:
            user_oid = PydanticObjectId(user_id)
            criteria.append(UploadedImage.user_id == user_oid)
        except Exception:
            pass

    existing = await UploadedImage.find_one(*criteria)
    if existing is not None:
        raise DuplicateFile()


async def get_image_dimensions(file_content: bytes) -> tuple[int | None, int | None]:
    """Return (width, height) of an image byte stream."""
    try:
        with Image.open(io.BytesIO(file_content)) as img:
            return img.width, img.height
    except Exception:
        return None, None


def _configure_cloudinary() -> None:
    """Configure the Cloudinary SDK from intake settings."""
    try:
        import cloudinary
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary dependency is not installed",
        ) from exc

    settings = intake_cfg.intake_settings
    if not (
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    ):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary credentials are not configured",
        )

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def _cloudinary_uploader():
    try:
        import cloudinary.uploader
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary dependency is not installed",
        ) from exc
    return cloudinary.uploader


def _safe_cloudinary_segment(value: str, fallback: str) -> str:
    cleaned = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in value.strip())
    return cleaned or fallback


def _cloudinary_user_folder(user_id: str) -> str:
    base_folder = intake_cfg.intake_settings.CLOUDINARY_FOLDER.strip().strip("/") or "cardly"
    safe_user_id = _safe_cloudinary_segment(user_id, "unknown_user")
    return f"{base_folder}/{safe_user_id}"


def _cloudinary_public_id(filename: str, processing_id: str) -> str:
    stem = filename.rsplit(".", 1)[0].strip() or "document"
    safe_stem = _safe_cloudinary_segment(stem, "document")
    safe_processing_id = _safe_cloudinary_segment(processing_id, "processing")
    return f"{safe_processing_id}/{safe_stem}"


def _cloudinary_avatar_public_id(filename: str) -> str:
    stem = filename.rsplit(".", 1)[0].strip() or "avatar"
    safe_stem = _safe_cloudinary_segment(stem, "avatar")
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    return f"avatar/{timestamp}_{safe_stem}"


def _cloudinary_url(public_id: str) -> str:
    _configure_cloudinary()
    try:
        import cloudinary
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary dependency is not installed",
        ) from exc
    return cloudinary.CloudinaryImage(public_id).build_url(secure=True)


async def save_to_storage(
    file_content: bytes,
    filename: str,
    processing_id: str,
    user_id: str,
    mime_type: str,
) -> tuple[str, str]:
    """Upload the file bytes to Cloudinary and return (secure URL, public ID)."""
    _configure_cloudinary()
    uploader = _cloudinary_uploader()
    folder = _cloudinary_user_folder(user_id)
    public_id = _cloudinary_public_id(filename, processing_id)

    result = await run_in_threadpool(
        uploader.upload,
        f"data:{mime_type};base64,{base64.b64encode(file_content).decode()}",
        folder=folder,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
    )
    return str(result["secure_url"]), str(result["public_id"])


async def save_avatar_to_storage(
    file_content: bytes,
    filename: str,
    user_id: str,
    mime_type: str,
) -> tuple[str, str]:
    """Upload an avatar image to the user's Cloudinary avatar folder."""
    _configure_cloudinary()
    uploader = _cloudinary_uploader()
    folder = _cloudinary_user_folder(user_id)
    public_id = _cloudinary_avatar_public_id(filename)

    result = await run_in_threadpool(
        uploader.upload,
        f"data:{mime_type};base64,{base64.b64encode(file_content).decode()}",
        folder=folder,
        public_id=public_id,
        overwrite=False,
        resource_type="image",
    )
    return str(result["secure_url"]), str(result["public_id"])


async def delete_image_from_storage(public_id: str) -> None:
    """Delete one image from Cloudinary if it has a public id."""
    if not public_id:
        return
    _configure_cloudinary()
    uploader = _cloudinary_uploader()
    await run_in_threadpool(uploader.destroy, public_id, resource_type="image")


async def ingest_single_file(
    current_user_id: str,
    file: UploadFile,
    processing_id: str,
    file_content: bytes,
    file_hash: str,
) -> tuple[UploadedImage, str]:
    """Persist to Cloudinary and insert one UploadFile into MongoDB.

    Returns (UploadedImage document, Cloudinary secure URL).
    """
    from src.documents.models import FinalizedDocument, ImageStatus, UploadedImage
    filename = file.filename or "unnamed_document"
    mime_type = file.content_type or "application/octet-stream"

    width, height = await get_image_dimensions(file_content)

    url, public_id = await save_to_storage(
        file_content,
        filename,
        processing_id,
        current_user_id,
        mime_type,
    )

    doc = UploadedImage(
        processing_id=processing_id,
        user_id=current_user_id,
        original_filename=filename,
        storage_path=public_id,
        mime_type=mime_type,
        file_size=len(file_content),
        file_hash_sha256=file_hash,
        width=width,
        height=height,
        status=ImageStatus.RECEIVED,
    )
    await doc.insert()
    return doc, url



async def list_documents(
    *,
    user_id: str,
    skip: int = 0,
    limit: int = 20,
    status_filter: str | None = None,
) -> list[UploadedImage]:
    """Return paginated UploadedImage documents for the given user."""
    from beanie import PydanticObjectId

    from src.documents.models import FinalizedDocument, ImageStatus, UploadedImage

    query_conditions = [UploadedImage.status != ImageStatus.REJECTED_DUPLICATE]

    if user_id != "MOCK_USER":
        try:
            oid = PydanticObjectId(user_id)
            query_conditions.append(UploadedImage.user_id == oid)
        except Exception:
            pass

    if status_filter:
        try:
            query_conditions.append(UploadedImage.status == ImageStatus(status_filter))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status filter: '{status_filter}'",
            ) from exc

    docs = await UploadedImage.find(*query_conditions).sort(-UploadedImage.uploaded_at).skip(skip).limit(limit).to_list()

    if not docs:
        return []

    for doc in docs:
        with suppress(Exception):
            doc.file_url = _cloudinary_url(doc.storage_path)
        with suppress(Exception):
            finalized = await FinalizedDocument.find_one(FinalizedDocument.processing_id == doc.processing_id)
            doc.review_status = "confirmed" if finalized else None

    return docs


async def list_contacts(*, user_id: str) -> list:
    """Return finalized business-card contacts for the current user."""
    from beanie import PydanticObjectId

    from src.documents.models import FinalizedDocument

    try:
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    return await FinalizedDocument.find(
        FinalizedDocument.user_id == user_oid,
    ).sort(-FinalizedDocument.confirmed_at).to_list()


async def create_manual_contact(*, user_id: str, data: dict) -> object:
    """Create a finalized contact without OCR."""
    from beanie import PydanticObjectId

    from src.common.enums import DocType
    from src.documents.models import FinalizedDocument

    try:
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    now = datetime.utcnow()
    processing_id = f"MAN-{now.strftime('%Y%m%d%H%M%S%f')}"
    final_data = _manual_contact_final_data(data)
    context_data = _contact_context(data)
    contact = FinalizedDocument(
        processing_id=processing_id,
        user_id=user_oid,
        doc_type=DocType.BUSINESS_CARD,
        final_data=final_data,
        final_json=final_data,
        context_data=context_data,
        source_review_id=None,
        confirmed_at=now,
    )
    await contact.insert()
    return contact


def decode_qr_values(image_data: bytes) -> list[str]:
    """Decode QR code values from one image byte payload."""
    try:
        import cv2
        import numpy as np
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="QR decoding dependencies are not installed",
        ) from exc

    img_np = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
    if img_np is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot decode uploaded QR image")

    detector = cv2.QRCodeDetector()
    values: list[str] = []

    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    variants = [
        img_np,
        gray,
        cv2.resize(gray, None, fx=1.75, fy=1.75, interpolation=cv2.INTER_CUBIC),
        cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
        cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 41, 3),
    ]
    for variant in variants:
        with suppress(Exception):
            ok, decoded_info, _, _ = detector.detectAndDecodeMulti(variant)
            if ok:
                values.extend(value for value in decoded_info if value)
        if values:
            break
        with suppress(Exception):
            value, _, _ = detector.detectAndDecode(variant)
            if value:
                values.append(value)
        if values:
            break

    return list(dict.fromkeys(values))


async def create_contact_from_digital_qr(*, user_id: str, image_data: bytes) -> object:
    """Decode a Cardly public card QR or contact vCard QR and save it as a contact."""
    contacts = await create_contacts_from_qr(user_id=user_id, image_data=image_data)
    return contacts[0]


async def create_contacts_from_qr(*, user_id: str, image_data: bytes) -> list[object]:
    """Decode a Cardly card/contact/bundle QR image and save one or more contacts."""
    qr_values = decode_qr_values(image_data)
    if not qr_values:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No QR code found in image")

    slug = _slug_from_cardly_qr(qr_values)
    if not slug:
        shared_contact_id = _contact_id_from_share_qr(qr_values)
        if shared_contact_id:
            shared_contact = await get_public_contact(shared_contact_id)
            shared_payload = contact_to_summary(shared_contact, image_urls=[])
            contact = await create_manual_contact(
                user_id=user_id,
                data={
                    "name": shared_payload.get("name"),
                    "company": shared_payload.get("company"),
                    "position": shared_payload.get("position"),
                    "email": shared_payload.get("email"),
                    "phone": shared_payload.get("phone"),
                    "website": shared_payload.get("website"),
                    "address": shared_payload.get("address"),
                    "social_profiles": shared_payload.get("social_profiles") or [],
                    "professional_brief": shared_payload.get("professional_brief"),
                    "keywords": shared_payload.get("keywords") or [],
                    "highlights": shared_payload.get("highlights") or [],
                    "tags": shared_payload.get("tags") or [],
                    "notes": shared_payload.get("notes"),
                    "source": "Contact QR",
                },
            )
            return [contact]
        bundle_id = _bundle_id_from_share_qr(qr_values)
        if bundle_id:
            contacts = await create_contacts_from_bundle(user_id=user_id, bundle_id=bundle_id)
            if not contacts:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Contact bundle is empty")
            return contacts
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="QR code does not contain a Cardly digital card or shared contact link",
        )

    card = await get_public_digital_card(slug)
    social_profiles = _clean_list(getattr(card, "social_profiles", []))
    for value in (getattr(card, "linkedin", None), getattr(card, "website", None)):
        clean_value = _clean_str(value)
        if clean_value and clean_value not in social_profiles:
            social_profiles.append(clean_value)

    contact = await create_manual_contact(
        user_id=user_id,
        data={
            "name": getattr(card, "full_name", None),
            "company": getattr(card, "company", None),
            "position": getattr(card, "title", None),
            "email": getattr(card, "email", None),
            "phone": getattr(card, "phone", None),
            "website": getattr(card, "website", None),
            "address": getattr(card, "address", None),
            "social_profiles": social_profiles,
            "professional_brief": getattr(card, "professional_brief", None) or getattr(card, "bio", None),
            "keywords": getattr(card, "keywords", []) or [],
            "highlights": getattr(card, "highlights", []) or [],
            "tags": getattr(card, "tags", []) or [],
            "notes": getattr(card, "notes", None),
            "qr_codes": qr_values,
            "source": "Digital QR",
        },
    )
    return [contact]


async def update_contact(*, contact_id: str, user_id: str, data: dict) -> object:
    """Update one finalized contact owned by the current user."""
    from beanie import PydanticObjectId

    from src.documents.models import FinalizedDocument

    try:
        contact_oid = PydanticObjectId(contact_id)
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found") from exc

    contact = await FinalizedDocument.find_one(
        FinalizedDocument.id == contact_oid,
        FinalizedDocument.user_id == user_oid,
    )
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    final_data = _manual_contact_final_data(data)
    context_data = _contact_context({
        **data,
        "source": data.get("source") or (contact.context_data or {}).get("source") or "Manual",
    })
    contact.final_data = final_data
    contact.final_json = final_data
    contact.context_data = context_data
    await contact.save()
    return contact


async def delete_contact(*, contact_id: str, user_id: str) -> None:
    """Delete one finalized contact owned by the current user."""
    from beanie import PydanticObjectId

    from src.documents.models import FinalizedDocument

    try:
        contact_oid = PydanticObjectId(contact_id)
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found") from exc

    contact = await FinalizedDocument.find_one(
        FinalizedDocument.id == contact_oid,
        FinalizedDocument.user_id == user_oid,
    )
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    if not contact.processing_id.startswith("MAN-"):
        await hard_delete(processing_id=contact.processing_id, user_id=user_id)
        return

    await contact.delete()


async def get_contact_image_urls(*, processing_id: str, user_id: str) -> list[str]:
    """Return original business-card image URLs for a finalized contact."""
    if processing_id.startswith("MAN-"):
        return []

    try:
        return await get_image_urls(processing_id=processing_id, user_id=user_id)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            return []
        raise


async def clear_document_queue(*, user_id: str) -> int:
    """Delete all scan queue artifacts for the current user, preserving saved contacts."""
    import asyncio

    from beanie import PydanticObjectId

    from src.documents.models import JsonReviewSession, UploadedImage
    from src.processing.models import BusinessCardScan

    try:
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    uploaded_images = await UploadedImage.find(UploadedImage.user_id == user_oid).to_list()
    processing_ids = sorted({doc.processing_id for doc in uploaded_images})
    public_ids = [doc.storage_path for doc in uploaded_images if doc.storage_path]

    deleted_count = len(processing_ids)
    if not processing_ids:
        return 0

    await asyncio.gather(
        UploadedImage.find({"processing_id": {"$in": processing_ids}}).delete(),
        BusinessCardScan.find({"processing_id": {"$in": processing_ids}}).delete(),
        JsonReviewSession.find({"processing_id": {"$in": processing_ids}}).delete(),
    )

    if public_ids:
        _configure_cloudinary()
        uploader = _cloudinary_uploader()
        for public_id in public_ids:
            with suppress(Exception):
                await run_in_threadpool(uploader.destroy, public_id, resource_type="image")

    return deleted_count


async def get_digital_card(*, user_id: str) -> object | None:
    """Return the user's digital card if it exists."""
    from beanie import PydanticObjectId

    from src.documents.models import DigitalBusinessCard

    try:
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    return await DigitalBusinessCard.find_one(DigitalBusinessCard.user_id == user_oid)


async def upsert_digital_card(*, user_id: str, data: dict) -> object:
    """Create or update the user's public digital business card."""
    from beanie import PydanticObjectId

    from src.documents.models import DigitalBusinessCard

    try:
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    slug = _normalize_slug(data.get("slug", ""))
    existing_slug = await DigitalBusinessCard.find_one(DigitalBusinessCard.slug == slug)
    existing_user_card = await DigitalBusinessCard.find_one(DigitalBusinessCard.user_id == user_oid)
    if existing_slug and (not existing_user_card or existing_slug.id != existing_user_card.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Digital card slug is already taken")

    payload = {
        "slug": slug,
        "full_name": str(data.get("full_name") or "").strip(),
        "title": _clean_str(data.get("title")),
        "company": _clean_str(data.get("company")),
        "bio": _clean_str(data.get("bio")),
        "photo_url": _clean_str(data.get("photo_url")),
        "phone": _clean_str(data.get("phone")),
        "email": _clean_str(data.get("email")),
        "zalo": _clean_str(data.get("zalo")),
        "whatsapp": _clean_str(data.get("whatsapp")),
        "linkedin": _clean_str(data.get("linkedin")),
        "website": _clean_str(data.get("website")),
        "address": _clean_str(data.get("address")),
        "social_profiles": _clean_list(data.get("social_profiles")),
        "professional_brief": _clean_str(data.get("professional_brief")),
        "keywords": _clean_list(data.get("keywords")),
        "tags": _clean_list(data.get("tags")),
        "notes": _clean_str(data.get("notes")),
        "highlights": _clean_list(data.get("highlights")),
        "is_public": bool(data.get("is_public", True)),
        "updated_at": datetime.utcnow(),
    }
    if not payload["full_name"]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="full_name is required")

    if existing_user_card:
        for key, value in payload.items():
            setattr(existing_user_card, key, value)
        await existing_user_card.save()
        return existing_user_card

    card = DigitalBusinessCard(user_id=user_oid, created_at=datetime.utcnow(), **payload)
    await card.insert()
    return card


async def get_public_digital_card(slug: str) -> object:
    """Return a public digital card by slug."""
    from src.documents.models import DigitalBusinessCard

    card = await DigitalBusinessCard.find_one(
        DigitalBusinessCard.slug == _normalize_slug(slug),
        DigitalBusinessCard.is_public == True,  # noqa: E712
    )
    if card is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Digital card not found")
    return card


def contact_to_summary(contact: object, *, image_urls: list[str] | None = None) -> dict:
    """Convert a FinalizedDocument into a contact API payload."""
    data = getattr(contact, "final_data", None) or {}
    context = getattr(contact, "context_data", None) or {}
    phone = data.get("phone") or data.get("phones")
    if isinstance(phone, list):
        phone = ", ".join(str(item) for item in phone if item)

    public_url = _contact_share_url(str(contact.id))
    return {
        "id": str(contact.id),
        "processing_id": contact.processing_id,
        "name": data.get("name"),
        "company": data.get("company"),
        "position": data.get("position"),
        "email": data.get("email"),
        "phone": phone,
        "website": data.get("website") or data.get("web"),
        "address": data.get("address"),
        "social_profiles": data.get("social_profiles") or [],
        "professional_brief": data.get("professional_brief"),
        "keywords": data.get("keywords") or [],
        "highlights": data.get("highlights") or [],
        "event_name": context.get("event_name"),
        "location": context.get("location"),
        "source": context.get("source"),
        "tags": context.get("tags") or [],
        "notes": context.get("notes"),
        "qr_codes": [public_url],
        "public_url": public_url,
        "image_urls": image_urls or [],
        "confirmed_at": contact.confirmed_at,
    }


async def get_public_contact(contact_id: str) -> object:
    """Return a contact by id for public sharing."""
    from beanie import PydanticObjectId

    from src.documents.models import FinalizedDocument

    try:
        contact_oid = PydanticObjectId(contact_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found") from exc

    contact = await FinalizedDocument.get(contact_oid)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


async def create_contact_bundle(*, user_id: str, contact_ids: list[str]) -> object:
    """Create a public bundle from contacts owned by the current user."""
    from beanie import PydanticObjectId

    from src.documents.models import ContactBundle, FinalizedDocument

    try:
        user_oid = PydanticObjectId(user_id)
        contact_oids = [PydanticObjectId(contact_id) for contact_id in dict.fromkeys(contact_ids) if contact_id]
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid contact id") from exc

    if not contact_oids:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Select at least one contact")

    contacts = []
    for contact_oid in contact_oids:
        contact = await FinalizedDocument.find_one(
            FinalizedDocument.id == contact_oid,
            FinalizedDocument.user_id == user_oid,
        )
        if contact is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more contacts were not found")
        contacts.append(contact)

    snapshots = [_bundle_contact_snapshot(contact) for contact in contacts]
    bundle = ContactBundle(user_id=user_oid, contacts=snapshots)
    await bundle.insert()
    return bundle


async def list_contact_bundles(*, user_id: str) -> list[object]:
    """Return contact bundles created by the current user."""
    from beanie import PydanticObjectId

    from src.documents.models import ContactBundle

    try:
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    return await ContactBundle.find(ContactBundle.user_id == user_oid).sort(-ContactBundle.created_at).to_list()


async def delete_contact_bundle(*, bundle_id: str, user_id: str) -> None:
    """Delete one contact bundle owned by the current user."""
    from beanie import PydanticObjectId

    from src.documents.models import ContactBundle

    try:
        bundle_oid = PydanticObjectId(bundle_id)
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact bundle not found") from exc

    bundle = await ContactBundle.find_one(ContactBundle.id == bundle_oid, ContactBundle.user_id == user_oid)
    if bundle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact bundle not found")
    await bundle.delete()


async def get_public_contact_bundle(bundle_id: str) -> object:
    """Return a public contact bundle by id."""
    from beanie import PydanticObjectId

    from src.documents.models import ContactBundle

    try:
        bundle_oid = PydanticObjectId(bundle_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact bundle not found") from exc

    bundle = await ContactBundle.get(bundle_oid)
    if bundle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact bundle not found")
    return bundle


async def create_contacts_from_bundle(*, user_id: str, bundle_id: str) -> list[object]:
    """Copy all contacts from a public bundle into the current user's address book."""
    bundle = await get_public_contact_bundle(bundle_id)
    contacts = []
    for snapshot in getattr(bundle, "contacts", []) or []:
        contacts.append(await create_manual_contact(user_id=user_id, data={**snapshot, "source": "Contact Bundle"}))
    return contacts


def contact_bundle_to_response(bundle: object) -> dict:
    public_url = _bundle_share_url(str(bundle.id))
    contacts = [
        {
            **snapshot,
            "id": f"{bundle.id}-{index}",
            "processing_id": snapshot.get("processing_id") or f"BUNDLE-{index + 1}",
            "qr_codes": [],
            "public_url": None,
            "image_urls": [],
            "confirmed_at": snapshot.get("confirmed_at") or bundle.created_at,
        }
        for index, snapshot in enumerate(getattr(bundle, "contacts", []) or [])
    ]
    return {
        "id": str(bundle.id),
        "public_url": public_url,
        "qr_svg": _qr_svg(public_url),
        "contacts": contacts,
        "total": len(contacts),
        "created_at": bundle.created_at,
    }


def digital_card_to_response(card: object) -> dict:
    """Convert a DigitalBusinessCard document into API response data."""
    public_url = _digital_card_url(card.slug)
    return {
        "id": str(card.id),
        "slug": card.slug,
        "full_name": card.full_name,
        "title": card.title,
        "company": card.company,
        "bio": card.bio,
        "photo_url": card.photo_url,
        "phone": card.phone,
        "email": card.email,
        "zalo": card.zalo,
        "whatsapp": card.whatsapp,
        "linkedin": card.linkedin,
        "website": card.website,
        "address": getattr(card, "address", None),
        "social_profiles": getattr(card, "social_profiles", []) or [],
        "professional_brief": getattr(card, "professional_brief", None),
        "keywords": getattr(card, "keywords", []) or [],
        "tags": getattr(card, "tags", []) or [],
        "notes": getattr(card, "notes", None),
        "highlights": card.highlights,
        "is_public": card.is_public,
        "public_url": public_url,
        "qr_svg": _qr_svg(public_url),
        "created_at": card.created_at,
        "updated_at": card.updated_at,
    }


def public_digital_card_to_response(card: object) -> dict:
    """Convert a public DigitalBusinessCard document into API response data."""
    payload = digital_card_to_response(card)
    return {key: payload[key] for key in (
        "slug",
        "full_name",
        "title",
        "company",
        "bio",
        "photo_url",
        "phone",
        "email",
        "zalo",
        "whatsapp",
        "linkedin",
        "website",
        "address",
        "social_profiles",
        "professional_brief",
        "keywords",
        "tags",
        "notes",
        "highlights",
        "qr_svg",
    )}


def _manual_contact_final_data(data: dict) -> dict:
    phones = _clean_list(data.get("phones") or data.get("phone"))
    return {
        "name": _clean_str(data.get("name")),
        "company": _clean_str(data.get("company")),
        "position": _clean_str(data.get("position")),
        "email": _clean_str(data.get("email")),
        "phones": phones,
        "website": _clean_str(data.get("website") or data.get("web")),
        "address": _clean_str(data.get("address")),
        "social_profiles": _clean_list(data.get("social_profiles")),
        "professional_brief": _clean_str(data.get("professional_brief")),
        "keywords": _clean_list(data.get("keywords")),
        "highlights": _clean_list(data.get("highlights")),
        "qr_codes": _clean_list(data.get("qr_codes")),
    }


def _contact_context(data: dict) -> dict:
    return {
        "event_name": _clean_str(data.get("event_name")),
        "location": _clean_str(data.get("location")),
        "source": _clean_str(data.get("source")) or "Manual",
        "tags": _clean_list(data.get("tags")),
        "notes": _clean_str(data.get("notes")),
    }


def _clean_str(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _clean_list(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        raw_items = re.split(r"[,;\n]", value)
    elif isinstance(value, list):
        raw_items = value
    else:
        raw_items = [value]
    return [str(item).strip() for item in raw_items if str(item).strip()]


def _normalize_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9-]+", "-", value.strip().lower())
    slug = re.sub(r"-+", "-", slug).strip("-")
    if not slug:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="slug is required")
    return slug


def _slug_from_cardly_qr(values: list[str]) -> str | None:
    for value in values:
        text = str(value or "").strip()
        if not text:
            continue
        parsed = urlparse(text)
        path = parsed.path if parsed.scheme else text
        match = re.search(r"/card/([^/?#]+)", path)
        if match:
            return _normalize_slug(match.group(1))
    return None


def _contact_id_from_share_qr(values: list[str]) -> str | None:
    for value in values:
        text = str(value or "").strip()
        if not text:
            continue
        parsed = urlparse(text)
        path = parsed.path if parsed.scheme else text
        match = re.search(r"/contact/([^/?#]+)", path)
        if match:
            return match.group(1)
    return None


def _bundle_id_from_share_qr(values: list[str]) -> str | None:
    for value in values:
        text = str(value or "").strip()
        if not text:
            continue
        parsed = urlparse(text)
        path = parsed.path if parsed.scheme else text
        match = re.search(r"/bundle/([^/?#]+)", path)
        if match:
            return match.group(1)
    return None


def _digital_card_url(slug: str) -> str:
    return f"{str(settings.PUBLIC_BASE_URL).rstrip('/')}/card/{slug}"


def _contact_share_url(contact_id: str) -> str:
    return f"{str(settings.PUBLIC_BASE_URL).rstrip('/')}/contact/{contact_id}"


def _bundle_share_url(bundle_id: str) -> str:
    return f"{str(settings.PUBLIC_BASE_URL).rstrip('/')}/bundle/{bundle_id}"


def _bundle_contact_snapshot(contact: object) -> dict:
    payload = contact_to_summary(contact, image_urls=[])
    return {
        "processing_id": payload.get("processing_id"),
        "name": payload.get("name"),
        "company": payload.get("company"),
        "position": payload.get("position"),
        "email": payload.get("email"),
        "phone": payload.get("phone"),
        "website": payload.get("website"),
        "address": payload.get("address"),
        "social_profiles": payload.get("social_profiles") or [],
        "professional_brief": payload.get("professional_brief"),
        "keywords": payload.get("keywords") or [],
        "highlights": payload.get("highlights") or [],
        "event_name": payload.get("event_name"),
        "location": payload.get("location"),
        "source": payload.get("source"),
        "tags": payload.get("tags") or [],
        "notes": payload.get("notes"),
        "confirmed_at": payload.get("confirmed_at"),
    }


def _qr_svg(value: str) -> str:
    try:
        import qrcode
        import qrcode.image.svg
    except ImportError:
        return ""

    image_factory = qrcode.image.svg.SvgPathImage
    image = qrcode.make(value, image_factory=image_factory)
    buffer = io.BytesIO()
    image.save(buffer)
    return buffer.getvalue().decode("utf-8")


async def get_image_urls(
    processing_id: str,
    user_id: str,
) -> list[str]:
    """Find all images for a processing_id and return their Cloudinary URLs."""
    from beanie import PydanticObjectId

    from src.documents.models import ImageStatus, UploadedImage

    docs: list[UploadedImage] = []
    try:
        oid = PydanticObjectId(processing_id)
        doc = await UploadedImage.find_one(UploadedImage.id == oid)
        if doc:
            docs = [doc]
    except Exception:
        pass

    if not docs:
        docs = await UploadedImage.find(UploadedImage.processing_id == processing_id).to_list()

    # Filter out soft-deleted ones
    docs = [d for d in docs if d.status != ImageStatus.REJECTED_INVALID]

    if not docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document(s) for '{processing_id}' not found",
        )

    if user_id != "MOCK_USER":
        try:
            user_oid = PydanticObjectId(user_id)
            for d in docs:
                if d.user_id != user_oid:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        except Exception as exc:
            if isinstance(exc, HTTPException):
                raise
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    urls: list[str] = []

    for doc in docs:
        with suppress(Exception):
            urls.append(_cloudinary_url(doc.storage_path))

    return urls


async def ensure_document_owner(processing_id: str, user_id: str) -> None:
    """Ensure the current user owns every uploaded image for the processing id."""
    from beanie import PydanticObjectId

    from src.documents.models import ImageStatus, UploadedImage

    docs = await UploadedImage.find(
        UploadedImage.processing_id == processing_id,
        UploadedImage.status != ImageStatus.REJECTED_INVALID,
    ).to_list()

    if not docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{processing_id}' not found",
        )

    try:
        user_oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    if any(doc.user_id != user_oid for doc in docs):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


async def get_image_stream(
    processing_id: str,
    user_id: str,
) -> tuple[Iterator[bytes], str, str]:
    """Fetch the original image from Cloudinary and return (byte_iterator, content_type, filename)."""
    from beanie import PydanticObjectId

    from src.documents.models import ImageStatus, UploadedImage

    doc = None
    try:
        oid = PydanticObjectId(processing_id)
        doc = await UploadedImage.find_one(UploadedImage.id == oid)
    except Exception:
        pass

    if doc is None:
        doc = await UploadedImage.find_one(UploadedImage.processing_id == processing_id)

    if doc is None or doc.status == ImageStatus.REJECTED_INVALID:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{processing_id}' not found",
        )

    if user_id != "MOCK_USER":
        try:
            if doc.user_id != PydanticObjectId(user_id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    url = _cloudinary_url(doc.storage_path)
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)

    if response.status_code == status.HTTP_404_NOT_FOUND:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found in storage",
        )
    if response.is_error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not download image from Cloudinary",
        )

    def _iter_chunks() -> Iterator[bytes]:
        yield response.content

    return _iter_chunks(), doc.mime_type, doc.original_filename


async def hard_delete(processing_id: str, user_id: str) -> None:
    """Permanently delete the document(s) from DB and Cloudinary across all modules."""
    import asyncio

    from beanie import PydanticObjectId

    from src.documents.models import FinalizedDocument, JsonReviewSession, UploadedImage
    from src.processing.models import BusinessCardScan

    # 1. Identify all documents and storage paths
    uploaded_images = await UploadedImage.find(UploadedImage.processing_id == processing_id).to_list()
    business_card_scan = await BusinessCardScan.find_one(BusinessCardScan.processing_id == processing_id)
    finalized_doc = await FinalizedDocument.find_one(FinalizedDocument.processing_id == processing_id)
    if not uploaded_images and business_card_scan is None and finalized_doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document '{processing_id}' not found")

    # 2. Permission check (if not mock user)
    if user_id != "MOCK_USER":
        user_oid = PydanticObjectId(user_id)
        for doc in uploaded_images:
            if doc.user_id != user_oid:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if finalized_doc is not None and finalized_doc.user_id != user_oid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    public_ids = [doc.storage_path for doc in uploaded_images if doc.storage_path]

    # 4. Delete from Database (All related collections)
    await asyncio.gather(
        UploadedImage.find(UploadedImage.processing_id == processing_id).delete(),
        BusinessCardScan.find(BusinessCardScan.processing_id == processing_id).delete(),
        JsonReviewSession.find(JsonReviewSession.processing_id == processing_id).delete(),
        FinalizedDocument.find(FinalizedDocument.processing_id == processing_id).delete(),
    )

    if public_ids:
        _configure_cloudinary()

        def _delete_public_ids(ids: list[str]) -> None:
            uploader = _cloudinary_uploader()
            for public_id in ids:
                with suppress(Exception):
                    uploader.destroy(public_id, resource_type="image")

        await run_in_threadpool(_delete_public_ids, public_ids)
