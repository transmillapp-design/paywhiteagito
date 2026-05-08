#!/usr/bin/env python3
"""
Setup da conta Labelview Empresa no AgitoMil
Para receber valores da parte que lhe cabe
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from passlib.hash import bcrypt
from datetime import datetime
import uuid

async def setup_labelview_empresa():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'transmill')]
    
    print("🏢 Configurando conta Labelview Empresa no AgitoMil...")
    
    # Email da empresa Labelview
    email_empresa = "empresa@labelview.com.br"
    
    # Verificar se já existe
    existing = await db.users.find_one({"email": email_empresa})
    
    if existing:
        print(f"✅ Conta Labelview Empresa já existe: {email_empresa}")
        print(f"   Saldo atual: R$ {existing.get('wallet_balance', 0):.2f}")
        
        # Garantir que tem carteira
        if 'wallet_balance' not in existing:
            await db.users.update_one(
                {"email": email_empresa},
                {"$set": {"wallet_balance": 0.00}}
            )
            print("   ✅ Carteira AgitoMil criada")
        
        return existing.get('id')
    
    # Criar conta da empresa
    empresa_id = str(uuid.uuid4())
    
    empresa_data = {
        "id": empresa_id,
        "email": email_empresa,
        "password": bcrypt.hash("labelview2024"),
        "full_name": "Labelview Proteção Veicular Ltda",
        "user_type": "labelview_empresa",
        "is_active": True,
        "is_blocked": False,
        "wallet_balance": 0.00,  # Carteira para receber comissões
        "cnpj": "12.345.678/0001-90",
        "razao_social": "Labelview Proteção Veicular Ltda",
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(empresa_data)
    
    print(f"✅ Conta Labelview Empresa criada com sucesso!")
    print(f"   Email: {email_empresa}")
    print(f"   Senha: labelview2024")
    print(f"   ID: {empresa_id}")
    print(f"   Carteira: R$ 0,00")
    print(f"   Tipo: labelview_empresa")
    
    client.close()
    return empresa_id

if __name__ == "__main__":
    asyncio.run(setup_labelview_empresa())
