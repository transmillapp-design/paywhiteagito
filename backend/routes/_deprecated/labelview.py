"""
Módulo Labelview - Transmill API
Endpoints para o sistema de proteção veicular Labelview
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
labelview_router = APIRouter(prefix="/api/labelview", tags=["labelview"])

# Security
security = HTTPBearer()

# Configurações
_db = None
_SECRET_KEY = None
_ALGORITHM = "HS256"


def setup_labelview_routes(db):
    """Configura as dependências do módulo Labelview"""
    global _db, _SECRET_KEY
    _db = db
    _SECRET_KEY = os.environ.get('JWT_SECRET', 'transmill_secret_key_2024')
    logger.info("✅ Labelview routes configuradas")


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


# Alias para compatibilidade com server.py
get_current_user_dependency = get_user_from_token


# ============================================
# ENDPOINTS - SOLICITAÇÕES DE SERVIÇO
# ============================================

@labelview_router.get("/solicitacoes-servico")
async def get_solicitacoes_servico(
    unidade_id: str = None,
    status: str = None,
    regional_id: str = None,
    consultor_id: str = None,
    current_user: dict = Depends(get_user_from_token)
):
    """
    Busca solicitações de serviço para o menu Serviços do dashboard Labelview.
    Filtra por hierarquia: Master vê tudo, Unidade vê da unidade, Regional/Consultor vê da unidade.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        user_type = current_user.get('user_type')
        is_master = (
            current_user.get('is_labelview_master') or
            user_type == 'labelview_master'
        )
        
        filtro = {}
        
        if is_master:
            # Master vê todas, pode filtrar por unidade
            if unidade_id:
                filtro['unidade_id'] = unidade_id
        elif user_type in ['labelview_unidade', 'labelview_regional', 'labelview_consultor', 'labelview_fornecedor']:
            # Ver apenas da sua unidade
            user_unidade_id = current_user.get('unidade_id') or current_user.get('id')
            filtro['unidade_id'] = user_unidade_id
        else:
            return {"success": True, "solicitacoes": []}
        
        # Filtro de status
        if status:
            status_map = {
                'em_atendimento': 'em_andamento',
                'em_andamento': 'em_andamento'
            }
            filtro['status'] = status_map.get(status, status)
        
        solicitacoes = await _db.solicitacoes_assistencia.find(
            filtro,
            {"_id": 0}
        ).sort("created_at", -1).to_list(length=500)
        
        # Mapear status de volta para o frontend
        for s in solicitacoes:
            if s.get('status') == 'em_andamento':
                s['status'] = 'em_atendimento'
        
        return {
            "success": True,
            "solicitacoes": solicitacoes,
            "total": len(solicitacoes)
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar solicitações: {e}")
        return {"success": False, "error": str(e), "solicitacoes": []}


@labelview_router.patch("/solicitacoes-servico/{solicitacao_id}/status")
async def atualizar_status_solicitacao(
    solicitacao_id: str,
    request: Request,
    current_user: dict = Depends(get_user_from_token)
):
    """Atualiza o status de uma solicitação de serviço."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database não configurado")
    
    try:
        data = await request.json()
        novo_status = data.get('status')
        observacao = data.get('observacao', '')
        
        # Mapear status do frontend para o backend
        status_map = {
            'em_atendimento': 'em_andamento',
            'em_andamento': 'em_andamento'
        }
        status_db = status_map.get(novo_status, novo_status)
        
        if status_db not in ['pendente', 'em_andamento', 'concluido', 'cancelado']:
            return {"success": False, "error": "Status inválido"}
        
        result = await _db.solicitacoes_assistencia.update_one(
            {"id": solicitacao_id},
            {
                "$set": {
                    "status": status_db,
                    "observacao_atendimento": observacao,
                    "atendido_por": current_user.get('full_name'),
                    "atendido_por_id": current_user.get('id'),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Solicitação {solicitacao_id} atualizada para: {novo_status}")
            return {"success": True, "message": f"Status atualizado para: {novo_status}"}
        else:
            return {"success": False, "error": "Solicitação não encontrada"}
        
    except Exception as e:
        logger.error(f"Erro ao atualizar solicitação: {e}")
        return {"success": False, "error": str(e)}
