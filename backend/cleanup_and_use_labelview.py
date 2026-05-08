#!/usr/bin/env python3
"""
Deletar protecao@agitomil.com e usar apenas labelview@transmill.com
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

async def cleanup():
    print("🗑️  Deletando protecao@agitomil.com...")
    
    result = await db.users.delete_one({"email": "protecao@agitomil.com"})
    
    if result.deleted_count > 0:
        print(f"✅ Deletado: {result.deleted_count} usuário")
    else:
        print("⚠️  Usuário protecao@agitomil.com não encontrado (já foi deletado)")
    
    print()
    print("🔍 Verificando labelview@transmill.com...")
    
    labelview_user = await db.users.find_one({"email": "labelview@transmill.com"})
    
    if labelview_user:
        print("✅ labelview@transmill.com encontrado!")
        print(f"   ID: {labelview_user.get('id')}")
        print(f"   User Type: {labelview_user.get('user_type')}")
        print(f"   is_labelview_master: {labelview_user.get('is_labelview_master')}")
        print()
        print("✅ Sistema configurado corretamente!")
        print("   Usar: labelview@transmill.com / demo123")
    else:
        print("❌ labelview@transmill.com NÃO encontrado!")
        print("   Execute: python3 create_correct_labelview_master.py")

if __name__ == "__main__":
    asyncio.run(cleanup())
