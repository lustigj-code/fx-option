"""Authentication service for user management and JWT tokens."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from services.auth.config import get_settings
from services.auth.models import TokenData, UserCreate, UserLogin, UserResponse
from services.database.models import User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Settings
settings = get_settings()


class AuthService:
    """Service for authentication and user management."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(user_id: str, username: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.expiration_minutes)

        to_encode = {
            "sub": user_id,
            "username": username,
            "role": role,
            "exp": expire,
            "type": "access",
        }

        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt

    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create a JWT refresh token."""
        expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_expiration_days)

        to_encode = {"sub": user_id, "exp": expire, "type": "refresh"}

        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> TokenData:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            user_id: str = payload.get("sub")
            username: str = payload.get("username")
            role: str = payload.get("role")

            if user_id is None:
                raise ValueError("Invalid token: missing user_id")

            token_data = TokenData(
                user_id=user_id, username=username, role=role, exp=datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc)
            )
            return token_data
        except JWTError as e:
            raise ValueError(f"Invalid token: {e}")

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user by username and password."""
        user = self.db.query(User).filter(User.username == username).first()

        if not user:
            return None

        if not self.verify_password(password, user.hashed_password):
            return None

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        self.db.commit()

        return user

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check if username or email already exists
        existing_user = self.db.query(User).filter((User.username == user_data.username) | (User.email == user_data.email)).first()

        if existing_user:
            if existing_user.username == user_data.username:
                raise ValueError("Username already exists")
            if existing_user.email == user_data.email:
                raise ValueError("Email already exists")

        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=self.hash_password(user_data.password),
            role=user_data.role,
            is_active=True,
            is_superuser=False,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get a user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username."""
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def update_user(self, user_id: str, **updates) -> Optional[User]:
        """Update user fields."""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        for key, value in updates.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password."""
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        if not self.verify_password(current_password, user.hashed_password):
            return False

        user.hashed_password = self.hash_password(new_password)
        self.db.commit()
        return True

    def deactivate_user(self, user_id: str) -> bool:
        """Deactivate a user account."""
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        user.is_active = False
        self.db.commit()
        return True

    def activate_user(self, user_id: str) -> bool:
        """Activate a user account."""
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        user.is_active = True
        self.db.commit()
        return True
