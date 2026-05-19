"""FastAPI dependency injection helpers."""

from typing import Annotated

from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User, UserRole

security_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]
TokenCreds = Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)]


def get_current_user(db: DbSession, creds: TokenCreds) -> User:
    """Resolve the authenticated user from a Bearer JWT."""
    if creds is None or creds.scheme.lower() != "bearer":
        raise UnauthorizedError()

    try:
        payload = decode_access_token(creds.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise UnauthorizedError()
    except JWTError as exc:
        raise UnauthorizedError() from exc

    user = db.get(User, int(user_id))
    if user is None:
        raise UnauthorizedError("User not found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole):
    """Factory for role-based route protection."""

    def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            from app.core.exceptions import ForbiddenError

            raise ForbiddenError()
        return user

    return checker
