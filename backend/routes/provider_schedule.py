"""
Provider Schedule & Appointments Routes
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

from routes.deps import get_current_user, get_current_master_user, verify_token, security

logger = logging.getLogger(__name__)

router = APIRouter()

db = None


def set_db(database):
    global db
    db = database


class CreateAvailabilityRequest(BaseModel):
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    is_recurring: Optional[bool] = False

class BookAppointmentRequest(BaseModel):
    provider_id: str
    service_id: Optional[str] = None
    appointment_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    client_notes: Optional[str] = None

# === PRESTADOR: GERENCIAR AGENDA ===
@router.post("/provider/availability")
async def create_availability_slot(
    request: CreateAvailabilityRequest,
    current_user = Depends(get_current_user)
):
    """Prestador cria slot de disponibilidade na agenda"""
    if current_user.user_type != "service_provider":
        raise HTTPException(status_code=403, detail="Apenas prestadores de serviço podem gerenciar agenda")
    
    try:
        # Verificar se já existe slot neste horário
        existing = await db.availability_slots.find_one({
            "provider_id": current_user.id,
            "date": request.date,
            "start_time": request.start_time,
            "end_time": request.end_time
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Já existe disponibilidade neste horário")
        
        # Calcular day_of_week se for recorrente
        day_of_week = None
        if request.is_recurring:
            from datetime import datetime
            date_obj = datetime.strptime(request.date, "%Y-%m-%d")
            day_of_week = date_obj.weekday() + 1  # Converter para 1=segunda, 7=domingo
            if day_of_week == 7:
                day_of_week = 0  # domingo = 0
        
        # Criar slot
        slot = {
            "id": str(uuid.uuid4()),
            "provider_id": current_user.id,
            "date": request.date,
            "start_time": request.start_time,
            "end_time": request.end_time,
            "is_available": True,
            "is_recurring": request.is_recurring,
            "day_of_week": day_of_week,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.availability_slots.insert_one(slot)
        
        return {
            "message": "Horário de disponibilidade criado com sucesso",
            "slot_id": slot["id"],
            "slot": slot
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar disponibilidade: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/provider/availability")
async def get_provider_availability(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Prestador visualiza sua agenda"""
    if current_user.user_type != "service_provider":
        raise HTTPException(status_code=403, detail="Apenas prestadores de serviço")
    
    try:
        # Construir filtro
        filter_query = {"provider_id": current_user.id}
        
        if start_date and end_date:
            filter_query["date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            filter_query["date"] = {"$gte": start_date}
        
        # Buscar slots
        slots = await db.availability_slots.find(
            filter_query, {"_id": 0}
        ).sort("date", 1).to_list(200)
        
        # Buscar agendamentos no mesmo período
        appointments = await db.appointments.find(
            {
                "provider_id": current_user.id,
                **(({"appointment_date": {"$gte": start_date, "$lte": end_date}} if start_date and end_date else {}))
            },
            {"_id": 0}
        ).sort("appointment_date", 1).to_list(100)
        
        return {
            "availability_slots": slots,
            "appointments": appointments,
            "total_slots": len(slots),
            "total_appointments": len(appointments)
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar agenda do prestador: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.delete("/provider/availability/{slot_id}")
async def remove_availability_slot(
    slot_id: str,
    current_user = Depends(get_current_user)
):
    """Prestador remove horário disponível"""
    if current_user.user_type != "service_provider":
        raise HTTPException(status_code=403, detail="Apenas prestadores de serviço")
    
    try:
        # Verificar se o slot pertence ao prestador
        slot = await db.availability_slots.find_one({
            "id": slot_id,
            "provider_id": current_user.id
        })
        
        if not slot:
            raise HTTPException(status_code=404, detail="Horário não encontrado")
        
        # Verificar se há agendamentos neste slot
        appointment = await db.appointments.find_one({
            "provider_id": current_user.id,
            "appointment_date": slot["date"],
            "start_time": slot["start_time"],
            "status": {"$in": ["pending", "confirmed"]}
        })
        
        if appointment:
            raise HTTPException(status_code=400, detail="Não é possível remover. Há agendamentos confirmados neste horário")
        
        # Remover slot
        await db.availability_slots.delete_one({"id": slot_id})
        
        return {"message": "Horário removido com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover disponibilidade: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# === CLIENTE: VER AGENDA E AGENDAR ===
@router.get("/provider/{provider_id}/available-slots")
async def get_available_slots(
    provider_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Cliente visualiza horários disponíveis do prestador"""
    try:
        # Verificar se prestador existe
        provider = await db.users.find_one({"id": provider_id, "user_type": "service_provider"})
        if not provider:
            raise HTTPException(status_code=404, detail="Prestador não encontrado")
        
        # Data padrão: próximos 30 dias
        if not start_date:
            from datetime import date, timedelta
            start_date = date.today().strftime("%Y-%m-%d")
        if not end_date:
            from datetime import date, timedelta
            end_date = (date.today() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Buscar slots disponíveis
        available_slots = await db.availability_slots.find({
            "provider_id": provider_id,
            "date": {"$gte": start_date, "$lte": end_date},
            "is_available": True
        }, {"_id": 0}).sort("date", 1).to_list(200)
        
        # Buscar agendamentos confirmados para filtrar horários ocupados
        booked_appointments = await db.appointments.find({
            "provider_id": provider_id,
            "appointment_date": {"$gte": start_date, "$lte": end_date},
            "status": {"$in": ["confirmed", "pending"]}
        }, {"appointment_date": 1, "start_time": 1, "end_time": 1, "_id": 0}).to_list(200)
        
        # Filtrar slots que não estão ocupados
        booked_times = set()
        for apt in booked_appointments:
            booked_times.add(f"{apt['appointment_date']}_{apt['start_time']}_{apt['end_time']}")
        
        free_slots = []
        for slot in available_slots:
            slot_key = f"{slot['date']}_{slot['start_time']}_{slot['end_time']}"
            if slot_key not in booked_times:
                free_slots.append(slot)
        
        # Buscar informações do prestador
        provider_profile = await db.service_providers.find_one({"user_id": provider_id})
        
        return {
            "provider": {
                "id": provider["id"],
                "name": provider["full_name"],
                "company_name": provider_profile.get("company_name") if provider_profile else None
            },
            "available_slots": free_slots,
            "total_available": len(free_slots),
            "period": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar slots disponíveis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.post("/appointments/book")
async def book_appointment(
    request: BookAppointmentRequest,
    current_user = Depends(get_current_user)
):
    """Cliente agenda horário com prestador"""
    if current_user.user_type != "cliente":
        raise HTTPException(status_code=403, detail="Apenas clientes podem agendar")
    
    try:
        # Verificar se prestador existe
        provider = await db.users.find_one({"id": request.provider_id, "user_type": "service_provider"})
        if not provider:
            raise HTTPException(status_code=404, detail="Prestador não encontrado")
        
        # Verificar se slot está disponível
        available_slot = await db.availability_slots.find_one({
            "provider_id": request.provider_id,
            "date": request.appointment_date,
            "start_time": request.start_time,
            "end_time": request.end_time,
            "is_available": True
        })
        
        if not available_slot:
            raise HTTPException(status_code=400, detail="Horário não está disponível")
        
        # Verificar se já há agendamento neste horário
        existing_appointment = await db.appointments.find_one({
            "provider_id": request.provider_id,
            "appointment_date": request.appointment_date,
            "start_time": request.start_time,
            "status": {"$in": ["pending", "confirmed"]}
        })
        
        if existing_appointment:
            raise HTTPException(status_code=400, detail="Horário já está ocupado")
        
        # Buscar serviço se fornecido
        service_name = None
        service_price = None
        if request.service_id:
            service = await db.services.find_one({"id": request.service_id, "user_id": request.provider_id})
            if service:
                service_name = service["name"]
                service_price = service["price"]
        
        # Criar agendamento
        appointment = {
            "id": str(uuid.uuid4()),
            "client_id": current_user.id,
            "provider_id": request.provider_id,
            "service_id": request.service_id,
            "appointment_date": request.appointment_date,
            "start_time": request.start_time,
            "end_time": request.end_time,
            "status": "pending",  # Prestador precisa confirmar
            "client_notes": request.client_notes,
            "service_name": service_name,
            "service_price": service_price,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.appointments.insert_one(appointment)
        
        return {
            "message": "Agendamento solicitado com sucesso",
            "appointment_id": appointment["id"],
            "status": "pending",
            "appointment": {
                "date": request.appointment_date,
                "start_time": request.start_time,
                "end_time": request.end_time,
                "provider_name": provider["full_name"],
                "service_name": service_name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao agendar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/appointments/my")
async def get_my_appointments(
    status: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Usuário visualiza seus agendamentos (cliente ou prestador)"""
    try:
        filter_query = {}
        
        if current_user.user_type == "cliente":
            filter_query["client_id"] = current_user.id
        elif current_user.user_type == "service_provider":
            filter_query["provider_id"] = current_user.id
        else:
            raise HTTPException(status_code=403, detail="Tipo de usuário inválido para agendamentos")
        
        if status:
            filter_query["status"] = status
        
        appointments = await db.appointments.find(
            filter_query, {"_id": 0}
        ).sort("appointment_date", -1).to_list(100)
        
        # Enriquecer dados dos agendamentos
        enriched_appointments = []
        for apt in appointments:
            # Buscar dados do cliente
            if current_user.user_type == "service_provider":
                client = await db.users.find_one({"id": apt["client_id"]})
                apt["client_name"] = client["full_name"] if client else "Cliente não encontrado"
                apt["client_phone"] = client.get("phone", "") if client else ""
            
            # Buscar dados do prestador
            if current_user.user_type == "cliente":
                provider = await db.users.find_one({"id": apt["provider_id"]})
                apt["provider_name"] = provider["full_name"] if provider else "Prestador não encontrado"
                apt["provider_phone"] = provider.get("phone", "") if provider else ""
            
            enriched_appointments.append(apt)
        
        return {
            "appointments": enriched_appointments,
            "total": len(enriched_appointments)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar agendamentos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.put("/appointments/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    status: str,
    notes: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Atualizar status do agendamento"""
    try:
        # Buscar agendamento
        appointment = await db.appointments.find_one({"id": appointment_id})
        if not appointment:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
        # Verificar permissão
        if current_user.user_type == "service_provider" and appointment["provider_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Sem permissão para este agendamento")
        elif current_user.user_type == "cliente" and appointment["client_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Sem permissão para este agendamento")
        
        # Validar transição de status
        valid_statuses = ["pending", "confirmed", "completed", "cancelled"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Status inválido")
        
        # Atualizar agendamento
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow()
        }
        
        if notes:
            if current_user.user_type == "service_provider":
                update_data["provider_notes"] = notes
            else:
                update_data["client_notes"] = notes
        
        await db.appointments.update_one(
            {"id": appointment_id},
            {"$set": update_data}
        )
        
        return {
            "message": f"Status atualizado para {status}",
            "appointment_id": appointment_id,
            "new_status": status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar status do agendamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


# === SISTEMA DE CATÁLOGO/CARDÁPIO - ENDPOINTS ===

# ============================================
# CATEGORIAS - LOJISTA
# ============================================

# merchant_block2 endpoints moved to modular router

# ============================================
# CATÁLOGO PÚBLICO - VISUALIZAÇÃO
# ============================================

