"""
Criar Master Labelview CORRETO para produção
Email: labelview@transmill.com
Senha: demo123
"""
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.hash import bcrypt
import uuid
from datetime import datetime

load_dotenv()

async def create_master():
    """Cria o Master Labelview correto"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'transmill')]
    
    # Verificar se já existe
    existing = await db.users.find_one({'email': 'labelview@transmill.com'})
    if existing:
        print("⚠️  Conta labelview@transmill.com já existe.")
        
        # Atualizar para garantir que tem permissão de master
        await db.users.update_one(
            {'email': 'labelview@transmill.com'},
            {'$set': {
                'is_labelview_master': True,
                'is_active': True,
                'is_blocked': False
            }}
        )
        print("✅ Conta atualizada com permissão de Master Labelview!")
        
        user = await db.users.find_one({'email': 'labelview@transmill.com'})
        print(f"\n📧 Email: labelview@transmill.com")
        print(f"🆔 ID: {user.get('id')}")
        print(f"✅ Is Labelview Master: {user.get('is_labelview_master')}")
        
    else:
        print("📝 Criando Master Labelview: labelview@transmill.com")
        
        master_id = str(uuid.uuid4())
        password = "demo123"
        password_hash = bcrypt.hash(password)
        
        master = {
            'id': master_id,
            'email': 'labelview@transmill.com',
            'password_hash': password_hash,
            'full_name': 'Master Labelview',
            'phone': '',
            'user_type': 'master',
            'is_labelview_master': True,
            'is_master_account': False,
            'is_active': True,
            'is_blocked': False,
            'is_verified': True,
            'balance': 0.0,
            'cashback_balance': 0.0,
            'referral_code': f'MASTER_{master_id[:8].upper()}',
            'referral_count': 0,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'must_change_password': False,
            'profile_complete': True
        }
        
        await db.users.insert_one(master)
        
        print("✅ Master Labelview criado com sucesso!")
        print(f"\n📧 Email: labelview@transmill.com")
        print(f"🔑 Senha: demo123")
        print(f"🆔 ID: {master_id}")
        print(f"✅ Is Labelview Master: True")
    
    # Remover contas antigas incorretas
    old_accounts = ['protecao@agitomil.com']
    for email in old_accounts:
        old = await db.users.find_one({'email': email})
        if old:
            await db.users.delete_one({'email': email})
            print(f"\n🗑️  Conta antiga removida: {email}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_master())
