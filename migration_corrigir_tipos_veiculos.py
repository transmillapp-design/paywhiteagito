#!/usr/bin/env python3
"""
SCRIPT DE MIGRAÇÃO - Corrigir tipos de veículos (Singular → Plural)

Este script corrige os dados existentes no banco de produção que foram
criados com nomes no singular para o padrão plural.

ANTES (errado):      DEPOIS (correto):
- "Carro Leve"    → "Carros Leves"
- "Aplicativo"    → "Aplicativos"
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
    
    print("🔧 SCRIPT DE MIGRAÇÃO - CORREÇÃO DE TIPOS DE VEÍCULOS")
    print("=" * 70)
    print()
    
    # Mapeamento de correções
    correcoes = {
        "Carro Leve": "Carros Leves",
        "Aplicativo": "Aplicativos"
    }
    
    total_corrigidos = 0
    
    # Verificar dados antes da correção
    print("📊 SITUAÇÃO ATUAL (ANTES DA CORREÇÃO):")
    print()
    
    servicos = ["Roubo/Furto", "Perda Total", "Assistencia 24hs"]
    
    for servico in servicos:
        print(f"   {servico}:")
        for tipo_errado, tipo_correto in correcoes.items():
            count_errado = await db.labelview_tabelas_valores.count_documents({
                "tipo_cobertura": servico,
                "tipo_veiculo_assistencia": tipo_errado
            })
            if count_errado > 0:
                print(f"      ❌ '{tipo_errado}': {count_errado} registros (precisa correção)")
            
            count_correto = await db.labelview_tabelas_valores.count_documents({
                "tipo_cobertura": servico,
                "tipo_veiculo_assistencia": tipo_correto
            })
            if count_correto > 0:
                print(f"      ✅ '{tipo_correto}': {count_correto} registros (já correto)")
    
    print()
    print("=" * 70)
    print()
    
    # Confirmar execução
    print("⚠️  ATENÇÃO: Este script irá atualizar os registros no banco de dados.")
    print()
    resposta = input("Deseja continuar com a correção? (s/n): ").lower().strip()
    
    if resposta != 's':
        print("❌ Operação cancelada pelo usuário.")
        client.close()
        return
    
    print()
    print("🔄 EXECUTANDO CORREÇÕES...")
    print()
    
    # Aplicar correções
    for tipo_errado, tipo_correto in correcoes.items():
        print(f"   Corrigindo '{tipo_errado}' → '{tipo_correto}'...")
        
        result = await db.labelview_tabelas_valores.update_many(
            {
                "tipo_veiculo_assistencia": tipo_errado
            },
            {
                "$set": {
                    "tipo_veiculo_assistencia": tipo_correto
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"      ✅ {result.modified_count} registros corrigidos")
            total_corrigidos += result.modified_count
        else:
            print(f"      ℹ️  Nenhum registro encontrado")
    
    print()
    print("=" * 70)
    print()
    
    # Verificar após correção
    print("📊 SITUAÇÃO FINAL (APÓS CORREÇÃO):")
    print()
    
    for servico in servicos:
        print(f"   {servico}:")
        
        cursor = db.labelview_tabelas_valores.find({
            "tipo_cobertura": servico,
            "ativo": True
        }, {"tipo_veiculo_assistencia": 1})
        
        tipos = {}
        async for doc in cursor:
            tipo = doc.get('tipo_veiculo_assistencia')
            if tipo:
                tipos[tipo] = tipos.get(tipo, 0) + 1
        
        if tipos:
            for tipo, count in sorted(tipos.items()):
                status = "✅" if tipo in ["Carros Leves", "Aplicativos"] else "  "
                print(f"      {status} '{tipo}': {count} registros")
        else:
            print(f"      (Nenhum registro ativo)")
    
    print()
    print("=" * 70)
    print()
    print(f"✅ MIGRAÇÃO CONCLUÍDA!")
    print(f"   Total de registros corrigidos: {total_corrigidos}")
    print()
    print("📝 PRÓXIMOS PASSOS:")
    print("   1. Fazer deploy das correções do frontend e backend")
    print("   2. Testar os filtros em produção")
    print("   3. Verificar que 'Carros Leves' e 'Aplicativos' agora funcionam")
    print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
