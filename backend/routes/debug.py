from fastapi import APIRouter
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os

logger = logging.getLogger(__name__)
debug_router = APIRouter()

@debug_router.get("/planos-estrutura")
async def debug_planos_estrutura():
    """Endpoint temporário SEM AUTH para ver estrutura dos planos em produção"""
    # Conectar direto no MongoDB sem circular import
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_instance = client.transmill
    
    # BUSCAR QUALQUER PLANO para diagnóstico (sem filtro de unidade)
    planos = await db_instance.labelview_planos.find({
        'ativo': True
    }).to_list(length=100)
    
    if len(planos) == 0:
        return {
            "total": 0,
            "message": "Nenhum plano encontrado no banco"
        }
    
    # Pegar primeiro plano e mostrar estrutura
    primeiro = planos[0]
    
    # Remover _id para serialização
    if '_id' in primeiro:
        del primeiro['_id']
    
    # Agrupar por unidade
    unidades = {}
    for plano in planos:
        uid = plano.get('unidade_id', 'sem_unidade')
        if uid not in unidades:
            unidades[uid] = 0
        unidades[uid] += 1
    
    return {
        "total": len(planos),
        "planos_por_unidade": unidades,
        "exemplo_plano": primeiro,
        "campos_disponiveis": list(primeiro.keys())
    }
