from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from src.auth.models import OtpCode, PasswordResetSession, RefreshToken, User
from src.config import settings
from src.documents.models import (
    ContactBundle,
    DigitalBusinessCard,
    FinalizedDocument,
    JsonReviewSession,
    UploadedImage,
)
from src.processing.models import BusinessCardScan

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
    ContactBundle,
]


async def init_db() -> None:
    client: AsyncIOMotorClient = AsyncIOMotorClient(str(settings.MONGODB_URL))
    await init_beanie(database=client.ocr_db, document_models=ALL_DOCUMENTS)
