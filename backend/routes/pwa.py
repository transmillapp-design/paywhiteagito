"""
Módulo PWA - Transmill API
Endpoints para Progressive Web App (PWA), Push Notifications e Master Push
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pywebpush import webpush, WebPushException
from passlib.hash import bcrypt
from datetime import datetime, timezone
import logging
import json
import uuid
import jwt
import os

logger = logging.getLogger(__name__)

# Router
pwa_router = APIRouter(prefix="/api", tags=["pwa"])

# Security
security = HTTPBearer()

# Configurações
_db = None
_SECRET_KEY = None
_ALGORITHM = "HS256"
_create_access_token = None
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', 'Dl5WLqSQnXYpJaIxkBMHVe01wPKi0O8cCaF10Gd8rq0')
VAPID_CLAIMS = {"sub": "mailto:contato@transmill.com.br"}


def setup_pwa_routes(db, create_token_fn=None):
    """Configura as dependências do módulo PWA"""
    global _db, _SECRET_KEY, _create_access_token
    _db = db
    _SECRET_KEY = os.environ.get('JWT_SECRET', 'transmill_secret_key_2024')
    _create_access_token = create_token_fn
    logger.info("✅ PWA routes configuradas")


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


def _create_token(user_id: str) -> str:
    """Cria token JWT para o usuário"""
    from datetime import timedelta
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, _SECRET_KEY, algorithm=_ALGORITHM)


# ============================================
# ENDPOINTS - VAPID KEY
# ============================================

@pwa_router.get("/pwa/vapid-public-key")
async def get_vapid_public_key():
    """Retorna a chave pública VAPID para configuração do Push no frontend"""
    return {"public_key": VAPID_PUBLIC_KEY}


# ============================================
# ENDPOINTS - UNIDADE/CLIENTE PWA
# ============================================

@pwa_router.get("/pwa/unidade/{slug}")
async def get_unidade_by_slug(slug: str):
    """Obtém dados de uma unidade pelo slug para PWA"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        unidade = await _db.labelview_unidades.find_one(
            {"$or": [{"slug": slug}, {"id": slug}]},
            {"_id": 0, "password_hash": 0}
        )
        
        if not unidade:
            return {"success": False, "error": "Unidade não encontrada"}
        
        return {"success": True, "unidade": unidade}
        
    except Exception as e:
        logger.error(f"Erro ao buscar unidade: {e}")
        return {"success": False, "error": str(e)}


@pwa_router.post("/pwa/login")
async def pwa_login(request: Request):
    """Login específico para o PWA de clientes"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        data = await request.json()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email e senha são obrigatórios")
        
        user = await _db.users.find_one({"email": email})
        
        if not user:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        if not bcrypt.verify(password, user.get('password_hash', '')):
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Criar token
        access_token = _create_token(user['id'])
        
        # Remover dados sensíveis
        user_dict = {k: v for k, v in user.items() if k not in ['password_hash', '_id']}
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_dict
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no login PWA: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@pwa_router.get("/pwa/minha-protecao")
async def get_minha_protecao(current_user: dict = Depends(get_user_from_token)):
    """Retorna dados de proteção veicular do cliente logado"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_id = current_user.get('id')
        email = current_user.get('email')
        cpf = current_user.get('cpf')
        
        filtro = {"$or": [{"user_id": user_id}]}
        if email:
            filtro["$or"].append({"email": email})
        if cpf:
            filtro["$or"].append({"cpf": cpf})
        
        cliente = await _db.labelview_clientes.find_one(filtro, {"_id": 0})
        
        if not cliente:
            return {"success": True, "message": "Nenhuma proteção encontrada", "protecao": None}
        
        return {"success": True, "protecao": cliente}
        
    except Exception as e:
        logger.error(f"Erro ao buscar proteção: {e}")
        return {"success": False, "error": str(e)}


@pwa_router.get("/pwa/minhas-solicitacoes")
async def get_minhas_solicitacoes(current_user: dict = Depends(get_user_from_token)):
    """Retorna solicitações de serviço do cliente logado"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_id = current_user.get('id')
        
        solicitacoes = await _db.solicitacoes_servico.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(length=50)
        
        return {"success": True, "solicitacoes": solicitacoes, "total": len(solicitacoes)}
        
    except Exception as e:
        logger.error(f"Erro ao buscar solicitações: {e}")
        return {"success": False, "error": str(e)}


@pwa_router.post("/pwa/solicitar-assistencia")
async def solicitar_assistencia(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Cria uma nova solicitação de assistência"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        data = await request.json()
        
        solicitacao_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        solicitacao = {
            "id": solicitacao_id,
            "user_id": current_user.get('id'),
            "user_name": current_user.get('full_name'),
            "user_email": current_user.get('email'),
            "tipo_servico": data.get('tipo_servico', 'assistencia'),
            "descricao": data.get('descricao', ''),
            "localizacao": data.get('localizacao', {}),
            "veiculo": data.get('veiculo', {}),
            "status": "pendente",
            "created_at": now,
            "updated_at": now
        }
        
        await _db.solicitacoes_assistencia.insert_one(solicitacao)
        
        solicitacao.pop('_id', None)
        
        logger.info(f"✅ Solicitação de assistência criada: {solicitacao_id}")
        
        return {"success": True, "message": "Solicitação enviada!", "solicitacao": solicitacao}
        
    except Exception as e:
        logger.error(f"Erro ao criar solicitação: {e}")
        return {"success": False, "error": str(e)}


# ============================================
# ENDPOINTS - PUSH SUBSCRIPTION (PWA)
# ============================================

@pwa_router.post("/pwa/push/subscribe")
async def subscribe_push(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Registra uma inscrição push para um usuário"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        data = await request.json()
        subscription = data.get('subscription')
        
        if not subscription:
            raise HTTPException(status_code=400, detail="Subscription data é obrigatório")
        
        user_id = current_user.get('id')
        franquia_slug = current_user.get('franquia_slug', '')
        unidade_id = current_user.get('unidade_id', '')
        
        endpoint = subscription.get('endpoint')
        
        existing = await _db.push_subscriptions.find_one({"endpoint": endpoint})
        
        if existing:
            await _db.push_subscriptions.update_one(
                {"endpoint": endpoint},
                {"$set": {
                    "user_id": user_id,
                    "franquia_slug": franquia_slug,
                    "unidade_id": unidade_id,
                    "keys": subscription.get('keys'),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            logger.info(f"📱 Push subscription atualizada para user {user_id}")
        else:
            sub_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "franquia_slug": franquia_slug,
                "unidade_id": unidade_id,
                "endpoint": endpoint,
                "keys": subscription.get('keys'),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await _db.push_subscriptions.insert_one(sub_data)
            logger.info(f"📱 Nova push subscription para user {user_id}")
        
        return {"success": True, "message": "Inscrição push registrada"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao registrar push: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@pwa_router.post("/pwa/push/unsubscribe")
async def unsubscribe_push(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Remove uma inscrição push"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        data = await request.json()
        endpoint = data.get('endpoint')
        user_id = current_user.get('id')
        
        if endpoint:
            await _db.push_subscriptions.delete_one({"endpoint": endpoint})
            logger.info(f"📱 Push subscription removida: {endpoint[:50]}...")
        else:
            await _db.push_subscriptions.delete_many({"user_id": user_id})
            logger.info(f"📱 Todas push subscriptions removidas para user {user_id}")
        
        return {"success": True, "message": "Inscrição removida"}
        
    except Exception as e:
        logger.error(f"❌ Erro ao remover push: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@pwa_router.get("/pwa/push/subscribers-count")
async def get_pwa_subscribers_count(current_user: dict = Depends(get_user_from_token)):
    """Retorna contagem de inscritos por categoria (para unidades)"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        unidade_id = current_user.get('unidade_id') or current_user.get('id')
        
        total = await _db.push_subscriptions.count_documents({"unidade_id": unidade_id})
        
        return {"success": True, "total": total, "unidade_id": unidade_id}
        
    except Exception as e:
        logger.error(f"❌ Erro ao contar subscribers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@pwa_router.post("/pwa/push/send")
async def send_push_notification(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Envia notificação push para clientes da unidade"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        data = await request.json()
        title = data.get('title', 'Notificação')
        body = data.get('body', '')
        url = data.get('url', '/')
        
        unidade_id = current_user.get('unidade_id') or current_user.get('id')
        
        subscriptions = await _db.push_subscriptions.find({"unidade_id": unidade_id}).to_list(length=10000)
        
        if not subscriptions:
            return {"success": True, "sent": 0, "message": "Nenhum inscrito encontrado"}
        
        push_payload = json.dumps({
            "title": title,
            "body": body,
            "icon": "/logo192.png",
            "data": {"url": url}
        })
        
        sent_count = 0
        failed_count = 0
        
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={"endpoint": sub.get('endpoint'), "keys": sub.get('keys')},
                    data=push_payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=VAPID_CLAIMS
                )
                sent_count += 1
            except WebPushException as e:
                if e.response and e.response.status_code in [404, 410]:
                    await _db.push_subscriptions.delete_one({"_id": sub["_id"]})
                failed_count += 1
            except Exception:
                failed_count += 1
        
        logger.info(f"📬 Push enviado: {sent_count} sucesso, {failed_count} falhas")
        
        return {"success": True, "sent": sent_count, "failed": failed_count}
        
    except Exception as e:
        logger.error(f"❌ Erro ao enviar push: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS - MASTER PUSH
# ============================================

@pwa_router.post("/master/push/subscribe")
async def master_subscribe_push(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Registra push subscription para master"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        data = await request.json()
        subscription = data.get('subscription')
        
        if not subscription:
            raise HTTPException(status_code=400, detail="Subscription é obrigatório")
        
        user_id = current_user.get('id')
        endpoint = subscription.get('endpoint')
        
        existing = await _db.push_subscriptions.find_one({"endpoint": endpoint})
        
        if existing:
            await _db.push_subscriptions.update_one(
                {"endpoint": endpoint},
                {"$set": {
                    "user_id": user_id,
                    "is_master": True,
                    "keys": subscription.get('keys'),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            await _db.push_subscriptions.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "is_master": True,
                "endpoint": endpoint,
                "keys": subscription.get('keys'),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        logger.info(f"📱 Master push subscription registrada: {user_id}")
        return {"success": True, "message": "Master subscription registrada"}
        
    except Exception as e:
        logger.error(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@pwa_router.post("/master/push/unsubscribe")
async def master_unsubscribe_push(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Remove push subscription do master"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        data = await request.json()
        endpoint = data.get('endpoint')
        
        if endpoint:
            await _db.push_subscriptions.delete_one({"endpoint": endpoint})
        
        return {"success": True, "message": "Subscription removida"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@pwa_router.get("/master/push/subscribers-count")
async def master_get_subscribers_count(current_user: dict = Depends(get_user_from_token)):
    """Retorna contagem total de inscritos (master view)"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_type = current_user.get('user_type', '')
        is_master = (user_type == 'master' or 
                     current_user.get('is_master_account', False) or
                     current_user.get('is_labelview_master', False))
        
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        total = await _db.push_subscriptions.count_documents({})
        
        pipeline = [
            {"$group": {"_id": "$franquia_slug", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        by_franquia = await _db.push_subscriptions.aggregate(pipeline).to_list(100)
        
        return {"success": True, "total": total, "by_franquia": by_franquia}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@pwa_router.post("/master/push/send")
async def master_send_push(request: Request, current_user: dict = Depends(get_user_from_token)):
    """Envia push notification para todos ou franquias específicas (master)"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_type = current_user.get('user_type', '')
        is_master = (user_type == 'master' or 
                     current_user.get('is_master_account', False) or
                     current_user.get('is_labelview_master', False))
        
        if not is_master:
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        data = await request.json()
        title = data.get('title', 'Notificação')
        body = data.get('body', '')
        url = data.get('url', '/')
        target = data.get('target', 'all')  # 'all' ou lista de franquia_slugs
        franquia_slugs = data.get('franquia_slugs', [])
        
        # Construir query
        query = {}
        if target != 'all' and franquia_slugs:
            query['franquia_slug'] = {"$in": franquia_slugs}
        
        subscriptions = await _db.push_subscriptions.find(query).to_list(length=50000)
        
        if not subscriptions:
            return {"success": True, "sent": 0, "message": "Nenhum inscrito encontrado"}
        
        push_payload = json.dumps({
            "title": title,
            "body": body,
            "icon": "/logo192.png",
            "data": {"url": url}
        })
        
        sent_count = 0
        failed_count = 0
        
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={"endpoint": sub.get('endpoint'), "keys": sub.get('keys')},
                    data=push_payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=VAPID_CLAIMS
                )
                sent_count += 1
            except WebPushException as e:
                if e.response and e.response.status_code in [404, 410]:
                    await _db.push_subscriptions.delete_one({"_id": sub["_id"]})
                failed_count += 1
            except Exception:
                failed_count += 1
        
        logger.info(f"📬 Master push enviado: {sent_count} sucesso, {failed_count} falhas")
        
        return {"success": True, "sent": sent_count, "failed": failed_count, "total_subscribers": len(subscriptions)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao enviar master push: {e}")
        raise HTTPException(status_code=500, detail=str(e))
