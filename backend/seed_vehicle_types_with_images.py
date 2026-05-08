#!/usr/bin/env python3
"""
Script para criar tipos de veículos com imagens de vistoria
Baseado no arquivo /app/IMAGENS_VISTORIA_REFERENCIA.json
"""
import asyncio
import json
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from uuid import uuid4

# Conexão MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

async def seed_vehicle_types_with_images():
    """Cria tipos de veículos com imagens de vistoria"""
    
    print("🚗 Iniciando seed de Tipos de Veículos com Imagens...")
    print()
    
    # Carregar JSON com imagens
    json_path = '/app/IMAGENS_VISTORIA_REFERENCIA.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        imagens_data = json.load(f)
    
    print("📂 JSON de imagens carregado:")
    print(f"   - Carros/SUV: {len(imagens_data['carros_suv']['imagens'])} imagens")
    print(f"   - Motos: {len(imagens_data['moto']['imagens'])} imagens")
    print(f"   - Caminhões: {len(imagens_data['caminhao']['imagens'])} imagens")
    print()
    
    # Buscar usuário Master para pegar created_by
    master_user = await db.users.find_one({"email": "protecao@agitomil.com"})
    master_id = master_user['id'] if master_user else None
    
    if not master_id:
        print("⚠️ Usuário Master não encontrado - usando ID genérico")
        master_id = str(uuid4())
    
    # Definir os 5 tipos de veículos conforme painel Master Labelview
    tipos_veiculo = [
        {
            "id": str(uuid4()),
            "nome": "Carro Leve",
            "categoria": "Carro Leve",
            "tipo_fipe": "carros",
            "icone": "🚗",
            "descricao": "Automóveis de passeio leves",
            "ativo": True,
            "valor_fipe_maximo": 120000,
            "imagens_vistoria": imagens_data['carros_suv']['imagens'],
            "created_at": datetime.utcnow(),
            "created_by": master_id
        },
        {
            "id": str(uuid4()),
            "nome": "Aplicativo",
            "categoria": "Aplicativo",
            "tipo_fipe": "carros",
            "icone": "🚕",
            "descricao": "Veículos para transporte por aplicativo (Uber, 99, etc)",
            "ativo": True,
            "valor_fipe_maximo": 120000,
            "imagens_vistoria": imagens_data['carros_suv']['imagens'],
            "created_at": datetime.utcnow(),
            "created_by": master_id
        },
        {
            "id": str(uuid4()),
            "nome": "Moto",
            "categoria": "Moto",
            "tipo_fipe": "motos",
            "icone": "🏍️",
            "descricao": "Motocicletas e ciclomotores",
            "ativo": True,
            "valor_fipe_maximo": 120000,
            "imagens_vistoria": imagens_data['moto']['imagens'],
            "created_at": datetime.utcnow(),
            "created_by": master_id
        },
        {
            "id": str(uuid4()),
            "nome": "SUV / Pickup / Van",
            "categoria": "SUV / Pickup / Van",
            "tipo_fipe": "carros",
            "icone": "🚙",
            "descricao": "SUVs, Pickups e Vans",
            "ativo": True,
            "valor_fipe_maximo": 120000,
            "imagens_vistoria": imagens_data['carros_suv']['imagens'],
            "created_at": datetime.utcnow(),
            "created_by": master_id
        },
        {
            "id": str(uuid4()),
            "nome": "Caminhão (KIA Bongo / EFFA)",
            "categoria": "Caminhão",
            "tipo_fipe": "caminhoes",
            "icone": "🚚",
            "descricao": "Caminhões leves (KIA Bongo, EFFA, etc)",
            "ativo": True,
            "valor_fipe_maximo": 120000,
            "imagens_vistoria": imagens_data['caminhao']['imagens'],
            "created_at": datetime.utcnow(),
            "created_by": master_id
        }
    ]
    
    print("🗑️  Limpando tipos de veículos antigos...")
    result = await db.labelview_tipos_veiculo.delete_many({})
    print(f"   Removidos: {result.deleted_count} tipos antigos")
    print()
    
    print("✨ Criando novos tipos de veículos com imagens...")
    await db.labelview_tipos_veiculo.insert_many(tipos_veiculo)
    print()
    
    print("="*70)
    print("✅ TIPOS DE VEÍCULOS CRIADOS COM SUCESSO!")
    print("="*70)
    
    for idx, tipo in enumerate(tipos_veiculo, 1):
        print(f"\n{idx}. {tipo['nome']} {tipo['icone']}")
        print(f"   └─ Categoria: {tipo['categoria']}")
        print(f"   └─ Tipo FIPE: {tipo['tipo_fipe']}")
        print(f"   └─ Imagens de vistoria: {len(tipo['imagens_vistoria'])} fotos")
    
    print()
    print("="*70)
    print("🎯 RESUMO:")
    print(f"   - Total de tipos criados: {len(tipos_veiculo)}")
    print(f"   - Total de imagens: {sum(len(t['imagens_vistoria']) for t in tipos_veiculo)}")
    print("="*70)
    print()
    print("✅ Agora o painel Master Labelview tem 5 tipos de veículos completos!")
    print("📸 Cada tipo já possui suas imagens de vistoria configuradas.")
    print()

if __name__ == "__main__":
    asyncio.run(seed_vehicle_types_with_images())
