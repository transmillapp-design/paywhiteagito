"""
Módulo de Transações - Transmill API
Endpoints: pagamentos, saques, histórico
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from routes.auth_utils import get_user_from_request
import logging

logger = logging.getLogger(__name__)

transactions_router = APIRouter(prefix="/api/transactions", tags=["transactions"])

_db = None


def setup_transactions_routes(db, get_current_user_fn=None, xgate_service=None):
    global _db
    _db = db
    logger.info("✅ Transactions routes configuradas")


@transactions_router.get("/history")
async def get_transaction_history(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    transaction_type: Optional[str] = Query(None),
):
    """Retorna histórico de transações do usuário"""
    current_user = await get_user_from_request(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Não autorizado")

    try:
        user_id = current_user.get('id')
        filtro = {"user_id": user_id}
        if transaction_type:
            filtro["transaction_type"] = transaction_type

        transactions = await _db.transactions.find(
            filtro, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)

        return {
            "success": True,
            "transactions": transactions,
            "total": len(transactions)
        }

    except Exception as e:
        logger.error(f"Erro ao buscar histórico: {e}")
        raise HTTPException(status_code=500, detail=str(e))
