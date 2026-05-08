import sys
sys.path.append('/app/backend')

import asyncio
from pymongo import MongoClient
import uuid
from datetime import datetime
from passlib.hash import bcrypt  # Usar o mesmo método do seed_demo_accounts.py

async def create_labelview_master():
    """Criar conta master do Labelview"""
    
    # Conectar ao MongoDB
    import os
    client = MongoClient('mongodb://localhost:27017/')
    db_name = os.environ.get('DB_NAME', 'transmill')
    db = client[db_name]
    users_collection = db['users']
    
    email = "protecao@agitomil.com"
    password = "demo123"
    
    # Verificar se já existe
    existing = users_collection.find_one({"email": email})
    
    # Hash da senha - usar o mesmo método do seed_demo_accounts.py
    hashed_password = bcrypt.hash(password)
    
    if existing:
        print(f"ℹ️  Conta {email} já existe, atualizando senha e permissões...")
        
        # Atualizar senha e permissões
        users_collection.update_one(
            {"email": email},
            {"$set": {
                "password_hash": hashed_password,  # Campo correto usado pelo backend
                "hashed_password": hashed_password,  # Mantém compatibilidade
                "is_labelview_master": True,
                "user_type": "labelview_master",
                "is_active": True,
                "is_blocked": False
            }}
        )
        print(f"✅ Senha e permissões atualizadas para {email}")
        print(f"📧 Email: {email}")
        print(f"🔑 Senha: {password}")
        client.close()
        return
    
    # Criar usuário master do Labelview
    labelview_master = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hashed_password,  # Campo correto usado pelo backend
        "hashed_password": hashed_password,  # Mantém compatibilidade
        "full_name": "Master Labelview",
        "user_type": "labelview_master",
        "is_active": True,
        "is_blocked": False,
        "is_labelview_master": True,  # Permissão específica
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
        "social_points": 0,
        "phone": "+55 11 98765-4321",
        "cpf": "000.000.000-00",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(labelview_master)
    
    if result.inserted_id:
        print(f"✅ Conta Master Labelview criada com sucesso!")
        print(f"📧 Email: {email}")
        print(f"🔑 Senha: demo123")
        print(f"🆔 ID: {labelview_master['id']}")
    else:
        print("❌ Erro ao criar conta")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_labelview_master())
