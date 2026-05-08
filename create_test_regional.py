#!/usr/bin/env python3
"""
Script to create a test Regional for testing
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from datetime import datetime, timezone
import uuid

async def create_test_regional():
    """Create a test regional"""
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'transmill')
    db = client[db_name]
    
    # Get the test unidade ID
    unidade = await db.users.find_one({"email": "unidade.teste@teste.com"})
    if not unidade:
        print("❌ Test unidade not found. Create it first.")
        client.close()
        return
    
    unidade_id = unidade["id"]
    
    # Check if regional already exists
    existing_regional = await db.users.find_one({"email": "regional.teste@teste.com"})
    
    if existing_regional:
        print("✅ Test regional already exists")
    else:
        # Create the test regional
        account_data = {
            "id": str(uuid.uuid4()),
            "email": "regional.teste@teste.com",
            "password_hash": bcrypt.hash("SenhaProvisoria2024!"),
            "full_name": "Regional Teste LTDA",
            "company_name": "Regional Teste LTDA",
            "nome_fantasia": "Regional Teste",
            "razao_social": "Regional Teste LTDA",
            "cnpj": "22.333.444/0001-99",
            "phone": "(11) 88888-8888",
            "whatsapp": "(11) 88888-8888",
            "user_type": "labelview_regional",
            "tipo_pessoa": "juridica",
            "document_type": "cnpj",
            "unidade_id": unidade_id,  # Link to the unidade
            "responsavel_nome": "Maria Regional",
            "responsavel_cpf": "987.654.321-00",
            "responsavel_email": "maria@teste.com",
            "responsavel_whatsapp": "(11) 88888-8888",
            "pix_key": "22.333.444/0001-99",
            "pix_key_type": "cnpj",
            "taxa_adesao": 80.00,
            "vencimento_inicio": 1,
            "vencimento_fim": 15,
            "cep": "01310-100",
            "address": "Av Regional, 456",
            "number": "456",
            "neighborhood": "Centro",
            "city": "São Paulo",
            "state": "SP",
            "cor_primaria": "#1a59ad",
            "cor_secundaria": "#2fa31c",
            "balance": 0.00,
            "cashback_balance": 0.00,
            "usdt_balance": 0.00,
            "social_points": 0,
            "is_active": True,
            "is_blocked": False,
            "must_change_password": True,
            "profile_complete": True,
            "referral_code": "REGTESTE",
            "referred_by": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(account_data)
        print("✅ Created test regional: regional.teste@teste.com")
        print(f"   Linked to unidade: {unidade_id}")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_regional())