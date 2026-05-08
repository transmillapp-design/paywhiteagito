#!/usr/bin/env python3
"""
Create Demo Users in Database
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from passlib.hash import bcrypt
import random
import string

async def create_demo_users():
    """Create demo users in database"""
    
    # Load environment variables
    ROOT_DIR = Path("/app/backend")
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    print(f"🔧 CRIANDO USUÁRIOS DEMO NO DATABASE")
    print(f"MongoDB URL: {mongo_url}")
    print(f"Database Name: {db_name}")
    print("=" * 60)
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Conexão com MongoDB estabelecida")
        
        # Demo users data
        demo_users = [
            {
                "id": str(uuid.uuid4()),
                "email": "cliente@demo.com",
                "password": "demo123",
                "full_name": "Cliente Demo",
                "phone": "11999888777",
                "user_type": "cliente",
                "balance": 100.0,
                "cashback_balance": 0.0,
                "platform_balance": 0.0,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "referral_code": ''.join(random.choices(string.ascii_uppercase + string.digits, k=8)),
                "referred_by": None,
                "referral_count": 0,
                "is_master_account": False,
                "profile_image": None,
                "theme": "light"
            },
            {
                "id": str(uuid.uuid4()),
                "email": "lojista@demo.com",
                "password": "demo123",
                "full_name": "João Silva",
                "phone": "11988888888",
                "user_type": "lojista",
                "balance": 500.0,
                "cashback_balance": 0.0,
                "platform_balance": 0.0,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "company_name": "Loja Demo LTDA",
                "cnpj": "12.345.678/0001-90",
                "address": "Rua das Flores, 123 - São Paulo",
                "whatsapp": "11988888888",
                "cashback_rate": 5.0,
                "state": "São Paulo",
                "city": "São Paulo",
                "neighborhood": "Centro",
                "business_segment": "Alimentação",
                "google_maps_url": "",
                "menu_catalog_url": "",
                "referral_code": ''.join(random.choices(string.ascii_uppercase + string.digits, k=8)),
                "referred_by": None,
                "referral_count": 0,
                "is_master_account": False,
                "profile_image": None,
                "theme": "light"
            },
            {
                "id": str(uuid.uuid4()),
                "email": "master@agitocash.com",
                "password": "master123",
                "full_name": "AgitoCash Master",
                "phone": "0000000000",
                "user_type": "platform",
                "balance": 0.0,
                "cashback_balance": 0.0,
                "platform_balance": 0.0,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "referral_code": "AGITOCASH",
                "referred_by": None,
                "referral_count": 0,
                "is_master_account": True,
                "profile_image": None,
                "theme": "light"
            }
        ]
        
        # Create users
        for user_data in demo_users:
            # Check if user already exists
            existing_user = await db.users.find_one({"email": user_data["email"]})
            
            if existing_user:
                print(f"⚠️  Usuário já existe: {user_data['email']} - Atualizando senha...")
                
                # Update password hash
                password_hash = bcrypt.hash(user_data["password"])
                await db.users.update_one(
                    {"email": user_data["email"]},
                    {"$set": {"password_hash": password_hash}}
                )
                print(f"✅ Senha atualizada para: {user_data['email']}")
                
            else:
                # Hash password
                password_hash = bcrypt.hash(user_data["password"])
                
                # Remove plain password and add hash
                user_data.pop("password")
                user_data["password_hash"] = password_hash
                
                # Convert datetime to ISO string for MongoDB
                user_data["created_at"] = user_data["created_at"].isoformat()
                
                # Insert user
                await db.users.insert_one(user_data)
                print(f"✅ Usuário criado: {user_data['email']} ({user_data['user_type']})")
                
                # Print user details
                if user_data["user_type"] == "lojista":
                    print(f"   - Empresa: {user_data['company_name']}")
                    print(f"   - CNPJ: {user_data['cnpj']}")
                    print(f"   - Cashback: {user_data['cashback_rate']}%")
                    print(f"   - Estado/Cidade: {user_data['state']}/{user_data['city']}")
                    print(f"   - Segmento: {user_data['business_segment']}")
                
                if user_data["is_master_account"]:
                    print(f"   - Conta Master: Sim")
                
                print(f"   - Saldo: R$ {user_data['balance']:.2f}")
                print(f"   - Código Referral: {user_data['referral_code']}")
        
        # Verify users were created
        print(f"\n🔍 VERIFICANDO USUÁRIOS CRIADOS:")
        user_count = await db.users.count_documents({})
        print(f"✅ Total de usuários no banco: {user_count}")
        
        for email in ["cliente@demo.com", "lojista@demo.com", "master@agitocash.com"]:
            user = await db.users.find_one({"email": email})
            if user:
                print(f"✅ {email} - OK")
            else:
                print(f"❌ {email} - NÃO ENCONTRADO")
        
        # Close connection
        client.close()
        print(f"\n✅ USUÁRIOS DEMO CRIADOS COM SUCESSO!")
        
    except Exception as e:
        print(f"❌ Erro ao criar usuários demo: {e}")

if __name__ == "__main__":
    asyncio.run(create_demo_users())