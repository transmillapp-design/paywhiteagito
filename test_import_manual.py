#!/usr/bin/env python3
"""
Teste manual das funções de importação
"""
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from import_roubo_furto_endpoint import importar_roubo_furto_production, TIPOS_VEICULO as TIPOS_RF
from import_perda_total_endpoint import importar_perda_total_production, TIPOS_VEICULO as TIPOS_PT

async def main():
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.transmill
    
    print("🔍 TESTANDO IMPORTAÇÕES MANUAIS")
    print("=" * 70)
    print()
    
    # Mostrar tipos definidos
    print("📋 TIPOS DE VEÍCULOS - ROUBO/FURTO:")
    for i, tipo in enumerate(TIPOS_RF, 1):
        print(f"   {i}. '{tipo}'")
    print()
    
    print("📋 TIPOS DE VEÍCULOS - PERDA TOTAL:")
    for i, tipo in enumerate(TIPOS_PT, 1):
        print(f"   {i}. '{tipo}'")
    print()
    
    # Limpar dados antigos
    print("🗑️  Limpando dados antigos...")
    await db.labelview_tabelas_valores.delete_many({"tipo_cobertura": "Roubo/Furto"})
    await db.labelview_tabelas_valores.delete_many({"tipo_cobertura": "Perda Total"})
    print("   ✅ Limpeza concluída")
    print()
    
    # Testar Roubo/Furto
    print("📦 IMPORTANDO ROUBO/FURTO...")
    try:
        resultado_rf = await importar_roubo_furto_production(db, "teste-manual")
        print(f"   ✅ Sucesso: {resultado_rf['success']}")
        print(f"   📊 Total inseridos: {resultado_rf['total_inseridos']}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    print()
    
    # Testar Perda Total
    print("📦 IMPORTANDO PERDA TOTAL...")
    try:
        resultado_pt = await importar_perda_total_production(db, "teste-manual")
        print(f"   ✅ Sucesso: {resultado_pt['success']}")
        print(f"   📊 Total inseridos: {resultado_pt['total_inseridos']}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    print()
    
    # Verificar no banco
    print("🔍 VERIFICAÇÃO NO BANCO:")
    for tipo_cob in ["Roubo/Furto", "Perda Total"]:
        count = await db.labelview_tabelas_valores.count_documents({
            "tipo_cobertura": tipo_cob,
            "ativo": True
        })
        print(f"   • {tipo_cob}: {count} registros")
        
        # Listar tipos de veículos encontrados
        cursor = db.labelview_tabelas_valores.find({
            "tipo_cobertura": tipo_cob,
            "ativo": True
        }, {"tipo_veiculo_assistencia": 1}).limit(5)
        
        tipos_encontrados = set()
        async for doc in cursor:
            tipos_encontrados.add(doc.get('tipo_veiculo_assistencia'))
        
        if tipos_encontrados:
            for tv in sorted(tipos_encontrados):
                print(f"     - '{tv}'")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
