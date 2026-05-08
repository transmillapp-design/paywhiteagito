#!/usr/bin/env python3
"""
Criar usuário Master Labelview: protecao@agitomil.com
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from uuid import uuid4
from datetime import datetime

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_master():
    # Verificar se já existe
    existing = await db.users.find_one({"email": "protecao@agitomil.com"})
    
    if existing:
        print("⚠️  Usuário já existe! Removendo...")
        await db.users.delete_one({"email": "protecao@agitomil.com"})
    
    # Criar senha hash
    senha_hash = pwd_context.hash("demo123")
    
    # Criar usuário
    novo_user = {
        "id": str(uuid4()),
        "email": "protecao@agitomil.com",
        "password_hash": senha_hash,
        "full_name": "Master Labelview",
        "phone": "(11) 99999-0000",
        "user_type": "labelview_master",
        "is_labelview_master": True,
        "is_active": True,
        "is_blocked": False,
        "balance": 0.0,
        "cashback_balance": 0.0,
        "profile_complete": True,
        "must_change_password": False,
        "created_at": datetime.utcnow(),
        "referral_code": f"MASTER_{str(uuid4())[:8].upper()}"
    }
    
    await db.users.insert_one(novo_user)
    
    print("✅ Master Labelview criado com sucesso!")
    print(f"   Email: protecao@agitomil.com")
    print(f"   Senha: demo123")
    print(f"   ID: {novo_user['id']}")
    print(f"   User Type: labelview_master")
    print(f"   is_labelview_master: True")
    
    # Verificar
    verificar = await db.users.find_one({"email": "protecao@agitomil.com"})
    if verificar:
        print()
        print("✅ Verificação: Usuário salvo no banco com sucesso!")
    else:
        print()
        print("❌ ERRO: Usuário não foi salvo!")

if __name__ == "__main__":
    asyncio.run(create_master())
