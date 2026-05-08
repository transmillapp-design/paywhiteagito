"""
Módulo Wallet - Transmill API
Endpoints para transações, pagamentos, saques e integração XGate
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
import logging
import uuid
import jwt
import os

logger = logging.getLogger(__name__)

# Router
wallet_router = APIRouter(prefix="/api", tags=["wallet"])

# Security
security = HTTPBearer()

# Configurações
_db = None
_SECRET_KEY = None
_ALGORITHM = "HS256"
_xgate_service = None


def setup_wallet_routes(db, xgate_service=None):
    """Configura as dependências do módulo wallet"""
    global _db, _SECRET_KEY, _xgate_service
    _db = db
    _SECRET_KEY = os.environ.get('JWT_SECRET', 'transmill_secret_key_2024')
    _xgate_service = xgate_service
    logger.info("✅ Wallet routes configuradas")


async def get_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extrai e valida usuário do token JWT"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user_doc = await _db.users.find_one({"id": user_id})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        user_doc.pop('_id', None)
        user_doc.pop('password_hash', None)
        return user_doc
        
    except jwt.exceptions.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")


# ============================================
# ENDPOINTS - HISTÓRICO DE TRANSAÇÕES
# ============================================

@wallet_router.get("/transactions/history")
async def get_transactions_history(
    limit: int = 50,
    offset: int = 0,
    tipo: str = None,
    current_user: dict = Depends(get_user_from_token)
):
    """Retorna o histórico de transações do usuário"""
    try:
        user_id = current_user.get('id')
        
        # Filtro base
        filtro = {"user_id": user_id}
        
        if tipo:
            filtro["tipo"] = tipo
        
        # Buscar transações
        transactions = await _db.transactions.find(
            filtro,
            {"_id": 0}
        ).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
        
        # Contar total
        total = await _db.transactions.count_documents(filtro)
        
        return {
            "success": True,
            "transactions": transactions,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar histórico: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - PAGAMENTO PIX
# ============================================

@wallet_router.post("/transactions/payment")
async def create_pix_payment(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Cria um pagamento PIX"""
    try:
        data = await request.json()
        user_id = current_user.get('id')
        
        valor = float(data.get('amount', data.get('valor', 0)))
        descricao = data.get('description', data.get('descricao', 'Pagamento PIX'))
        
        if valor <= 0:
            raise HTTPException(status_code=400, detail="Valor inválido")
        
        # Verificar saldo
        user = await _db.users.find_one({"id": user_id})
        balance = user.get('balance', 0)
        
        if balance < valor:
            raise HTTPException(status_code=400, detail="Saldo insuficiente")
        
        # Criar transação
        transaction_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        transaction = {
            "id": transaction_id,
            "user_id": user_id,
            "tipo": "pagamento",
            "valor": valor,
            "descricao": descricao,
            "status": "pending",
            "created_at": now
        }
        
        await _db.transactions.insert_one(transaction)
        
        # Debitar saldo
        await _db.users.update_one(
            {"id": user_id},
            {"$inc": {"balance": -valor}}
        )
        
        # Atualizar status
        await _db.transactions.update_one(
            {"id": transaction_id},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        transaction.pop('_id', None)
        transaction['status'] = 'completed'
        
        return {
            "success": True,
            "message": "Pagamento realizado com sucesso",
            "transaction": transaction,
            "new_balance": balance - valor
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no pagamento: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - SAQUE
# ============================================

@wallet_router.post("/transactions/withdrawal")
async def create_withdrawal(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Cria uma solicitação de saque"""
    try:
        data = await request.json()
        user_id = current_user.get('id')
        
        valor = float(data.get('amount', data.get('valor', 0)))
        pix_key = data.get('pix_key', data.get('chave_pix'))
        pix_type = data.get('pix_type', data.get('tipo_chave', 'cpf'))
        
        if valor <= 0:
            raise HTTPException(status_code=400, detail="Valor inválido")
        
        if not pix_key:
            raise HTTPException(status_code=400, detail="Chave PIX é obrigatória")
        
        # Verificar saldo
        user = await _db.users.find_one({"id": user_id})
        balance = user.get('balance', 0)
        
        # Taxa de saque (exemplo: 1%)
        taxa = valor * 0.01
        valor_liquido = valor - taxa
        
        if balance < valor:
            raise HTTPException(status_code=400, detail="Saldo insuficiente")
        
        # Criar transação de saque
        withdrawal_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        withdrawal = {
            "id": withdrawal_id,
            "user_id": user_id,
            "tipo": "saque",
            "valor": valor,
            "taxa": taxa,
            "valor_liquido": valor_liquido,
            "pix_key": pix_key,
            "pix_type": pix_type,
            "status": "pending",
            "created_at": now
        }
        
        await _db.transactions.insert_one(withdrawal)
        
        # Debitar saldo
        await _db.users.update_one(
            {"id": user_id},
            {"$inc": {"balance": -valor}}
        )
        
        withdrawal.pop('_id', None)
        
        return {
            "success": True,
            "message": "Saque solicitado com sucesso",
            "withdrawal": withdrawal,
            "new_balance": balance - valor
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no saque: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - DEPÓSITO (GERAR QR CODE PIX)
# ============================================

@wallet_router.post("/transactions/deposit")
async def create_deposit(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Gera um QR Code PIX para depósito"""
    try:
        data = await request.json()
        user_id = current_user.get('id')
        
        valor = float(data.get('amount', data.get('valor', 0)))
        
        if valor <= 0:
            raise HTTPException(status_code=400, detail="Valor inválido")
        
        # Criar transação de depósito pendente
        deposit_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        deposit = {
            "id": deposit_id,
            "user_id": user_id,
            "tipo": "deposito",
            "valor": valor,
            "status": "pending",
            "created_at": now,
            "expires_at": datetime.now(timezone.utc).isoformat()  # 30 min expiry
        }
        
        # Se temos XGate, gerar QR Code real
        if _xgate_service:
            try:
                user = await _db.users.find_one({"id": user_id})
                pix_result = await _xgate_service.generate_pix_qrcode(
                    amount=valor,
                    description=f"Depósito Transmill - {user.get('full_name', 'Cliente')}",
                    external_id=deposit_id
                )
                deposit['qr_code'] = pix_result.get('qr_code')
                deposit['qr_code_base64'] = pix_result.get('qr_code_base64')
                deposit['pix_copy_paste'] = pix_result.get('copy_paste')
            except Exception as e:
                logger.error(f"Erro ao gerar PIX via XGate: {e}")
                deposit['qr_code'] = None
        
        await _db.transactions.insert_one(deposit)
        deposit.pop('_id', None)
        
        return {
            "success": True,
            "message": "QR Code gerado",
            "deposit": deposit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no depósito: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - TRANSFERÊNCIA P2P
# ============================================

@wallet_router.post("/transactions/transfer")
async def create_transfer(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Transferência entre usuários da plataforma"""
    try:
        data = await request.json()
        sender_id = current_user.get('id')
        
        receiver_identifier = data.get('receiver_id') or data.get('receiver_email') or data.get('receiver_cpf')
        valor = float(data.get('amount', data.get('valor', 0)))
        descricao = data.get('description', 'Transferência')
        
        if valor <= 0:
            raise HTTPException(status_code=400, detail="Valor inválido")
        
        if not receiver_identifier:
            raise HTTPException(status_code=400, detail="Destinatário é obrigatório")
        
        # Buscar destinatário
        receiver = await _db.users.find_one({
            "$or": [
                {"id": receiver_identifier},
                {"email": receiver_identifier},
                {"cpf": receiver_identifier}
            ]
        })
        
        if not receiver:
            raise HTTPException(status_code=404, detail="Destinatário não encontrado")
        
        if receiver.get('id') == sender_id:
            raise HTTPException(status_code=400, detail="Não é possível transferir para si mesmo")
        
        # Verificar saldo
        sender = await _db.users.find_one({"id": sender_id})
        balance = sender.get('balance', 0)
        
        if balance < valor:
            raise HTTPException(status_code=400, detail="Saldo insuficiente")
        
        # Criar transações
        transfer_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Transação de saída (sender)
        tx_out = {
            "id": str(uuid.uuid4()),
            "user_id": sender_id,
            "tipo": "transferencia_enviada",
            "valor": -valor,
            "descricao": f"Transferência para {receiver.get('full_name', 'Usuário')}",
            "transfer_id": transfer_id,
            "receiver_id": receiver.get('id'),
            "status": "completed",
            "created_at": now
        }
        
        # Transação de entrada (receiver)
        tx_in = {
            "id": str(uuid.uuid4()),
            "user_id": receiver.get('id'),
            "tipo": "transferencia_recebida",
            "valor": valor,
            "descricao": f"Transferência de {current_user.get('full_name', 'Usuário')}",
            "transfer_id": transfer_id,
            "sender_id": sender_id,
            "status": "completed",
            "created_at": now
        }
        
        await _db.transactions.insert_many([tx_out, tx_in])
        
        # Atualizar saldos
        await _db.users.update_one({"id": sender_id}, {"$inc": {"balance": -valor}})
        await _db.users.update_one({"id": receiver.get('id')}, {"$inc": {"balance": valor}})
        
        return {
            "success": True,
            "message": f"Transferência de R$ {valor:.2f} realizada",
            "transfer_id": transfer_id,
            "new_balance": balance - valor
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na transferência: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - VALIDAÇÃO DE CÓDIGO DIGITAL
# ============================================

@wallet_router.post("/transactions/validate-digital-code")
async def validate_digital_code(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Valida um código digital para pagamento"""
    try:
        data = await request.json()
        code = data.get('code', '').strip()
        
        if not code:
            raise HTTPException(status_code=400, detail="Código é obrigatório")
        
        # Buscar código na base
        digital_code = await _db.digital_codes.find_one({
            "code": code,
            "status": "active",
            "used": False
        })
        
        if not digital_code:
            return {
                "success": False,
                "valid": False,
                "message": "Código inválido ou já utilizado"
            }
        
        return {
            "success": True,
            "valid": True,
            "code_data": {
                "valor": digital_code.get('valor'),
                "descricao": digital_code.get('descricao'),
                "merchant_name": digital_code.get('merchant_name')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na validação: {e}")
        raise HTTPException(status_code=500, detail=str(e))
