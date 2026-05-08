"""
Script para importar TODAS as tabelas de valores
"""
import asyncio
import sys
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def importar_tudo():
    """Importa todas as tabelas"""
    
    print("🚀 Iniciando importação de TODAS as tabelas...")
    
    # Conectar
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.transmill
    
    # Importar funções
    from tabelas_valores import (
        importar_assistencia_24h,
        importar_vidros_farois_lanternas,
        importar_carro_reserva,
        importar_colisao,
        importar_danos_materiais_terceiros
    )
    
    servicos = [
        ("Assistência 24h", importar_assistencia_24h, "Assistencia 24hs"),
        ("Vidros, Faróis e Lanternas", importar_vidros_farois_lanternas, "Vidros, Farois e Lanternas"),
        ("Carro Reserva", importar_carro_reserva, "Carro Reserva"),
        ("Colisão", importar_colisao, "Colisão"),
        ("Danos Materiais e Terceiros", importar_danos_materiais_terceiros, "Danos materiais e Terceiros")
    ]
    
    total = 0
    
    for nome, funcao, tipo_cob in servicos:
        print(f"\n📦 Importando {nome}...")
        
        # Verificar se já existe
        count = await db.tabela_valores.count_documents({"tipo_cobertura": tipo_cob})
        
        if count > 0:
            print(f"   ✓ {nome}: {count} registros já existem (pulando)")
            continue
        
        try:
            resultado = await funcao(db, "manual-import")
            
            if resultado.get('success'):
                registros = resultado.get('registros_criados', 0)
                print(f"   ✅ {nome}: {registros} registros criados!")
                total += registros
            else:
                print(f"   ❌ {nome}: ERRO - {resultado.get('message')}")
        except Exception as e:
            print(f"   ❌ {nome}: EXCEÇÃO - {str(e)}")
    
    print(f"\n{'='*60}")
    print(f"✅ IMPORTAÇÃO CONCLUÍDA: {total} registros criados no total")
    print(f"{'='*60}\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(importar_tudo())
