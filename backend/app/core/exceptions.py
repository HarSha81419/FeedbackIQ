"""Custom application exceptions."""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base HTTP exception with consistent structure."""

    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: str | None = None,
    ) -> None:
        detail = {"message": message, "error_code": error_code or "APP_ERROR"}
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(
            status.HTTP_404_NOT_FOUND,
            f"{resource} not found",
            "NOT_FOUND",
        )


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Could not validate credentials") -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, message, "UNAUTHORIZED")


class ForbiddenError(AppException):
    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, message, "FORBIDDEN")


class ConflictError(AppException):
    def __init__(self, message: str = "Resource already exists") -> None:
        super().__init__(status.HTTP_409_CONFLICT, message, "CONFLICT")
