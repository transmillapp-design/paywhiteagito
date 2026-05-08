#!/usr/bin/env python3
"""
Script de teste para importação de Assistência 24h
"""
import asyncio
import sys
import os

# Adicionar o diretório backend ao path
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from tabelas_valores import importar_assistencia_24h

async def main():
    # Conectar ao MongoDB
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.transmill
    
    print("🚀 Iniciando importação de Assistência 24h...")
    print()
    
    # Executar importação
    resultado = await importar_assistencia_24h(db, "teste-import-script")
    
    print()
    print("📊 RESULTADO DA IMPORTAÇÃO:")
    print(f"✅ Sucesso: {resultado['success']}")
    print(f"📝 Mensagem: {resultado['message']}")
    
    if resultado['success']:
        print(f"📦 Registros criados: {resultado['registros_criados']}")
        print(f"🚗 Tipos de veículos: {resultado['tipos_veiculos']}")
        print(f"📊 Faixas por tipo: {resultado['faixas_por_tipo']}")
        
        # Contar registros no banco
        total = await db.labelview_tabelas_valores.count_documents({
            "tipo_cobertura": "Assistencia 24hs",
            "ativo": True
        })
        print(f"🔍 Total no banco: {total} registros ativos")
        
        # Buscar alguns exemplos
        print()
        print("📋 EXEMPLOS DE REGISTROS CRIADOS:")
        cursor = db.labelview_tabelas_valores.find({
            "tipo_cobertura": "Assistencia 24hs",
            "ativo": True
        }).limit(5)
        
        async for doc in cursor:
            print(f"  • {doc['tipo_veiculo_assistencia']}: R$ {doc['valor_servico']:.2f} | Faixa FIPE: R$ {doc['valor_fipe_min']:,.2f} - R$ {doc['valor_fipe_max']:,.2f}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
