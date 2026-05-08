"""
LIMPEZA FINAL E DEFINITIVA
Deletar TUDO exceto as 4 contas de produção
Incluir TODAS as coleções com dados de teste
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# APENAS essas 4 contas devem existir
KEEP_EMAILS = [
    'transmillapp@gmail.com',        # Master Transmill
    'labelview@transmill.com',       # Master Labelview
    'agitoautobrasil@gmail.com',     # Unidade Labelview
    'rafael.bersch@htmail.com',      # Consultor Labelview
]

async def final_cleanup():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['transmill']
    
    print("=" * 80)
    print("LIMPEZA FINAL E DEFINITIVA - PRODUÇÃO")
    print("=" * 80)
    
    # 1. DELETAR TODOS OS USUÁRIOS QUE NÃO SÃO AS 4 CONTAS
    users_before = await db.users.count_documents({})
    result_users = await db.users.delete_many({
        'email': {'$nin': KEEP_EMAILS}
    })
    users_after = await db.users.count_documents({})
    
    print(f"\n🗑️ USUÁRIOS:")
    print(f"   Antes: {users_before}")
    print(f"   Deletados: {result_users.deleted_count}")
    print(f"   Depois: {users_after}")
    
    # 2. DELETAR ABSOLUTAMENTE TUDO DAS OUTRAS COLEÇÕES
    collections_to_clean = [
        'stores',
        'orders', 
        'transactions',
        'labelview_leads',
        'labelview_protecoes',
        'labelview_solicitacoes',
        'labelview_clients',
        'cotacoes',
        'referrals',
        'notifications',
        'internet_plan_purchases',
        'service_requests',
        'pix_transactions',
        'withdrawals',
        'deposits'
    ]
    
    print(f"\n🧹 LIMPANDO OUTRAS COLEÇÕES:")
    
    for collection_name in collections_to_clean:
        try:
            count_before = await db[collection_name].count_documents({})
            if count_before > 0:
                result = await db[collection_name].delete_many({})
                print(f"   {collection_name}: {result.deleted_count} deletados")
        except:
            pass
    
    # 3. VERIFICAÇÃO FINAL
    print("\n" + "=" * 80)
    print("VERIFICAÇÃO FINAL")
    print("=" * 80)
    
    final_users = await db.users.find({}).to_list(length=100)
    print(f"\n👥 Total de usuários: {len(final_users)}")
    
    for user in final_users:
        print(f"\n  {user.get('email')}")
        print(f"    Tipo: {user.get('user_type')}")
        print(f"    ID: {user.get('id')}")
    
    # Verificar todas as coleções
    print(f"\n📊 ESTADO DAS COLEÇÕES:")
    collections = await db.list_collection_names()
    
    for col in sorted(collections):
        if col.startswith('system.'):
            continue
        count = await db[col].count_documents({})
        if count > 0:
            status = 'LIMPA' if count == 0 else f'{count} docs'
            print(f"  {col}: {status}")
    
    print("\n" + "=" * 80)
    print("LIMPEZA FINAL CONCLUÍDA!")
    print("=" * 80)
    print("\n✅ APENAS 4 CONTAS DE PRODUÇÃO:")
    print("  1. Master Transmill:  transmillapp@gmail.com")
    print("  2. Master Labelview:  labelview@transmill.com")
    print("  3. Unidade AgitoAuto: agitoautobrasil@gmail.com")
    print("  4. Consultor Rafael:  rafael.bersch@htmail.com")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(final_cleanup())
