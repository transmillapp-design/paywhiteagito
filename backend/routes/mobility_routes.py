"""
Mobility Routes - Transmill
Endpoints da API de Mobilidade Urbana P2P
Refatorado: endpoints com decoradores de rota próprios
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import math
import json
import base64
import logging

from models.mobility_models import (
    DriverProfile, DriverProfileCreate, DriverProfileUpdate,
    Ride, RideRequest, RideEstimate, RideEstimateResponse,
    RideStatus, RatingRequest, LocationUpdate, NearbyDriversRequest,
    DriverWithPrice, RideCalculation, Location, Vehicle, DriverPricing
)
from routes.auth_utils import get_authenticated_user

logger = logging.getLogger(__name__)

mobility_router = APIRouter(prefix="/mobility", tags=["Mobilidade"])

db = None

def set_db(database):
    global db
    db = database

# ========================
# FUNÇÕES AUXILIARES
# ========================

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calcula distância em km usando fórmula de Haversine"""
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return round(R * c, 2)

def calculate_ride_price(distance_km: float, pricing: DriverPricing) -> RideCalculation:
    """Calcula o preço da corrida com base na distância e tarifas do motorista"""
    distance_fare = distance_km * pricing.valor_por_km
    subtotal = max(pricing.taxa_minima, distance_fare)
    platform_fee = round(subtotal * 0.10, 2)
    cashback_amount = round(subtotal * (pricing.cashback_percentage / 100), 2)
    driver_earnings = round(subtotal - platform_fee - cashback_amount, 2)
    duration_min = int((distance_km / 30) * 60) + 5
    return RideCalculation(
        distance_km=distance_km,
        duration_min=duration_min,
        base_fare=pricing.taxa_minima,
        distance_fare=round(distance_fare, 2),
        total=round(subtotal, 2),
        driver_earnings=driver_earnings,
        platform_fee=platform_fee,
        cashback_amount=cashback_amount,
        cashback_percentage=pricing.cashback_percentage
    )

# ========================
# ENDPOINTS - MOTORISTA
# ========================

@mobility_router.post("/driver/register")
async def register_driver(profile_data: DriverProfileCreate, request: Request):
    """Registrar usuário como motorista"""
    current_user = await get_authenticated_user(request)

    existing = await db.driver_profiles.find_one({"user_id": current_user.id})
    if existing:
        raise HTTPException(status_code=400, detail="Usuário já é motorista cadastrado")

    user_data = current_user._data if hasattr(current_user, '_data') else current_user
    now = datetime.now(timezone.utc)

    driver_profile = {
        "id": str(uuid4()),
        "user_id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.get('phone'),
        "profile_image": current_user.get('profile_image'),
        "vehicle": profile_data.vehicle.dict(),
        "pricing": profile_data.pricing.dict(),
        "is_active": True,
        "is_online": False,
        "is_verified": False,
        "current_location": None,
        "total_rides": 0,
        "rating": 5.0,
        "rating_count": 0,
        "franquia_slug": user_data.get('franquia_slug') if isinstance(user_data, dict) else current_user.get('franquia_slug'),
        "franquia_id": user_data.get('franquia_id') if isinstance(user_data, dict) else current_user.get('franquia_id'),
        "unidade_id": user_data.get('unidade_id') if isinstance(user_data, dict) else current_user.get('unidade_id'),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }

    await db.driver_profiles.insert_one(driver_profile)
    if "_id" in driver_profile:
        del driver_profile["_id"]

    logger.info(f"Novo motorista registrado: {current_user.email}")
    return {"success": True, "message": "Cadastro de motorista realizado com sucesso", "driver_profile": driver_profile}


@mobility_router.get("/driver/profile")
async def get_driver_profile(request: Request):
    """Obter perfil do motorista"""
    current_user = await get_authenticated_user(request)

    profile = await db.driver_profiles.find_one({"user_id": current_user.id}, {"_id": 0})
    if not profile:
        return {"exists": False, "profile": None}
    return {"exists": True, "profile": profile}


@mobility_router.put("/driver/profile")
async def update_driver_profile(profile_data: DriverProfileUpdate, request: Request):
    """Atualizar perfil do motorista"""
    current_user = await get_authenticated_user(request)

    profile = await db.driver_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de motorista não encontrado")

    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if profile_data.vehicle:
        update_fields["vehicle"] = profile_data.vehicle.dict()
    if profile_data.pricing:
        update_fields["pricing"] = profile_data.pricing.dict()
    if profile_data.is_online is not None:
        update_fields["is_online"] = profile_data.is_online

    await db.driver_profiles.update_one({"user_id": current_user.id}, {"$set": update_fields})
    updated_profile = await db.driver_profiles.find_one({"user_id": current_user.id}, {"_id": 0})
    return {"success": True, "message": "Perfil atualizado com sucesso", "profile": updated_profile}


@mobility_router.put("/driver/availability")
async def update_driver_availability(is_online: bool, request: Request):
    """Atualizar disponibilidade do motorista (online/offline)"""
    current_user = await get_authenticated_user(request)

    result = await db.driver_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": {"is_online": is_online, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Perfil de motorista não encontrado")

    status_text = "online" if is_online else "offline"
    logger.info(f"Motorista {current_user.email} agora está {status_text}")
    return {"success": True, "message": f"Status alterado para {status_text}", "is_online": is_online}


@mobility_router.put("/driver/location")
async def update_driver_location(location: LocationUpdate, request: Request):
    """Atualizar localização do motorista"""
    current_user = await get_authenticated_user(request)

    result = await db.driver_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": {
            "current_location": {"lat": location.lat, "lng": location.lng, "updated_at": datetime.now(timezone.utc).isoformat()},
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Perfil de motorista não encontrado")
    return {"success": True, "message": "Localização atualizada"}


@mobility_router.get("/driver/earnings")
async def get_driver_earnings(request: Request, period: str = "today"):
    """Obter ganhos do motorista"""
    current_user = await get_authenticated_user(request)

    profile = await db.driver_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de motorista não encontrado")

    now = datetime.now(timezone.utc)
    date_filter = {}
    if period == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        date_filter = {"paid_at": {"$gte": start_of_day.isoformat()}}
    elif period == "week":
        date_filter = {"paid_at": {"$gte": (now - timedelta(days=7)).isoformat()}}
    elif period == "month":
        date_filter = {"paid_at": {"$gte": (now - timedelta(days=30)).isoformat()}}

    rides = await db.mobility_rides.find(
        {"driver_id": current_user.id, "status": RideStatus.PAID.value, **date_filter}, {"_id": 0}
    ).to_list(1000)

    total_earnings = sum(r.get("pricing", {}).get("driver_earnings", 0) for r in rides)
    return {"period": period, "total_earnings": round(total_earnings, 2), "total_rides": len(rides), "rides": rides}


@mobility_router.get("/driver/rides")
async def get_driver_rides(request: Request):
    """Obter histórico de corridas do motorista"""
    current_user = await get_authenticated_user(request)
    rides = await db.mobility_rides.find({"driver_id": current_user.id}, {"_id": 0}).sort("requested_at", -1).to_list(100)
    return {"rides": rides, "total": len(rides)}


@mobility_router.get("/driver/active-ride")
async def get_driver_active_ride(request: Request):
    """Obter corrida ativa do motorista"""
    current_user = await get_authenticated_user(request)
    return await _get_active_ride(current_user, is_driver=True)


@mobility_router.get("/driver/available-rides")
async def get_available_rides(request: Request):
    """Obter corridas disponíveis para aceitar"""
    current_user = await get_authenticated_user(request)

    driver_profile = await db.driver_profiles.find_one({"user_id": current_user.id})
    if not driver_profile:
        raise HTTPException(status_code=403, detail="Usuário não é motorista cadastrado")

    rides = await db.mobility_rides.find(
        {"driver_id": current_user.id, "status": RideStatus.PENDING.value}, {"_id": 0}
    ).to_list(10)
    return {"rides": rides, "total": len(rides)}


# ========================
# CORRIDAS (MOTORISTA)
# ========================

@mobility_router.post("/ride/{ride_id}/accept")
async def accept_ride(ride_id: str, request: Request):
    """Motorista aceita uma corrida"""
    current_user = await get_authenticated_user(request)

    ride = await db.mobility_rides.find_one(
        {"id": ride_id, "driver_id": current_user.id, "status": RideStatus.PENDING.value}
    )
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada ou já foi aceita")

    now = datetime.now(timezone.utc)
    await db.mobility_rides.update_one(
        {"id": ride_id},
        {"$set": {"status": RideStatus.ACCEPTED.value, "accepted_at": now.isoformat()}}
    )
    await db.mobility_rides.update_one(
        {"id": ride_id},
        {"$set": {"status": RideStatus.DRIVER_ARRIVING.value}}
    )

    logger.info(f"Corrida aceita: {ride_id} por motorista {current_user.email}")
    updated_ride = await db.mobility_rides.find_one({"id": ride_id}, {"_id": 0})
    return {"success": True, "message": "Corrida aceita com sucesso", "ride": updated_ride}


@mobility_router.post("/ride/{ride_id}/reject")
async def reject_ride(ride_id: str, request: Request):
    """Motorista recusa uma corrida"""
    current_user = await get_authenticated_user(request)

    ride = await db.mobility_rides.find_one(
        {"id": ride_id, "driver_id": current_user.id, "status": RideStatus.PENDING.value}
    )
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")

    await db.mobility_rides.update_one(
        {"id": ride_id},
        {"$set": {
            "status": RideStatus.CANCELLED.value,
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancelled_by": current_user.id,
            "cancel_reason": "driver_rejected"
        }}
    )
    logger.info(f"Corrida recusada: {ride_id} por motorista {current_user.email}")
    return {"success": True, "message": "Corrida recusada"}


@mobility_router.post("/ride/{ride_id}/arrived")
async def driver_arrived(ride_id: str, request: Request):
    """Motorista chegou ao local de embarque"""
    current_user = await get_authenticated_user(request)

    ride = await db.mobility_rides.find_one(
        {"id": ride_id, "driver_id": current_user.id, "status": RideStatus.DRIVER_ARRIVING.value}
    )
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")

    await db.mobility_rides.update_one(
        {"id": ride_id},
        {"$set": {"status": RideStatus.DRIVER_ARRIVED.value, "driver_arrived_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated_ride = await db.mobility_rides.find_one({"id": ride_id}, {"_id": 0})
    return {"success": True, "message": "Chegada registrada", "ride": updated_ride}


@mobility_router.post("/ride/{ride_id}/start")
async def start_ride(ride_id: str, request: Request):
    """Motorista inicia a corrida"""
    current_user = await get_authenticated_user(request)

    ride = await db.mobility_rides.find_one(
        {"id": ride_id, "driver_id": current_user.id, "status": RideStatus.DRIVER_ARRIVED.value}
    )
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada ou status inválido")

    await db.mobility_rides.update_one(
        {"id": ride_id},
        {"$set": {"status": RideStatus.IN_PROGRESS.value, "started_at": datetime.now(timezone.utc).isoformat()}}
    )
    logger.info(f"Corrida iniciada: {ride_id}")
    updated_ride = await db.mobility_rides.find_one({"id": ride_id}, {"_id": 0})
    return {"success": True, "message": "Corrida iniciada", "ride": updated_ride}


@mobility_router.post("/ride/{ride_id}/complete")
async def complete_ride(ride_id: str, request: Request):
    """Motorista encerra a corrida e gera QR Code para pagamento"""
    current_user = await get_authenticated_user(request)

    ride = await db.mobility_rides.find_one(
        {"id": ride_id, "driver_id": current_user.id, "status": RideStatus.IN_PROGRESS.value}
    )
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada ou status inválido")

    now = datetime.now(timezone.utc)
    payment_data = {
        "type": "mobility_payment",
        "ride_id": ride_id,
        "amount": ride["pricing"]["total"],
        "driver_id": current_user.id,
        "driver_name": ride["driver_name"],
        "created_at": now.isoformat()
    }
    qr_code_data = base64.b64encode(json.dumps(payment_data).encode()).decode()

    await db.mobility_rides.update_one(
        {"id": ride_id},
        {"$set": {"status": RideStatus.COMPLETED.value, "completed_at": now.isoformat(), "payment_qr_code": qr_code_data}}
    )
    logger.info(f"Corrida finalizada: {ride_id} - Valor: R$ {ride['pricing']['total']}")
    updated_ride = await db.mobility_rides.find_one({"id": ride_id}, {"_id": 0})
    return {"success": True, "message": "Corrida finalizada. Aguardando pagamento do cliente.", "ride": updated_ride, "payment_qr_code": qr_code_data}


# ========================
# ENDPOINTS - CORRIDA (CLIENTE)
# ========================

@mobility_router.post("/estimate")
async def estimate_ride(estimate: RideEstimate, request: Request):
    """Estimar valor da corrida e buscar motoristas próximos"""
    current_user = await get_authenticated_user(request)

    distance_km = calculate_distance(
        estimate.origin.lat, estimate.origin.lng,
        estimate.destination.lat, estimate.destination.lng
    )

    drivers = await db.driver_profiles.find(
        {"is_online": True, "is_active": True, "current_location": {"$ne": None}}, {"_id": 0}
    ).to_list(50)

    drivers_with_prices = []
    for driver in drivers:
        if not driver.get("current_location"):
            continue
        driver_distance = calculate_distance(
            driver["current_location"]["lat"], driver["current_location"]["lng"],
            estimate.origin.lat, estimate.origin.lng
        )
        if driver_distance > 15:
            continue
        pricing = DriverPricing(**driver["pricing"])
        calculation = calculate_ride_price(distance_km, pricing)
        eta_min = int((driver_distance / 30) * 60) + 3
        drivers_with_prices.append({
            "driver_id": driver["user_id"],
            "driver_profile_id": driver["id"],
            "full_name": driver["full_name"],
            "profile_image": driver.get("profile_image"),
            "phone": driver.get("phone"),
            "vehicle": driver["vehicle"],
            "rating": driver["rating"],
            "rating_count": driver["rating_count"],
            "total_rides": driver["total_rides"],
            "distance_to_client_km": driver_distance,
            "estimated_arrival_min": eta_min,
            "pricing": driver["pricing"],
            "calculated_price": calculation.total,
            "cashback_amount": calculation.cashback_amount
        })

    drivers_with_prices.sort(key=lambda x: x["calculated_price"])
    duration_min = int((distance_km / 30) * 60) + 5
    return {
        "origin": estimate.origin.dict(),
        "destination": estimate.destination.dict(),
        "distance_km": distance_km,
        "duration_min": duration_min,
        "drivers_count": len(drivers_with_prices),
        "drivers": drivers_with_prices
    }


@mobility_router.post("/ride/request")
async def request_ride(ride_request: RideRequest, request: Request):
    """Cliente solicita uma corrida"""
    current_user = await get_authenticated_user(request)

    driver_profile = await db.driver_profiles.find_one({"user_id": ride_request.driver_id}, {"_id": 0})
    if not driver_profile:
        raise HTTPException(status_code=404, detail="Motorista não encontrado")
    if not driver_profile["is_online"]:
        raise HTTPException(status_code=400, detail="Motorista não está disponível")

    distance_km = calculate_distance(
        ride_request.origin.lat, ride_request.origin.lng,
        ride_request.destination.lat, ride_request.destination.lng
    )
    pricing = DriverPricing(**driver_profile["pricing"])
    calculation = calculate_ride_price(distance_km, pricing)
    now = datetime.now(timezone.utc)

    ride = {
        "id": str(uuid4()),
        "client_id": current_user.id,
        "client_name": current_user.full_name,
        "client_phone": current_user.get('phone'),
        "client_profile_image": current_user.get('profile_image'),
        "driver_id": driver_profile["user_id"],
        "driver_profile_id": driver_profile["id"],
        "driver_name": driver_profile["full_name"],
        "driver_phone": driver_profile.get("phone"),
        "driver_profile_image": driver_profile.get("profile_image"),
        "driver_vehicle": driver_profile["vehicle"],
        "driver_rating": driver_profile["rating"],
        "origin": ride_request.origin.dict(),
        "destination": ride_request.destination.dict(),
        "distance_km": distance_km,
        "duration_min": calculation.duration_min,
        "pricing": calculation.dict(),
        "status": RideStatus.PENDING.value,
        "requested_at": now.isoformat(),
        "accepted_at": None, "driver_arrived_at": None, "started_at": None,
        "completed_at": None, "paid_at": None, "cancelled_at": None,
        "client_rating_given": None, "driver_rating_given": None,
        "client_comment": None, "driver_comment": None,
        "payment_qr_code": None, "payment_transaction_id": None
    }

    await db.mobility_rides.insert_one(ride)
    if "_id" in ride:
        del ride["_id"]

    logger.info(f"Nova corrida solicitada: {ride['id']} - Cliente: {current_user.email} - Motorista: {driver_profile['email']}")
    return {"success": True, "message": "Corrida solicitada com sucesso", "ride": ride}


@mobility_router.get("/ride/{ride_id}")
async def get_ride_status(ride_id: str, request: Request):
    """Obter status de uma corrida"""
    current_user = await get_authenticated_user(request)

    ride = await db.mobility_rides.find_one({
        "id": ride_id,
        "$or": [{"client_id": current_user.id}, {"driver_id": current_user.id}]
    }, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")

    driver_location = None
    if ride["status"] in [RideStatus.ACCEPTED.value, RideStatus.DRIVER_ARRIVING.value,
                          RideStatus.DRIVER_ARRIVED.value, RideStatus.IN_PROGRESS.value]:
        driver_profile = await db.driver_profiles.find_one({"user_id": ride["driver_id"]}, {"current_location": 1})
        if driver_profile:
            driver_location = driver_profile.get("current_location")

    return {"ride": ride, "driver_location": driver_location}


@mobility_router.post("/ride/{ride_id}/cancel")
async def cancel_ride(ride_id: str, request: Request):
    """Cancelar uma corrida"""
    current_user = await get_authenticated_user(request)

    ride = await db.mobility_rides.find_one({
        "id": ride_id,
        "$or": [{"client_id": current_user.id}, {"driver_id": current_user.id}]
    })
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    if ride["status"] in [RideStatus.IN_PROGRESS.value, RideStatus.COMPLETED.value,
                          RideStatus.PAID.value, RideStatus.CANCELLED.value]:
        raise HTTPException(status_code=400, detail="Não é possível cancelar esta corrida")

    await db.mobility_rides.update_one(
        {"id": ride_id},
        {"$set": {
            "status": RideStatus.CANCELLED.value,
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancelled_by": current_user.id
        }}
    )
    logger.info(f"Corrida cancelada: {ride_id} por {current_user.email}")
    return {"success": True, "message": "Corrida cancelada com sucesso"}


@mobility_router.get("/client/rides")
async def get_client_rides(request: Request):
    """Obter histórico de corridas do cliente"""
    current_user = await get_authenticated_user(request)
    rides = await db.mobility_rides.find({"client_id": current_user.id}, {"_id": 0}).sort("requested_at", -1).to_list(100)
    return {"rides": rides, "total": len(rides)}


@mobility_router.get("/client/active-ride")
async def get_client_active_ride(request: Request):
    """Obter corrida ativa do cliente"""
    current_user = await get_authenticated_user(request)
    return await _get_active_ride(current_user, is_driver=False)


# ========================
# PAGAMENTO
# ========================

@mobility_router.post("/ride/{ride_id}/pay")
async def process_ride_payment(ride_id: str, request: Request):
    """Cliente paga a corrida (após ler QR Code)"""
    current_user = await get_authenticated_user(request)

    ride = await db.mobility_rides.find_one(
        {"id": ride_id, "client_id": current_user.id, "status": RideStatus.COMPLETED.value}
    )
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada ou já paga")

    client = await db.users.find_one({"id": current_user.id})
    if not client:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    total_amount = ride["pricing"]["total"]
    client_balance = client.get("balance", 0) + client.get("cashback_balance", 0)
    if client_balance < total_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Saldo insuficiente. Necessário: R$ {total_amount:.2f}, Disponível: R$ {client_balance:.2f}"
        )

    now = datetime.now(timezone.utc)
    transaction_id = str(uuid4())
    driver_earnings = ride["pricing"]["driver_earnings"]
    platform_fee = ride["pricing"]["platform_fee"]
    cashback_amount = ride["pricing"]["cashback_amount"]

    # Debitar cliente
    client_cashback = client.get("cashback_balance", 0)
    if client_cashback >= total_amount:
        await db.users.update_one({"id": current_user.id}, {"$inc": {"cashback_balance": -total_amount}})
    elif client_cashback > 0:
        remaining = total_amount - client_cashback
        await db.users.update_one({"id": current_user.id}, {"$set": {"cashback_balance": 0}, "$inc": {"balance": -remaining}})
    else:
        await db.users.update_one({"id": current_user.id}, {"$inc": {"balance": -total_amount}})

    # Creditar motorista
    await db.users.update_one({"id": ride["driver_id"]}, {"$inc": {"balance": driver_earnings}})

    # Creditar cashback
    if cashback_amount > 0:
        await db.users.update_one({"id": current_user.id}, {"$inc": {"cashback_balance": cashback_amount}})

    # Registrar transações
    transactions = [
        {
            "id": transaction_id, "user_id": current_user.id, "type": "mobility_payment",
            "amount": -total_amount,
            "description": f"Pagamento corrida - {ride['origin'].get('address', 'Origem')} → {ride['destination'].get('address', 'Destino')}",
            "ride_id": ride_id, "created_at": now.isoformat()
        },
        {
            "id": str(uuid4()), "user_id": ride["driver_id"], "type": "mobility_earning",
            "amount": driver_earnings,
            "description": f"Ganho corrida - {ride['origin'].get('address', 'Origem')} → {ride['destination'].get('address', 'Destino')}",
            "ride_id": ride_id, "created_at": now.isoformat()
        }
    ]
    if cashback_amount > 0:
        transactions.append({
            "id": str(uuid4()), "user_id": current_user.id, "type": "mobility_cashback",
            "amount": cashback_amount,
            "description": f"Cashback corrida - {ride['pricing']['cashback_percentage']}%",
            "ride_id": ride_id, "created_at": now.isoformat()
        })
    await db.transactions.insert_many(transactions)

    # Atualizar corrida
    await db.mobility_rides.update_one(
        {"id": ride_id},
        {"$set": {"status": RideStatus.PAID.value, "paid_at": now.isoformat(), "payment_transaction_id": transaction_id}}
    )
    await db.driver_profiles.update_one({"user_id": ride["driver_id"]}, {"$inc": {"total_rides": 1}})

    logger.info(f"Pagamento processado: Corrida {ride_id} - R$ {total_amount}")
    updated_ride = await db.mobility_rides.find_one({"id": ride_id}, {"_id": 0})
    return {
        "success": True, "message": "Pagamento realizado com sucesso", "ride": updated_ride,
        "payment_details": {
            "total_paid": total_amount, "driver_received": driver_earnings,
            "platform_fee": platform_fee, "cashback_received": cashback_amount
        }
    }


# ========================
# AVALIAÇÃO
# ========================

@mobility_router.post("/ride/{ride_id}/rate/client")
async def rate_ride_as_client(ride_id: str, rating_data: RatingRequest, request: Request):
    """Cliente avalia o motorista"""
    current_user = await get_authenticated_user(request)
    return await _rate_ride(ride_id, rating_data, current_user, is_driver=False)


@mobility_router.post("/ride/{ride_id}/rate/driver")
async def rate_ride_as_driver(ride_id: str, rating_data: RatingRequest, request: Request):
    """Motorista avalia o cliente"""
    current_user = await get_authenticated_user(request)
    return await _rate_ride(ride_id, rating_data, current_user, is_driver=True)


async def _rate_ride(ride_id: str, rating_data: RatingRequest, current_user, is_driver: bool = False):
    """Avaliar uma corrida (lógica interna)"""
    if is_driver:
        field_filter = {"driver_id": current_user.id}
        rating_field = "driver_rating_given"
        comment_field = "driver_comment"
    else:
        field_filter = {"client_id": current_user.id}
        rating_field = "client_rating_given"
        comment_field = "client_comment"

    ride = await db.mobility_rides.find_one({"id": ride_id, "status": RideStatus.PAID.value, **field_filter})
    if not ride:
        raise HTTPException(status_code=404, detail="Corrida não encontrada ou não pode ser avaliada")
    if ride.get(rating_field):
        raise HTTPException(status_code=400, detail="Você já avaliou esta corrida")

    await db.mobility_rides.update_one(
        {"id": ride_id}, {"$set": {rating_field: rating_data.rating, comment_field: rating_data.comment}}
    )

    if not is_driver:
        driver_profile = await db.driver_profiles.find_one({"user_id": ride["driver_id"]})
        if driver_profile:
            current_rating = driver_profile.get("rating", 5.0)
            current_count = driver_profile.get("rating_count", 0)
            new_count = current_count + 1
            new_rating = ((current_rating * current_count) + rating_data.rating) / new_count
            await db.driver_profiles.update_one(
                {"user_id": ride["driver_id"]},
                {"$set": {"rating": round(new_rating, 2), "rating_count": new_count}}
            )

    logger.info(f"Avaliação registrada: Corrida {ride_id} - {rating_data.rating} estrelas")
    return {"success": True, "message": "Avaliação enviada com sucesso"}


# ========================
# BUSCA
# ========================

@mobility_router.get("/drivers/nearby")
async def get_nearby_drivers(
    lat: float, lng: float, request: Request,
    radius_km: float = 10.0, franquia_slug: Optional[str] = None
):
    """Buscar motoristas próximos com filtro white-label"""
    current_user = await get_authenticated_user(request)

    filtro = {"is_online": True, "is_active": True, "current_location": {"$ne": None}}

    user_data = current_user._data if hasattr(current_user, '_data') else current_user
    if isinstance(user_data, dict):
        if user_data.get('franquia_slug'):
            filtro["franquia_slug"] = user_data['franquia_slug']
        elif user_data.get('franquia_id'):
            filtro["franquia_id"] = user_data['franquia_id']

    if franquia_slug:
        filtro["franquia_slug"] = franquia_slug

    drivers = await db.driver_profiles.find(filtro, {"_id": 0}).to_list(100)
    nearby = []
    for driver in drivers:
        if not driver.get("current_location"):
            continue
        distance = calculate_distance(lat, lng, driver["current_location"]["lat"], driver["current_location"]["lng"])
        if distance <= radius_km:
            nearby.append({
                "driver_id": driver["user_id"], "full_name": driver["full_name"],
                "profile_image": driver.get("profile_image"), "vehicle": driver["vehicle"],
                "rating": driver["rating"], "distance_km": distance, "location": driver["current_location"]
            })
    nearby.sort(key=lambda x: x["distance_km"])
    return {"drivers": nearby, "total": len(nearby)}


# ========================
# CORRIDA ATIVA (HELPER)
# ========================

async def _get_active_ride(current_user, is_driver: bool = False):
    """Obter corrida ativa do usuário"""
    active_statuses = [
        RideStatus.PENDING.value, RideStatus.ACCEPTED.value,
        RideStatus.DRIVER_ARRIVING.value, RideStatus.DRIVER_ARRIVED.value,
        RideStatus.IN_PROGRESS.value, RideStatus.COMPLETED.value
    ]

    filter_query = {"driver_id": current_user.id} if is_driver else {"client_id": current_user.id}
    ride = await db.mobility_rides.find_one({**filter_query, "status": {"$in": active_statuses}}, {"_id": 0})

    if not ride:
        return {"has_active_ride": False, "ride": None}

    driver_location = None
    if ride["status"] in [RideStatus.DRIVER_ARRIVING.value, RideStatus.IN_PROGRESS.value]:
        driver_profile = await db.driver_profiles.find_one({"user_id": ride["driver_id"]}, {"current_location": 1})
        if driver_profile:
            driver_location = driver_profile.get("current_location")

    return {"has_active_ride": True, "ride": ride, "driver_location": driver_location}
