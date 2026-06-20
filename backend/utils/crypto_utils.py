"""
Crypto utilities for encrypting per-franchise integration credentials at rest.
Uses Fernet (AES-128-CBC + HMAC) with a master key stored ONLY in backend/.env.
"""
import os
from cryptography.fernet import Fernet, InvalidToken

_key = os.environ.get('CREDENTIALS_ENCRYPTION_KEY')
if not _key:
    raise RuntimeError("CREDENTIALS_ENCRYPTION_KEY não configurada no .env")

_fernet = Fernet(_key.encode() if isinstance(_key, str) else _key)


def encrypt_value(plain: str) -> str:
    """Encrypt a plaintext secret. Returns base64 token string."""
    if plain is None or plain == "":
        return ""
    return _fernet.encrypt(plain.encode()).decode()


def decrypt_value(token: str) -> str:
    """Decrypt a stored token. Returns plaintext (empty string on failure/empty)."""
    if not token:
        return ""
    try:
        return _fernet.decrypt(token.encode()).decode()
    except (InvalidToken, Exception):
        return ""


def mask_value(plain: str) -> str:
    """Return a masked representation showing only the last 4 chars."""
    if not plain:
        return ""
    if len(plain) <= 4:
        return "••••"
    return "••••••" + plain[-4:]
