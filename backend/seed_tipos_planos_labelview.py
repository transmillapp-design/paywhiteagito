#!/usr/bin/env python3
"""
Script para criar os tipos de planos Labelview conforme especificação
"""
import pymongo
import uuid
from datetime import datetime

# Conectar ao MongoDB
client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client[os.environ.get('DB_NAME', 'transmill')]

# Buscar usuário Master Labelview
master_user = db.users.find_one({'email': 'protecao@agitomil.com'})
if not master_user:
    print("❌ Usuário Master Labelview não encontrado!")
    exit(1)

master_id = master_user['id']
print(f"✅ Master Labelview encontrado: {master_id}")

# Limpar tipos existentes (opcional)
print("\n🗑️ Limpando tipos de planos existentes...")
db.labelview_planos.delete_many({})

# Tipos de Planos Principal
tipos_principal = [
    "Roubo e Furto",
    "Perda Total"
]

# Tipos de Planos Adicional
tipos_adicional = [
    "Assistência 24h (Carro Reserva, Danos da Natureza, Incêndio, Pane seca, Pane Eletrica, Reboque, Taxi, Hotel)",
    "Monitoramento",
    "Colisão",
    "Terceiro",
    "Vidros",
    "Rastreador"
]

print("\n📝 Criando tipos de planos PRINCIPAL...")
for nome in tipos_principal:
    plano_data = {
        'id': str(uuid.uuid4()),
        'nome': nome,
        'categoria': 'Principal',
        'is_active': True,
        'is_blocked': False,
        'created_at': datetime.utcnow(),
        'created_by': master_id
    }
    db.labelview_planos.insert_one(plano_data)
    print(f"   ✅ {nome}")

print("\n📝 Criando tipos de planos ADICIONAL...")
for nome in tipos_adicional:
    plano_data = {
        'id': str(uuid.uuid4()),
        'nome': nome,
        'categoria': 'Adicional',
        'is_active': True,
        'is_blocked': False,
        'created_at': datetime.utcnow(),
        'created_by': master_id
    }
    db.labelview_planos.insert_one(plano_data)
    print(f"   ✅ {nome}")

# Verificar total
total = db.labelview_planos.count_documents({})
principal_count = db.labelview_planos.count_documents({'categoria': 'Principal'})
adicional_count = db.labelview_planos.count_documents({'categoria': 'Adicional'})

print(f"\n✅ TOTAL DE TIPOS CRIADOS: {total}")
print(f"   📘 Principal: {principal_count}")
print(f"   📗 Adicional: {adicional_count}")

print("\n📋 LISTA COMPLETA:")
print("\n📘 PRINCIPAL:")
for plano in db.labelview_planos.find({'categoria': 'Principal'}):
    print(f"   • {plano['nome']}")

print("\n📗 ADICIONAL:")
for plano in db.labelview_planos.find({'categoria': 'Adicional'}):
    print(f"   • {plano['nome']}")

client.close()
print("\n✅ Script concluído com sucesso!")
