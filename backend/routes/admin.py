"""
Módulo Admin - Transmill API
Endpoints administrativos para gestão de usuários, auditoria e configurações
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.hash import bcrypt
from datetime import datetime, timezone
import logging
import uuid
import jwt
import os

logger = logging.getLogger(__name__)

# Router
admin_router = APIRouter(prefix="/api/admin", tags=["admin"])

# Security
security = HTTPBearer()

# Configurações
_db = None
_SECRET_KEY = None
_ALGORITHM = "HS256"


def setup_admin_routes(db):
    """Configura as dependências do módulo admin"""
    global _db, _SECRET_KEY
    _db = db
    _SECRET_KEY = os.environ.get('JWT_SECRET', 'transmill_secret_key_2024')
    logger.info("✅ Admin routes configuradas")


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


def require_admin(user: dict):
    """Verifica se o usuário é admin/master"""
    is_admin = (
        user.get('is_master_account') or
        user.get('is_labelview_master') or
        user.get('user_type') in ['master', 'labelview_master', 'admin']
    )
    if not is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    return True


# ============================================
# ENDPOINTS - LISTAGEM DE USUÁRIOS
# ============================================

@admin_router.get("/users")
async def list_users(
    limit: int = 50,
    offset: int = 0,
    search: str = None,
    user_type: str = None,
    status: str = None,
    current_user: dict = Depends(get_user_from_token)
):
    """Lista todos os usuários (admin only)"""
    require_admin(current_user)
    
    try:
        filtro = {}
        
        if search:
            filtro["$or"] = [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"cpf": {"$regex": search, "$options": "i"}}
            ]
        
        if user_type:
            filtro["user_type"] = user_type
        
        if status:
            filtro["status"] = status
        
        users = await _db.users.find(
            filtro,
            {"_id": 0, "password_hash": 0, "hashed_password": 0}
        ).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
        
        total = await _db.users.count_documents(filtro)
        
        return {
            "success": True,
            "users": users,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar usuários: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.get("/users/{user_id}")
async def get_user_details(user_id: str, current_user: dict = Depends(get_user_from_token)):
    """Obtém detalhes de um usuário específico"""
    require_admin(current_user)
    
    try:
        user = await _db.users.find_one(
            {"id": user_id},
            {"_id": 0, "password_hash": 0, "hashed_password": 0}
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Buscar transações recentes
        transactions = await _db.transactions.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(10).to_list(length=10)
        
        return {
            "success": True,
            "user": user,
            "recent_transactions": transactions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar usuário: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - AÇÕES EM USUÁRIOS
# ============================================

@admin_router.post("/user-action")
async def perform_user_action(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Executa ações administrativas em usuários"""
    require_admin(current_user)
    
    try:
        data = await request.json()
        user_id = data.get('user_id')
        action = data.get('action')
        
        if not user_id or not action:
            raise HTTPException(status_code=400, detail="user_id e action são obrigatórios")
        
        valid_actions = ['block', 'unblock', 'verify_kyc', 'reject_kyc', 'reset_password', 'delete']
        if action not in valid_actions:
            raise HTTPException(status_code=400, detail=f"Ação inválida. Use: {', '.join(valid_actions)}")
        
        user = await _db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        if action == 'block':
            update_data['is_blocked'] = True
            update_data['blocked_at'] = datetime.now(timezone.utc).isoformat()
            update_data['blocked_by'] = current_user.get('id')
        
        elif action == 'unblock':
            update_data['is_blocked'] = False
            update_data['unblocked_at'] = datetime.now(timezone.utc).isoformat()
        
        elif action == 'verify_kyc':
            update_data['kyc_status'] = 'verified'
            update_data['kyc_verified_at'] = datetime.now(timezone.utc).isoformat()
            update_data['kyc_verified_by'] = current_user.get('id')
        
        elif action == 'reject_kyc':
            update_data['kyc_status'] = 'rejected'
            update_data['kyc_rejection_reason'] = data.get('reason', 'Documentos inválidos')
        
        elif action == 'reset_password':
            new_password = data.get('new_password', '123456')
            update_data['password_hash'] = bcrypt.hash(new_password)
            update_data['hashed_password'] = update_data['password_hash']
        
        elif action == 'delete':
            await _db.users.delete_one({"id": user_id})
            return {"success": True, "message": "Usuário deletado"}
        
        await _db.users.update_one({"id": user_id}, {"$set": update_data})
        
        return {"success": True, "message": f"Ação '{action}' executada com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na ação: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - AUDITORIA
# ============================================

@admin_router.get("/balance-audit/{user_id}")
async def audit_user_balance(user_id: str, current_user: dict = Depends(get_user_from_token)):
    """Audita o saldo de um usuário"""
    require_admin(current_user)
    
    try:
        user = await _db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Calcular saldo baseado em transações
        pipeline = [
            {"$match": {"user_id": user_id, "status": "completed"}},
            {"$group": {
                "_id": None,
                "total_entradas": {"$sum": {"$cond": [{"$gt": ["$valor", 0]}, "$valor", 0]}},
                "total_saidas": {"$sum": {"$cond": [{"$lt": ["$valor", 0]}, {"$abs": "$valor"}, 0]}}
            }}
        ]
        
        result = await _db.transactions.aggregate(pipeline).to_list(length=1)
        
        entradas = result[0]['total_entradas'] if result else 0
        saidas = result[0]['total_saidas'] if result else 0
        saldo_calculado = entradas - saidas
        saldo_atual = user.get('balance', 0)
        
        return {
            "success": True,
            "user_id": user_id,
            "saldo_atual": saldo_atual,
            "saldo_calculado": saldo_calculado,
            "total_entradas": entradas,
            "total_saidas": saidas,
            "diferenca": saldo_atual - saldo_calculado,
            "status": "OK" if abs(saldo_atual - saldo_calculado) < 0.01 else "DISCREPÂNCIA"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na auditoria: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/recalculate-balances")
async def recalculate_all_balances(current_user: dict = Depends(get_user_from_token)):
    """Recalcula todos os saldos (cuidado: operação pesada)"""
    require_admin(current_user)
    
    try:
        users = await _db.users.find({}, {"id": 1}).to_list(length=10000)
        updated = 0
        errors = 0
        
        for user in users:
            try:
                user_id = user.get('id')
                
                pipeline = [
                    {"$match": {"user_id": user_id, "status": "completed"}},
                    {"$group": {"_id": None, "total": {"$sum": "$valor"}}}
                ]
                
                result = await _db.transactions.aggregate(pipeline).to_list(length=1)
                novo_saldo = result[0]['total'] if result else 0
                
                await _db.users.update_one(
                    {"id": user_id},
                    {"$set": {"balance": novo_saldo}}
                )
                updated += 1
                
            except Exception as e:
                errors += 1
                logger.error(f"Erro ao recalcular saldo de {user_id}: {e}")
        
        return {
            "success": True,
            "message": f"Saldos recalculados: {updated} usuários",
            "updated": updated,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Erro ao recalcular saldos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - BUSCA
# ============================================

@admin_router.get("/buscar-por-cpf")
async def buscar_usuario_por_cpf(cpf: str, current_user: dict = Depends(get_user_from_token)):
    """Busca usuário por CPF"""
    require_admin(current_user)
    
    try:
        # Limpar CPF
        cpf_limpo = ''.join(filter(str.isdigit, cpf))
        
        user = await _db.users.find_one(
            {"cpf": {"$regex": cpf_limpo}},
            {"_id": 0, "password_hash": 0}
        )
        
        if not user:
            return {"success": False, "message": "Usuário não encontrado"}
        
        return {"success": True, "user": user}
        
    except Exception as e:
        logger.error(f"Erro na busca: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - REDE DO USUÁRIO
# ============================================

@admin_router.get("/user-network/{user_id}")
async def get_user_network(user_id: str, current_user: dict = Depends(get_user_from_token)):
    """Retorna a rede de indicações do usuário"""
    require_admin(current_user)
    
    try:
        user = await _db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        referral_code = user.get('referral_code')
        
        # Buscar indicados
        indicados = await _db.users.find(
            {"referred_by": referral_code},
            {"_id": 0, "id": 1, "full_name": 1, "email": 1, "created_at": 1}
        ).to_list(length=100)
        
        # Buscar quem indicou
        indicador = None
        if user.get('referred_by'):
            indicador = await _db.users.find_one(
                {"referral_code": user.get('referred_by')},
                {"_id": 0, "id": 1, "full_name": 1, "email": 1}
            )
        
        return {
            "success": True,
            "user": {
                "id": user.get('id'),
                "full_name": user.get('full_name'),
                "referral_code": referral_code
            },
            "indicados": indicados,
            "total_indicados": len(indicados),
            "indicador": indicador
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar rede: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - PERMISSÕES
# ============================================

@admin_router.post("/fix-master-permissions")
async def fix_master_permissions(current_user: dict = Depends(get_user_from_token)):
    """Corrige permissões de contas master"""
    require_admin(current_user)
    
    try:
        # Emails de contas master conhecidas
        master_emails = [
            "marcelotransmillapp@gmail.com",
            "labelview@transmill.com"
        ]
        
        updated = 0
        for email in master_emails:
            result = await _db.users.update_one(
                {"email": email},
                {"$set": {
                    "is_master_account": True,
                    "is_labelview_master": True,
                    "user_type": "master",
                    "is_blocked": False,
                    "is_active": True
                }}
            )
            if result.modified_count > 0:
                updated += 1
        
        return {"success": True, "message": f"Permissões atualizadas para {updated} contas"}
        
    except Exception as e:
        logger.error(f"Erro ao corrigir permissões: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.get("/test-simple")
async def admin_test_simple(current_user: dict = Depends(get_user_from_token)):
    """Endpoint de teste simples para verificar autenticação admin"""
    require_admin(current_user)
    return {"success": True, "message": "Admin autenticado", "user": current_user.get('email')}
