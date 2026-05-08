#!/usr/bin/env python3
"""
Script para criar conta demo de prestador no ambiente de PRODUÇÃO
Execute este script após fazer login no ambiente de produção
"""
import asyncio
import sys
import os

# Adicionar o diretório backend ao path
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
from passlib.hash import bcrypt

async def create_production_prestador():
    """Cria prestador demo no banco de produção"""
    
    # Usar MONGO_URL do ambiente (produção)
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    print(f"Conectando ao MongoDB: {mongo_url}")
    
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitocoin')
    db = client[db_name]
    
    print(f"Usando database: {db_name}")
    
    try:
        # Verificar se prestador já existe
        existing = await db.users.find_one({"email": "prestador@demo.com"})
        
        if existing:
            print("✅ Prestador prestador@demo.com já existe!")
            print(f"   ID: {existing.get('id')}")
            print(f"   Nome: {existing.get('full_name')}")
            print(f"   Tipo: {existing.get('user_type')}")
            user_id = existing["id"]
        else:
            # Criar usuário prestador
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
                "is_blocked": False,
                "referral_code": str(uuid.uuid4())[:8].upper(),
                "referral_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.users.insert_one(user_data)
            print(f"✅ Usuário prestador criado: {user_data['email']}")
            print(f"   ID: {user_id}")
        
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
            print(f"✅ Tipo de prestador criado: {provider_type['name']}")
        
        # Verificar perfil de prestador
        existing_profile = await db.service_providers.find_one({"user_id": user_id})
        
        if existing_profile:
            print("✅ Perfil de prestador já existe!")
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
                "profile_description": "Eletricista profissional com 10 anos de experiência.",
                "working_hours": "Segunda a Sexta: 8h - 18h",
                "accepts_emergency": True,
                "cashback_rate": 0.05,
                "rating_average": 4.8,
                "rating_count": 24,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.service_providers.insert_one(provider_profile)
            print(f"✅ Perfil de prestador criado: {provider_profile['fantasy_name']}")
        
        # Criar alguns serviços de exemplo
        services = [
            {
                "name": "Instalação Elétrica Completa",
                "description": "Instalação elétrica completa para residências",
                "price": 350.00,
                "estimated_duration": 240,
                "category": "eletrica"
            },
            {
                "name": "Manutenção de Tomadas",
                "description": "Troca e manutenção de tomadas e interruptores",
                "price": 80.00,
                "estimated_duration": 60,
                "category": "eletrica"
            },
            {
                "name": "Instalação de Chuveiro",
                "description": "Instalação completa de chuveiro elétrico",
                "price": 120.00,
                "estimated_duration": 90,
                "category": "eletrica"
            }
        ]
        
        services_created = 0
        for service_data in services:
            existing_service = await db.services.find_one({
                "user_id": user_id,
                "name": service_data["name"]
            })
            
            if not existing_service:
                service_id = str(uuid.uuid4())
                service = {
                    "id": service_id,
                    "provider_id": user_id,
                    "user_id": user_id,
                    "name": service_data["name"],
                    "description": service_data["description"],
                    "price": service_data["price"],
                    "estimated_duration": service_data["estimated_duration"],
                    "category": service_data["category"],
                    "is_available": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.services.insert_one(service)
                services_created += 1
        
        if services_created > 0:
            print(f"✅ {services_created} serviços criados")
        else:
            print("ℹ️  Serviços já existem")
        
        # Verificar estatísticas
        total_users = await db.users.count_documents({})
        prestadores = await db.users.count_documents({"user_type": "service_provider"})
        
        print("\n" + "="*60)
        print("🎉 SUCESSO!")
        print("="*60)
        print(f"\n📧 Email: prestador@demo.com")
        print(f"🔑 Senha: demo123")
        print(f"\n📊 Estatísticas do Banco:")
        print(f"   Total de usuários: {total_users}")
        print(f"   Prestadores: {prestadores}")
        print(f"\n✅ O prestador agora deve aparecer no painel master!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    print("="*60)
    print("CRIANDO PRESTADOR DEMO NO BANCO DE PRODUÇÃO")
    print("="*60 + "\n")
    asyncio.run(create_production_prestador())
