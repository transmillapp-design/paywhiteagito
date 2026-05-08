#!/usr/bin/env python3
"""
Script para criar TODAS as contas demo no banco de dados de produção
Inclui: Cliente, Lojista, Prestador e Master
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid
from passlib.hash import bcrypt

async def seed_database():
    # Conectar ao MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitomil')
    db = client[db_name]
    
    print("🔧 Iniciando seed do banco de dados...")
    print(f"📦 Database: {db_name}")
    print(f"🔗 MongoDB: {mongo_url}")
    print()
    
    # Senha padrão para todas as contas demo
    password_hash = bcrypt.hash("demo123")
    
    # ====================
    # 1. CRIAR CLIENTE DEMO
    # ====================
    cliente_email = "cliente@demo.com"
    cliente = await db.users.find_one({"email": cliente_email})
    
    if not cliente:
        cliente_id = str(uuid.uuid4())
        cliente_data = {
            "id": cliente_id,
            "full_name": "Cliente Demo",
            "email": cliente_email,
            "password_hash": password_hash,
            "phone": "11999999999",
            "user_type": "cliente",
            "balance": 20.0,
            "cashback_balance": 2.0,
            "usdt_balance": 0.0,
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(cliente_data)
        print(f"✅ Cliente criado: {cliente_email}")
    else:
        print(f"ℹ️  Cliente já existe: {cliente_email}")
    
    # ====================
    # 2. CRIAR LOJISTA DEMO
    # ====================
    lojista_email = "lojista@demo.com"
    lojista = await db.users.find_one({"email": lojista_email})
    
    if not lojista:
        lojista_id = str(uuid.uuid4())
        lojista_data = {
            "id": lojista_id,
            "full_name": "Lojista Demo",
            "email": lojista_email,
            "password_hash": password_hash,
            "phone": "11988888888",
            "user_type": "lojista",
            "company_name": "Loja Demo Ltda",
            "fantasy_name": "Loja Demo",
            "cnpj": "12.345.678/0001-99",
            "store_slug": "loja-demo",
            "city": "São Paulo",
            "state": "SP",
            "balance": 100.0,
            "cashback_balance": 0.0,
            "usdt_balance": 0.0,
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(lojista_data)
        print(f"✅ Lojista criado: {lojista_email}")
        
        # Criar perfil de lojista
        merchant_id = str(uuid.uuid4())
        merchant_data = {
            "id": merchant_id,
            "user_id": lojista_id,
            "fantasy_name": "Loja Demo",
            "document": "12345678000199",
            "document_type": "cnpj",
            "address": {
                "street": "Rua Demo",
                "number": "100",
                "neighborhood": "Centro",
                "city": "São Paulo",
                "state": "SP",
                "zipcode": "01000-000"
            },
            "cashback_rate": 0.05,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.merchants.insert_one(merchant_data)
        print(f"✅ Perfil de lojista criado")
    else:
        print(f"ℹ️  Lojista já existe: {lojista_email}")
    
    # ====================
    # 3. CRIAR PRESTADOR DEMO
    # ====================
    prestador_email = "prestador@demo.com"
    prestador = await db.users.find_one({"email": prestador_email})
    
    if not prestador:
        prestador_id = str(uuid.uuid4())
        prestador_data = {
            "id": prestador_id,
            "full_name": "José Silva Prestador",
            "email": prestador_email,
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
        await db.users.insert_one(prestador_data)
        print(f"✅ Prestador criado: {prestador_email}")
        
        # Buscar ou criar tipo de prestador
        provider_type = await db.service_provider_types.find_one({"name": "Eletricista"})
        if not provider_type:
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
            print(f"✅ Tipo de prestador criado: Eletricista")
        
        # Criar perfil de prestador
        provider_id = str(uuid.uuid4())
        provider_data = {
            "id": provider_id,
            "user_id": prestador_id,
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
            "cashback_rate": 0.05,
            "google_maps_url": "",
            "rating_average": 4.8,
            "rating_count": 24,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.service_providers.insert_one(provider_data)
        print(f"✅ Perfil de prestador criado: JS Elétrica")
        
        # Criar serviços do prestador
        services = [
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
        
        for service_data in services:
            service_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            
            service = {
                "id": service_id,
                "provider_id": provider_id,
                "user_id": prestador_id,
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
            print(f"   ✅ Serviço: {service['name']} - R$ {service['price']:.2f}")
            
    else:
        print(f"ℹ️  Prestador já existe: {prestador_email}")
    
    # ====================
    # 4. CRIAR MASTER
    # ====================
    master_email = "master@agitocoin.com"
    master = await db.users.find_one({"email": master_email})
    
    if not master:
        master_id = str(uuid.uuid4())
        master_data = {
            "id": master_id,
            "full_name": "Master Admin",
            "email": master_email,
            "password_hash": bcrypt.hash("master123"),
            "phone": "11977777777",
            "user_type": "master",
            "balance": 0.0,
            "cashback_balance": 0.0,
            "usdt_balance": 0.0,
            "is_active": True,
            "is_verified": True,
            "is_master_account": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(master_data)
        print(f"✅ Master criado: {master_email}")
    else:
        print(f"ℹ️  Master já existe: {master_email}")
    
    print()
    print("="*60)
    print("🎉 SEED COMPLETO!")
    print("="*60)
    print()
    print("📧 CONTAS DEMO CRIADAS:")
    print(f"   Cliente:   cliente@demo.com / demo123")
    print(f"   Lojista:   lojista@demo.com / demo123")
    print(f"   Prestador: prestador@demo.com / demo123")
    print(f"   Master:    master@agitocoin.com / master123")
    print()
    print("✅ Todas as contas estão ativas e prontas para uso!")
    print("="*60)
    
    # Fechar conexão
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
