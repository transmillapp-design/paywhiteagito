import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid
from passlib.hash import bcrypt

async def create_labelview_account():
    # Conectar ao MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitomil')  # Banco correto
    db = client[db_name]
    
    print(f"🔗 Connecting to database: {db_name}")
    
    email = "protecao@agitomil.com"
    
    # Deletar se existe
    await db.users.delete_one({"email": email})
    
    # Criar com o MESMO CÓDIGO do seed_demo_accounts.py
    labelview_id = str(uuid.uuid4())
    labelview_data = {
        "id": labelview_id,
        "full_name": "Master Labelview",
        "email": email,
        "password_hash": bcrypt.hash("demo123"),  # Mesmo método usado no seed
        "phone": "11987654321",
        "user_type": "labelview_master",
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
        "social_points": 0,
        "is_active": True,
        "is_blocked": False,
        "is_labelview_master": True,  # Permissão específica
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(labelview_data)
    print(f"✅ Conta Labelview criada: {email}")
    print(f"🔑 Senha: demo123")
    print(f"🆔 ID: {labelview_id}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_labelview_account())
