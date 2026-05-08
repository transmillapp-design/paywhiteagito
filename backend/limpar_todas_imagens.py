#!/usr/bin/env python3
"""
Script para LIMPAR todas as imagens dos tipos de veículos
Deixa os campos vazios para adicionar fotos corretas manualmente
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

async def limpar_imagens():
    print("=" * 80)
    print("🗑️  LIMPANDO TODAS AS IMAGENS DOS TIPOS DE VEÍCULOS")
    print("=" * 80)
    print()
    
    # Buscar tipos existentes
    tipos = await db.labelview_tipos_veiculo.find({}).to_list(length=100)
    
    if not tipos:
        print("❌ Nenhum tipo de veículo encontrado")
        return
    
    print(f"✅ Encontrados {len(tipos)} tipos de veículos")
    print()
    
    limpos = 0
    
    for tipo in tipos:
        nome = tipo.get('nome', 'Sem nome')
        tipo_id = tipo.get('id')
        
        # Limpar campo imagens_vistoria (deixar vazio)
        result = await db.labelview_tipos_veiculo.update_one(
            {'id': tipo_id},
            {
                '$set': {
                    'imagens_vistoria': [],  # Array vazio
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"✅ '{nome}' - Imagens removidas (campo vazio)")
            limpos += 1
        else:
            print(f"⚠️  '{nome}' - Já estava vazio")
    
    print()
    print("=" * 80)
    print("✅ LIMPEZA CONCLUÍDA!")
    print("=" * 80)
    print()
    print(f"📊 Tipos limpos: {limpos}")
    print()
    print("📝 Próximos passos:")
    print("   1. Todos os campos estão vazios agora")
    print("   2. Adicione as fotos corretas manualmente pelo painel")
    print("   3. Use FOTOS DO MESMO VEÍCULO em todas as posições")
    print("   4. Exemplo: Fiat Argo nas 14 posições")
    print()

if __name__ == "__main__":
    asyncio.run(limpar_imagens())
