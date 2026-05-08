"""
Script para importar os 60 registros de Assistência 24hs
"""
import asyncio
import sys
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def importar_60_registros():
    """Importa os 60 registros de Assistência 24hs"""
    
    print("🚀 Iniciando importação dos 60 registros de Assistência 24hs...")
    
    # Conectar
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.transmill
    
    # Importar função
    from tabelas_valores import importar_assistencia_24h
    
    try:
        # Verificar quantos já existem
        count_antes = await db.labelview_tabelas_valores.count_documents({})
        print(f"📊 Registros antes da importação: {count_antes}")
        
        # Importar
        resultado = await importar_assistencia_24h(db, "admin-import")
        
        if resultado.get('success'):
            registros = resultado.get('registros_criados', 0)
            print(f"✅ Assistência 24hs: {registros} registros criados!")
            
            # Verificar depois
            count_depois = await db.labelview_tabelas_valores.count_documents({})
            print(f"📊 Registros depois da importação: {count_depois}")
            
            # Mostrar alguns exemplos
            print("\n📋 Exemplos de registros criados:")
            exemplos = await db.labelview_tabelas_valores.find().limit(5).to_list(length=5)
            for i, ex in enumerate(exemplos, 1):
                print(f"   {i}. {ex.get('tipo_veiculo_assistencia')}: R$ {ex.get('valor_servico')} (FIPE: R$ {ex.get('valor_fipe_min')} - R$ {ex.get('valor_fipe_max')})")
        else:
            print(f"❌ ERRO: {resultado.get('message')}")
    
    except Exception as e:
        print(f"❌ EXCEÇÃO: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(importar_60_registros())
