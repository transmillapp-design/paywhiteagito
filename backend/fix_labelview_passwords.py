#!/usr/bin/env python3
"""
Script para atualizar senhas das contas demo Labelview para 'demo123'
"""
import os
import sys
from pymongo import MongoClient
from passlib.hash import bcrypt

# Conectar ao MongoDB
client = MongoClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017/'))
db = client[os.environ.get('DB_NAME', 'transmill')]

# Nova senha padrão
nova_senha = "demo123"
senha_hash = bcrypt.hash(nova_senha)

# Contas a atualizar
contas = [
    "protecao@agitomil.com",
    "agitoauto@agitomil.com",
    "regional@agitomil.com",
    "rafael@agitomil.com"
]

print("=" * 60)
print("ATUALIZANDO SENHAS DAS CONTAS LABELVIEW")
print("=" * 60)
print(f"Nova senha: {nova_senha}")
print()

for email in contas:
    result = db.users.update_one(
        {"email": email},
        {"$set": {"password_hash": senha_hash}}
    )
    
    if result.modified_count > 0:
        print(f"✅ {email} - senha atualizada")
    else:
        print(f"⚠️  {email} - não encontrado ou já tinha essa senha")

print()
print("=" * 60)
print("✅ SENHAS ATUALIZADAS COM SUCESSO!")
print("=" * 60)
print()
print("🔑 Todas as contas agora usam a senha: demo123")
print()
print("Contas Demo Transmill:")
print("  - cliente@demo.com / demo123")
print("  - lojista@demo.com / demo123")
print()
print("Contas Demo Labelview:")
print("  - protecao@agitomil.com / demo123 (Master)")
print("  - agitoauto@agitomil.com / demo123 (Unidade)")
print("  - regional@agitomil.com / demo123 (Regional)")
print("  - rafael@agitomil.com / demo123 (Consultor)")
print()
