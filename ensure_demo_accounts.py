#!/usr/bin/env python3
"""
Script para garantir que as contas demo sempre existam no startup
"""

import pymongo
import bcrypt
import os
import sys

def ensure_demo_accounts():
    """Garante que as contas demo existam - executado no startup"""
    
    try:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/agitocash')
        print(f"🔄 Conectando ao MongoDB: {mongo_url}")
        
        client = pymongo.MongoClient(mongo_url)
        db = client.agitocash
        
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
        
        created_count = 0
        updated_count = 0
        
        for account_data in demo_accounts:
            email = account_data["email"]
            
            # Check if account exists
            existing_user = db.users.find_one({"email": email})
            
            if existing_user:
                # Update if password hash is wrong format or missing
                needs_update = False
                if not existing_user.get('password_hash'):
                    needs_update = True
                else:
                    try:
                        # Test if current hash works
                        password_to_test = "demo123" if email != "master@agitocash.com" else "master123"
                        bcrypt.checkpw(password_to_test.encode('utf-8'), existing_user['password_hash'].encode('utf-8'))
                    except:
                        needs_update = True
                
                if needs_update:
                    db.users.update_one(
                        {"email": email},
                        {"$set": account_data}
                    )
                    print(f"✅ Conta atualizada: {email}")
                    updated_count += 1
                else:
                    print(f"✅ Conta OK: {email}")
            else:
                # Create new account
                db.users.insert_one(account_data)
                print(f"✅ Conta criada: {email}")
                created_count += 1
        
        if created_count > 0 or updated_count > 0:
            print(f"📊 Resultado: {created_count} criadas, {updated_count} atualizadas")
        else:
            print("📊 Todas as contas demo já estavam OK")
            
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar contas demo: {e}")
        return False

if __name__ == "__main__":
    success = ensure_demo_accounts()
    sys.exit(0 if success else 1)