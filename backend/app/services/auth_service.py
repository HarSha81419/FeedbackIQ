"""Authentication business logic."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate


class AuthService:
    """User registration and login."""

    def register(self, db: Session, data: UserCreate) -> User:
        existing = db.scalar(select(User).where(User.email == data.email))
        if existing:
            raise ConflictError("Email already registered")

        user = User(
            email=data.email.lower(),
            name=data.name,
            hashed_password=get_password_hash(data.password),
            role=data.role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def authenticate(self, db: Session, email: str, password: str) -> User:
        user = db.scalar(select(User).where(User.email == email.lower()))
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        return user

    def create_token_for_user(self, user: User) -> str:
        return create_access_token(
            str(user.id),
            extra_claims={"role": user.role.value, "email": user.email},
        )


auth_service = AuthService()
