#!/usr/bin/env python3
"""
SCRIPT DE CORREÇÃO URGENTE - Filtros de Tipos de Veículos
Execute este script diretamente no servidor de produção via SSH

COMO USAR:
1. Conectar ao servidor: ssh user@app.transmill.com.br
2. Copiar este arquivo para o servidor
3. Executar: python3 FIX_FILTROS_PRODUCAO.py
"""

import asyncio
import sys
import os

# Tentar importar motor
try:
    from motor.motor_asyncio import AsyncIOMotorClient
except ImportError:
    print("❌ Erro: biblioteca 'motor' não encontrada")
    print("Execute: pip install motor")
    sys.exit(1)

async def main():
    print("=" * 70)
    print("🔧 CORREÇÃO DE FILTROS - TIPOS DE VEÍCULOS")
    print("=" * 70)
    print()
    
    # Solicitar URL do MongoDB
    print("📝 Configuração do MongoDB")
    print()
    mongo_url = input("MongoDB URL [mongodb://localhost:27017]: ").strip()
    if not mongo_url:
        mongo_url = "mongodb://localhost:27017"
    
    print(f"Conectando a: {mongo_url}")
    print()
    
    try:
        # Conectar ao MongoDB
        client = AsyncIOMotorClient(mongo_url)
        db = client.transmill
        
        # Testar conexão
        await db.command('ping')
        print("✅ Conexão com MongoDB estabelecida!")
        print()
        
    except Exception as e:
        print(f"❌ Erro ao conectar ao MongoDB: {e}")
        print()
        print("Dicas:")
        print("- Verifique se o MongoDB está rodando")
        print("- Verifique a URL de conexão")
        print("- Verifique permissões de acesso")
        sys.exit(1)
    
    # Mapeamento de correções
    correcoes = {
        "Carro Leve": "Carros Leves",
        "Aplicativo": "Aplicativos"
    }
    
    servicos = ["Roubo/Furto", "Perda Total", "Assistencia 24hs"]
    
    # Mostrar situação atual
    print("📊 SITUAÇÃO ATUAL (ANTES DA CORREÇÃO)")
    print("-" * 70)
    print()
    
    encontrou_problemas = False
    
    for servico in servicos:
        print(f"   {servico}:")
        
        for tipo_errado, tipo_correto in correcoes.items():
            count_errado = await db.labelview_tabelas_valores.count_documents({
                "tipo_cobertura": servico,
                "tipo_veiculo_assistencia": tipo_errado
            })
            
            if count_errado > 0:
                print(f"      ❌ '{tipo_errado}': {count_errado} registros (precisa correção)")
                encontrou_problemas = True
            
            count_correto = await db.labelview_tabelas_valores.count_documents({
                "tipo_cobertura": servico,
                "tipo_veiculo_assistencia": tipo_correto
            })
            
            if count_correto > 0:
                print(f"      ✅ '{tipo_correto}': {count_correto} registros (já correto)")
        
        print()
    
    if not encontrou_problemas:
        print("✅ TODOS OS TIPOS JÁ ESTÃO CORRETOS!")
        print()
        print("Nenhuma correção necessária. Os filtros devem funcionar normalmente.")
        client.close()
        return
    
    # Confirmar execução
    print("=" * 70)
    print()
    print("⚠️  ATENÇÃO: Este script irá atualizar registros no banco de dados.")
    print()
    resposta = input("Deseja continuar com a correção? (digite SIM): ").strip().upper()
    
    if resposta != "SIM":
        print()
        print("❌ Operação cancelada pelo usuário.")
        client.close()
        return
    
    print()
    print("=" * 70)
    print("🔄 EXECUTANDO CORREÇÕES...")
    print("=" * 70)
    print()
    
    total_corrigidos = 0
    
    # Aplicar correções
    for tipo_errado, tipo_correto in correcoes.items():
        print(f"Corrigindo '{tipo_errado}' → '{tipo_correto}'...", end=" ")
        
        result = await db.labelview_tabelas_valores.update_many(
            {"tipo_veiculo_assistencia": tipo_errado},
            {"$set": {"tipo_veiculo_assistencia": tipo_correto}}
        )
        
        if result.modified_count > 0:
            print(f"✅ {result.modified_count} registros")
            total_corrigidos += result.modified_count
        else:
            print("ℹ️  Nenhum registro encontrado")
    
    print()
    print("=" * 70)
    print()
    
    # Verificar resultado
    print("📊 SITUAÇÃO FINAL (APÓS CORREÇÃO)")
    print("-" * 70)
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
    
    if total_corrigidos > 0:
        print(f"✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print()
        print(f"   📊 Total de registros corrigidos: {total_corrigidos}")
        print()
        print("🎯 PRÓXIMOS PASSOS:")
        print()
        print("   1. Fazer hard refresh no navegador (Ctrl+Shift+R)")
        print("   2. Limpar cache do navegador")
        print("   3. Fazer logout e login novamente")
        print("   4. Testar os filtros:")
        print("      - Ir em Tabela > Roubo/Furto")
        print("      - Selecionar 'Carros Leves' no filtro")
        print("      - Selecionar 'Aplicativos' no filtro")
        print("      - Ambos devem mostrar 12 registros cada")
        print()
    else:
        print("ℹ️  Nenhum registro foi modificado.")
        print()
    
    client.close()
    
    print("=" * 70)
    print()


if __name__ == "__main__":
    print()
    asyncio.run(main())
