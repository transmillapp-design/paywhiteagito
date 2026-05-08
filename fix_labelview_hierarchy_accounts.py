#!/usr/bin/env python3
"""
Script para corrigir/criar APENAS as 3 contas da hierarquia Labelview
que não estão funcionando em produção
"""
import os
import pymongo
import uuid
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Conectar ao MongoDB usando variáveis de ambiente
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DB_NAME', 'agitomil')
client = pymongo.MongoClient(mongo_url)
db = client[db_name]

PASSWORD = "demo123"
password_hash = pwd_context.hash(PASSWORD)

print("="*70)
print("🔧 CORREÇÃO DAS 3 CONTAS LABELVIEW EM PRODUÇÃO")
print("="*70)
print()

# As 3 contas que precisam ser corrigidas
accounts = [
    {
        "email": "agitoauto@agitomil.com",
        "full_name": "AgitoAuto Unidade",
        "user_type": "labelview_unidade",
        "phone": "(11) 94444-4444",
        "document": "12.345.678/0001-90",
    },
    {
        "email": "regional@agitomil.com",
        "full_name": "Regional Sul",
        "user_type": "labelview_regional",
        "phone": "(11) 93333-3333",
    },
    {
        "email": "rafael@agitomil.com",
        "full_name": "Rafael Consultor",
        "user_type": "labelview_consultor",
        "phone": "(11) 92222-2222",
    },
]

for account in accounts:
    email = account["email"]
    
    print(f"Processando: {email}")
    
    # Verificar se conta existe
    existing = db.users.find_one({"email": email})
    
    if existing:
        print(f"  ℹ️  Conta encontrada - Atualizando senha e campos...")
        
        # Atualizar senha e garantir todos os campos
        db.users.update_one(
            {"email": email},
            {"$set": {
                "password_hash": password_hash,
                "full_name": account["full_name"],
                "user_type": account["user_type"],
                "phone": account.get("phone", ""),
                "is_active": True,
                "is_blocked": False,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        
        # Verificar se atualizou
        updated = db.users.find_one({"email": email})
        if updated and pwd_context.verify(PASSWORD, updated['password_hash']):
            print(f"  ✅ Senha atualizada e verificada!")
        else:
            print(f"  ⚠️  Problema ao atualizar senha")
            
    else:
        print(f"  ℹ️  Conta NÃO encontrada - Criando nova...")
        
        # Criar nova conta
        user_data = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": password_hash,
            "full_name": account["full_name"],
            "user_type": account["user_type"],
            "phone": account.get("phone", ""),
            "document": account.get("document", ""),
            "balance": 0.0,
            "cashback_balance": 0.0,
            "usdt_balance": 0.0,
            "social_points": 0,
            "is_active": True,
            "is_blocked": False,
            "is_verified": True,
            "referral_code": email.split("@")[0].upper(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        db.users.insert_one(user_data)
        print(f"  ✅ Conta criada com sucesso!")
    
    print()

print("="*70)
print("✅ PROCESSO CONCLUÍDO!")
print()
print("📋 TESTE AS CONTAS AGORA:")
print()
print("curl -X POST https://app.transmill.com.br/api/auth/login \\")
print("  -H 'Content-Type: application/json' \\")
print("  -d '{\"email\": \"agitoauto@agitomil.com\", \"password\": \"demo123\"}'")
print()
print("curl -X POST https://app.transmill.com.br/api/auth/login \\")
print("  -H 'Content-Type: application/json' \\")
print("  -d '{\"email\": \"regional@agitomil.com\", \"password\": \"demo123\"}'")
print()
print("curl -X POST https://app.transmill.com.br/api/auth/login \\")
print("  -H 'Content-Type: application/json' \\")
print("  -d '{\"email\": \"rafael@agitomil.com\", \"password\": \"demo123\"}'")
print()
print("="*70)

client.close()
