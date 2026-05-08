"""
Mobility Service - Transmill
Sistema de Mobilidade Urbana P2P
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ========================
# ENUMS
# ========================

class RideStatus(str, Enum):
    PENDING = "pending"                    # Cliente solicitou, aguardando motorista aceitar
    ACCEPTED = "accepted"                  # Motorista aceitou
    DRIVER_ARRIVING = "driver_arriving"    # Motorista a caminho do embarque
    DRIVER_ARRIVED = "driver_arrived"      # Motorista chegou ao embarque
    IN_PROGRESS = "in_progress"            # Corrida em andamento
    COMPLETED = "completed"                # Corrida finalizada (aguardando pagamento)
    PAID = "paid"                          # Pagamento realizado
    CANCELLED = "cancelled"                # Cancelada

class VehicleType(str, Enum):
    CARRO = "carro"
    MOTO = "moto"
    SUV = "suv"
    VAN = "van"

# ========================
# MODELOS - VEÍCULO
# ========================

class Vehicle(BaseModel):
    tipo: VehicleType = VehicleType.CARRO
    modelo: str = ""
    cor: str = ""
    placa: str = ""
    ano: Optional[int] = None

# ========================
# MODELOS - LOCALIZAÇÃO
# ========================

class Location(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None

# ========================
# MODELOS - PREÇOS DO MOTORISTA
# ========================

class DriverPricing(BaseModel):
    taxa_minima: float = 8.0          # R$ valor mínimo da corrida
    valor_por_km: float = 2.5         # R$ por km
    cashback_percentage: float = 5.0  # 0 a 10%

# ========================
# MODELOS - PERFIL DO MOTORISTA
# ========================

class DriverProfileCreate(BaseModel):
    vehicle: Vehicle
    pricing: DriverPricing

class DriverProfileUpdate(BaseModel):
    vehicle: Optional[Vehicle] = None
    pricing: Optional[DriverPricing] = None
    is_online: Optional[bool] = None

class DriverProfile(BaseModel):
    id: str
    user_id: str                          # Referência ao usuário Transmill
    email: str
    full_name: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    
    vehicle: Vehicle
    pricing: DriverPricing
    
    is_active: bool = True                # Cadastro ativo
    is_online: bool = False               # Disponível para corridas
    is_verified: bool = False             # Documentos verificados
    
    current_location: Optional[Location] = None
    
    # Estatísticas
    total_rides: int = 0
    rating: float = 5.0
    rating_count: int = 0
    
    created_at: datetime
    updated_at: datetime

# ========================
# MODELOS - CORRIDA
# ========================

class RideRequest(BaseModel):
    origin: Location
    destination: Location
    driver_id: str                        # ID do motorista selecionado

class RideEstimate(BaseModel):
    origin: Location
    destination: Location

class RideEstimateResponse(BaseModel):
    distance_km: float
    duration_min: int
    drivers: List[dict]                   # Lista de motoristas com preços calculados

class RideCalculation(BaseModel):
    distance_km: float
    duration_min: int
    base_fare: float                      # Taxa mínima
    distance_fare: float                  # Valor por distância
    total: float                          # Total da corrida
    driver_earnings: float                # Ganho do motorista (após taxa plataforma)
    platform_fee: float                   # Taxa da plataforma (10%)
    cashback_amount: float                # Valor do cashback para o cliente
    cashback_percentage: float            # Percentual de cashback

class Ride(BaseModel):
    id: str
    
    # Participantes
    client_id: str
    client_name: str
    client_phone: Optional[str] = None
    client_rating: Optional[float] = None
    
    driver_id: str
    driver_profile_id: str
    driver_name: str
    driver_phone: Optional[str] = None
    driver_rating: Optional[float] = None
    driver_vehicle: Vehicle
    
    # Trajeto
    origin: Location
    destination: Location
    distance_km: float
    duration_min: int
    
    # Valores
    pricing: RideCalculation
    
    # Status
    status: RideStatus = RideStatus.PENDING
    
    # Timestamps
    requested_at: datetime
    accepted_at: Optional[datetime] = None
    driver_arrived_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    # Avaliações
    client_rating_given: Optional[int] = None
    driver_rating_given: Optional[int] = None
    client_comment: Optional[str] = None
    driver_comment: Optional[str] = None
    
    # Pagamento
    payment_qr_code: Optional[str] = None
    payment_transaction_id: Optional[str] = None

# ========================
# MODELOS - AVALIAÇÃO
# ========================

class RatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

# ========================
# MODELOS - ATUALIZAÇÃO DE LOCALIZAÇÃO
# ========================

class LocationUpdate(BaseModel):
    lat: float
    lng: float

# ========================
# MODELOS - BUSCA DE MOTORISTAS
# ========================

class NearbyDriversRequest(BaseModel):
    lat: float
    lng: float
    radius_km: float = 10.0               # Raio de busca em km

class DriverWithPrice(BaseModel):
    driver_id: str
    driver_profile_id: str
    full_name: str
    profile_image: Optional[str] = None
    phone: Optional[str] = None
    vehicle: Vehicle
    rating: float
    rating_count: int
    total_rides: int
    distance_to_client_km: float
    estimated_arrival_min: int
    pricing: DriverPricing
    calculated_price: float               # Preço calculado para a corrida
    cashback_amount: float                # Cashback que o cliente receberá
