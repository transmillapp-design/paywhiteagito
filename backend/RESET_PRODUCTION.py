"""
SCRIPT DE RESET DE PRODUÇÃO
Execute este script para limpar e recriar as 4 contas de produção corretamente

ATENÇÃO: Este script deleta TODOS os dados exceto as 4 contas principais!

Para executar:
cd /app/backend && python3 RESET_PRODUCTION.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from datetime import datetime
import os
import uuid

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def reset_production():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['transmill']
    
    print("=" * 80)
    print("🔴 RESET DE PRODUÇÃO - INICIANDO")
    print("=" * 80)
    
    # Lista de emails que devem ser mantidos
    KEEP_EMAILS = [
        'transmillapp@gmail.com',
        'labelview@transmill.com',
        'agitoautobrasil@gmail.com',
        'rafael.bersch@htmail.com',
    ]
    
    # 1. BUSCAR UNIDADE ATUAL (pode ter ID diferente em produção)
    unidade_atual = await db.users.find_one({'email': 'agitoautobrasil@gmail.com'})
    unidade_id = unidade_atual.get('id') if unidade_atual else str(uuid.uuid4())
    
    print(f"\n📋 ID da Unidade em produção: {unidade_id}")
    
    # 2. DELETAR TODOS OS OUTROS USUÁRIOS
    users_before = await db.users.count_documents({})
    result_users = await db.users.delete_many({
        'email': {'$nin': KEEP_EMAILS}
    })
    print(f"\n🗑️ Usuários:")
    print(f"   Antes: {users_before}")
    print(f"   Deletados: {result_users.deleted_count}")
    
    # 3. GARANTIR QUE AS 4 CONTAS EXISTEM COM DADOS CORRETOS
    
    # Master Transmill
    master_transmill = await db.users.find_one({'email': 'transmillapp@gmail.com'})
    if not master_transmill:
        master_id = str(uuid.uuid4())
        await db.users.insert_one({
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
        })
        print("\n✅ Master Transmill CRIADO")
    else:
        master_id = master_transmill.get('id')
        print(f"\n✅ Master Transmill JÁ EXISTE (ID: {master_id})")
    
    # Master Labelview
    master_labelview = await db.users.find_one({'email': 'labelview@transmill.com'})
    if not master_labelview:
        master_lv_id = str(uuid.uuid4())
        await db.users.insert_one({
            'id': master_lv_id,
            'email': 'labelview@transmill.com',
            'password_hash': bcrypt.hash('demo123'),
            'full_name': 'Master Labelview',
            'user_type': 'labelview_master',
            'phone': '',
            'balance': 0.0,
            'cashback_balance': 0.0,
            'is_active': True,
            'is_blocked': False,
            'is_labelview_master': True,
            'must_change_password': False,
            'profile_complete': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'referral_code': f"MASTERLV_{master_lv_id[:8].upper()}",
        })
        print(f"✅ Master Labelview CRIADO (ID: {master_lv_id})")
    else:
        master_lv_id = master_labelview.get('id')
        print(f"✅ Master Labelview JÁ EXISTE (ID: {master_lv_id})")
    
    # Unidade AgitoAuto (atualizar se necessário)
    if unidade_atual:
        await db.users.update_one(
            {'id': unidade_id},
            {'$set': {
                'user_type': 'labelview_unidade',
                'unidade_id': unidade_id,
                'referred_by': master_lv_id,
                'updated_at': datetime.utcnow()
            }}
        )
        print(f"✅ Unidade ATUALIZADA (ID: {unidade_id})")
    else:
        await db.users.insert_one({
            'id': unidade_id,
            'email': 'agitoautobrasil@gmail.com',
            'password_hash': bcrypt.hash('!Ma04202011@'),
            'full_name': 'AgitoAuto Brasil',
            'user_type': 'labelview_unidade',
            'phone': '',
            'balance': 0.0,
            'cashback_balance': 0.0,
            'is_active': True,
            'is_blocked': False,
            'must_change_password': False,
            'profile_complete': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'referral_code': f"UNIT_{unidade_id[:8].upper()}",
            'referred_by': master_lv_id,
            'nome_fantasia': 'AgitoAuto',
            'razao_social': 'AgitoAuto Brasil LTDA',
            'cnpj': '12.345.678/0001-00',
            'unidade_id': unidade_id,
        })
        print(f"✅ Unidade CRIADA (ID: {unidade_id})")
    
    # Rafael - DELETAR E RECRIAR com unidade_id correto
    print(f"\n🔧 Recriando Rafael com unidade_id correto: {unidade_id}")
    await db.users.delete_many({'email': 'rafael.bersch@htmail.com'})
    rafael_id = str(uuid.uuid4())
    await db.users.insert_one({
        'id': rafael_id,
        'email': 'rafael.bersch@htmail.com',
        'password_hash': bcrypt.hash('!Ma04202011@'),
        'full_name': 'Rafael Bersch',
        'user_type': 'labelview_consultor',
        'unidade_id': unidade_id,  # USAR O ID CORRETO DA UNIDADE
        'regional_id': None,
        'phone': '',
        'balance': 0.0,
        'cashback_balance': 0.0,
        'is_active': True,
        'is_blocked': False,
        'must_change_password': False,
        'profile_complete': True,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'referral_code': f"CONS_{rafael_id[:8].upper()}",
        'referred_by': unidade_id,
        'natureza': 'cpf',
        'nome': 'Rafael Bersch',
        'cpf': '999.888.777-66',
        'comissao_mensalidade_tipo': 'percentual',
        'comissao_mensalidade_valor': 10.0,
    })
    print(f"✅ Rafael RECRIADO com unidade_id: {unidade_id} (Rafael ID: {rafael_id})")
    
    # 4. LIMPAR OUTRAS COLEÇÕES
    print("\n🧹 Limpando outras coleções...")
    collections_to_clean = [
        'stores', 'orders', 'transactions', 'labelview_leads',
        'labelview_protecoes', 'labelview_solicitacoes', 'labelview_clients',
        'cotacoes', 'referrals', 'notifications'
    ]
    
    for col in collections_to_clean:
        try:
            result = await db[col].delete_many({})
            if result.deleted_count > 0:
                print(f"   {col}: {result.deleted_count} deletados")
        except:
            pass
    
    # 5. VERIFICAÇÃO FINAL
    final_count = await db.users.count_documents({})
    
    print("\n" + "=" * 80)
    print("✅ RESET COMPLETO!")
    print("=" * 80)
    print(f"\n📊 Total de usuários finais: {final_count}")
    print("\n👥 CONTAS DE PRODUÇÃO:")
    print(f"   1. Master Transmill:  transmillapp@gmail.com (ID: {master_id})")
    print(f"   2. Master Labelview:  labelview@transmill.com (ID: {master_lv_id})")
    print(f"   3. Unidade AgitoAuto: agitoautobrasil@gmail.com (ID: {unidade_id})")
    print(f"   4. Consultor Rafael:  rafael.bersch@htmail.com (ID: {rafael_id})")
    print(f"\n🔑 CHAVE: Rafael.unidade_id = {unidade_id} (ID da unidade em produção)")
    print("=" * 80)
    
    # Verificar Rafael
    rafael_check = await db.users.find_one({'email': 'rafael.bersch@htmail.com'})
    if rafael_check:
        print(f"\n✅ VERIFICAÇÃO RAFAEL:")
        print(f"   Email: {rafael_check.get('email')}")
        print(f"   Tipo: {rafael_check.get('user_type')}")
        print(f"   unidade_id: {rafael_check.get('unidade_id')}")
        print(f"   ✅ VINCULADO À UNIDADE CORRETA!")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    print("\n⚠️  ATENÇÃO: Este script vai DELETAR todos os dados de teste!")
    print("Pressione CTRL+C para cancelar ou ENTER para continuar...")
    input()
    asyncio.run(reset_production())
