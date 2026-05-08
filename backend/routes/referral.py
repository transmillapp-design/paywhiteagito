"""
Módulo Referral - Transmill API
Sistema de indicações: código, rede e validação.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from routes.auth_utils import get_user_from_request
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/referral", tags=["Referral"])

db = None

PRODUCTION_URL = os.environ.get('PRODUCTION_URL', 'https://app.transmill.com.br')


def set_db(database):
    global db
    db = database


def _attr(user, attr, default=''):
    if hasattr(user, attr):
        return getattr(user, attr)
    if isinstance(user, dict):
        return user.get(attr, default)
    return default


@router.get("/my-code")
async def get_my_referral_code(request: Request = None):
    current_user = await get_user_from_request(request)
    user_type = _attr(current_user, 'user_type')
    full_name = _attr(current_user, 'full_name')
    company_name = _attr(current_user, 'company_name')
    referral_code = _attr(current_user, 'referral_code')
    referral_count = _attr(current_user, 'referral_count', 0)

    indicador_name = full_name
    if user_type == "lojista" and company_name:
        indicador_name = company_name

    referral_link = f"{PRODUCTION_URL}/register?ref={referral_code}"
    whatsapp_message = (
        f"🎉 {indicador_name} está te indicando para o Transmill!\n\n"
        f"💰 Ganhe dinheiro de volta em todas as compras!\n"
        f"🎁 Código: *{referral_code}*\n"
        f"👉 Cadastre-se: {referral_link}"
    )

    return {
        "referral_code": referral_code,
        "referral_count": referral_count,
        "referral_link": referral_link,
        "whatsapp_link": f"https://wa.me/?text={whatsapp_message}",
        "indicador_name": indicador_name
    }


@router.get("/my-network")
async def get_my_referral_network(request: Request = None):
    current_user = await get_user_from_request(request)
    user_id = _attr(current_user, 'id')
    referred_by = _attr(current_user, 'referred_by')

    referrals = await db.users.find({"referred_by": user_id}).to_list(100)

    referrer = None
    if referred_by:
        referrer_data = await db.users.find_one({"id": referred_by})
        if referrer_data:
            referrer = {
                "name": referrer_data["full_name"],
                "user_type": referrer_data["user_type"],
                "referral_code": referrer_data["referral_code"]
            }

    earnings_agg = await db.transactions.aggregate([
        {"$match": {"user_id": user_id, "transaction_type": {"$in": ["referral_bonus_client", "referral_bonus_merchant"]}}},
        {"$group": {"_id": "$transaction_type", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]).to_list(10)

    return {
        "referrer": referrer,
        "referrals": [
            {"name": r["full_name"], "user_type": r["user_type"], "created_at": r["created_at"]}
            for r in referrals
        ],
        "referral_count": len(referrals),
        "earnings": {
            "client_referrals": next((e["total"] for e in earnings_agg if e["_id"] == "referral_bonus_client"), 0),
            "merchant_referrals": next((e["total"] for e in earnings_agg if e["_id"] == "referral_bonus_merchant"), 0),
            "total": sum(e["total"] for e in earnings_agg)
        }
    }


@router.get("/validate/{referral_code}")
async def validate_referral_code(referral_code: str):
    referrer = await db.users.find_one({"referral_code": referral_code})
    if not referrer:
        raise HTTPException(status_code=404, detail="Código de indicação inválido")
    return {
        "valid": True,
        "referrer_name": referrer["full_name"],
        "referrer_type": referrer["user_type"],
        "bonus_info": "Você ganhará bônus na primeira compra!"
    }


logger.info("✅ Referral routes configuradas")
