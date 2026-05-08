#!/usr/bin/env python3
"""
Script para verificar todos os tipos de veículos da Assistência 24h
"""
import asyncio
import sys
import os

sys.path.insert(0, '/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.transmill
    
    print("🔍 VERIFICAÇÃO COMPLETA - ASSISTÊNCIA 24 HORAS")
    print("=" * 60)
    print()
    
    # Buscar todos os tipos de veículos únicos
    pipeline = [
        {"$match": {"tipo_cobertura": "Assistencia 24hs", "ativo": True}},
        {"$group": {
            "_id": "$tipo_veiculo_assistencia",
            "valor": {"$first": "$valor_servico"},
            "total_faixas": {"$sum": 1}
        }},
        {"$sort": {"valor": 1}}
    ]
    
    tipos = []
    async for doc in db.labelview_tabelas_valores.aggregate(pipeline):
        tipos.append(doc)
    
    print(f"📊 TOTAL DE TIPOS DE VEÍCULOS: {len(tipos)}")
    print()
    
    for i, tipo in enumerate(tipos, 1):
        print(f"{i}. {tipo['_id']}")
        print(f"   💰 Valor: R$ {tipo['valor']:.2f}")
        print(f"   📈 Faixas FIPE: {tipo['total_faixas']}")
        print()
    
    # Total de registros
    total = await db.labelview_tabelas_valores.count_documents({
        "tipo_cobertura": "Assistencia 24hs",
        "ativo": True
    })
    
    print("=" * 60)
    print(f"📦 TOTAL DE REGISTROS: {total}")
    print(f"✅ Esperado: 60 (5 tipos × 12 faixas)")
    print(f"🎯 Status: {'OK!' if total == 60 else 'ERRO!'}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
