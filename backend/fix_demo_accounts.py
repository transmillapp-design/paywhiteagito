#!/usr/bin/env python3
"""
Script para ativar contas demo que possam estar desativadas
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_demo_accounts():
    """Ativar todas as contas demo"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'transmill')]
    
    demo_emails = [
        "cliente@demo.com",
        "lojista@demo.com",
        "master@transmill.com",
        "protecao@agitomil.com"  # Master Labelview
    ]
    
    print("🔧 Ativando contas demo...")
    
    for email in demo_emails:
        result = await db.users.update_one(
            {"email": email},
            {"$set": {
                "is_active": True,
                "is_blocked": False
            }}
        )
        
        if result.matched_count > 0:
            print(f"✅ {email} - Ativado")
        else:
            print(f"⚠️ {email} - Não encontrado no banco")
    
    print("\n✅ Processo concluído!")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_demo_accounts())
