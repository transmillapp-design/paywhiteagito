#!/usr/bin/env python3
"""
Script para criar conta demo de prestador de serviço no AgitoCoin
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid
from passlib.hash import bcrypt

async def create_demo_provider():
    # Conectar ao MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitocoin')
    db = client[db_name]
    
    # Verificar se conta já existe
    existing_user = await db.users.find_one({"email": "prestador@demo.com"})
    if existing_user:
        print("ℹ️  Conta prestador@demo.com já existe")
        user_id = existing_user["id"]
    else:
        # Criar usuário base
        user_id = str(uuid.uuid4())
        password_hash = bcrypt.hash("demo123")
        
        user_data = {
            "id": user_id,
            "full_name": "José Silva Prestador",
            "email": "prestador@demo.com",
            "password_hash": password_hash,
            "phone": "11988776655",
            "user_type": "service_provider",
            "balance": 0.0,
            "cashback_balance": 0.0,
            "usdt_balance": 0.0,
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user_data)
        print(f"✅ Usuário criado: {user_data['email']}")
    
    # Buscar um tipo de prestador para associar (Eletricista)
    provider_type = await db.service_provider_types.find_one({"name": "Eletricista"})
    if not provider_type:
        # Se não existir, criar um tipo padrão
        provider_type_id = str(uuid.uuid4())
        provider_type = {
            "id": provider_type_id,
            "name": "Eletricista",
            "description": "Serviços elétricos residenciais e comerciais",
            "category": "domestico",
            "icon": "⚡",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        await db.service_provider_types.insert_one(provider_type)
        print(f"✅ Tipo de prestador criado: {provider_type['name']}")
    
    # Verificar se perfil de prestador já existe
    existing_provider = await db.service_providers.find_one({"user_id": user_id})
    if existing_provider:
        print("ℹ️  Perfil de prestador já existe")
        provider_id = existing_provider["id"]
    else:
        # Criar perfil de prestador
        provider_id = str(uuid.uuid4())
        provider_profile = {
            "id": provider_id,
            "user_id": user_id,
            "fantasy_name": "JS Elétrica",
            "document": "12345678901",
            "document_type": "cpf",
            "provider_type_id": provider_type["id"],
            "provider_type_name": provider_type["name"],
            "address": {
                "street": "Rua das Flores",
                "number": "123",
                "complement": "Casa",
                "neighborhood": "Centro",
                "city": "São Paulo",
                "state": "SP",
                "zipcode": "01000-000"
            },
            "profile_description": "Eletricista profissional com 10 anos de experiência. Atendo residências e comércios.",
            "working_hours": "Segunda a Sexta: 8h - 18h | Sábado: 8h - 12h",
            "accepts_emergency": True,
            "cashback_rate": 0.05,  # 5% de cashback
            "rating_average": 4.8,
            "rating_count": 24,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.service_providers.insert_one(provider_profile)
        print(f"✅ Perfil de prestador criado: {provider_profile['fantasy_name']}")
    
    # Criar alguns serviços de exemplo
    services_to_create = [
        {
            "name": "Instalação Elétrica Completa",
            "description": "Instalação elétrica completa para residências e comércios",
            "price": 350.00,
            "estimated_duration": 240,
            "category": "eletrica"
        },
        {
            "name": "Manutenção de Tomadas e Interruptores",
            "description": "Troca e manutenção de tomadas e interruptores",
            "price": 80.00,
            "estimated_duration": 60,
            "category": "eletrica"
        },
        {
            "name": "Instalação de Chuveiro Elétrico",
            "description": "Instalação completa de chuveiro elétrico com verificação",
            "price": 120.00,
            "estimated_duration": 90,
            "category": "eletrica"
        }
    ]
    
    services_created = 0
    for service_data in services_to_create:
        # Verificar se serviço já existe
        existing_service = await db.services.find_one({
            "user_id": user_id,
            "name": service_data["name"]
        })
        
        if not existing_service:
            service_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            
            service = {
                "id": service_id,
                "provider_id": provider_id,
                "user_id": user_id,
                "name": service_data["name"],
                "description": service_data["description"],
                "price": service_data["price"],
                "estimated_duration": service_data["estimated_duration"],
                "category": service_data["category"],
                "is_available": True,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            
            await db.services.insert_one(service)
            services_created += 1
            print(f"✅ Serviço criado: {service['name']} - R$ {service['price']:.2f}")
    
    if services_created == 0:
        print("ℹ️  Serviços já existem")
    
    print("\n" + "="*60)
    print("🎉 CONTA DEMO DE PRESTADOR CRIADA COM SUCESSO!")
    print("="*60)
    print(f"\n📧 Email: prestador@demo.com")
    print(f"🔑 Senha: demo123")
    print(f"\n👤 Nome: José Silva Prestador")
    print(f"🏢 Nome Fantasia: JS Elétrica")
    print(f"⚡ Tipo: Eletricista")
    print(f"💰 Cashback: 5%")
    print(f"⭐ Avaliação: 4.8 (24 avaliações)")
    print(f"📍 Localização: São Paulo/SP")
    print(f"🛠️  Serviços cadastrados: {len(services_to_create)}")
    print(f"\n✅ Pronto para testar o dashboard de prestador!")
    print("="*60 + "\n")
    
    # Fechar conexão
    client.close()

if __name__ == "__main__":
    asyncio.run(create_demo_provider())
