"""
Master Routes - Transmill API
Endpoints para administração master da plataforma.
Inclui: segmentos de negócio, tipos de prestador, planos de internet/telemedicina.
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4
import logging

from routes.auth_utils import get_authenticated_user

logger = logging.getLogger(__name__)

master_router = APIRouter(prefix="/master", tags=["Master"])

db = None

def set_db(database):
    global db
    db = database

def set_auth_dependency(auth_func):
    """Mantido para retrocompatibilidade na inicialização do server.py"""
    pass

def _check_master(user):
    """Verifica se o usuário tem acesso master"""
    user_data = user._data if hasattr(user, '_data') else (user if isinstance(user, dict) else {})
    is_master = (
        user_data.get('user_type') == 'master' or
        user_data.get('is_master_account') or
        user_data.get('user_type') == 'labelview_master' or
        user_data.get('is_labelview_master')
    )
    if not is_master:
        raise HTTPException(status_code=403, detail="Acesso negado. Somente contas master.")

def _uid(user):
    return user.id if hasattr(user, 'id') else (user.get('id') if isinstance(user, dict) else str(user))

# ============================================
# SEGMENTOS DE NEGÓCIO
# ============================================

@master_router.get("/business-segments")
async def get_business_segments(request: Request):
    """Lista todos os segmentos de negócio cadastrados"""
    current_user = await get_authenticated_user(request)
    _check_master(current_user)
    try:
        segments = await db.business_segments.find({}, {"_id": 0}).sort("name", 1).to_list(length=200)
        return {"success": True, "segments": segments, "total": len(segments)}
    except Exception as e:
        logger.error(f"Erro ao listar segmentos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@master_router.post("/business-segments")
async def create_business_segment(segment_data: dict, request: Request):
    """Cria um novo segmento de negócio"""
    current_user = await get_authenticated_user(request)
    _check_master(current_user)
    try:
        segment = {
            "id": str(uuid4()),
            "name": segment_data.get("name"),
            "icon": segment_data.get("icon", "briefcase"),
            "description": segment_data.get("description", ""),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": _uid(current_user)
        }
        await db.business_segments.insert_one(segment)
        if "_id" in segment:
            del segment["_id"]
        return {"success": True, "segment": segment}
    except Exception as e:
        logger.error(f"Erro ao criar segmento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@master_router.put("/business-segments/{segment_id}")
async def update_business_segment(segment_id: str, segment_data: dict, request: Request):
    """Atualiza um segmento de negócio"""
    current_user = await get_authenticated_user(request)
    _check_master(current_user)
    try:
        existing = await db.business_segments.find_one({"id": segment_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Segmento não encontrado")
        update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
        for field in ["name", "icon", "description", "is_active"]:
            if field in segment_data:
                update_fields[field] = segment_data[field]
        await db.business_segments.update_one({"id": segment_id}, {"$set": update_fields})
        updated = await db.business_segments.find_one({"id": segment_id}, {"_id": 0})
        return {"success": True, "segment": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar segmento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@master_router.delete("/business-segments/{segment_id}")
async def delete_business_segment(segment_id: str, request: Request):
    """Remove um segmento de negócio"""
    current_user = await get_authenticated_user(request)
    _check_master(current_user)
    try:
        result = await db.business_segments.delete_one({"id": segment_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Segmento não encontrado")
        return {"success": True, "message": "Segmento removido"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover segmento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# TIPOS DE PRESTADOR DE SERVIÇO
# ============================================

@master_router.get("/service-provider-types")
async def get_service_provider_types(request: Request):
    """Lista todos os tipos de prestadores de serviço"""
    current_user = await get_authenticated_user(request)
    _check_master(current_user)
    try:
        types = await db.service_provider_types.find({}, {"_id": 0}).sort("name", 1).to_list(length=200)
        return {"success": True, "types": types, "total": len(types)}
    except Exception as e:
        logger.error(f"Erro ao listar tipos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@master_router.post("/service-provider-types")
async def create_service_provider_type(type_data: dict, request: Request):
    """Cria um novo tipo de prestador de serviço"""
    current_user = await get_authenticated_user(request)
    _check_master(current_user)
    try:
        provider_type = {
            "id": str(uuid4()),
            "name": type_data.get("name"),
            "icon": type_data.get("icon", "wrench"),
            "description": type_data.get("description", ""),
            "required_documents": type_data.get("required_documents", []),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": _uid(current_user)
        }
        await db.service_provider_types.insert_one(provider_type)
        if "_id" in provider_type:
            del provider_type["_id"]
        return {"success": True, "type": provider_type}
    except Exception as e:
        logger.error(f"Erro ao criar tipo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@master_router.put("/service-provider-types/{type_id}")
async def update_service_provider_type(type_id: str, type_data: dict, request: Request):
    """Atualiza um tipo de prestador"""
    current_user = await get_authenticated_user(request)
    _check_master(current_user)
    try:
        existing = await db.service_provider_types.find_one({"id": type_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Tipo não encontrado")
        update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
        for field in ["name", "icon", "description", "required_documents", "is_active"]:
            if field in type_data:
                update_fields[field] = type_data[field]
        await db.service_provider_types.update_one({"id": type_id}, {"$set": update_fields})
        updated = await db.service_provider_types.find_one({"id": type_id}, {"_id": 0})
        return {"success": True, "type": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar tipo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@master_router.delete("/service-provider-types/{type_id}")
async def delete_service_provider_type(type_id: str, request: Request):
    """Remove um tipo de prestador"""
    current_user = await get_authenticated_user(request)
    _check_master(current_user)
    try:
        result = await db.service_provider_types.delete_one({"id": type_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tipo não encontrado")
        return {"success": True, "message": "Tipo removido"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover tipo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

logger.info("✅ Master routes configuradas")
