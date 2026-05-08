#!/usr/bin/env python3
"""
Script para recriar o usuário Master Labelview
"""
import pymongo
import uuid
from passlib.context import CryptContext
from datetime import datetime

# Configuração de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Conectar ao MongoDB
import os
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'transmill')
client = pymongo.MongoClient(MONGO_URL)
db = client[DB_NAME]
print(f"🔗 Conectando ao banco: {DB_NAME}")

# Dados do Master Labelview
email = "protecao@agitomil.com"
password = "demo123"

# Verificar se usuário já existe
existing_user = db.users.find_one({'email': email})
if existing_user:
    print(f"⚠️ Usuário {email} já existe. Removendo...")
    db.users.delete_one({'email': email})

# Criar hash da senha
hashed_password = pwd_context.hash(password)

# Criar novo usuário Master Labelview
user_data = {
    'id': str(uuid.uuid4()),
    'email': email,
    'password_hash': hashed_password,
    'full_name': 'Master Labelview',
    'user_type': 'labelview_master',
    'is_labelview_master': True,
    'is_master_account': False,
    'is_active': True,
    'is_blocked': False,
    'phone': '11999999999',
    'balance': 0.0,
    'cashback_balance': 0.0,
    'usdt_balance': 0.0,
    'social_points': 0,
    'referral_code': 'LABELVIEW',
    'referred_by': None,
    'created_at': datetime.utcnow().isoformat(),
    'updated_at': datetime.utcnow().isoformat()
}

# Inserir no banco
result = db.users.insert_one(user_data)

print(f"✅ Usuário Master Labelview criado com sucesso!")
print(f"   ID: {user_data['id']}")
print(f"   Email: {user_data['email']}")
print(f"   Senha: demo123")
print(f"   User Type: {user_data['user_type']}")
print(f"   is_labelview_master: {user_data['is_labelview_master']}")

# Verificar inserção
inserted_user = db.users.find_one({'id': user_data['id']})
if inserted_user:
    print(f"\n✅ Verificação: Usuário encontrado no banco de dados")
else:
    print(f"\n❌ ERRO: Usuário NÃO foi encontrado após inserção")

client.close()
