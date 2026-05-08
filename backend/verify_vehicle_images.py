#!/usr/bin/env python3
"""
Script para verificar se as imagens estão nos tipos de veículos
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Conexão MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

async def verify_vehicle_images():
    """Verifica se as imagens estão nos tipos de veículos"""
    
    print("🔍 Verificando tipos de veículos no banco de dados...")
    print()
    
    tipos = await db.labelview_tipos_veiculo.find({}).to_list(length=100)
    
    if not tipos:
        print("❌ Nenhum tipo de veículo encontrado!")
        return
    
    print(f"✅ Encontrados {len(tipos)} tipos de veículos:")
    print()
    
    for idx, tipo in enumerate(tipos, 1):
        print(f"{idx}. {tipo.get('nome')} {tipo.get('icone', '')}")
        print(f"   ID: {tipo.get('id')}")
        print(f"   Categoria: {tipo.get('categoria')}")
        print(f"   Tipo FIPE: {tipo.get('tipo_fipe')}")
        print(f"   Ativo: {tipo.get('ativo')}")
        
        imagens = tipo.get('imagens_vistoria', [])
        print(f"   📸 Imagens de vistoria: {len(imagens)}")
        
        if imagens:
            print(f"   └─ Primeiras 3 imagens:")
            for i, img in enumerate(imagens[:3], 1):
                print(f"      {i}. {img.get('nome', 'Sem nome')}")
                print(f"         URL: {img.get('url', 'Sem URL')[:60]}...")
        else:
            print(f"   ⚠️  NENHUMA IMAGEM ENCONTRADA!")
        
        print()
    
    print("="*70)
    print("🎯 RESULTADO DA VERIFICAÇÃO:")
    print(f"   - Total de tipos: {len(tipos)}")
    
    tipos_com_imagens = sum(1 for t in tipos if t.get('imagens_vistoria'))
    print(f"   - Tipos com imagens: {tipos_com_imagens}")
    print(f"   - Tipos SEM imagens: {len(tipos) - tipos_com_imagens}")
    
    total_imagens = sum(len(t.get('imagens_vistoria', [])) for t in tipos)
    print(f"   - Total de imagens: {total_imagens}")
    print("="*70)
    
    if tipos_com_imagens == len(tipos):
        print()
        print("✅ TODOS OS TIPOS TÊM IMAGENS CONFIGURADAS!")
    else:
        print()
        print("⚠️  ALGUNS TIPOS NÃO TÊM IMAGENS!")

if __name__ == "__main__":
    asyncio.run(verify_vehicle_images())
