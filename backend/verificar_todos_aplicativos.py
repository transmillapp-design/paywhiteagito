#!/usr/bin/env python3
"""
Verificar TODOS os tipos que se chamam Aplicativo
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

async def verificar():
    print("=" * 80)
    print("🔍 BUSCANDO TODOS OS TIPOS 'APLICATIVO'")
    print("=" * 80)
    print()
    
    # Buscar TODOS os tipos que contenham "aplicativo" no nome
    tipos_app = await db.labelview_tipos_veiculo.find(
        {"nome": {"$regex": "aplicativo", "$options": "i"}}
    ).to_list(length=100)
    
    print(f"✅ Encontrados {len(tipos_app)} tipos com nome 'Aplicativo'")
    print()
    
    for i, tipo in enumerate(tipos_app, 1):
        print(f"{i}. {tipo.get('nome')}")
        print(f"   ID: {tipo.get('id')}")
        print(f"   Categoria: {tipo.get('categoria')}")
        
        imagens = tipo.get('imagens_vistoria', [])
        print(f"   📸 Imagens: {len(imagens)}")
        
        if imagens:
            print(f"   ✅ TEM IMAGENS SALVAS!")
            for j, img in enumerate(imagens[:3], 1):
                nome = img.get('nome', img.get('nome_campo', 'Sem nome'))
                print(f"      {j}. {nome}")
        else:
            print(f"   ❌ SEM IMAGENS")
        
        print()
    
    # Buscar especificamente o ID que apareceu no console
    id_console = "234a5fb6-1b1d-44ed-bed5-739ab4d39186"
    tipo_console = await db.labelview_tipos_veiculo.find_one({"id": id_console})
    
    if tipo_console:
        print("=" * 80)
        print(f"🎯 TIPO DO CONSOLE (ID: {id_console[:20]}...)")
        print("=" * 80)
        print(f"Nome: {tipo_console.get('nome')}")
        print(f"Categoria: {tipo_console.get('categoria')}")
        
        imagens = tipo_console.get('imagens_vistoria', [])
        print(f"📸 Imagens: {len(imagens)}")
        
        if imagens:
            print()
            print("✅ IMAGENS FORAM SALVAS NESTE!")
            print()
            for j, img in enumerate(imagens, 1):
                nome = img.get('nome', img.get('nome_campo', 'Sem nome'))
                url = img.get('url', img.get('imagem', 'Sem URL'))
                print(f"{j}. {nome}")
                print(f"   URL: {url[:60]}...")
        else:
            print("❌ NENHUMA IMAGEM SALVA")

if __name__ == "__main__":
    asyncio.run(verificar())
