#!/usr/bin/env python3
"""
Script robusto para criar/verificar contas de demonstração
"""

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'transmill')

async def create_demo_accounts():
    """Cria ou atualiza as contas de demonstração"""
    
    print("🔄 Conectando ao MongoDB...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Demo accounts data
    demo_accounts = [
        {
            "id": "cliente-demo-001",
            "email": "cliente@demo.com",
            "password": "demo123",
            "full_name": "Cliente Demo",
            "phone": "11987654321",
            "user_type": "cliente",
            "balance": 100.00,
            "cashback_balance": 0.00,
            "referral_code": "Z9AAVSIM",
            "referred_by": None,
            "is_blocked": False,
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": "lojista-demo-001", 
            "email": "lojista@demo.com",
            "password": "demo123",
            "full_name": "João Silva",
            "phone": "11988888888",
            "whatsapp": "11988888888",
            "user_type": "lojista",
            "balance": 500.00,
            "cashback_balance": 0.00,
            "cashback_rate": 5.0,
            "referral_code": "V7TM9YJF",
            "referred_by": None,
            "is_blocked": False,
            "created_at": "2024-01-01T00:00:00Z",
            # Business data
            "company_name": "Loja Demo LTDA",
            "cnpj": "12.345.678/0001-90",
            "address": "Rua das Flores, 123",
            "state": "São Paulo",
            "city": "São Paulo", 
            "neighborhood": "Centro",
            "business_segment": "Alimentação",
            "menu_catalog_url": ""
        },
        {
            "id": "master-demo-001",
            "email": "master@transmill.com", 
            "password": "master123",
            "full_name": "Master Admin",
            "phone": "11999999999",
            "user_type": "cliente",  # Master is stored as cliente with is_master_account=true
            "balance": 0.00,
            "cashback_balance": 0.00,
            "platform_balance": 0.00,
            "is_master_account": True,
            "referral_code": "MASTER01",
            "referred_by": None,
            "is_blocked": False,
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
    
    created_count = 0
    updated_count = 0
    
    for account_data in demo_accounts:
        email = account_data["email"]
        
        # Check if account exists
        existing_user = await db.users.find_one({"email": email})
        
        # Hash the password
        password = account_data.pop("password")  # Remove password from data
        hashed_password = bcrypt.hash(password)
        account_data["password_hash"] = hashed_password
        
        if existing_user:
            # Update existing account with fresh password hash
            await db.users.update_one(
                {"email": email},
                {"$set": account_data}
            )
            print(f"✅ Conta atualizada: {email}")
            updated_count += 1
        else:
            # Create new account
            await db.users.insert_one(account_data)
            print(f"✅ Conta criada: {email}")
            created_count += 1
    
    print(f"\n📊 Resultado:")
    print(f"   Contas criadas: {created_count}")
    print(f"   Contas atualizadas: {updated_count}")
    print(f"   Total: {len(demo_accounts)} contas demo ativas")
    
    # Verify all accounts work
    print("\n🔍 Verificando contas criadas...")
    for account_data in demo_accounts:
        user = await db.users.find_one({"email": account_data["email"]})
        if user and user.get("password_hash"):
            # Test the password for master account
            test_password = "master123" if "master" in account_data["email"] else "demo123"
            if bcrypt.verify(test_password, user["password_hash"]):
                print(f"✅ {account_data['email']} - Hash válido")
            else:
                print(f"❌ {account_data['email']} - Hash inválido!")
        else:
            print(f"❌ {account_data['email']} - Usuário não encontrado ou sem hash!")
    
    client.close()
    print("\n🎉 Contas de demonstração configuradas com sucesso!")

if __name__ == "__main__":
    asyncio.run(create_demo_accounts())