from dataclasses import dataclass

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwk, jwt
from jose.utils import base64url_decode

from app.core.config import Settings


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: str
    email: str | None


async def verify_supabase_token(token: str, settings: Settings) -> AuthenticatedUser:
    if settings.supabase_jwks_url is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication is not configured",
        )

    try:
        header = jwt.get_unverified_header(token)
        key_id = header.get("kid")
        if not key_id:
            raise JWTError("Token is missing key id")

        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(str(settings.supabase_jwks_url))
            response.raise_for_status()
            jwks = response.json()

        key = next((item for item in jwks.get("keys", []) if item.get("kid") == key_id), None)
        if key is None:
            raise JWTError("Signing key not found")

        message, encoded_signature = token.rsplit(".", 1)
        decoded_signature = base64url_decode(encoded_signature.encode())
        public_key = jwk.construct(key)
        if not public_key.verify(message.encode(), decoded_signature):
            raise JWTError("Invalid token signature")

        payload = jwt.get_unverified_claims(token)
        audience = payload.get("aud")
        if audience != settings.supabase_jwt_audience:
            raise JWTError("Invalid token audience")

        subject = payload.get("sub")
        if not subject:
            raise JWTError("Token is missing subject")

        jwt.decode(
            token,
            key,
            algorithms=[header.get("alg", "RS256")],
            audience=settings.supabase_jwt_audience,
            options={"verify_signature": False, "verify_aud": True, "verify_exp": True},
        )

        return AuthenticatedUser(user_id=subject, email=payload.get("email"))
    except (JWTError, ValueError, httpx.HTTPError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        ) from exc
