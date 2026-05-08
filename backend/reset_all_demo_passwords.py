#!/usr/bin/env python3
"""
Script para resetar TODAS as senhas demo para 'demo123'
"""
import os
import sys
from pymongo import MongoClient
from passlib.hash import bcrypt

# Conectar ao MongoDB
client = MongoClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017/'))
db = client[os.environ.get('DB_NAME', 'transmill')]

# Nova senha padrão
SENHA_DEMO = "demo123"
senha_hash = bcrypt.hash(SENHA_DEMO)

# Lista de TODAS as contas demo
contas_demo = [
    # Transmill
    {"email": "cliente@demo.com", "tipo": "Cliente Transmill"},
    {"email": "lojista@demo.com", "tipo": "Lojista Transmill"},
    {"email": "prestador@demo.com", "tipo": "Prestador Transmill"},
    
    # Labelview
    {"email": "protecao@agitomil.com", "tipo": "Master Labelview"},
    {"email": "agitoauto@agitomil.com", "tipo": "Unidade Labelview"},
    {"email": "regional@agitomil.com", "tipo": "Regional Labelview"},
    {"email": "rafael@agitomil.com", "tipo": "Consultor Labelview"}
]

print("=" * 70)
print("RESETANDO TODAS AS SENHAS DEMO PARA: demo123")
print("=" * 70)
print()

sucessos = 0
falhas = 0

for conta in contas_demo:
    email = conta["email"]
    tipo = conta["tipo"]
    
    # Verificar se existe
    user = db.users.find_one({"email": email})
    
    if not user:
        print(f"❌ {email} ({tipo}) - NÃO ENCONTRADO")
        falhas += 1
        continue
    
    # Atualizar senha
    result = db.users.update_one(
        {"email": email},
        {"$set": {"password_hash": senha_hash}}
    )
    
    if result.modified_count > 0:
        print(f"✅ {email} ({tipo}) - SENHA RESETADA")
        sucessos += 1
    else:
        print(f"⚠️  {email} ({tipo}) - JÁ TINHA A SENHA CORRETA")
        sucessos += 1

print()
print("=" * 70)
print(f"RESULTADO: {sucessos} sucessos, {falhas} falhas")
print("=" * 70)
print()

if falhas > 0:
    print("⚠️  ATENÇÃO: Algumas contas não foram encontradas!")
    print("Execute os scripts de criação de contas primeiro.")
else:
    print("✅ TODAS AS SENHAS FORAM RESETADAS COM SUCESSO!")
    print()
    print("🔑 CONTAS DEMO DISPONÍVEIS:")
    print()
    print("TRANSMILL:")
    print("  • cliente@demo.com / demo123 (Cliente)")
    print("  • lojista@demo.com / demo123 (Lojista)")
    print("  • prestador@demo.com / demo123 (Prestador)")
    print()
    print("LABELVIEW:")
    print("  • protecao@agitomil.com / demo123 (Master)")
    print("  • agitoauto@agitomil.com / demo123 (Unidade)")
    print("  • regional@agitomil.com / demo123 (Regional)")
    print("  • rafael@agitomil.com / demo123 (Consultor)")
    print()

sys.exit(0 if falhas == 0 else 1)
