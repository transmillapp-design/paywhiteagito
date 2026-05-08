"""
Limpar TODOS os dados de teste do Transmill
Manter APENAS:
- Master Transmill: transmillapp@gmail.com
- Master Labelview: labelview@transmill.com
- Unidade Labelview: agitoautobrasil@gmail.com
- Consultor Labelview: rafael.bersch@htmail.com
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from datetime import datetime
import os
from uuid import uuid4

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# Contas que DEVEM ser mantidas
KEEP_EMAILS = [
    'transmillapp@gmail.com',        # Master Transmill
    'labelview@transmill.com',       # Master Labelview
    'agitoautobrasil@gmail.com',     # Unidade Labelview
    'rafael.bersch@htmail.com',      # Consultor Labelview
]

async def cleanup_all():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['transmill']
    
    print("=" * 70)
    print("LIMPEZA COMPLETA DE DADOS DE TESTE DO TRANSMILL")
    print("=" * 70)
    
    # 1. Listar todos os usuários atuais
    all_users = await db.users.find({}).to_list(length=1000)
    print(f"\n📊 Total de usuários no sistema: {len(all_users)}")
    
    # 2. Identificar quem será deletado
    to_delete = []
    to_keep = []
    
    for user in all_users:
        email = user.get('email', '')
        if email in KEEP_EMAILS:
            to_keep.append(email)
        else:
            to_delete.append(email)
    
    print(f"\n✅ Contas que serão MANTIDAS ({len(to_keep)}):")
    for email in to_keep:
        print(f"   - {email}")
    
    print(f"\n❌ Contas que serão DELETADAS ({len(to_delete)}):")
    for email in to_delete:
        print(f"   - {email}")
    
    # 3. Deletar usuários de teste
    if to_delete:
        result = await db.users.delete_many({
            'email': {'$nin': KEEP_EMAILS}
        })
        print(f"\n🗑️ Usuários deletados: {result.deleted_count}")
    
    # 4. Verificar/Criar Master Transmill
    master_transmill = await db.users.find_one({'email': 'transmillapp@gmail.com'})
    
    if not master_transmill:
        master_id = str(uuid4())
        master_data = {
            'id': master_id,
            'email': 'transmillapp@gmail.com',
            'password_hash': bcrypt.hash('demo123'),
            'full_name': 'Master Transmill',
            'user_type': 'master',
            'phone': '',
            'balance': 0.0,
            'cashback_balance': 0.0,
            'is_active': True,
            'is_blocked': False,
            'is_master_account': True,
            'must_change_password': False,
            'profile_complete': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'referral_code': f"MASTER_{master_id[:8].upper()}",
        }
        
        await db.users.insert_one(master_data)
        print(f"\n✅ Master Transmill criado: transmillapp@gmail.com")
    else:
        print(f"\n✅ Master Transmill já existe: transmillapp@gmail.com")
    
    # 5. Limpar outras coleções de teste
    print("\n🧹 Limpando outras coleções...")
    
    # Deletar lojas de teste (exceto se for do Master)
    stores_deleted = await db.stores.delete_many({
        'created_by': {'$nin': [u.get('id') for u in all_users if u.get('email') in KEEP_EMAILS]}
    })
    print(f"   🏪 Lojas deletadas: {stores_deleted.deleted_count}")
    
    # Deletar pedidos de teste
    orders_deleted = await db.orders.delete_many({
        'user_id': {'$nin': [u.get('id') for u in all_users if u.get('email') in KEEP_EMAILS]}
    })
    print(f"   📦 Pedidos deletados: {orders_deleted.deleted_count}")
    
    # Deletar transações de teste
    transactions_deleted = await db.transactions.delete_many({
        'user_id': {'$nin': [u.get('id') for u in all_users if u.get('email') in KEEP_EMAILS]}
    })
    print(f"   💰 Transações deletadas: {transactions_deleted.deleted_count}")
    
    # 6. Verificação final
    final_users = await db.users.find({}).to_list(length=100)
    
    print("\n" + "=" * 70)
    print("LIMPEZA CONCLUÍDA COM SUCESSO!")
    print("=" * 70)
    print(f"\n📊 Usuários finais no sistema: {len(final_users)}")
    
    print("\n👥 USUÁRIOS MANTIDOS:")
    for user in final_users:
        email = user.get('email')
        user_type = user.get('user_type')
        is_master = user.get('is_master_account') or user.get('is_labelview_master')
        print(f"   - {email}")
        print(f"     Tipo: {user_type}")
        print(f"     Master: {'Sim' if is_master else 'Não'}")
        print()
    
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(cleanup_all())
