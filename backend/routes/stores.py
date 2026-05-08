"""
Módulo Stores (Lojas) - Transmill API
Busca e filtros de lojas/lojistas com suporte a geolocalização e white-label

Endpoints:
- GET /api/stores - Listar lojas (com geolocalização)
- GET /api/stores/search - Buscar lojas (com white-label)
- GET /api/stores/filters - Obter filtros disponíveis
- GET /api/stores/cities/{state} - Cidades por estado
- GET /api/stores/{store_id} - Detalhes de uma loja
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from math import radians, cos, sin, asin, sqrt
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stores", tags=["Stores"])

# Dependências injetadas
_db = None
_get_current_user = None
_get_franquia_filter = None
_get_franquia_context = None


def init_stores_routes(database, auth_dependency=None, franquia_filter_fn=None, franquia_context_fn=None):
    """Inicializa as rotas do módulo stores"""
    global _db, _get_current_user, _get_franquia_filter, _get_franquia_context
    _db = database
    _get_current_user = auth_dependency
    _get_franquia_filter = franquia_filter_fn
    _get_franquia_context = franquia_context_fn
    logger.info("✅ Stores routes configuradas (com geolocalização)")


# ============================================
# HELPER FUNCTIONS
# ============================================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula distância entre dois pontos usando Haversine (km)"""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return 6371 * c


COORDINATES_MAP = {
    ("São Paulo", "SP"): (-23.5505, -46.6333),
    ("Guarulhos", "SP"): (-23.4538, -46.5333),
    ("Campinas", "SP"): (-22.9099, -47.0626),
    ("São Bernardo do Campo", "SP"): (-23.6914, -46.5646),
    ("Osasco", "SP"): (-23.5329, -46.7918),
    ("Rio de Janeiro", "RJ"): (-22.9068, -43.1729),
    ("Niterói", "RJ"): (-22.8833, -43.1036),
    ("Duque de Caxias", "RJ"): (-22.7856, -43.3119),
    ("Belo Horizonte", "MG"): (-19.9167, -43.9345),
    ("Uberlândia", "MG"): (-18.9113, -48.2622),
    ("Salvador", "BA"): (-12.9714, -38.5014),
    ("Brasília", "DF"): (-15.7939, -47.8828),
    ("Fortaleza", "CE"): (-3.7319, -38.5267),
    ("Recife", "PE"): (-8.0476, -34.8770),
    ("Porto Alegre", "RS"): (-30.0346, -51.2177),
    ("Curitiba", "PR"): (-25.4284, -49.2733),
    ("Florianópolis", "SC"): (-27.5954, -48.5480),
    ("Goiânia", "GO"): (-16.6869, -49.2648),
}

STATE_CAPITALS = {
    "SP": (-23.5505, -46.6333), "RJ": (-22.9068, -43.1729),
    "MG": (-19.9167, -43.9345), "BA": (-12.9714, -38.5014),
    "DF": (-15.7939, -47.8828), "CE": (-3.7319, -38.5267),
    "PE": (-8.0476, -34.8770), "RS": (-30.0346, -51.2177),
    "PR": (-25.4284, -49.2733), "SC": (-27.5954, -48.5480),
    "GO": (-16.6869, -49.2648),
}


def get_default_coordinates(city: str, state: str) -> tuple:
    """Retorna coordenadas padrão baseadas na cidade/estado"""
    key = (city, state)
    if key in COORDINATES_MAP:
        return COORDINATES_MAP[key]
    return STATE_CAPITALS.get(state, (-23.5505, -46.6333))


# ============================================
# ENDPOINTS
# ============================================

@router.get("")
async def get_stores(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = 50.0,
    business_segment: Optional[str] = None,
    limit: Optional[int] = 100
):
    """
    Busca lojas com suporte a geolocalização
    - lat, lng: Coordenadas do usuário para calcular distância
    - radius: Raio de busca em km (padrão: 50km)
    - business_segment: Filtro por segmento de negócio
    - limit: Limite de resultados (padrão: 100)
    """
    try:
        filters = {"user_type": "lojista"}

        if business_segment:
            filters["business_segment"] = {"$regex": business_segment, "$options": "i"}

        stores_cursor = _db.users.find(filters).limit(limit)
        stores = await stores_cursor.to_list(limit)

        results = []
        for store in stores:
            store_lat = store.get("latitude")
            store_lng = store.get("longitude")

            if not store_lat or not store_lng:
                city = store.get("city", "")
                state = store.get("state", "")
                if city and state:
                    store_lat, store_lng = get_default_coordinates(city, state)
                else:
                    store_lat, store_lng = -23.5505, -46.6333

            distance = None
            if lat is not None and lng is not None:
                distance = calculate_distance(lat, lng, store_lat, store_lng)
                if radius and distance > radius:
                    continue

            store_data = {
                "id": store["id"],
                "company_name": store.get("company_name", ""),
                "name": store.get("company_name", store.get("full_name", "")),
                "full_name": store.get("full_name", ""),
                "description": store.get("business_segment", ""),
                "business_segment": store.get("business_segment", ""),
                "category": store.get("business_segment", ""),
                "address": store.get("address", ""),
                "street": store.get("address", ""),
                "number": store.get("number", ""),
                "neighborhood": store.get("neighborhood", ""),
                "city": store.get("city", ""),
                "state": store.get("state", ""),
                "whatsapp": store.get("whatsapp", ""),
                "google_maps_url": store.get("google_maps_url", ""),
                "menu_catalog_url": store.get("menu_catalog_url", ""),
                "profile_image": store.get("profile_image", ""),
                "cashback_rate": store.get("cashback_rate", 0.0),
                "cashback_percentage": store.get("cashback_rate", 5.0),
                "latitude": store_lat,
                "longitude": store_lng,
                "distance": distance,
                "rating": 4.5,
                "tags": ["Parceiro Transmill", store.get("business_segment", "Loja")]
            }
            results.append(store_data)

        if lat is not None and lng is not None:
            results.sort(key=lambda x: x["distance"] if x["distance"] is not None else 999)

        return {
            "stores": results,
            "total": len(results),
            "user_location": {
                "latitude": lat,
                "longitude": lng
            } if lat and lng else None
        }

    except Exception as e:
        logger.error(f"❌ [STORES] Erro ao listar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar lojas: {str(e)}")


@router.get("/search")
async def search_stores(
    state: Optional[str] = None,
    city: Optional[str] = None,
    neighborhood: Optional[str] = None,
    business_segment: Optional[str] = None,
    franquia_slug: Optional[str] = None,
):
    """Busca lojas por localização e segmento com white-label"""
    try:
        filters = {"user_type": "lojista"}

        if franquia_slug:
            filters["franquia_slug"] = franquia_slug
        if state:
            filters["state"] = {"$regex": state, "$options": "i"}
        if city:
            filters["city"] = {"$regex": city, "$options": "i"}
        if neighborhood:
            filters["neighborhood"] = {"$regex": neighborhood, "$options": "i"}
        if business_segment:
            filters["business_segment"] = {"$regex": business_segment, "$options": "i"}

        stores_cursor = _db.users.find(filters)
        stores = await stores_cursor.to_list(100)

        results = []
        for store in stores:
            results.append({
                "id": store["id"],
                "company_name": store.get("company_name", ""),
                "full_name": store.get("full_name", ""),
                "address": store.get("address", ""),
                "whatsapp": store.get("whatsapp", ""),
                "state": store.get("state", ""),
                "city": store.get("city", ""),
                "neighborhood": store.get("neighborhood", ""),
                "business_segment": store.get("business_segment", ""),
                "google_maps_url": store.get("google_maps_url", ""),
                "menu_catalog_url": store.get("menu_catalog_url", ""),
                "cashback_rate": store.get("cashback_rate", 0.0),
                "profile_image": store.get("profile_image", ""),
            })

        return {
            "success": True,
            "franquia_nome": "Transmill",
            "service_name": "Transmill Lojas",
            "stores": results,
            "total": len(results)
        }

    except Exception as e:
        logger.error(f"❌ [STORES] Erro na busca: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro na busca de lojas: {str(e)}")


@router.get("/filters")
async def get_store_filters():
    """Obtém opções de filtros para busca de lojas"""
    try:
        from brazilian_locations import get_all_states, get_all_cities

        states = get_all_states()
        cities = get_all_cities()

        # Bairros únicos
        neighborhoods_cursor = _db.users.aggregate([
            {"$match": {"user_type": "lojista", "neighborhood": {"$exists": True, "$nin": [None, ""]}}},
            {"$group": {"_id": "$neighborhood"}},
            {"$sort": {"_id": 1}}
        ])
        neighborhoods = [n["_id"] async for n in neighborhoods_cursor]

        # Segmentos ativos
        segments_cursor = _db.business_segments.find({"is_active": True}).sort("name", 1)
        segments = [s["name"] async for s in segments_cursor]

        return {
            "states": states,
            "cities": cities,
            "neighborhoods": neighborhoods,
            "business_segments": segments
        }

    except ImportError:
        # Fallback se brazilian_locations não estiver disponível
        segments = await _db.users.distinct("business_segment", {
            "user_type": "lojista", "is_blocked": {"$ne": True},
            "business_segment": {"$nin": [None, ""]}
        })
        states = await _db.users.distinct("state", {
            "user_type": "lojista", "is_blocked": {"$ne": True},
            "state": {"$nin": [None, ""]}
        })
        return {
            "success": True,
            "filters": {
                "segments": sorted([s for s in segments if s]),
                "states": sorted([s for s in states if s])
            }
        }
    except Exception as e:
        logger.error(f"❌ [STORES] Erro ao buscar filtros: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter filtros: {str(e)}")


@router.get("/cities/{state}")
async def get_cities_by_state_endpoint(state: str):
    """Obtém cidades de um estado específico"""
    try:
        from brazilian_locations import get_cities_by_state
        cities = get_cities_by_state(state)
        return {
            "state": state,
            "cities": cities
        }
    except ImportError:
        cities = await _db.users.distinct("city", {
            "user_type": "lojista", "is_blocked": {"$ne": True},
            "state": state, "city": {"$nin": [None, ""]}
        })
        return {"state": state, "cities": sorted([c for c in cities if c])}
    except Exception as e:
        logger.error(f"❌ [STORES] Erro ao buscar cidades: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter cidades: {str(e)}")


@router.get("/{store_id}")
async def get_store_details(store_id: str):
    """Obtém detalhes completos de uma loja (endpoint público)"""
    try:
        store = await _db.users.find_one({"id": store_id, "user_type": "lojista"})
        if not store:
            raise HTTPException(status_code=404, detail="Loja não encontrada")

        return {
            "id": store["id"],
            "company_name": store.get("company_name", ""),
            "full_name": store.get("full_name", ""),
            "address": store.get("address", ""),
            "whatsapp": store.get("whatsapp", ""),
            "state": store.get("state", ""),
            "city": store.get("city", ""),
            "neighborhood": store.get("neighborhood", ""),
            "business_segment": store.get("business_segment", ""),
            "google_maps_url": store.get("google_maps_url", ""),
            "cashback_rate": store.get("cashback_rate", 0.0),
            "profile_image": store.get("profile_image", ""),
            "cnpj": store.get("cnpj", ""),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [STORES] Erro ao buscar loja: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar loja: {str(e)}")
