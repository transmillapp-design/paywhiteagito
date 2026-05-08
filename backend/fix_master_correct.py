"""
Corrigir Master Labelview - usar labelview@transmill.com
Deletar qualquer coisa com @agitomil
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from datetime import datetime
import os
from uuid import uuid4

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def fix_master():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['transmill']
    
    print("=" * 70)
    print("CORRIGINDO MASTER LABELVIEW")
    print("=" * 70)
    
    print("\n1. Deletando contas @agitomil...")
    result = await db.users.delete_many({'email': {'$regex': '@agitomil', '$options': 'i'}})
    print(f"   Deletados: {result.deleted_count} usuarios @agitomil")
    
    # 2. VERIFICAR/CRIAR MASTER CORRETO
    master_email = 'labelview@transmill.com'
    master = await db.users.find_one({'email': master_email})
    
    if not master:
        master_id = str(uuid4())
        master_data = {
            'id': master_id,
            'email': master_email,
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
            'referral_code': f"MASTER_{master_id[:8].upper()}",
        }
        
        await db.users.insert_one(master_data)
        print(f"\n2. Master Labelview criado:")
        print(f"   Email: {master_email}")
        print(f"   Senha: demo123")
        print(f"   ID: {master_id}")
        master = master_data
    else:
        master_id = master.get('id')
        print(f"\n2. Master Labelview ja existe:")
        print(f"   Email: {master_email}")
        print(f"   ID: {master_id}")
    
    # 3. VERIFICAR UNIDADE E ATUALIZAR VINCULOS
    unidade_email = 'agitoautobrasil@gmail.com'
    unidade = await db.users.find_one({'email': unidade_email})
    
    if unidade:
        # Atualizar vinculo da unidade para o master correto
        await db.users.update_one(
            {'id': unidade.get('id')},
            {'$set': {
                'referred_by': master_id,
                'updated_at': datetime.utcnow()
            }}
        )
        print(f"\n3. Unidade AgitoAuto atualizada:")
        print(f"   Email: {unidade_email}")
        print(f"   Novo vinculo: Master {master_id}")
    else:
        # Criar unidade se nao existir
        unidade_id = str(uuid4())
        unidade_data = {
            'id': unidade_id,
            'email': unidade_email,
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
            'referred_by': master_id,
            
            'nome_fantasia': 'AgitoAuto',
            'razao_social': 'AgitoAuto Brasil LTDA',
            'cnpj': '12.345.678/0001-00',
            'responsavel_nome': 'Responsavel AgitoAuto',
            'responsavel_cpf': '111.222.333-44',
            'cor_primaria': '#2fa31c',
            'cor_secundaria': '#f1c40f',
            'pix_key': 'agitoautobrasil@gmail.com',
            'pix_key_type': 'email',
            'address': 'Rua Principal, 123',
            'city': 'Sao Paulo',
            'state': 'SP',
            'telefone': '',
            'unidade_id': unidade_id,
        }
        
        await db.users.insert_one(unidade_data)
        print(f"\n3. Unidade AgitoAuto criada:")
        print(f"   Email: {unidade_email}")
        print(f"   ID: {unidade_id}")
        unidade = unidade_data
    
    # 4. VERIFICAR RAFAEL E ATUALIZAR VINCULOS
    rafael_email = 'rafael.bersch@htmail.com'
    rafael = await db.users.find_one({'email': rafael_email})
    
    if rafael:
        # Atualizar vinculo do rafael para a unidade
        await db.users.update_one(
            {'id': rafael.get('id')},
            {'$set': {
                'unidade_id': unidade.get('id'),
                'referred_by': unidade.get('id'),
                'updated_at': datetime.utcnow()
            }}
        )
        print(f"\n4. Consultor Rafael atualizado:")
        print(f"   Email: {rafael_email}")
        print(f"   Vinculo: Unidade {unidade.get('id')}")
    else:
        # Criar rafael se nao existir
        rafael_id = str(uuid4())
        rafael_data = {
            'id': rafael_id,
            'email': rafael_email,
            'password_hash': bcrypt.hash('!Ma04202011@'),
            'full_name': 'Rafael Bersch',
            'user_type': 'labelview_consultor',
            'unidade_id': unidade.get('id'),
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
            'referred_by': unidade.get('id'),
            
            'natureza': 'cpf',
            'nome': 'Rafael Bersch',
            'cpf': '999.888.777-66',
            'rg': '1234567',
            'data_nascimento': '1990-01-01',
            'telefone': '',
            'endereco': 'Endereco do Rafael',
            'pix_key': 'rafael.bersch@htmail.com',
            'pix_key_type': 'email',
            
            'comissao_mensalidade_tipo': 'percentual',
            'comissao_mensalidade_valor': 10.0,
        }
        
        await db.users.insert_one(rafael_data)
        print(f"\n4. Consultor Rafael criado:")
        print(f"   Email: {rafael_email}")
        print(f"   ID: {rafael_id}")
    
    print("\n" + "=" * 70)
    print("ESTRUTURA CORRIGIDA COM SUCESSO!")
    print("=" * 70)
    print("\nHIERARQUIA CORRETA:")
    print(f"  Master Labelview")
    print(f"  └── labelview@transmill.com / demo123")
    print(f"      └── Unidade: AgitoAuto")
    print(f"          └── agitoautobrasil@gmail.com / !Ma04202011@")
    print(f"              └── Consultor: Rafael Bersch")
    print(f"                  └── rafael.bersch@htmail.com / !Ma04202011@")
    print("\nCREDENCIAIS CORRETAS:")
    print(f"  Master:    labelview@transmill.com / demo123")
    print(f"  Unidade:   agitoautobrasil@gmail.com / !Ma04202011@")
    print(f"  Consultor: rafael.bersch@htmail.com / !Ma04202011@")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(fix_master())
