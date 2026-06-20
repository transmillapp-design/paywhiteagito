"""
Shared dependencies for modular routers.
Provides auth dependencies wired to the centralized auth_utils helper.
"""
import os
import jwt
import logging
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from routes.auth_utils import get_authenticated_user

logger = logging.getLogger(__name__)

SECRET_KEY = os.environ.get('JWT_SECRET', 'transmill_secret_key_2024')
ALGORITHM = "HS256"
security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT and return the user_id (sub)."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


async def get_current_user(request: Request):
    """Return the authenticated user as a DictObject (user.id, user.email, ...)."""
    return await get_authenticated_user(request)


async def get_current_master_user(request: Request):
    """Return the authenticated user, ensuring it is a master account."""
    user = await get_authenticated_user(request)
    if not (user.get('is_master_account') or user.get('user_type') == 'master'):
        raise HTTPException(status_code=403, detail="Acesso restrito à conta master")
    return user
