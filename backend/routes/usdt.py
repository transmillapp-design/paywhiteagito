"""
USDT Wallet Routes
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
from services.usdt_service import USDTService
from routes.deps import get_current_user, get_current_master_user, verify_token, security

logger = logging.getLogger(__name__)

router = APIRouter()

db = None


def set_db(database):
    global db
    db = database


@router.get("/usdt/rate")
async def get_usdt_rate(current_user = Depends(get_current_user)):
    """Obter cotação USDT/BRL"""
    try:
        usdt_service = USDTService()
        rate_data = await usdt_service.get_usdt_rate()
        return {
            "success": True,
            "data": rate_data,
            "error": None
        }
    except Exception as e:
        logger.error(f"Erro ao obter cotação USDT: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/usdt/calculate-fee")
async def calculate_usdt_fee(
    request: dict,
    current_user = Depends(get_current_user)
):
    """Calcular taxa USDT em tempo real"""
    try:
        amount_brl = float(request.get('amount_brl', 0))
        
        if amount_brl <= 0:
            raise ValueError("Valor deve ser maior que zero")
        
        usdt_service = USDTService()
        fee_amount, net_amount = usdt_service.calculate_usdt_fee(amount_brl)
        
        # Obter cotação para mostrar equivalente em USDT
        usdt_rate = await usdt_service.get_usdt_rate()
        net_usdt = net_amount / usdt_rate
        
        return {
            "success": True,
            "data": {
                "amount_brl": amount_brl,
                "fee_percentage": 3.99,
                "fee_amount": fee_amount,
                "net_amount": net_amount,
                "usdt_rate": usdt_rate,
                "net_usdt": round(net_usdt, 6)
            }
        }
    except Exception as e:
        logger.error(f"Erro ao calcular taxa USDT: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/usdt/deposit")
async def create_usdt_deposit(
    request: dict,
    current_user = Depends(get_current_user)
):
    """Criar depósito USDT via PIX"""
    try:
        amount_brl = float(request.get('amount_brl', 0))
        
        usdt_service = USDTService()
        result = await usdt_service.create_usdt_deposit(current_user.id, amount_brl)
        
        if result['success']:
            return {
                "success": True,
                "data": result,
                "message": "Depósito USDT criado com sucesso"
            }
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logger.error(f"Erro ao criar depósito USDT: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/usdt/deposit/confirm")
async def confirm_usdt_deposit(
    request: dict,
    current_user = Depends(get_current_user)
):
    """Confirmar depósito USDT"""
    try:
        operation_id = request.get('operation_id')
        if not operation_id:
            raise ValueError("operation_id é obrigatório")
        
        usdt_service = USDTService()
        result = await usdt_service.confirm_usdt_deposit(operation_id)
        
        if result['success']:
            return {
                "success": True,
                "data": result,
                "message": "Depósito USDT confirmado com sucesso"
            }
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logger.error(f"Erro ao confirmar depósito USDT: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/usdt/withdrawal")
async def create_withdrawal(
    request: dict,
    current_user = Depends(get_current_user)
):
    """Criar saque (BRL ou USDT)"""
    try:
        amount_brl = float(request.get('amount_brl', 0))
        currency = request.get('currency', 'BRL').upper()
        
        if currency not in ['BRL', 'USDT']:
            raise ValueError("Moeda deve ser BRL ou USDT")
        
        usdt_service = USDTService()
        result = await usdt_service.create_withdrawal(current_user.id, amount_brl, currency)
        
        if result['success']:
            return {
                "success": True,
                "data": result,
                "message": f"Saque em {currency} criado com sucesso"
            }
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logger.error(f"Erro ao criar saque: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/usdt/convert-to-brl")
async def convert_usdt_to_brl(
    request: dict,
    current_user = Depends(get_current_user)
):
    """Converter USDT para BRL"""
    try:
        amount_usdt = float(request.get('amount_usdt', 0))
        
        if amount_usdt <= 0:
            raise ValueError("Valor deve ser maior que zero")
        
        # Buscar usuário
        user = await db.users.find_one({'id': current_user.id})
        if not user:
            raise ValueError("Usuário não encontrado")
        
        current_usdt_balance = float(user.get('usdt_balance', 0))
        
        if amount_usdt > current_usdt_balance:
            raise ValueError("Saldo USDT insuficiente")
        
        # Obter cotação
        usdt_service = USDTService()
        usdt_rate = await usdt_service.get_usdt_rate()
        
        # Calcular valores
        amount_brl = amount_usdt * usdt_rate
        fee_amount = amount_brl * 0.0399  # Taxa 3,99%
        net_amount_brl = amount_brl - fee_amount
        
        # Atualizar saldos
        current_balance = float(user.get('balance', 0))
        new_balance = current_balance + net_amount_brl
        new_usdt_balance = current_usdt_balance - amount_usdt
        
        await db.users.update_one(
            {'user_id': current_user.id},
            {
                '$set': {
                    'balance': new_balance,
                    'usdt_balance': new_usdt_balance
                }
            }
        )
        
        # Creditar comissão para master
        master = await db.users.find_one({'is_master_account': True})
        if master:
            master_balance = float(master.get('balance', 0))
            await db.users.update_one(
                {'user_id': master['user_id']},
                {'$set': {'balance': master_balance + fee_amount}}
            )
        
        # Criar transações
        import uuid
        from datetime import datetime
        
        # Débito USDT
        await db.transactions.insert_one({
            'transaction_id': str(uuid.uuid4()),
            'user_id': current_user.id,
            'type': 'debit',
            'amount': amount_usdt,
            'description': 'Conversão USDT para BRL',
            'status': 'completed',
            'currency': 'USDT',
            'created_at': datetime.utcnow()
        })
        
        # Crédito BRL líquido
        await db.transactions.insert_one({
            'transaction_id': str(uuid.uuid4()),
            'user_id': current_user.id,
            'type': 'credit',
            'amount': net_amount_brl,
            'description': 'Conversão USDT para BRL',
            'status': 'completed',
            'currency': 'BRL',
            'created_at': datetime.utcnow()
        })
        
        # Débito taxa
        await db.transactions.insert_one({
            'transaction_id': str(uuid.uuid4()),
            'user_id': current_user.id,
            'type': 'debit',
            'amount': fee_amount,
            'description': 'Taxa conversão USDT',
            'status': 'completed',
            'currency': 'BRL',
            'created_at': datetime.utcnow()
        })
        
        return {
            "success": True,
            "data": {
                "amount_usdt": amount_usdt,
                "amount_brl": amount_brl,
                "fee_amount": fee_amount,
                "net_amount_brl": net_amount_brl,
                "new_balance_brl": new_balance,
                "new_balance_usdt": new_usdt_balance,
                "usdt_rate": usdt_rate
            },
            "message": "Conversão USDT realizada com sucesso"
        }
        
    except Exception as e:
        logger.error(f"Erro ao converter USDT: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/usdt/transfer-external")
async def create_external_transfer(
    request: dict,
    current_user = Depends(get_current_user)
):
    """Criar transferência USDT para carteira externa"""
    try:
        amount_usdt = float(request.get('amount_usdt', 0))
        wallet_address = request.get('wallet_address', '').strip()
        
        if not wallet_address:
            raise ValueError("Endereço da carteira é obrigatório")
        
        usdt_service = USDTService()
        result = await usdt_service.create_external_transfer(
            current_user.id, 
            amount_usdt, 
            wallet_address
        )
        
        if result['success']:
            return {
                "success": True,
                "data": result,
                "message": "Transferência criada. Aguardando aprovação."
            }
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logger.error(f"Erro ao criar transferência externa: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# MASTER USDT MANAGEMENT APIs
# =============================================================================

@router.get("/master/usdt/pending-approvals")
async def get_pending_approvals(current_user = Depends(get_current_master_user)):
    """Obter operações USDT pendentes de aprovação"""
    try:
        usdt_service = USDTService()
        approvals = usdt_service.get_pending_approvals()
        
        return {
            "success": True,
            "data": approvals,
            "count": len(approvals)
        }
    except Exception as e:
        logger.error(f"Erro ao buscar aprovações pendentes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/master/usdt/approve")
async def approve_usdt_operation(
    request: dict,
    current_user = Depends(get_current_master_user)
):
    """Aprovar operação USDT"""
    try:
        operation_id = request.get('operation_id')
        if not operation_id:
            raise ValueError("operation_id é obrigatório")
        
        usdt_service = USDTService()
        result = await usdt_service.approve_operation(operation_id, current_user.id)
        
        if result['success']:
            return {
                "success": True,
                "message": "Operação aprovada com sucesso"
            }
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logger.error(f"Erro ao aprovar operação USDT: {e}")
        raise HTTPException(status_code=500, detail=str(e))
