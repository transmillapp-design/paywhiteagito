"""
Shared auth utility for modular routers.
Extracts current user from JWT token in request headers.
"""
import jwt
import os
from fastapi import Request, HTTPException

SECRET_KEY = os.environ.get('JWT_SECRET', 'transmill_secret_key_2024')

_db = None


def set_db(database):
    global _db
    _db = database


class DictObject:
    """Wrapper that allows accessing dict as object (dict.key) and as dict (dict.get('key'))"""
    def __init__(self, data: dict):
        self._data = data

    def __getattr__(self, key):
        return self._data.get(key)

    def get(self, key, default=None):
        return self._data.get(key, default)

    def __getitem__(self, key):
        return self._data[key]


async def get_user_from_request(request: Request):
    """Extract authenticated user from request headers (returns dict or None)"""
    try:
        token = request.headers.get('authorization', '').replace('Bearer ', '')
        if not token:
            return None
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('sub')
        if not user_id:
            return None
        user = await _db.users.find_one({'id': user_id})
        if user and '_id' in user:
            del user['_id']
        return user
    except Exception:
        return None


async def get_authenticated_user(request: Request) -> DictObject:
    """Extract authenticated user from request, raise 401 if not authenticated.
    Returns DictObject for attribute-style access (user.id, user.email, etc.)"""
    user = await get_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return DictObject(user)
