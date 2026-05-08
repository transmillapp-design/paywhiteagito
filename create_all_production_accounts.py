#!/usr/bin/env python3
"""
Script para criar/atualizar TODAS as contas demo para produção
TODAS as contas com senha: demo123
"""
import os
import pymongo
import uuid
from passlib.context import CryptContext
from datetime import datetime

# Configuração de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Conectar ao MongoDB usando variáveis de ambiente
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DB_NAME', 'agitomil')
client = pymongo.MongoClient(mongo_url)
db = client[db_name]

# Senha única para todas as contas
PASSWORD = "demo123"
password_hash = pwd_context.hash(PASSWORD)

print("="*60)
print("CRIANDO/ATUALIZANDO TODAS AS CONTAS DEMO PARA PRODUÇÃO")
print(f"Senha para todas as contas: {PASSWORD}")
print("="*60)
print()

# Lista de contas a criar/atualizar
accounts = [
    # 1. Sistema Básico
    {
        "email": "cliente@demo.com",
        "full_name": "Cliente Demo",
        "user_type": "cliente",
        "phone": "(11) 99999-9999",
        "balance": 100.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
    },
    {
        "email": "lojista@demo.com",
        "full_name": "Lojista Demo",
        "user_type": "lojista",
        "phone": "(11) 98888-8888",
        "balance": 500.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
    },
    {
        "email": "prestador@demo.com",
        "full_name": "Prestador Demo",
        "user_type": "service_provider",
        "phone": "(11) 97777-7777",
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
    },
    {
        "email": "master@agitocoin.com",
        "full_name": "Master Sistema",
        "user_type": "master",
        "phone": "(11) 96666-6666",
        "is_master_account": True,
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
    },
    # 2. Hierarquia Labelview
    {
        "email": "protecao@agitomil.com",
        "full_name": "Master Labelview",
        "user_type": "labelview_master",
        "phone": "(11) 95555-5555",
        "is_labelview_master": True,
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
    },
    {
        "email": "agitoauto@agitomil.com",
        "full_name": "AgitoAuto Unidade",
        "user_type": "labelview_unidade",
        "phone": "(11) 94444-4444",
        "document": "12.345.678/0001-90",
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
    },
    {
        "email": "regional@agitomil.com",
        "full_name": "Regional Sul",
        "user_type": "labelview_regional",
        "phone": "(11) 93333-3333",
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
    },
    {
        "email": "rafael@agitomil.com",
        "full_name": "Rafael Consultor",
        "user_type": "labelview_consultor",
        "phone": "(11) 92222-2222",
        "balance": 0.0,
        "cashback_balance": 0.0,
        "usdt_balance": 0.0,
    },
]

created = 0
updated = 0

for account in accounts:
    email = account["email"]
    
    # Verificar se conta já existe
    existing = db.users.find_one({"email": email})
    
    if existing:
        # Atualizar senha
        db.users.update_one(
            {"email": email},
            {"$set": {
                "password_hash": password_hash,
                "is_active": True,
                "is_blocked": False,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        print(f"✅ Atualizado: {email} ({account['user_type']})")
        updated += 1
    else:
        # Criar nova conta
        user_data = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": password_hash,
            "full_name": account["full_name"],
            "user_type": account["user_type"],
            "phone": account.get("phone", ""),
            "document": account.get("document", ""),
            "balance": account.get("balance", 0.0),
            "cashback_balance": account.get("cashback_balance", 0.0),
            "usdt_balance": account.get("usdt_balance", 0.0),
            "social_points": 0,
            "is_active": True,
            "is_blocked": False,
            "is_verified": True,
            "referral_code": email.split("@")[0].upper(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Adicionar campos especiais
        if account.get("is_master_account"):
            user_data["is_master_account"] = True
        if account.get("is_labelview_master"):
            user_data["is_labelview_master"] = True
        
        db.users.insert_one(user_data)
        print(f"✅ Criado: {email} ({account['user_type']})")
        created += 1

print()
print("="*60)
print(f"✅ PROCESSO CONCLUÍDO!")
print(f"   Contas criadas: {created}")
print(f"   Contas atualizadas: {updated}")
print(f"   Total: {created + updated}")
print("="*60)
print()
print("📋 CREDENCIAIS PARA PRODUÇÃO (https://app.transmill.com.br):")
print()
print("SISTEMA BÁSICO:")
print("  • cliente@demo.com / demo123 (Cliente)")
print("  • lojista@demo.com / demo123 (Lojista)")
print("  • prestador@demo.com / demo123 (Prestador)")
print("  • master@agitocoin.com / demo123 (Master Sistema)")
print()
print("HIERARQUIA LABELVIEW:")
print("  • protecao@agitomil.com / demo123 (Master Labelview)")
print("  • agitoauto@agitomil.com / demo123 (Unidade)")
print("  • regional@agitomil.com / demo123 (Regional)")
print("  • rafael@agitomil.com / demo123 (Consultor)")
print()
print("="*60)

client.close()
