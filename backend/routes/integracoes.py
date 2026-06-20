"""
Per-franchise integration credentials.
Each franchise stores its own API credentials (XGate, Google Maps, image/Cloudinary, BaaS).
Secrets are encrypted at rest (utils.crypto_utils). Nothing is hardcoded.
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
import logging

from routes.auth_utils import get_authenticated_user
from utils.crypto_utils import encrypt_value, decrypt_value, mask_value

logger = logging.getLogger(__name__)

router = APIRouter()

db = None


def set_db(database):
    global db
    db = database


def _is_master(user) -> bool:
    return bool(user.get('is_master_account') or user.get('user_type') == 'master')


async def _authorize(request: Request, slug: str):
    """Master OR franqueado da própria franquia podem gerenciar credenciais."""
    user = await get_authenticated_user(request)
    if _is_master(user):
        return user
    if user.get('franquia_slug') == slug:
        return user
    raise HTTPException(status_code=403, detail="Acesso negado a esta franquia")


async def get_integration_credentials(slug: str, name: str) -> dict:
    """Backend helper: retorna credenciais DESCRIPTOGRAFADAS de uma integração da franquia."""
    doc = await db.franquia_integracoes.find_one({"slug": slug})
    if not doc:
        return {}
    if name == "xgate":
        return {
            "email": decrypt_value(doc.get("xgate_email_enc", "")),
            "password": decrypt_value(doc.get("xgate_password_enc", "")),
            "api_url": doc.get("xgate_api_url", ""),
        }
    if name == "google_maps":
        return {"api_key": decrypt_value(doc.get("google_maps_key_enc", ""))}
    if name == "cloudinary":
        return {
            "cloud_name": doc.get("cloudinary_cloud_name", ""),
            "api_key": decrypt_value(doc.get("cloudinary_api_key_enc", "")),
            "api_secret": decrypt_value(doc.get("cloudinary_api_secret_enc", "")),
        }
    if name == "baas":
        return {
            "provider_name": doc.get("baas_provider_name", ""),
            "api_key": decrypt_value(doc.get("baas_api_key_enc", "")),
        }
    return {}


@router.get("/franquias/{slug}/integracoes")
async def get_franquia_integracoes(slug: str, request: Request):
    """Retorna as integrações da franquia com segredos MASCARADOS."""
    await _authorize(request, slug)
    doc = await db.franquia_integracoes.find_one({"slug": slug}) or {}

    def field(enc_key):
        plain = decrypt_value(doc.get(enc_key, ""))
        return {"configured": bool(plain), "masked": mask_value(plain)}

    return {
        "success": True,
        "integracoes": {
            "xgate": {
                "email": doc.get("xgate_email_enc") and decrypt_value(doc.get("xgate_email_enc", "")) or "",
                "api_url": doc.get("xgate_api_url", ""),
                "password": field("xgate_password_enc"),
            },
            "google_maps": {
                "api_key": field("google_maps_key_enc"),
            },
            "cloudinary": {
                "cloud_name": doc.get("cloudinary_cloud_name", ""),
                "api_key": field("cloudinary_api_key_enc"),
                "api_secret": field("cloudinary_api_secret_enc"),
            },
            "baas": {
                "provider_name": doc.get("baas_provider_name", ""),
                "api_key": field("baas_api_key_enc"),
            },
        },
    }


@router.put("/franquias/{slug}/integracoes")
async def update_franquia_integracoes(slug: str, payload: dict, request: Request):
    """Atualiza credenciais. Apenas campos enviados (não vazios) são gravados/criptografados."""
    user = await _authorize(request, slug)

    franquia = await db.franquias.find_one({"slug": slug})
    if not franquia:
        raise HTTPException(status_code=404, detail="Franquia não encontrada")

    update = {}

    xgate = payload.get("xgate") or {}
    if xgate.get("email"):
        update["xgate_email_enc"] = encrypt_value(xgate["email"])
    if xgate.get("password"):
        update["xgate_password_enc"] = encrypt_value(xgate["password"])
    if xgate.get("api_url") is not None:
        update["xgate_api_url"] = xgate["api_url"]

    gmaps = payload.get("google_maps") or {}
    if gmaps.get("api_key"):
        update["google_maps_key_enc"] = encrypt_value(gmaps["api_key"])

    cloud = payload.get("cloudinary") or {}
    if cloud.get("cloud_name") is not None:
        update["cloudinary_cloud_name"] = cloud["cloud_name"]
    if cloud.get("api_key"):
        update["cloudinary_api_key_enc"] = encrypt_value(cloud["api_key"])
    if cloud.get("api_secret"):
        update["cloudinary_api_secret_enc"] = encrypt_value(cloud["api_secret"])

    baas = payload.get("baas") or {}
    if baas.get("provider_name") is not None:
        update["baas_provider_name"] = baas["provider_name"]
    if baas.get("api_key"):
        update["baas_api_key_enc"] = encrypt_value(baas["api_key"])

    if not update:
        return {"success": True, "message": "Nenhuma alteração enviada"}

    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    update["updated_by"] = user.get("email", "")

    await db.franquia_integracoes.update_one(
        {"slug": slug},
        {"$set": update, "$setOnInsert": {"slug": slug}},
        upsert=True,
    )
    logger.info(f"🔐 Integrações atualizadas para franquia {slug} por {user.get('email')}")
    return {"success": True, "message": "Credenciais salvas com sucesso"}


@router.get("/public/franquias/{slug}/maps-config")
async def get_franquia_maps_config(slug: str):
    """Endpoint público: retorna SOMENTE a chave do Google Maps da franquia (para carregar o mapa)."""
    doc = await db.franquia_integracoes.find_one({"slug": slug})
    key = decrypt_value(doc.get("google_maps_key_enc", "")) if doc else ""
    return {"success": True, "google_maps_key": key or None}
