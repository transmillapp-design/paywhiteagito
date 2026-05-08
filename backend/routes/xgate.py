# XGate Routes - API para integração com pagamentos PIX e USDT
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/xgate", tags=["XGate"])

# Referências globais (serão inicializadas pelo server.py)
db = None
xgate_service = None
usdt_service_class = None
get_current_user = None

def init_xgate_routes(_db, _xgate_service, _usdt_service_class, _get_current_user):
    """Inicializar dependências do módulo XGate"""
    global db, xgate_service, usdt_service_class, get_current_user
    db = _db
    xgate_service = _xgate_service
    usdt_service_class = _usdt_service_class
    get_current_user = _get_current_user

# Modelos Pydantic
class XGateDepositRequest(BaseModel):
    amount: float
    description: Optional[str] = None

class XGateConversionRequest(BaseModel):
    brl_amount: float
    target_currency: str = "USDT"

class XGateWebhookPayload(BaseModel):
    event_type: str
    deposit_id: Optional[str] = None
    customer_id: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    transaction_id: Optional[str] = None
    timestamp: Optional[str] = None


@router.get("/test-connection")
async def test_xgate_connection(current_user = Depends(lambda: get_current_user)):
    """Testar conexão com a API XGate"""
    try:
        result = await xgate_service.test_connection()
        
        if result.success:
            return {
                "success": True,
                "data": {
                    **result.data,
                    "user_id": current_user.email,
                    "connected_at": datetime.now(timezone.utc).isoformat()
                },
                "error": None,
                "status_code": result.status_code
            }
        else:
            return {
                "success": False,
                "data": None,
                "error": result.error,
                "status_code": result.status_code or 500
            }
    except Exception as e:
        logger.error(f"Erro ao testar XGate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.post("/create-customer")
async def create_xgate_customer(current_user = Depends(lambda: get_current_user)):
    """Criar cliente no sistema XGate"""
    try:
        mock_customer_id = f"XG_{current_user.id[:8]}_{int(datetime.now(timezone.utc).timestamp())}"
        
        await db.users.update_one(
            {"email": current_user.email},
            {"$set": {"xgate_customer_id": mock_customer_id}}
        )
        
        return {
            "success": True,
            "data": {
                "customer_id": mock_customer_id,
                "name": current_user.full_name,
                "email": current_user.email,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "mock_mode": True
            },
            "error": None,
            "status_code": 201
        }
    except Exception as e:
        logger.error(f"Erro ao criar cliente XGate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.post("/pix-deposit")
async def create_pix_deposit(
    request: XGateDepositRequest, 
    current_user = Depends(lambda: get_current_user)
):
    """Criar depósito PIX via XGate"""
    try:
        customer_id = getattr(current_user, 'xgate_customer_id', None)
        customer_name = current_user.full_name
        customer_document = getattr(current_user, 'cpf', None) or getattr(current_user, 'cnpj', None)
        customer_phone = getattr(current_user, 'phone', None)
        
        result = await xgate_service.create_pix_deposit(
            customer_id=customer_id,
            amount=request.amount,
            description=request.description or f"Depósito Transmill - R$ {request.amount:.2f}",
            user_email=current_user.email,
            customer_name=customer_name,
            customer_document=customer_document,
            customer_phone=customer_phone
        )
        
        if result.success:
            if result.data.get('customerId') and not customer_id:
                await db.users.update_one(
                    {"id": current_user.id},
                    {"$set": {"xgate_customer_id": result.data.get('customerId')}}
                )
            
            transaction_data = {
                "id": str(uuid.uuid4()),
                "user_id": current_user.id,
                "type": "deposit_pix_xgate",
                "amount": request.amount,
                "description": result.data.get("description", f"Depósito PIX XGate - R$ {request.amount:.2f}"),
                "status": "pending",
                "xgate_deposit_id": result.data.get("id"),
                "pix_key": result.data.get("pix_key"),
                "qr_code": result.data.get("qr_code"),
                "expires_at": result.data.get("expires_at"),
                "created_at": datetime.now(timezone.utc)
            }
            
            await db.transactions.insert_one(transaction_data)
            
            return {
                "success": True,
                "data": {
                    **result.data,
                    "customer_id": customer_id or result.data.get('customerId'),
                    "user_email": current_user.email
                },
                "error": None,
                "status_code": result.status_code
            }
        else:
            return {
                "success": False,
                "data": None,
                "error": result.error,
                "status_code": result.status_code or 500
            }
            
    except Exception as e:
        logger.error(f"Erro ao criar depósito PIX XGate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/exchange-rate")
async def get_exchange_rate(
    from_currency: str = "BRL",
    to_currency: str = "USDT",
    current_user = Depends(lambda: get_current_user)
):
    """Consultar taxa de câmbio BRL/USDT"""
    try:
        mock_rate = 5.50
        
        return {
            "success": True,
            "data": {
                "from_currency": from_currency,
                "to_currency": to_currency,
                "rate": mock_rate,
                "brl_usdt_rate": mock_rate,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "mock_mode": True
            },
            "error": None,
            "status_code": 200
        }
    except Exception as e:
        logger.error(f"Erro ao consultar taxa de câmbio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.post("/convert-brl-usdt")
async def convert_brl_to_usdt(
    request: XGateConversionRequest,
    current_user = Depends(lambda: get_current_user)
):
    """Criar PIX para depósito com conversão BRL para USDT via XGate"""
    try:
        customer_id = getattr(current_user, 'xgate_customer_id', None)
        if not customer_id:
            customer_result = await create_xgate_customer(current_user)
            if not customer_result["success"]:
                return customer_result
            customer_id = customer_result["data"].get("customer_id")
        
        exchange_rate = 5.50
        
        usdt_service = usdt_service_class()
        fee_amount, net_amount = usdt_service.calculate_usdt_fee(request.brl_amount)
        
        usdt_amount = net_amount / exchange_rate
        
        qr_data = xgate_service._generate_pix_qr_code(request.brl_amount)
        
        pix_copy_paste = qr_data["pix_copy_paste"]
        qr_code_image = qr_data["qr_code_image"]
        pix_key = f"pix.transmill.usdt.{str(uuid.uuid4())[:8]}@xgate.com.br"
        
        conversion_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "type": "deposit_conversion_usdt",
            "brl_amount": request.brl_amount,
            "fee_percentage": 3.99,
            "fee_amount": round(fee_amount, 2),
            "net_amount": round(net_amount, 2),
            "usdt_amount": round(usdt_amount, 6),
            "exchange_rate": exchange_rate,
            "status": "pending_payment",
            "pix_key": pix_key,
            "pix_code": pix_copy_paste,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=30),
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.conversions.insert_one(conversion_data)
        
        return {
            "success": True,
            "data": {
                "amount": request.brl_amount,
                "fee_percentage": 3.99,
                "fee_amount": round(fee_amount, 2),
                "net_amount": round(net_amount, 2),
                "usdt_amount": round(usdt_amount, 6),
                "exchange_rate": exchange_rate,
                "qr_code_image": qr_code_image,
                "pix_copy_paste": pix_copy_paste,
                "pix_key": pix_key,
                "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
                "conversion_id": conversion_data["id"],
                "mock_mode": True
            },
            "error": None,
            "status_code": 200
        }
    except Exception as e:
        logger.error(f"Erro ao converter BRL para USDT: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/deposit-status/{deposit_id}")
async def get_deposit_status(
    deposit_id: str,
    current_user = Depends(lambda: get_current_user)
):
    """Consultar status de depósito XGate"""
    try:
        transaction = await db.transactions.find_one({
            "user_id": current_user.id,
            "xgate_deposit_id": deposit_id
        })
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Depósito não encontrado")
        
        result = await xgate_service.check_deposit_status(deposit_id)
        
        if result.success:
            xgate_status = result.data.get("status")
            if xgate_status and xgate_status != transaction.get("status"):
                await db.transactions.update_one(
                    {"xgate_deposit_id": deposit_id},
                    {
                        "$set": {
                            "status": xgate_status,
                            "updated_at": datetime.now(timezone.utc)
                        }
                    }
                )
            
            return {
                "success": True,
                "data": {
                    "deposit_id": deposit_id,
                    "status": xgate_status or transaction.get("status", "unknown"),
                    "amount": transaction.get("amount", 0),
                    "created_at": transaction.get("created_at"),
                    "updated_at": result.data.get("updated_at"),
                    "description": transaction.get("description", ""),
                    "pix_key": transaction.get("pix_key"),
                    "qr_code": transaction.get("qr_code"),
                    "expires_at": transaction.get("expires_at")
                }
            }
        else:
            return {
                "success": True,
                "data": {
                    "deposit_id": deposit_id,
                    "status": transaction.get("status", "unknown"),
                    "amount": transaction.get("amount", 0),
                    "created_at": transaction.get("created_at"),
                    "description": transaction.get("description", ""),
                    "note": "Status from local database (XGate service unavailable)"
                }
            }
            
    except Exception as e:
        logger.error(f"Erro ao consultar status do depósito: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/transactions")
async def get_xgate_transactions(current_user = Depends(lambda: get_current_user)):
    """Listar transações XGate do usuário"""
    try:
        transactions = await db.transactions.find({
            "user_id": current_user.id,
            "type": {"$in": ["deposit_pix_xgate", "conversion_brl_usdt"]}
        }, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        conversions = await db.conversions.find({
            "user_id": current_user.id
        }, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        return {
            "success": True,
            "data": {
                "deposits": transactions,
                "conversions": conversions
            }
        }
    except Exception as e:
        logger.error(f"Erro ao listar transações XGate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.post("/webhook")
async def xgate_webhook(payload: XGateWebhookPayload, request: Request):
    """Webhook para receber notificações do XGate (Público)"""
    try:
        logger.info(f"📡 XGate webhook received: {payload.event_type}")
        
        if payload.event_type == "deposit.confirmed":
            if payload.deposit_id:
                transaction = await db.transactions.find_one({
                    "xgate_deposit_id": payload.deposit_id
                })
                
                if transaction:
                    await db.transactions.update_one(
                        {"xgate_deposit_id": payload.deposit_id},
                        {
                            "$set": {
                                "status": "completed",
                                "confirmed_at": datetime.now(timezone.utc),
                                "xgate_transaction_id": payload.transaction_id
                            }
                        }
                    )
                    
                    user = await db.users.find_one({"id": transaction["user_id"]})
                    if user:
                        new_balance = (user.get("balance", 0) or 0) + transaction["amount"]
                        await db.users.update_one(
                            {"id": transaction["user_id"]},
                            {"$set": {"balance": new_balance}}
                        )
                        
                        logger.info(f"💰 Depósito confirmado: R$ {transaction['amount']:.2f} para {user['email']}")
        
        elif payload.event_type == "deposit.failed":
            if payload.deposit_id:
                await db.transactions.update_one(
                    {"xgate_deposit_id": payload.deposit_id},
                    {
                        "$set": {
                            "status": "failed",
                            "failed_at": datetime.now(timezone.utc)
                        }
                    }
                )
                logger.warning(f"❌ Depósito falhou: {payload.deposit_id}")
        
        return {"status": "ok", "received": payload.event_type}
        
    except Exception as e:
        logger.error(f"Erro no webhook XGate: {str(e)}")
        return {"status": "error", "message": str(e)}
