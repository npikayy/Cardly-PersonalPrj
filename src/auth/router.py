"""Auth router — route definitions only.

Responsibilities:
  1. Parse and validate the request body (via Pydantic schemas).
  2. Call the service layer.
  3. Return a structured HTTP response.

No business logic lives here.  All domain errors bubble up from the service
and are caught by the global AppException handler registered in main.py.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from src.auth import service
from src.auth.dependencies import get_current_user
from src.auth.models import User, UserAvatar
from src.auth.schemas import (
    AvatarListResponse,
    AvatarResponse,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    ResendOtpRequest,
    TokenResponse,
    UserResponse,
    VerifyOtpRequest,
)
from src.documents import dependencies as document_dependencies
from src.documents import service as document_service

router = APIRouter()
CurrentUser = Annotated[User, Depends(get_current_user)]
AvatarUpload = Annotated[UploadFile, Depends(document_dependencies.valid_upload_file)]


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=MessageResponse,
    summary="Register a new account",
)
async def register(body: RegisterRequest) -> MessageResponse:
    await service.register_user(
        email=body.email,
        password=body.password,
        full_name=body.full_name,
    )
    return MessageResponse(message="Account created. Check your email for the verification OTP.")


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify a newly registered account with OTP",
)
async def verify_email(body: VerifyOtpRequest) -> MessageResponse:
    await service.verify_email_otp(email=body.email, otp=body.otp)
    return MessageResponse(message="Account verified. You can log in now.")


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    summary="Resend the registration verification OTP",
)
async def resend_verification(body: ResendOtpRequest) -> MessageResponse:
    await service.resend_verification_otp(email=body.email)
    return MessageResponse(message="Verification OTP sent.")


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and receive token pair",
)
async def login(body: LoginRequest) -> TokenResponse:
    tokens = await service.login(
        email=body.email,
        password=body.password,
    )
    return TokenResponse(**tokens)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Exchange a refresh token for a new access token",
)
async def refresh(body: RefreshRequest) -> TokenResponse:
    tokens = await service.refresh_access_token(body.refresh_token)
    return TokenResponse(**tokens)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Revoke the current refresh token",
)
async def logout(body: LogoutRequest) -> MessageResponse:
    await service.logout(body.refresh_token)
    return MessageResponse(message="Logged out successfully.")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the currently authenticated user",
)
async def me(current_user: CurrentUser) -> UserResponse:
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
    )


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update the current user's profile",
)
async def update_me(body: ProfileUpdateRequest, current_user: CurrentUser) -> UserResponse:
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url.strip() or None
    await current_user.save()
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
    )


@router.get(
    "/me/avatars",
    response_model=AvatarListResponse,
    summary="List recently uploaded avatars for the current user",
)
async def list_me_avatars(current_user: CurrentUser) -> AvatarListResponse:
    avatars = await UserAvatar.find(UserAvatar.user_id == current_user.id).sort(-UserAvatar.created_at).limit(5).to_list()
    return AvatarListResponse(
        avatars=[
            AvatarResponse(id=str(avatar.id), url=avatar.url, created_at=avatar.created_at.isoformat())
            for avatar in avatars
        ]
    )


@router.post(
    "/me/avatar",
    response_model=UserResponse,
    summary="Upload and update the current user's avatar",
)
async def upload_me_avatar(file: AvatarUpload, current_user: CurrentUser) -> UserResponse:
    content = await file.read()
    avatar_url, public_id = await document_service.save_avatar_to_storage(
        file_content=content,
        filename=file.filename or "profile-avatar",
        user_id=str(current_user.id),
        mime_type=file.content_type or "image/jpeg",
    )
    await UserAvatar(
        user_id=current_user.id,
        url=avatar_url,
        public_id=public_id,
    ).insert()

    avatars = await UserAvatar.find(UserAvatar.user_id == current_user.id).sort(-UserAvatar.created_at).to_list()
    for old_avatar in avatars[5:]:
        await document_service.delete_image_from_storage(old_avatar.public_id)
        await old_avatar.delete()

    current_user.avatar_url = avatar_url
    await current_user.save()
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
    )


@router.delete(
    "/me/avatars/{avatar_id}",
    response_model=UserResponse,
    summary="Delete one recently uploaded avatar",
)
async def delete_me_avatar(avatar_id: str, current_user: CurrentUser) -> UserResponse:
    avatar = await UserAvatar.get(avatar_id)
    if avatar is None or avatar.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar not found",
        )

    await document_service.delete_image_from_storage(avatar.public_id)
    deleted_url = avatar.url
    await avatar.delete()

    if current_user.avatar_url == deleted_url:
        current_user.avatar_url = None
        await current_user.save()

    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
    )
