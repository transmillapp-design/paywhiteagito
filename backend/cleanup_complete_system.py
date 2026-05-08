"""
LIMPEZA COMPLETA E TOTAL DO SISTEMA TRANSMILL
Manter APENAS 4 contas de produção:
1. Master Transmill: transmillapp@gmail.com
2. Master Labelview: labelview@transmill.com
3. Unidade AgitoAuto: agitoautobrasil@gmail.com
4. Consultor Rafael: rafael.bersch@htmail.com

DELETAR TUDO O RESTO - SEM RESQUÍCIOS!
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

async def cleanup_everything():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['transmill']
    
    print("=" * 80)
    print("LIMPEZA COMPLETA E TOTAL DO SISTEMA TRANSMILL")
    print("=" * 80)
    
    # 1. Pegar IDs das contas que devem ser mantidas
    keep_users = await db.users.find({'email': {'$in': KEEP_EMAILS}}).to_list(length=10)
    keep_user_ids = [u.get('id') for u in keep_users]
    
    print(f"\n✅ Contas que serão MANTIDAS ({len(keep_users)}):")
    for user in keep_users:
        print(f"   - {user.get('email')} (ID: {user.get('id')})")
    
    # 2. DELETAR TODOS OS OUTROS USUÁRIOS
    users_before = await db.users.count_documents({})
    result_users = await db.users.delete_many({
        'email': {'$nin': KEEP_EMAILS}
    })
    users_after = await db.users.count_documents({})
    print(f"\n🗑️ USUÁRIOS:")
    print(f"   Antes: {users_before}")
    print(f"   Deletados: {result_users.deleted_count}")
    print(f"   Depois: {users_after}")
    
    # 3. DELETAR TODAS AS LOJAS (stores)
    stores_count = await db.stores.count_documents({})
    result_stores = await db.stores.delete_many({})
    print(f"\n🗑️ LOJAS (stores):")
    print(f"   Deletadas: {result_stores.deleted_count}")
    
    # 4. DELETAR TODOS OS PEDIDOS (orders)
    orders_count = await db.orders.count_documents({})
    result_orders = await db.orders.delete_many({})
    print(f"\n🗑️ PEDIDOS (orders):")
    print(f"   Deletados: {result_orders.deleted_count}")
    
    # 5. DELETAR TODAS AS TRANSAÇÕES (transactions)
    transactions_count = await db.transactions.count_documents({})
    result_transactions = await db.transactions.delete_many({})
    print(f"\n🗑️ TRANSAÇÕES (transactions):")
    print(f"   Deletadas: {result_transactions.deleted_count}")
    
    # 6. DELETAR TODOS OS LEADS (labelview_leads)
    leads_count = await db.labelview_leads.count_documents({})
    result_leads = await db.labelview_leads.delete_many({})
    print(f"\n🗑️ LEADS Labelview (labelview_leads):")
    print(f"   Deletados: {result_leads.deleted_count}")
    
    # 7. DELETAR TODAS AS PROTEÇÕES (labelview_protecoes)
    protecoes_count = await db.labelview_protecoes.count_documents({})
    result_protecoes = await db.labelview_protecoes.delete_many({})
    print(f"\n🗑️ PROTEÇÕES Labelview (labelview_protecoes):")
    print(f"   Deletadas: {result_protecoes.deleted_count}")
    
    # 8. DELETAR TODAS AS SOLICITAÇÕES (labelview_solicitacoes)
    solicitacoes_count = await db.labelview_solicitacoes.count_documents({})
    result_solicitacoes = await db.labelview_solicitacoes.delete_many({})
    print(f"\n🗑️ SOLICITAÇÕES Labelview (labelview_solicitacoes):")
    print(f"   Deletadas: {result_solicitacoes.deleted_count}")
    
    # 9. DELETAR TODOS OS CLIENTES LABELVIEW (labelview_clients)
    clients_count = await db.labelview_clients.count_documents({})
    result_clients = await db.labelview_clients.delete_many({})
    print(f"\n🗑️ CLIENTES Labelview (labelview_clients):")
    print(f"   Deletados: {result_clients.deleted_count}")
    
    # 10. DELETAR TODAS AS COTAÇÕES (cotacoes ou similar)
    try:
        cotacoes_count = await db.cotacoes.count_documents({})
        result_cotacoes = await db.cotacoes.delete_many({})
        print(f"\n🗑️ COTAÇÕES (cotacoes):")
        print(f"   Deletadas: {result_cotacoes.deleted_count}")
    except:
        print(f"\n⚠️ Coleção 'cotacoes' não existe")
    
    # 11. DELETAR REFERRALS de usuários deletados
    referrals_count = await db.referrals.count_documents({})
    result_referrals = await db.referrals.delete_many({
        'referrer_id': {'$nin': keep_user_ids}
    })
    print(f"\n🗑️ REFERRALS:")
    print(f"   Deletados: {result_referrals.deleted_count}")
    
    # 12. DELETAR NOTIFICAÇÕES de usuários deletados
    try:
        notifications_count = await db.notifications.count_documents({})
        result_notifications = await db.notifications.delete_many({
            'user_id': {'$nin': keep_user_ids}
        })
        print(f"\n🗑️ NOTIFICAÇÕES:")
        print(f"   Deletadas: {result_notifications.deleted_count}")
    except:
        print(f"\n⚠️ Coleção 'notifications' não existe")
    
    # 13. DELETAR INTERNET PLANS PURCHASES
    try:
        internet_purchases = await db.internet_plan_purchases.count_documents({})
        result_internet = await db.internet_plan_purchases.delete_many({
            'user_id': {'$nin': keep_user_ids}
        })
        print(f"\n🗑️ COMPRAS INTERNET:")
        print(f"   Deletadas: {result_internet.deleted_count}")
    except:
        print(f"\n⚠️ Coleção 'internet_plan_purchases' não existe")
    
    # 14. VERIFICAÇÃO FINAL - Listar todas as coleções
    print("\n" + "=" * 80)
    print("VERIFICAÇÃO FINAL - ESTADO DO SISTEMA")
    print("=" * 80)
    
    collections = await db.list_collection_names()
    print(f"\n📊 Total de coleções no banco: {len(collections)}")
    
    for collection_name in sorted(collections):
        if collection_name.startswith('system.'):
            continue
            
        count = await db[collection_name].count_documents({})
        if count > 0:
            print(f"\n📁 {collection_name}: {count} documentos")
            
            # Mostrar alguns exemplos
            if collection_name == 'users':
                users = await db[collection_name].find({}).to_list(length=10)
                for user in users:
                    print(f"   - {user.get('email')} ({user.get('user_type')})")
    
    print("\n" + "=" * 80)
    print("LIMPEZA COMPLETA FINALIZADA!")
    print("=" * 80)
    print("\n✅ SISTEMA LIMPO - APENAS 4 CONTAS DE PRODUÇÃO MANTIDAS:")
    print("   1. Master Transmill:  transmillapp@gmail.com")
    print("   2. Master Labelview:  labelview@transmill.com")
    print("   3. Unidade AgitoAuto: agitoautobrasil@gmail.com")
    print("   4. Consultor Rafael:  rafael.bersch@htmail.com")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(cleanup_everything())
