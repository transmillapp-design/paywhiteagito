"""
Payment Method Preferences Routes
Migrado de server.py para router modular.
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import logging
import os

from routes.deps import get_current_user, get_current_master_user, verify_token, security

logger = logging.getLogger(__name__)

router = APIRouter()

db = None


def set_db(database):
    global db
    db = database


@router.get("/user/payment-methods")
async def get_payment_methods(current_user = Depends(get_current_user)):
    """Get user's payment method preferences"""
    try:
        user = await db.users.find_one({'id': current_user.id})
        
        return {
            'success': True,
            'preferences': {
                'accept_wallet_payment': user.get('accept_wallet_payment', True),
                'accept_usdt_payment': user.get('accept_usdt_payment', False)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting payment methods: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/user/payment-methods")
async def update_payment_methods(
    preferences: dict,
    current_user = Depends(get_current_user)
):
    """Update user's payment method preferences"""
    try:
        # Validate user type
        user = await db.users.find_one({'id': current_user.id})
        if user.get('user_type') not in ['lojista', 'service_provider']:
            raise HTTPException(status_code=403, detail="Apenas lojistas e prestadores podem configurar formas de pagamento")
        
        accept_wallet = preferences.get('accept_wallet_payment', True)
        accept_usdt = preferences.get('accept_usdt_payment', False)
        
        # At least one payment method must be enabled
        if not accept_wallet and not accept_usdt:
            raise HTTPException(status_code=400, detail="Pelo menos uma forma de pagamento deve estar ativa")
        
        await db.users.update_one(
            {'id': current_user.id},
            {'$set': {
                'accept_wallet_payment': accept_wallet,
                'accept_usdt_payment': accept_usdt
            }}
        )
        
        return {
            'success': True,
            'message': 'Formas de pagamento atualizadas com sucesso',
            'preferences': {
                'accept_wallet_payment': accept_wallet,
                'accept_usdt_payment': accept_usdt
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment methods: {e}")
        raise HTTPException(status_code=500, detail=str(e))
