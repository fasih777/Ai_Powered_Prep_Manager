from __future__ import annotations

import os
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from pydantic import BaseModel

security = HTTPBearer(auto_error=False)

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
REQUIRE_AUTH = os.environ.get("REQUIRE_AUTH", "false").lower() in ("1", "true", "yes")


class AuthenticatedUser(BaseModel):
    user_id: str
    email: str | None = None
    role: str = "operator"
    organization_id: str | None = None
    is_authenticated: bool = True
    claims: dict = {}


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None
) -> AuthenticatedUser | None:
    """
    Validates Supabase JWT access token from Authorization: Bearer <token>.
    When REQUIRE_AUTH is true, raises 401 if missing or invalid.
    When REQUIRE_AUTH is false, returns a default actor if no token provided.
    """
    if not credentials:
        if REQUIRE_AUTH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return AuthenticatedUser(
            user_id="00000000-0000-0000-0000-000000000001",
            email="dev-operator@prep-manager.internal",
            role="admin",
            organization_id="00000000-0000-0000-0000-000000000000",
            is_authenticated=False,
            claims={},
        )

    token = credentials.credentials
    try:
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            payload = jwt.decode(token, options={"verify_signature": False})

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject (sub)",
            )

        app_metadata = payload.get("app_metadata", {})
        user_metadata = payload.get("user_metadata", {})
        role = app_metadata.get("role") or user_metadata.get("role") or "operator"
        org_id = app_metadata.get("organization_id") or user_metadata.get("organization_id")

        return AuthenticatedUser(
            user_id=user_id,
            email=payload.get("email"),
            role=role,
            organization_id=org_id,
            is_authenticated=True,
            claims=payload,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(allowed_roles: list[str]):
    """
    Enforces minimum RBAC role for sensitive endpoints (e.g. overrides require 'reviewer' or 'admin').
    """
    def role_checker(user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> AuthenticatedUser:
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
        if user.role not in allowed_roles and "admin" not in user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions: role '{user.role}' not in allowed roles {allowed_roles}",
            )
        return user
    return role_checker
