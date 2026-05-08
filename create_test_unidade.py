#!/usr/bin/env python3
"""
Script to create a test Unidade for testing
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from datetime import datetime, timezone
import uuid

async def create_test_unidade():
    """Create a test unidade"""
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'transmill')
    db = client[db_name]
    
    # Check if account already exists
    existing_user = await db.users.find_one({"email": "unidade.teste@teste.com"})
    
    if existing_user:
        print("✅ Test unidade already exists")
    else:
        # Create the test unidade
        account_data = {
            "id": str(uuid.uuid4()),
            "email": "unidade.teste@teste.com",
            "password_hash": bcrypt.hash("SenhaProvisoria2024!"),
            "full_name": "Unidade Teste LTDA",
            "company_name": "Unidade Teste LTDA",
            "nome_fantasia": "Unidade Teste",
            "razao_social": "Unidade Teste LTDA",
            "cnpj": "11.222.333/0001-88",
            "phone": "(11) 99999-9999",
            "whatsapp": "(11) 99999-9999",
            "user_type": "labelview_unidade",
            "tipo_pessoa": "juridica",
            "document_type": "cnpj",
            "responsavel_nome": "João Responsável",
            "responsavel_cpf": "123.456.789-00",
            "responsavel_email": "joao@teste.com",
            "responsavel_whatsapp": "(11) 99999-9999",
            "pix_key": "11.222.333/0001-88",
            "pix_key_type": "cnpj",
            "taxa_adesao": 100.00,
            "vencimento_inicio": 1,
            "vencimento_fim": 15,
            "cep": "01310-100",
            "address": "Rua Teste, 123",
            "number": "123",
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
            "referral_code": "UNITESTE",
            "referred_by": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(account_data)
        print("✅ Created test unidade: unidade.teste@teste.com")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_unidade())