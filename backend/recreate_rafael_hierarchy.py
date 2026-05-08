"""
Recriar hierarquia Labelview em produção:
- Regional da AgitoAuto
- Consultor Rafael vinculado à regional
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from datetime import datetime
import os
from uuid import uuid4

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def recreate_hierarchy():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['transmill']
    
    print("🔄 Recriando hierarquia Labelview...")
    
    # 1. Buscar Unidade AgitoAuto
    unidade = await db.users.find_one({'email': 'agitoautobrasil@gmail.com'})
    if not unidade:
        print("❌ Erro: Unidade AgitoAuto não encontrada!")
        return
    
    print(f"✅ Unidade encontrada: {unidade.get('nome_fantasia')} (ID: {unidade.get('id')})")
    
    # 2. Criar ou buscar Regional
    regional_email = 'regional.agitoauto@gmail.com'
    regional = await db.users.find_one({'email': regional_email})
    
    if not regional:
        regional_id = str(uuid4())
        regional_data = {
            'id': regional_id,
            'email': regional_email,
            'password_hash': bcrypt.hash('!Ma04202011@'),
            'full_name': 'Regional AgitoAuto',
            'user_type': 'labelview_regional',
            'unidade_id': unidade.get('id'),
            'phone': '',
            'balance': 0.0,
            'cashback_balance': 0.0,
            'is_active': True,
            'is_blocked': False,
            'must_change_password': False,
            'profile_complete': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'referral_code': f"REG_{regional_id[:8].upper()}",
            'referred_by': unidade.get('id'),  # Regional foi indicado pela unidade
            
            # Campos Regional
            'razao_social': 'Regional AgitoAuto LTDA',
            'cnpj': '12.345.678/0001-99',
            'nome_fantasia': 'Regional AgitoAuto',
            'responsavel_nome': 'Responsável Regional',
            'responsavel_cpf': '111.222.333-44',
            
            # Comissão
            'comissao_mensalidade_tipo': 'percentual',
            'comissao_mensalidade_valor': 5.0,  # 5%
        }
        
        await db.users.insert_one(regional_data)
        print(f"✅ Regional criada: {regional_email} (ID: {regional_id})")
        regional = regional_data
    else:
        print(f"✅ Regional já existe: {regional_email} (ID: {regional.get('id')})")
    
    # 3. Criar ou buscar Rafael (Consultor)
    rafael_email = 'rafael.bersch@htmail.com'
    rafael = await db.users.find_one({'email': rafael_email})
    
    if not rafael:
        rafael_id = str(uuid4())
        rafael_data = {
            'id': rafael_id,
            'email': rafael_email,
            'password_hash': bcrypt.hash('!Ma04202011@'),
            'full_name': 'Rafael Bersch',
            'user_type': 'labelview_consultor',
            'unidade_id': unidade.get('id'),
            'regional_id': regional.get('id'),
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
            'referred_by': regional.get('id'),  # Rafael foi indicado pela regional
            
            # Campos Consultor (Pessoa Física - CPF)
            'natureza': 'cpf',
            'nome': 'Rafael Bersch',
            'cpf': '999.888.777-66',
            'rg': '1234567',
            'data_nascimento': '1990-01-01',
            'telefone': '',
            'endereco': 'Endereço do Rafael',
            'pix_key': 'rafael.bersch@htmail.com',
            'pix_key_type': 'email',
            
            # Comissão
            'comissao_mensalidade_tipo': 'percentual',
            'comissao_mensalidade_valor': 10.0,  # 10%
        }
        
        await db.users.insert_one(rafael_data)
        print(f"✅ Rafael (Consultor) criado: {rafael_email} (ID: {rafael_id})")
        rafael = rafael_data
    else:
        print(f"✅ Rafael já existe: {rafael_email} (ID: {rafael.get('id')})")
        
        # Atualizar vínculos se necessário
        if not rafael.get('regional_id') or not rafael.get('unidade_id'):
            await db.users.update_one(
                {'id': rafael.get('id')},
                {'$set': {
                    'unidade_id': unidade.get('id'),
                    'regional_id': regional.get('id'),
                    'updated_at': datetime.utcnow()
                }}
            )
            print(f"✅ Vínculos do Rafael atualizados!")
    
    print("\n" + "="*60)
    print("✅ HIERARQUIA RECRIADA COM SUCESSO!")
    print("="*60)
    print(f"\n📊 ESTRUTURA:")
    print(f"   Master: protecao@agitomil.com / demo123")
    print(f"   └── Unidade: {unidade.get('email')} / !Ma04202011@")
    print(f"       └── Regional: {regional.get('email')} / !Ma04202011@")
    print(f"           └── Consultor: {rafael.get('email')} / !Ma04202011@")
    print(f"\n📝 IDs:")
    print(f"   Unidade ID: {unidade.get('id')}")
    print(f"   Regional ID: {regional.get('id')}")
    print(f"   Consultor ID: {rafael.get('id')}")

if __name__ == "__main__":
    asyncio.run(recreate_hierarchy())
