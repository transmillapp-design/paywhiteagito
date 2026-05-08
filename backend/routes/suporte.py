"""
Módulo de Suporte - Transmill API
Sistema de chamados/tickets entre franquias e master
Com notificações push integradas
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import logging
import uuid
import jwt

logger = logging.getLogger(__name__)

# Router
suporte_router = APIRouter(prefix="/api/suporte", tags=["suporte"])

# Security
security = HTTPBearer()

# ============================================
# MODELS
# ============================================

class ChamadoCreate(BaseModel):
    titulo: str
    categoria: str = "geral"  # 'geral', 'financeiro', 'tecnico', 'operacional'
    descricao: str
    prioridade: str = "media"  # 'baixa', 'media', 'alta', 'urgente'

class ChamadoResponse(BaseModel):
    chamado_id: str
    conteudo: str

class ChamadoStatusUpdate(BaseModel):
    status: str  # 'aberto', 'em_andamento', 'aguardando_resposta', 'resolvido', 'fechado'

# ============================================
# DATABASE e HELPERS
# ============================================

_db = None
_SECRET_KEY = None
_ALGORITHM = "HS256"
_notifications_module = None

def setup_suporte_routes(db, get_current_user_fn=None):
    """Configura as dependências do módulo suporte"""
    global _db, _SECRET_KEY, _notifications_module
    import os
    _db = db
    _SECRET_KEY = os.environ.get('JWT_SECRET', 'transmill_secret_key_2024')
    
    # Importar e configurar módulo de notificações
    try:
        from routes.notifications import setup_notifications, notify_new_chamado, notify_chamado_response
        setup_notifications(db)
        _notifications_module = {
            'notify_new_chamado': notify_new_chamado,
            'notify_chamado_response': notify_chamado_response
        }
        logger.info("✅ Suporte routes configuradas com notificações push")
    except Exception as e:
        logger.warning(f"⚠️ Notificações push não configuradas: {e}")
        _notifications_module = None
    
    logger.info("✅ Suporte routes configuradas")

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
        
        # Remover _id e password_hash antes de retornar
        user_doc.pop('_id', None)
        user_doc.pop('password_hash', None)
        
        return user_doc
        
    except jwt.exceptions.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

# ============================================
# ENDPOINTS
# ============================================

@suporte_router.post("/chamados")
async def criar_chamado(chamado_data: ChamadoCreate, current_user: dict = Depends(get_user_from_token)):
    """
    Cria um novo chamado de suporte.
    Apenas franquias/unidades podem criar chamados.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_id = current_user.get('id', '')
        user_type = current_user.get('user_type', '')
        franquia_slug = current_user.get('franquia_slug', '')
        full_name = current_user.get('full_name', 'Usuário')
        
        # Master NÃO pode criar chamados de suporte (ele responde)
        if user_type == 'master' or current_user.get('is_master_account'):
            raise HTTPException(status_code=403, detail="Master não pode criar chamados de suporte")
        
        # Buscar franquia associada (se houver)
        franquia_id = None
        franquia_nome = "Sem franquia vinculada"
        
        if franquia_slug:
            franquia = await _db.franquias.find_one({"slug": franquia_slug})
            if franquia:
                franquia_id = franquia.get('id')
                franquia_nome = franquia.get('nome', franquia_slug)
        
        # Criar o chamado
        chamado_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        chamado = {
            "id": chamado_id,
            "franquia_id": franquia_id,
            "franquia_slug": franquia_slug,
            "franquia_nome": franquia_nome,
            "criador_id": user_id,
            "criador_nome": full_name,
            "criador_tipo": user_type,
            "titulo": chamado_data.titulo,
            "categoria": chamado_data.categoria,
            "descricao": chamado_data.descricao,
            "prioridade": chamado_data.prioridade,
            "status": "aberto",
            "mensagens": [
                {
                    "id": str(uuid.uuid4()),
                    "autor_id": user_id,
                    "autor_nome": full_name,
                    "autor_tipo": "franquia",
                    "conteudo": chamado_data.descricao,
                    "created_at": now
                }
            ],
            "created_at": now,
            "updated_at": now
        }
        
        await _db.suporte_chamados.insert_one(chamado)
        
        # Remover _id do MongoDB antes de retornar
        chamado.pop('_id', None)
        
        logger.info(f"✅ Chamado criado: {chamado_id} por {full_name}")
        
        # Enviar notificação push para o master sobre novo chamado
        if _notifications_module:
            try:
                await _notifications_module['notify_new_chamado'](chamado)
            except Exception as notif_error:
                logger.warning(f"⚠️ Erro ao enviar notificação: {notif_error}")
        
        return {
            "success": True,
            "message": "Chamado criado com sucesso",
            "chamado": chamado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao criar chamado: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar chamado: {str(e)}")


@suporte_router.get("/chamados")
async def listar_chamados(
    status: Optional[str] = None,
    categoria: Optional[str] = None,
    prioridade: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Lista chamados de suporte.
    - Master: vê todos os chamados
    - Franquia: vê apenas seus próprios chamados
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_type = current_user.get('user_type', '')
        is_master = (user_type == 'master' or 
                     current_user.get('is_master_account', False) or
                     current_user.get('is_labelview_master', False) or
                     user_type == 'labelview_master')
        franquia_slug = current_user.get('franquia_slug', '')
        
        # Construir filtro
        filtro = {}
        
        # Master vê todos, franquia vê apenas os seus
        if not is_master:
            if franquia_slug:
                filtro["franquia_slug"] = franquia_slug
            else:
                filtro["criador_id"] = current_user.get('id', '')
        
        # Filtros opcionais
        if status:
            filtro["status"] = status
        if categoria:
            filtro["categoria"] = categoria
        if prioridade:
            filtro["prioridade"] = prioridade
        
        # Buscar chamados
        chamados_cursor = _db.suporte_chamados.find(filtro, {"_id": 0}).sort("created_at", -1).limit(limit)
        chamados = await chamados_cursor.to_list(length=limit)
        
        # Estatísticas (para master vê geral, para franquia vê só os seus)
        filtro_base = {} if is_master else filtro.copy()
        if 'status' in filtro_base:
            del filtro_base['status']
        
        total = await _db.suporte_chamados.count_documents(filtro_base)
        abertos = await _db.suporte_chamados.count_documents({**filtro_base, "status": "aberto"})
        em_andamento = await _db.suporte_chamados.count_documents({**filtro_base, "status": "em_andamento"})
        resolvidos = await _db.suporte_chamados.count_documents({**filtro_base, "status": "resolvido"})
        
        return {
            "success": True,
            "chamados": chamados,
            "stats": {
                "total": total,
                "abertos": abertos,
                "em_andamento": em_andamento,
                "resolvidos": resolvidos
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao listar chamados: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar chamados: {str(e)}")


@suporte_router.get("/chamados/{chamado_id}")
async def obter_chamado(chamado_id: str, current_user: dict = Depends(get_user_from_token)):
    """
    Obtém detalhes de um chamado específico.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_type = current_user.get('user_type', '')
        is_master = (user_type == 'master' or 
                     current_user.get('is_master_account', False) or
                     current_user.get('is_labelview_master', False) or
                     user_type == 'labelview_master')
        franquia_slug = current_user.get('franquia_slug', '')
        
        # Buscar chamado
        chamado = await _db.suporte_chamados.find_one({"id": chamado_id}, {"_id": 0})
        
        if not chamado:
            raise HTTPException(status_code=404, detail="Chamado não encontrado")
        
        # Verificar permissão
        if not is_master:
            if chamado.get('franquia_slug') != franquia_slug and chamado.get('criador_id') != current_user.get('id'):
                raise HTTPException(status_code=403, detail="Acesso não autorizado a este chamado")
        
        return {
            "success": True,
            "chamado": chamado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao obter chamado: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter chamado: {str(e)}")


@suporte_router.post("/chamados/{chamado_id}/mensagens")
async def adicionar_mensagem(
    chamado_id: str, 
    mensagem_data: ChamadoResponse,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Adiciona uma mensagem a um chamado existente.
    Tanto franquia quanto master podem responder.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_id = current_user.get('id', '')
        user_type = current_user.get('user_type', '')
        full_name = current_user.get('full_name', 'Usuário')
        is_master = (user_type == 'master' or 
                     current_user.get('is_master_account', False) or
                     current_user.get('is_labelview_master', False) or
                     user_type == 'labelview_master')
        franquia_slug = current_user.get('franquia_slug', '')
        
        # Buscar chamado
        chamado = await _db.suporte_chamados.find_one({"id": chamado_id})
        
        if not chamado:
            raise HTTPException(status_code=404, detail="Chamado não encontrado")
        
        # Verificar permissão
        if not is_master:
            if chamado.get('franquia_slug') != franquia_slug and chamado.get('criador_id') != user_id:
                raise HTTPException(status_code=403, detail="Acesso não autorizado a este chamado")
        
        # Criar nova mensagem
        now = datetime.now(timezone.utc).isoformat()
        nova_mensagem = {
            "id": str(uuid.uuid4()),
            "autor_id": user_id,
            "autor_nome": full_name,
            "autor_tipo": "master" if is_master else "franquia",
            "conteudo": mensagem_data.conteudo,
            "created_at": now
        }
        
        # Determinar novo status
        novo_status = chamado.get('status', 'aberto')
        if is_master:
            # Master respondeu, aguarda resposta da franquia
            if novo_status in ['aberto', 'em_andamento']:
                novo_status = "aguardando_resposta"
        else:
            # Franquia respondeu, volta para em_andamento
            if novo_status == 'aguardando_resposta':
                novo_status = "em_andamento"
        
        # Atualizar chamado
        await _db.suporte_chamados.update_one(
            {"id": chamado_id},
            {
                "$push": {"mensagens": nova_mensagem},
                "$set": {
                    "status": novo_status,
                    "updated_at": now
                }
            }
        )
        
        logger.info(f"✅ Mensagem adicionada ao chamado {chamado_id} por {full_name}")
        
        # Enviar notificação push sobre a resposta
        if _notifications_module:
            try:
                # Atualizar chamado com o novo status antes de notificar
                chamado['status'] = novo_status
                await _notifications_module['notify_chamado_response'](
                    chamado=chamado,
                    respondente=current_user,
                    is_master_response=is_master
                )
            except Exception as notif_error:
                logger.warning(f"⚠️ Erro ao enviar notificação: {notif_error}")
        
        return {
            "success": True,
            "message": "Mensagem adicionada com sucesso",
            "nova_mensagem": nova_mensagem,
            "novo_status": novo_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao adicionar mensagem: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar mensagem: {str(e)}")


@suporte_router.patch("/chamados/{chamado_id}/status")
async def atualizar_status(
    chamado_id: str,
    status_data: ChamadoStatusUpdate,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Atualiza o status de um chamado.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_type = current_user.get('user_type', '')
        is_master = (user_type == 'master' or 
                     current_user.get('is_master_account', False) or
                     current_user.get('is_labelview_master', False) or
                     user_type == 'labelview_master')
        franquia_slug = current_user.get('franquia_slug', '')
        user_id = current_user.get('id', '')
        
        # Buscar chamado
        chamado = await _db.suporte_chamados.find_one({"id": chamado_id})
        
        if not chamado:
            raise HTTPException(status_code=404, detail="Chamado não encontrado")
        
        # Verificar permissão
        if not is_master:
            if chamado.get('franquia_slug') != franquia_slug and chamado.get('criador_id') != user_id:
                raise HTTPException(status_code=403, detail="Acesso não autorizado a este chamado")
        
        # Validar status
        status_validos = ['aberto', 'em_andamento', 'aguardando_resposta', 'resolvido', 'fechado']
        if status_data.status not in status_validos:
            raise HTTPException(status_code=400, detail=f"Status inválido. Use: {', '.join(status_validos)}")
        
        # Atualizar status
        now = datetime.now(timezone.utc).isoformat()
        await _db.suporte_chamados.update_one(
            {"id": chamado_id},
            {
                "$set": {
                    "status": status_data.status,
                    "updated_at": now
                }
            }
        )
        
        logger.info(f"✅ Status do chamado {chamado_id} atualizado para {status_data.status}")
        
        return {
            "success": True,
            "message": f"Status atualizado para {status_data.status}",
            "novo_status": status_data.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar status: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar status: {str(e)}")
