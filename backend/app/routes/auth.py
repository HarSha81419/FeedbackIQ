"""Authentication routes."""

from fastapi import APIRouter, status

from app.core.deps import DbSession
from app.schemas.auth import AuthResponse, UserCreate, UserLogin, UserOut
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_out(user) -> UserOut:
    return UserOut(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        createdAt=user.created_at,
    )


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def signup(data: UserCreate, db: DbSession) -> AuthResponse:
    user = auth_service.register(db, data)
    token = auth_service.create_token_for_user(user)
    return AuthResponse(token=token, user=_user_out(user))


@router.post("/login", response_model=AuthResponse, summary="Login and receive JWT")
def login(data: UserLogin, db: DbSession) -> AuthResponse:
    user = auth_service.authenticate(db, data.email, data.password)
    token = auth_service.create_token_for_user(user)
    return AuthResponse(token=token, user=_user_out(user))
