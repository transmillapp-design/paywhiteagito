"""
Script para popular o banco de dados com usuários demo
AgitoCoin - Contas de Teste
"""

import asyncio
import bcrypt
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Configuração do MongoDB
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "transmill")

async def seed_database():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🌱 Iniciando seed do banco de dados...")
    
    # Verificar se já existem usuários demo
    existing = await db.users.find_one({"email": {"$regex": "@demo.com"}})
    if existing:
        print("⚠️  Usuários demo já existem. Deletando para recriar...")
        await db.users.delete_many({"email": {"$regex": "@demo.com"}})
    
    # Senha padrão para todos: demo123
    password_hash = bcrypt.hashpw("demo123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # 1. CLIENTE DEMO
    cliente_id = str(uuid.uuid4())
    cliente = {
        "id": cliente_id,
        "email": "cliente@demo.com",
        "password": password_hash,
        "name": "João Silva Cliente",
        "user_type": "cliente",
        "cpf": "111.111.111-11",
        "whatsapp": "(11) 91111-1111",
        "balance": 1000.00,
        "cashback_balance": 50.00,
        "commission_balance": 0.0,
        "is_verified": True,
        "is_active": True,
        "is_blocked": False,
        "is_master_account": False,
        "referral_code": str(uuid.uuid4())[:8].upper(),
        "referred_by": None,
        "referral_count": 0,
        "cep": "01310-100",
        "street": "Avenida Paulista",
        "number": "1578",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "pix_key": "111.111.111-11",
        "pix_key_type": "cpf",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(cliente)
    print(f"✅ Cliente criado: {cliente['email']}")
    
    # 2. PRESTADOR DEMO
    prestador_id = str(uuid.uuid4())
    prestador = {
        "id": prestador_id,
        "email": "prestador@demo.com",
        "password": password_hash,
        "name": "José Silva Prestador",
        "user_type": "service_provider",
        "cpf": "222.222.222-22",
        "whatsapp": "(11) 92222-2222",
        "balance": 500.00,
        "cashback_balance": 25.00,
        "commission_balance": 100.00,
        "is_verified": True,
        "is_active": True,
        "is_blocked": False,
        "is_master_account": False,
        "referral_code": str(uuid.uuid4())[:8].upper(),
        "referred_by": None,
        "referral_count": 2,
        "cep": "04567-001",
        "street": "Rua dos Prestadores",
        "number": "456",
        "neighborhood": "Vila Mariana",
        "city": "São Paulo",
        "state": "SP",
        "pix_key": "222.222.222-22",
        "pix_key_type": "cpf",
        "fantasy_name": "JS Elétrica",
        "profile_description": "Serviços elétricos em geral",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(prestador)
    print(f"✅ Prestador criado: {prestador['email']}")
    
    # 3. LOJISTA DEMO
    lojista_id = str(uuid.uuid4())
    lojista = {
        "id": lojista_id,
        "email": "lojista@demo.com",
        "password": password_hash,
        "name": "Maria Santos Lojista",
        "user_type": "lojista",
        "cpf": "333.333.333-33",
        "whatsapp": "(11) 93333-3333",
        "balance": 2000.00,
        "cashback_balance": 100.00,
        "commission_balance": 500.00,
        "is_verified": True,
        "is_active": True,
        "is_blocked": False,
        "is_master_account": False,
        "referral_code": str(uuid.uuid4())[:8].upper(),
        "referred_by": None,
        "referral_count": 5,
        "cep": "01415-002",
        "street": "Rua Augusta",
        "number": "2690",
        "neighborhood": "Consolação",
        "city": "São Paulo",
        "state": "SP",
        "pix_key": "333.333.333-33",
        "pix_key_type": "cpf",
        # Campos específicos do lojista
        "fantasy_name": "Loja Demo AgitoCoin",
        "business_segment": "Alimentação",
        "cashback_rate": 5.0,
        "profile_description": "Loja de demonstração com catálogo completo",
        # Configurações de delivery
        "accepts_pickup": True,
        "accepts_delivery": True,
        "delivery_fee": 5.00,
        "delivery_radius_km": 10.0,
        "estimated_delivery_time": 45,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(lojista)
    print(f"✅ Lojista criado: {lojista['email']}")
    
    # 4. MASTER DEMO
    master_id = str(uuid.uuid4())
    master = {
        "id": master_id,
        "email": "master@transmill.com",
        "password": password_hash,
        "name": "Admin Master",
        "user_type": "cliente",
        "cpf": "999.999.999-99",
        "whatsapp": "(11) 99999-9999",
        "balance": 10000.00,
        "cashback_balance": 500.00,
        "commission_balance": 1000.00,
        "is_verified": True,
        "is_active": True,
        "is_blocked": False,
        "is_master_account": True,
        "referral_code": "MASTER",
        "referred_by": None,
        "referral_count": 100,
        "cep": "01310-100",
        "street": "Avenida Paulista",
        "number": "1000",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "pix_key": "master@transmill.com",
        "pix_key_type": "email",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(master)
    print(f"✅ Master criado: {master['email']}")
    
    print("\n📊 Resumo dos usuários criados:")
    print(f"   • Cliente: cliente@demo.com (Senha: demo123)")
    print(f"   • Prestador: prestador@demo.com (Senha: demo123)")
    print(f"   • Lojista: lojista@demo.com (Senha: demo123)")
    print(f"   • Master: master@transmill.com (Senha: demo123)")
    print(f"\n✅ Seed concluído com sucesso!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
