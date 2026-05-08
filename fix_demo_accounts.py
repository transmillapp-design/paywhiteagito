#!/usr/bin/env python3
"""
Script simples para corrigir contas demo
"""

import pymongo
import bcrypt
import os

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'agitocash')

def create_demo_accounts():
    """Cria as contas de demonstração com hashes corretos"""
    
    print("🔄 Conectando ao MongoDB...")
    client = pymongo.MongoClient(mongo_url)
    db = client[db_name]
    
    # Clear existing demo accounts
    db.users.delete_many({"email": {"$in": ["cliente@demo.com", "lojista@demo.com", "master@agitocash.com"]}})
    
    # Demo accounts data
    demo_accounts = [
        {
            "id": "cliente-demo-001",
            "email": "cliente@demo.com",
            "password_hash": bcrypt.hashpw("demo123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
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
            "password_hash": bcrypt.hashpw("demo123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
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
            "email": "master@agitocash.com", 
            "password_hash": bcrypt.hashpw("master123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "full_name": "Master Admin",
            "phone": "11999999999",
            "user_type": "master",
            "balance": 0.00,
            "cashback_balance": 0.00,
            "is_master_account": True,
            "referral_code": "MASTER01",
            "referred_by": None,
            "is_blocked": False,
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
    
    # Insert all accounts
    result = db.users.insert_many(demo_accounts)
    print(f"✅ Criadas {len(result.inserted_ids)} contas demo")
    
    # Verify accounts
    print("\n🔍 Verificando contas criadas...")
    for account in demo_accounts:
        user = db.users.find_one({"email": account["email"]})
        if user and bcrypt.checkpw("demo123".encode('utf-8'), user["password_hash"].encode('utf-8')):
            print(f"✅ {account['email']} - Hash válido")
        else:
            print(f"❌ {account['email']} - Problema detectado!")
    
    # Fix master account password  
    master_account = db.users.find_one({"email": "master@agitocash.com"})
    if master_account and not bcrypt.checkpw("master123".encode('utf-8'), master_account["password_hash"].encode('utf-8')):
        new_hash = bcrypt.hashpw("master123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        db.users.update_one({"email": "master@agitocash.com"}, {"$set": {"password_hash": new_hash}})
        print("🔧 Corrigido hash da conta master")
    
    client.close()
    print("\n🎉 Contas de demonstração configuradas com sucesso!")

if __name__ == "__main__":
    create_demo_accounts()