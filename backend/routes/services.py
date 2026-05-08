"""
Services Routes - Transmill API
Endpoints para prestadores de serviço e agendamento de serviços.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timezone
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)

services_router = APIRouter(prefix="/servicos", tags=["Services"])

# Referências globais
db = None
get_current_user = None

def set_db(database):
    global db
    db = database

def set_auth_dependency(auth_func):
    global get_current_user
    get_current_user = auth_func

# ============================================
# SERVIÇOS
# ============================================

@services_router.get("/{service_id}")
async def get_service_details(
    service_id: str,
    current_user = Depends(lambda: get_current_user)
):
    """Busca detalhes de um serviço específico"""
    try:
        service = await db.services.find_one(
            {"id": service_id},
            {"_id": 0}
        )
        
        if not service:
            raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
        # Buscar dados do prestador
        provider = await db.users.find_one(
            {"id": service.get("provider_id")},
            {"_id": 0, "id": 1, "full_name": 1, "profile_image": 1, "rating": 1}
        )
        
        service["provider"] = provider
        
        return {"success": True, "service": service}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar serviço: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@services_router.post("")
async def create_service(
    service_data: dict,
    current_user = Depends(lambda: get_current_user)
):
    """Cria um novo serviço (para prestadores)"""
    user_data = current_user._data if hasattr(current_user, '_data') else current_user
    
    if user_data.get('user_type') != 'service_provider':
        raise HTTPException(status_code=403, detail="Apenas prestadores podem criar serviços")
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        service = {
            "id": str(uuid4()),
            "provider_id": user_id,
            "name": service_data.get("name"),
            "description": service_data.get("description", ""),
            "category": service_data.get("category"),
            "price": float(service_data.get("price", 0)),
            "duration_minutes": service_data.get("duration_minutes", 60),
            "image_url": service_data.get("image_url"),
            "is_available": True,
            "franquia_slug": user_data.get("franquia_slug"),
            "franquia_id": user_data.get("franquia_id"),
            "unidade_id": user_data.get("unidade_id"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.services.insert_one(service)
        if "_id" in service:
            del service["_id"]
        
        return {"success": True, "service": service}
    except Exception as e:
        logger.error(f"Erro ao criar serviço: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@services_router.put("/{service_id}")
async def update_service(
    service_id: str,
    service_data: dict,
    current_user = Depends(lambda: get_current_user)
):
    """Atualiza um serviço"""
    user_data = current_user._data if hasattr(current_user, '_data') else current_user
    
    if user_data.get('user_type') != 'service_provider':
        raise HTTPException(status_code=403, detail="Apenas prestadores podem atualizar serviços")
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        update_fields = {}
        for field in ["name", "description", "category", "price", "duration_minutes", "image_url", "is_available"]:
            if field in service_data:
                update_fields[field] = service_data[field]
        
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.services.update_one(
            {"id": service_id, "provider_id": user_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
        return {"success": True, "message": "Serviço atualizado"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar serviço: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@services_router.delete("/{service_id}")
async def delete_service(
    service_id: str,
    current_user = Depends(lambda: get_current_user)
):
    """Remove um serviço"""
    user_data = current_user._data if hasattr(current_user, '_data') else current_user
    
    if user_data.get('user_type') != 'service_provider':
        raise HTTPException(status_code=403, detail="Apenas prestadores podem remover serviços")
    
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        result = await db.services.delete_one(
            {"id": service_id, "provider_id": user_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
        return {"success": True, "message": "Serviço removido"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover serviço: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# AGENDAMENTOS
# ============================================

@services_router.post("/agendar")
async def schedule_service(
    booking_data: dict,
    current_user = Depends(lambda: get_current_user)
):
    """Agenda um serviço"""
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        
        # Verificar se serviço existe
        service = await db.services.find_one({"id": booking_data.get("service_id")})
        if not service:
            raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
        booking = {
            "id": str(uuid4()),
            "service_id": booking_data.get("service_id"),
            "provider_id": service.get("provider_id"),
            "client_id": user_id,
            "scheduled_date": booking_data.get("scheduled_date"),
            "scheduled_time": booking_data.get("scheduled_time"),
            "notes": booking_data.get("notes", ""),
            "status": "pending",  # pending, confirmed, completed, cancelled
            "price": service.get("price"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.service_bookings.insert_one(booking)
        if "_id" in booking:
            del booking["_id"]
        
        return {"success": True, "booking": booking}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao agendar serviço: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@services_router.get("/meus-agendamentos")
async def get_my_bookings(
    status: Optional[str] = None,
    current_user = Depends(lambda: get_current_user)
):
    """Lista agendamentos do usuário"""
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        user_data = current_user._data if hasattr(current_user, '_data') else current_user
        
        # Se for prestador, buscar agendamentos como provider
        # Se for cliente, buscar como client
        if user_data.get('user_type') == 'service_provider':
            filtro = {"provider_id": user_id}
        else:
            filtro = {"client_id": user_id}
        
        if status:
            filtro["status"] = status
        
        bookings = await db.service_bookings.find(
            filtro,
            {"_id": 0}
        ).sort("scheduled_date", -1).to_list(100)
        
        return {"success": True, "bookings": bookings, "total": len(bookings)}
    except Exception as e:
        logger.error(f"Erro ao listar agendamentos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@services_router.put("/agendamento/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status_data: dict,
    current_user = Depends(lambda: get_current_user)
):
    """Atualiza status de um agendamento"""
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
        new_status = status_data.get("status")
        
        if new_status not in ["pending", "confirmed", "completed", "cancelled"]:
            raise HTTPException(status_code=400, detail="Status inválido")
        
        # Verificar se usuário é provider ou client do agendamento
        booking = await db.service_bookings.find_one({"id": booking_id})
        if not booking:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
        if booking.get("provider_id") != user_id and booking.get("client_id") != user_id:
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        await db.service_bookings.update_one(
            {"id": booking_id},
            {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"success": True, "message": f"Status atualizado para {new_status}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

logger.info("✅ Services routes configuradas")
