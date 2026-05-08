#!/usr/bin/env python3
"""
Verificar usuário Master no banco
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_master():
    user = await db.users.find_one({"email": "protecao@agitomil.com"})
    
    if not user:
        print("❌ Usuário não encontrado!")
        return
    
    print("✅ Usuário encontrado:")
    print(f"   ID: {user.get('id')}")
    print(f"   Email: {user.get('email')}")
    print(f"   User Type: {user.get('user_type')}")
    print(f"   is_labelview_master: {user.get('is_labelview_master')}")
    print(f"   password_hash exists: {bool(user.get('password_hash'))}")
    
    # Testar senha
    senha_correta = "demo123"
    hash_salvo = user.get('password_hash', '')
    
    print()
    print("🔐 Testando verificação de senha...")
    try:
        resultado = pwd_context.verify(senha_correta, hash_salvo)
        if resultado:
            print("✅ Senha 'demo123' é válida!")
        else:
            print("❌ Senha 'demo123' NÃO bate com o hash!")
    except Exception as e:
        print(f"❌ Erro ao verificar senha: {e}")

if __name__ == "__main__":
    asyncio.run(check_master())
