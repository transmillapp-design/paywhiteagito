#!/usr/bin/env python3
"""
Script para garantir que TODAS as contas demo existam
Pode ser executado múltiplas vezes com segurança
"""
import os
import sys
from pymongo import MongoClient
from passlib.hash import bcrypt
import uuid
from datetime import datetime

# Conectar ao MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'transmill')

print(f"Conectando ao MongoDB: {MONGO_URL}")
print(f"Database: {DB_NAME}")
print()

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Senha padrão
SENHA_DEMO = "demo123"
senha_hash = bcrypt.hash(SENHA_DEMO)

# Definição de TODAS as contas demo
contas_demo = [
    # TRANSMILL
    {
        "email": "cliente@demo.com",
        "full_name": "Cliente Demo",
        "phone": "(11) 99999-0001",
        "cpf": "111.111.111-11",
        "user_type": "cliente",
        "tipo_desc": "Cliente Transmill"
    },
    {
        "email": "lojista@demo.com",
        "full_name": "Lojista Demo",
        "phone": "(11) 99999-0002",
        "cpf": "222.222.222-22",
        "user_type": "lojista",
        "tipo_desc": "Lojista Transmill"
    },
    {
        "email": "prestador@demo.com",
        "full_name": "Prestador Demo",
        "phone": "(11) 99999-0003",
        "cpf": "333.333.333-33",
        "user_type": "service_provider",
        "tipo_desc": "Prestador Transmill"
    },
    
    # LABELVIEW
    {
        "email": "protecao@agitomil.com",
        "full_name": "Master Labelview",
        "phone": "(11) 99999-1001",
        "cpf": "444.444.444-44",
        "user_type": "labelview_master",
        "is_labelview_master": True,
        "tipo_desc": "Master Labelview"
    },
    {
        "email": "agitoauto@agitomil.com",
        "full_name": "Unidade AgitoAuto",
        "phone": "(11) 99999-1002",
        "cpf": "555.555.555-55",
        "user_type": "labelview_unidade",
        "tipo_desc": "Unidade Labelview"
    },
    {
        "email": "regional@agitomil.com",
        "full_name": "Regional Demo",
        "phone": "(11) 99999-1003",
        "cpf": "666.666.666-66",
        "user_type": "labelview_regional",
        "tipo_desc": "Regional Labelview"
    },
    {
        "email": "rafael@agitomil.com",
        "full_name": "Rafael",
        "phone": "(11) 99999-1004",
        "cpf": "777.777.777-77",
        "user_type": "labelview_consultor",
        "is_labelview_consultor": True,
        "tipo_desc": "Consultor Labelview"
    }
]

print("=" * 70)
print("GARANTINDO TODAS AS CONTAS DEMO")
print("=" * 70)
print()

criadas = 0
atualizadas = 0
ja_existiam = 0

for conta in contas_demo:
    email = conta.pop("email")
    tipo_desc = conta.pop("tipo_desc")
    
    # Verificar se já existe
    existing = db.users.find_one({"email": email})
    
    if existing:
        # Atualizar apenas a senha
        result = db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": senha_hash}}
        )
        
        if result.modified_count > 0:
            print(f"🔄 {email} ({tipo_desc}) - SENHA ATUALIZADA")
            atualizadas += 1
        else:
            print(f"✅ {email} ({tipo_desc}) - JÁ EXISTE COM SENHA CORRETA")
            ja_existiam += 1
    else:
        # Criar nova conta
        user_data = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": senha_hash,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "balance": 0,
            "referral_code": f"{email.split('@')[0].upper()[:4]}{uuid.uuid4().hex[:6].upper()}",
            "referred_by": None,
            **conta
        }
        
        db.users.insert_one(user_data)
        print(f"✨ {email} ({tipo_desc}) - CRIADA")
        criadas += 1

print()
print("=" * 70)
print(f"RESULTADO:")
print(f"  ✨ Criadas: {criadas}")
print(f"  🔄 Atualizadas: {atualizadas}")
print(f"  ✅ Já existiam: {ja_existiam}")
print(f"  📊 TOTAL: {criadas + atualizadas + ja_existiam}")
print("=" * 70)
print()
print("🔑 CONTAS DEMO DISPONÍVEIS (senha: demo123):")
print()
print("TRANSMILL:")
print("  • cliente@demo.com")
print("  • lojista@demo.com")
print("  • prestador@demo.com")
print()
print("LABELVIEW:")
print("  • protecao@agitomil.com (Master)")
print("  • agitoauto@agitomil.com (Unidade)")
print("  • regional@agitomil.com (Regional)")
print("  • rafael@agitomil.com (Consultor)")
print()
print("✅ TODAS AS CONTAS ESTÃO PRONTAS!")
print()
