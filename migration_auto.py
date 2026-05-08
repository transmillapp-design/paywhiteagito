#!/usr/bin/env python3
"""
SCRIPT DE MIGRAÇÃO AUTOMÁTICA - Corrigir tipos de veículos
Versão não-interativa para execução em ambientes automatizados
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
    
    print("🔧 MIGRAÇÃO AUTOMÁTICA - CORREÇÃO DE TIPOS DE VEÍCULOS")
    print("=" * 70)
    print()
    
    # Mapeamento de correções
    correcoes = {
        "Carro Leve": "Carros Leves",
        "Aplicativo": "Aplicativos"
    }
    
    total_corrigidos = 0
    servicos = ["Roubo/Furto", "Perda Total", "Assistencia 24hs"]
    
    # Verificar situação atual
    print("📊 SITUAÇÃO ANTES DA CORREÇÃO:")
    for servico in servicos:
        print(f"\n   {servico}:")
        for tipo_errado in correcoes.keys():
            count = await db.labelview_tabelas_valores.count_documents({
                "tipo_cobertura": servico,
                "tipo_veiculo_assistencia": tipo_errado
            })
            if count > 0:
                print(f"      ❌ '{tipo_errado}': {count} registros")
    
    print()
    print("🔄 APLICANDO CORREÇÕES...")
    print()
    
    # Aplicar correções
    for tipo_errado, tipo_correto in correcoes.items():
        result = await db.labelview_tabelas_valores.update_many(
            {"tipo_veiculo_assistencia": tipo_errado},
            {"$set": {"tipo_veiculo_assistencia": tipo_correto}}
        )
        
        if result.modified_count > 0:
            print(f"   ✅ '{tipo_errado}' → '{tipo_correto}': {result.modified_count} registros")
            total_corrigidos += result.modified_count
    
    print()
    print("📊 SITUAÇÃO APÓS CORREÇÃO:")
    for servico in servicos:
        print(f"\n   {servico}:")
        cursor = db.labelview_tabelas_valores.find({
            "tipo_cobertura": servico,
            "ativo": True
        }, {"tipo_veiculo_assistencia": 1})
        
        tipos = {}
        async for doc in cursor:
            tipo = doc.get('tipo_veiculo_assistencia')
            if tipo:
                tipos[tipo] = tipos.get(tipo, 0) + 1
        
        for tipo, count in sorted(tipos.items()):
            print(f"      ✅ '{tipo}': {count} registros")
    
    print()
    print("=" * 70)
    print(f"\n✅ MIGRAÇÃO CONCLUÍDA: {total_corrigidos} registros corrigidos\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
