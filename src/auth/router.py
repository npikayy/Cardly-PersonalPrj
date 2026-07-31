"""Auth router — route definitions only.

Responsibilities:
  1. Parse and validate the request body (via Pydantic schemas).
  2. Call the service layer.
  3. Return a structured HTTP response.

No business logic lives here.  All domain errors bubble up from the service
and are caught by the global AppException handler registered in main.py.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from src.auth import service
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.auth.schemas import (
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResendOtpRequest,
    TokenResponse,
    UserResponse,
    VerifyOtpRequest,
)

router = APIRouter()
CurrentUser = Annotated[User, Depends(get_current_user)]


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
        is_active=current_user.is_active,
    )
