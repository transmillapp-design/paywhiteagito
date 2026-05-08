"""
Recriar estrutura Labelview em produção após limpeza
- Master Labelview
- Unidade AgitoAuto
- Consultor Rafael (direto da unidade, sem regional)
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from datetime import datetime
import os
from uuid import uuid4

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def recreate_labelview():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['transmill']
    
    print("=" * 70)
    print("RECRIANDO ESTRUTURA LABELVIEW EM PRODUCAO")
    print("=" * 70)
    
    # 1. CRIAR MASTER LABELVIEW
    master_email = 'protecao@agitomil.com'
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
        print(f"\n1. Master Labelview criado:")
        print(f"   Email: {master_email}")
        print(f"   Senha: demo123")
        print(f"   ID: {master_id}")
    else:
        print(f"\n1. Master Labelview ja existe:")
        print(f"   Email: {master_email}")
        print(f"   ID: {master.get('id')}")
        master_data = master
    
    # 2. CRIAR UNIDADE AGITOAUTO
    unidade_email = 'agitoautobrasil@gmail.com'
    unidade = await db.users.find_one({'email': unidade_email})
    
    if not unidade:
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
            'referred_by': master_data.get('id'),
            
            # Campos da Unidade
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
            'city': 'São Paulo',
            'state': 'SP',
            'telefone': '',
            'unidade_id': unidade_id,  # Auto-referência
        }
        
        await db.users.insert_one(unidade_data)
        print(f"\n2. Unidade AgitoAuto criada:")
        print(f"   Email: {unidade_email}")
        print(f"   Senha: !Ma04202011@")
        print(f"   ID: {unidade_id}")
    else:
        print(f"\n2. Unidade AgitoAuto ja existe:")
        print(f"   Email: {unidade_email}")
        print(f"   ID: {unidade.get('id')}")
        unidade_data = unidade
    
    # 3. CRIAR CONSULTOR RAFAEL (DIRETO DA UNIDADE)
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
            'unidade_id': unidade_data.get('id'),
            'regional_id': None,  # Sem regional - direto da unidade
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
            'referred_by': unidade_data.get('id'),  # Indicado pela unidade
            
            # Campos Consultor (Pessoa Fisica - CPF)
            'natureza': 'cpf',
            'nome': 'Rafael Bersch',
            'cpf': '999.888.777-66',
            'rg': '1234567',
            'data_nascimento': '1990-01-01',
            'telefone': '',
            'endereco': 'Endereco do Rafael',
            'pix_key': 'rafael.bersch@htmail.com',
            'pix_key_type': 'email',
            
            # Comissao
            'comissao_mensalidade_tipo': 'percentual',
            'comissao_mensalidade_valor': 10.0,  # 10%
        }
        
        await db.users.insert_one(rafael_data)
        print(f"\n3. Consultor Rafael criado:")
        print(f"   Email: {rafael_email}")
        print(f"   Senha: !Ma04202011@")
        print(f"   ID: {rafael_id}")
        print(f"   Vinculo: Direto da Unidade (sem Regional)")
    else:
        print(f"\n3. Consultor Rafael ja existe:")
        print(f"   Email: {rafael_email}")
        print(f"   ID: {rafael.get('id')}")
    
    print("\n" + "=" * 70)
    print("ESTRUTURA LABELVIEW RECRIADA COM SUCESSO!")
    print("=" * 70)
    print("\nHIERARQUIA:")
    print(f"  Master Labelview")
    print(f"  └── protecao@agitomil.com / demo123")
    print(f"      └── Unidade: AgitoAuto")
    print(f"          └── agitoautobrasil@gmail.com / !Ma04202011@")
    print(f"              └── Consultor: Rafael Bersch")
    print(f"                  └── rafael.bersch@htmail.com / !Ma04202011@")
    print("\nCREDENCIAIS:")
    print(f"  Master:    protecao@agitomil.com / demo123")
    print(f"  Unidade:   agitoautobrasil@gmail.com / !Ma04202011@")
    print(f"  Consultor: rafael.bersch@htmail.com / !Ma04202011@")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(recreate_labelview())
