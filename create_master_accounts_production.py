#!/usr/bin/env python3
"""
Script para criar as 2 contas master de produção:
1. Master Transmill (administra sistema inteiro)
2. Master Labelview (administra proteção veicular)
"""

import sys
sys.path.append('/app/backend')

import asyncio
from pymongo import MongoClient
import uuid
from datetime import datetime
from passlib.hash import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

async def create_master_accounts():
    """Criar contas master de produção"""
    
    # Conectar ao MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
    client = MongoClient(mongo_url)
    db = client['transmill']  # Banco de dados principal
    users_collection = db['users']
    
    print("🗑️  Limpando banco de dados...")
    # Deletar TODAS as contas existentes (começar do zero)
    deleted = users_collection.delete_many({})
    print(f"   Deletadas {deleted.deleted_count} contas antigas")
    
    print("\n📝 Criando contas master de produção...\n")
    
    # ============================================
    # 1. MASTER TRANSMILL - Administra sistema inteiro
    # ============================================
    master_transmill = {
        "id": str(uuid.uuid4()),
        "email": "transmillapp@gmail.com",
        "password_hash": bcrypt.hash("demo123"),
        "full_name": "Master Transmill",
        "user_type": "master",  # Tipo master para sistema inteiro
        "is_active": True,
        "is_blocked": False,
        "is_master_account": True,  # ✅ Permissão de master do sistema
        "is_labelview_master": False,  # Não é master do Labelview
        
        # Dados da empresa
        "company_name": "Transmill Tecnologia Ltda",
        "cnpj": "13.462.972/0001-40",
        
        # Saldos
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
        "platform_balance": 0.0,
        "social_points": 0,
        
        # Dados adicionais
        "phone": "+55 11 90000-0001",
        "cpf": "000.000.000-01",
        "referral_code": "TRANSMILL",
        "referred_by": None,
        
        # Timestamps
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result1 = users_collection.insert_one(master_transmill)
    
    if result1.inserted_id:
        print("✅ MASTER TRANSMILL criado com sucesso!")
        print(f"   📧 Email: transmillapp@gmail.com")
        print(f"   🔑 Senha: demo123")
        print(f"   🏢 Empresa: Transmill Tecnologia Ltda")
        print(f"   📄 CNPJ: 13.462.972/0001-40")
        print(f"   🆔 ID: {master_transmill['id']}")
        print(f"   👑 Permissões: Master do Sistema (is_master_account=True)")
    else:
        print("❌ Erro ao criar Master Transmill")
    
    print("\n" + "="*60 + "\n")
    
    # ============================================
    # 2. MASTER LABELVIEW - Administra proteção veicular
    # ============================================
    master_labelview = {
        "id": str(uuid.uuid4()),
        "email": "labelview@transmill.com",
        "password_hash": bcrypt.hash("demo123"),
        "full_name": "Master Labelview",
        "user_type": "labelview_master",  # Tipo específico Labelview
        "is_active": True,
        "is_blocked": False,
        "is_master_account": False,  # Não é master do sistema geral
        "is_labelview_master": True,  # ✅ Permissão de master do Labelview
        
        # Dados da empresa
        "company_name": "LABELVIEW ASSOCIAÇÃO MUTUALISTA DE PROTEÇÃO VEICULAR",
        "cnpj": "59.035.703/0001-06",
        
        # Saldos
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
        "social_points": 0,
        
        # Dados adicionais
        "phone": "+55 11 90000-0002",
        "cpf": "000.000.000-02",
        "referral_code": "LABELVIEW",
        "referred_by": None,
        
        # Timestamps
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result2 = users_collection.insert_one(master_labelview)
    
    if result2.inserted_id:
        print("✅ MASTER LABELVIEW criado com sucesso!")
        print(f"   📧 Email: labelview@transmill.com")
        print(f"   🔑 Senha: demo123")
        print(f"   🏢 Empresa: LABELVIEW ASSOCIAÇÃO MUTUALISTA DE PROTEÇÃO VEICULAR")
        print(f"   📄 CNPJ: 59.035.703/0001-06")
        print(f"   🆔 ID: {master_labelview['id']}")
        print(f"   👑 Permissões: Master do Labelview (is_labelview_master=True)")
    else:
        print("❌ Erro ao criar Master Labelview")
    
    print("\n" + "="*60 + "\n")
    print("✅ CONTAS MASTER DE PRODUÇÃO CRIADAS COM SUCESSO!")
    print("\n📊 RESUMO:")
    print("   - Total de contas no banco: 2")
    print("   - Master Transmill: transmillapp@gmail.com")
    print("   - Master Labelview: labelview@transmill.com")
    print("\n🔐 Ambas as contas usam senha: demo123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_master_accounts())
