"""FastAPI router for authentication endpoints."""
from __future__ import annotations

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from services.auth.config import get_settings
from services.auth.dependencies import get_auth_service, get_current_active_user, require_admin
from services.auth.models import PasswordChange, Token, UserCreate, UserLogin, UserResponse, UserUpdate
from services.auth.service import AuthService
from services.database import get_db
from services.database.models import User

settings = get_settings()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, auth_service: Annotated[AuthService, Depends(get_auth_service)]):
    """Register a new user account.

    Creates a new user with the provided credentials. Usernames and emails must be unique.

    **Default role**: client (can be overridden by admin)

    **Available roles**:
    - `client`: Regular users who can manage their exposures and quotes
    - `operator`: Internal users who can view all operations and manage orders
    - `admin`: Full system access including user management
    """
    try:
        user = auth_service.create_user(user_data)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, auth_service: Annotated[AuthService, Depends(get_auth_service)]):
    """Authenticate and receive JWT tokens.

    Returns both an access token (short-lived) and refresh token (long-lived).

    **Access token**: Use for API authentication (expires in 30 minutes)
    **Refresh token**: Use to get new access tokens (expires in 7 days)

    Include the access token in requests using the `Authorization: Bearer <token>` header.
    """
    user = auth_service.authenticate_user(credentials.username, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    access_token = AuthService.create_access_token(user.id, user.username, user.role)
    refresh_token = AuthService.create_refresh_token(user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.expiration_minutes * 60,
    )


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, auth_service: Annotated[AuthService, Depends(get_auth_service)]):
    """Get a new access token using a refresh token.

    When your access token expires, use this endpoint with your refresh token
    to get a new access token without logging in again.
    """
    try:
        token_data = AuthService.decode_token(refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = auth_service.get_user_by_id(token_data.user_id)

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    access_token = AuthService.create_access_token(user.id, user.username, user.role)

    return Token(access_token=access_token, token_type="bearer", expires_in=settings.expiration_minutes * 60)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: Annotated[User, Depends(get_current_active_user)]):
    """Get current user information.

    Returns the profile of the currently authenticated user.
    """
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_current_user(
    updates: UserUpdate, current_user: Annotated[User, Depends(get_current_active_user)], db: Session = Depends(get_db)
):
    """Update current user profile.

    Users can update their own email and full name. Role changes require admin privileges.
    """
    auth_service = AuthService(db)

    # Users cannot change their own role
    if updates.role and updates.role != current_user.role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change your own role")

    # Prepare updates
    update_data = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if k != "role"}

    updated_user = auth_service.update_user(current_user.id, **update_data)

    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.model_validate(updated_user)


@router.post("/me/change-password")
def change_password(
    password_change: PasswordChange,
    current_user: Annotated[User, Depends(get_current_active_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    """Change current user's password.

    Requires the current password for verification.
    """
    success = auth_service.change_password(current_user.id, password_change.current_password, password_change.new_password)

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    return {"message": "Password changed successfully"}


@router.get("/users", response_model=list[UserResponse])
def list_users(_admin: Annotated[User, Depends(require_admin)], db: Session = Depends(get_db)):
    """List all users (admin only).

    Returns a list of all user accounts in the system.
    """
    users = db.query(User).all()
    return [UserResponse.model_validate(user) for user in users]


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(_admin: Annotated[User, Depends(require_admin)], user_id: str, db: Session = Depends(get_db)):
    """Get user by ID (admin only)."""
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(_admin: Annotated[User, Depends(require_admin)], user_id: str, updates: UserUpdate, db: Session = Depends(get_db)):
    """Update any user (admin only).

    Admins can update any user field including role and active status.
    """
    auth_service = AuthService(db)
    update_data = updates.model_dump(exclude_unset=True)

    updated_user = auth_service.update_user(user_id, **update_data)

    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.model_validate(updated_user)


@router.post("/users/{user_id}/deactivate")
def deactivate_user(_admin: Annotated[User, Depends(require_admin)], user_id: str, db: Session = Depends(get_db)):
    """Deactivate a user account (admin only).

    Deactivated users cannot log in or use the system.
    """
    auth_service = AuthService(db)
    success = auth_service.deactivate_user(user_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": "User deactivated successfully"}


@router.post("/users/{user_id}/activate")
def activate_user(_admin: Annotated[User, Depends(require_admin)], user_id: str, db: Session = Depends(get_db)):
    """Activate a user account (admin only).

    Reactivates a previously deactivated user account.
    """
    auth_service = AuthService(db)
    success = auth_service.activate_user(user_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": "User activated successfully"}
