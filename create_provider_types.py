#!/usr/bin/env python3
"""
Script para criar tipos de prestadores padrão no AgitoCoin
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid

async def create_provider_types():
    # Conectar ao MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitocoin')
    db = client[db_name]
    
    # Tipos de prestadores padrão
    provider_types = [
        {
            "id": str(uuid.uuid4()),
            "name": "Encanador",
            "description": "Serviços de encanamento, instalação e reparos hidráulicos",
            "category": "domestico",
            "icon": "🔧",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Eletricista",
            "description": "Serviços elétricos residenciais e comerciais",
            "category": "domestico",
            "icon": "⚡",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Pintor",
            "description": "Pintura residencial e comercial",
            "category": "domestico",
            "icon": "🎨",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Barbeiro / Cabeleireiro",
            "description": "Serviços de corte de cabelo e estética capilar",
            "category": "beleza",
            "icon": "💈",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Manicure / Pedicure",
            "description": "Serviços de manicure e pedicure",
            "category": "beleza",
            "icon": "💅",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Personal Trainer",
            "description": "Treinamento físico personalizado",
            "category": "saude",
            "icon": "💪",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Massagista",
            "description": "Massagem terapêutica e relaxante",
            "category": "saude",
            "icon": "💆",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Mecânico",
            "description": "Serviços de mecânica automotiva",
            "category": "automotivo",
            "icon": "🔧",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Lavador de Carros",
            "description": "Lavagem e limpeza de veículos",
            "category": "automotivo",
            "icon": "🚗",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Professor Particular",
            "description": "Aulas particulares e reforço escolar",
            "category": "educacao",
            "icon": "📚",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Psicólogo",
            "description": "Atendimento psicológico",
            "category": "saude",
            "icon": "🧠",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Nutricionista",
            "description": "Consultoria nutricional",
            "category": "saude",
            "icon": "🥗",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Fotógrafo",
            "description": "Serviços de fotografia profissional",
            "category": "eventos",
            "icon": "📷",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Diarista",
            "description": "Serviços de limpeza doméstica",
            "category": "domestico",
            "icon": "🧹",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Jardineiro",
            "description": "Serviços de jardinagem e paisagismo",
            "category": "domestico",
            "icon": "🌱",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    # Verificar e criar tipos
    for provider_type in provider_types:
        existing = await db.service_provider_types.find_one({"name": provider_type["name"]})
        if not existing:
            await db.service_provider_types.insert_one(provider_type)
            print(f"✅ Tipo criado: {provider_type['name']} ({provider_type['category']})")
        else:
            print(f"ℹ️  Tipo já existe: {provider_type['name']}")
    
    print(f"\n✅ Total de tipos de prestadores: {len(provider_types)}")
    
    # Fechar conexão
    client.close()

if __name__ == "__main__":
    asyncio.run(create_provider_types())
