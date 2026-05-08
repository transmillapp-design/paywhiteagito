#!/usr/bin/env python3
"""
Script para criar contas hierárquicas permanentemente
"""

import pymongo
import bcrypt
import os
from datetime import datetime

def create_hierarchical_accounts():
    """Cria as contas hierárquicas permanentemente"""
    
    try:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/agitocash')
        print(f"🔄 Conectando ao MongoDB: {mongo_url}")
        
        client = pymongo.MongoClient(mongo_url)
        db = client.agitocash
        
        # Contas hierárquicas
        hierarchical_accounts = [
            {
                "id": "socio-operador-001",
                "email": "socio.operador@agitocash.com",
                "password_hash": bcrypt.hashpw("socio123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                "full_name": "Carlos Silva Operador",
                "phone": "11999001234",
                "user_type": "hierarchical",
                "hierarchical_role": "socio_operador",
                "balance": 0.00,
                "cashback_balance": 0.00,
                "referral_code": "SOCIO001",
                "referred_by": None,
                "is_blocked": False,
                "created_at": datetime.utcnow().isoformat(),
                "state": "São Paulo",
                "city": "São Paulo",
                "whatsapp": "11999001234"
            },
            {
                "id": "mini-agencia-001", 
                "email": "mini.agencia@agitocash.com",
                "password_hash": bcrypt.hashpw("agencia123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                "full_name": "Maria Santos Agência",
                "phone": "11999005678",
                "user_type": "hierarchical",
                "hierarchical_role": "mini_agencia",
                "balance": 0.00,
                "cashback_balance": 0.00,
                "referral_code": "AGENCIA01",
                "referred_by": None,
                "is_blocked": False,
                "created_at": datetime.utcnow().isoformat(),
                "state": "Rio de Janeiro",
                "city": "Rio de Janeiro",
                "whatsapp": "11999005678"
            },
            {
                "id": "consultor-001",
                "email": "consultor@agitocash.com", 
                "password_hash": bcrypt.hashpw("consultor123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                "full_name": "João Costa Consultor",
                "phone": "11999009999",
                "user_type": "hierarchical",
                "hierarchical_role": "consultor",
                "balance": 0.00,
                "cashback_balance": 0.00,
                "referral_code": "CONSULT01",
                "referred_by": None,
                "is_blocked": False,
                "created_at": datetime.utcnow().isoformat(),
                "state": "Minas Gerais",
                "city": "Belo Horizonte",
                "whatsapp": "11999009999"
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for account_data in hierarchical_accounts:
            email = account_data["email"]
            
            # Verificar se conta existe
            existing_user = db.users.find_one({"email": email})
            
            if existing_user:
                # Atualizar conta existente
                db.users.update_one(
                    {"email": email},
                    {"$set": account_data}
                )
                print(f"✅ Conta hierárquica atualizada: {email} ({account_data['hierarchical_role']})")
                updated_count += 1
            else:
                # Criar nova conta
                db.users.insert_one(account_data)
                print(f"✅ Conta hierárquica criada: {email} ({account_data['hierarchical_role']})")
                created_count += 1
        
        print(f"\n📊 Resultado:")
        print(f"   Contas hierárquicas criadas: {created_count}")
        print(f"   Contas hierárquicas atualizadas: {updated_count}")
        print(f"   Total: {len(hierarchical_accounts)} contas hierárquicas ativas")
        
        # Verificar contas criadas
        print("\n🔍 Verificando contas hierárquicas...")
        for account_data in hierarchical_accounts:
            user = db.users.find_one({"email": account_data["email"]})
            if user:
                role = user.get('hierarchical_role', 'N/A')
                print(f"✅ {account_data['email']} - {role} - Hash válido")
            else:
                print(f"❌ {account_data['email']} - Problema detectado!")
        
        client.close()
        print("\n🎉 Contas hierárquicas configuradas com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar contas hierárquicas: {e}")
        return False

if __name__ == "__main__":
    create_hierarchical_accounts()