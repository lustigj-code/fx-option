"""FastAPI dependencies for authentication and authorization."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from services.auth.service import AuthService
from services.database import get_db
from services.database.models import User

# HTTP Bearer token scheme
security = HTTPBearer()


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Get authentication service instance."""
    return AuthService(db)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    """Get current authenticated user from JWT token.

    Usage:
        @app.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id}
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        token_data = AuthService.decode_token(token)
    except ValueError:
        raise credentials_exception

    user = auth_service.get_user_by_id(token_data.user_id)

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Get current active user (must be active).

    Usage:
        @app.get("/protected")
        def protected_route(user: User = Depends(get_current_active_user)):
            return {"user": user.username}
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    return current_user


def require_role(*allowed_roles: str):
    """Dependency factory to require specific roles.

    Usage:
        @app.get("/admin-only")
        def admin_route(user: User = Depends(require_role("admin"))):
            return {"admin": user.username}

        @app.get("/operators-and-admins")
        def ops_route(user: User = Depends(require_role("operator", "admin"))):
            return {"authorized": True}
    """

    async def role_checker(current_user: Annotated[User, Depends(get_current_active_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail=f"Requires one of these roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


def require_admin(current_user: Annotated[User, Depends(get_current_active_user)]) -> User:
    """Require admin role (shortcut dependency).

    Usage:
        @app.delete("/users/{user_id}")
        def delete_user(user_id: str, admin: User = Depends(require_admin)):
            # Only admins can delete users
            return {"deleted": user_id}
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def require_operator(current_user: Annotated[User, Depends(get_current_active_user)]) -> User:
    """Require operator or admin role (shortcut dependency).

    Usage:
        @app.post("/orders/{order_id}/cancel")
        def cancel_order(order_id: str, operator: User = Depends(require_operator)):
            # Only operators and admins can cancel orders
            return {"cancelled": order_id}
    """
    if current_user.role not in ("operator", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator or admin access required")
    return current_user
