#!/usr/bin/env python3
"""
Criar hierarquia de contas demo Labelview:
- Unidade: AgitoAuto
- Regional: Regional 1 (rede AgitoAuto)
- Consultor: Rafael (rede Regional 1)
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
import os
from datetime import datetime
from uuid import uuid4

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')

async def criar_hierarquia_demo():
    """Criar contas demo da hierarquia Labelview"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[os.environ.get('DB_NAME', 'transmill')]
    
    try:
        print("="*60)
        print("CRIANDO HIERARQUIA DEMO LABELVIEW")
        print("="*60)
        
        # Buscar Master Labelview
        master = await db.users.find_one({"email": "protecao@agitomil.com"})
        if not master:
            print("❌ Master Labelview não encontrado!")
            return
        
        master_id = master.get('id')
        print(f"\n✓ Master encontrado: {master.get('full_name')}")
        
        # ====================================================================
        # 1. CRIAR UNIDADE: AgitoAuto
        # ====================================================================
        print("\n1️⃣  Criando Unidade: AgitoAuto...")
        
        unidade_email = "agitoauto@agitomil.com"
        existing_unidade = await db.users.find_one({"email": unidade_email})
        
        if existing_unidade:
            unidade_id = existing_unidade.get('id')
            print(f"   ⚠️  Unidade já existe (ID: {unidade_id})")
        else:
            unidade_id = str(uuid4())
            senha_hash = bcrypt.hash("agitoauto123")
            
            unidade_doc = {
                "id": unidade_id,
                "email": unidade_email,
                "password_hash": senha_hash,
                "full_name": "AgitoAuto",
                "user_type": "labelview_unidade",
                "is_labelview_unidade": True,
                "phone": "(11) 98765-4321",
                "document": "12.345.678/0001-90",
                
                # Hierarquia
                "labelview_master_id": master_id,
                "superior_id": master_id,
                
                # Saldos
                "balance": 0.0,
                "cashback_balance": 0.0,
                
                # Status
                "is_active": True,
                "is_blocked": False,
                "email_verified": True,
                
                # Datas
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.users.insert_one(unidade_doc)
            print(f"   ✅ Unidade criada!")
            print(f"      Email: {unidade_email}")
            print(f"      Senha: agitoauto123")
            print(f"      ID: {unidade_id}")
        
        # ====================================================================
        # 2. CRIAR REGIONAL: Regional 1 (rede AgitoAuto)
        # ====================================================================
        print("\n2️⃣  Criando Regional: Regional 1...")
        
        regional_email = "regional@agitomil.com"
        existing_regional = await db.users.find_one({"email": regional_email})
        
        if existing_regional:
            regional_id = existing_regional.get('id')
            print(f"   ⚠️  Regional já existe (ID: {regional_id})")
        else:
            regional_id = str(uuid4())
            senha_hash = bcrypt.hash("regional123")
            
            regional_doc = {
                "id": regional_id,
                "email": regional_email,
                "password_hash": senha_hash,
                "full_name": "Regional 1",
                "user_type": "labelview_regional",
                "is_labelview_regional": True,
                "phone": "(11) 97654-3210",
                "document": "123.456.789-01",
                
                # Hierarquia
                "labelview_master_id": master_id,
                "labelview_unidade_id": unidade_id,
                "superior_id": unidade_id,
                
                # Região
                "regiao": "São Paulo - Capital",
                
                # Saldos
                "balance": 0.0,
                "cashback_balance": 0.0,
                
                # Status
                "is_active": True,
                "is_blocked": False,
                "email_verified": True,
                
                # Datas
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.users.insert_one(regional_doc)
            print(f"   ✅ Regional criada!")
            print(f"      Email: {regional_email}")
            print(f"      Senha: regional123")
            print(f"      ID: {regional_id}")
        
        # ====================================================================
        # 3. CRIAR CONSULTOR: Rafael (rede Regional 1)
        # ====================================================================
        print("\n3️⃣  Criando Consultor: Rafael...")
        
        consultor_email = "rafael@agitomil.com"
        existing_consultor = await db.users.find_one({"email": consultor_email})
        
        if existing_consultor:
            consultor_id = existing_consultor.get('id')
            print(f"   ⚠️  Consultor já existe (ID: {consultor_id})")
        else:
            consultor_id = str(uuid4())
            senha_hash = bcrypt.hash("rafael123")
            
            consultor_doc = {
                "id": consultor_id,
                "email": consultor_email,
                "password_hash": senha_hash,
                "full_name": "Rafael",
                "user_type": "labelview_consultor",
                "is_labelview_consultor": True,
                "phone": "(11) 96543-2109",
                "document": "987.654.321-09",
                
                # Hierarquia
                "labelview_master_id": master_id,
                "labelview_unidade_id": unidade_id,
                "labelview_regional_id": regional_id,
                "superior_id": regional_id,
                
                # Comissão
                "commission_percentage": 10.0,  # 10% de comissão
                
                # Saldos
                "balance": 0.0,
                "cashback_balance": 0.0,
                
                # Status
                "is_active": True,
                "is_blocked": False,
                "email_verified": True,
                
                # Datas
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.users.insert_one(consultor_doc)
            print(f"   ✅ Consultor criado!")
            print(f"      Email: {consultor_email}")
            print(f"      Senha: rafael123")
            print(f"      ID: {consultor_id}")
        
        # ====================================================================
        # RESUMO FINAL
        # ====================================================================
        print("\n" + "="*60)
        print("✅ HIERARQUIA DEMO CRIADA COM SUCESSO!")
        print("="*60)
        print("\n📊 ESTRUTURA:")
        print(f"   Master Labelview (protecao@agitomil.com)")
        print(f"   └── Unidade: AgitoAuto (agitoauto@agitomil.com)")
        print(f"       └── Regional 1 (regional@agitomil.com)")
        print(f"           └── Consultor Rafael (rafael@agitomil.com)")
        
        print("\n🔑 CREDENCIAIS DE ACESSO:")
        print("\n1. Master Labelview:")
        print("   Email: protecao@agitomil.com")
        print("   Senha: demo123")
        
        print("\n2. Unidade AgitoAuto:")
        print("   Email: agitoauto@agitomil.com")
        print("   Senha: agitoauto123")
        
        print("\n3. Regional 1:")
        print("   Email: regional@agitomil.com")
        print("   Senha: regional123")
        
        print("\n4. Consultor Rafael:")
        print("   Email: rafael@agitomil.com")
        print("   Senha: rafael123")
        
        print("\n🌐 URL DE ACESSO:")
        print("   https://agitomil.com.br/labelview/login")
        print("   ou")
        print("   https://slim-super-app.preview.emergentagent.com/labelview/login")
        
        print("\n💡 FUNCIONALIDADES POR TIPO:")
        print("   Master: Todas as funcionalidades + Tabela de Valores")
        print("   Unidade: Visualiza tabelas, gerencia Regionais/Consultores")
        print("   Regional: Gerencia Consultores da região")
        print("   Consultor: Cria cotações para clientes (Nova Cotação)")
        
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(criar_hierarquia_demo())
