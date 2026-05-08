#!/usr/bin/env python3
"""
Atualizar created_by dos tipos de veículos para usar labelview@transmill.com
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

async def update_creator():
    # Buscar labelview@transmill.com
    labelview_user = await db.users.find_one({"email": "labelview@transmill.com"})
    
    if not labelview_user:
        print("❌ Usuário labelview@transmill.com não encontrado!")
        return
    
    labelview_id = labelview_user['id']
    print(f"✅ ID do labelview@transmill.com: {labelview_id}")
    print()
    
    # Atualizar todos os tipos de veículos
    print("🔄 Atualizando created_by nos tipos de veículos...")
    
    result = await db.labelview_tipos_veiculo.update_many(
        {},  # Todos os documentos
        {
            "$set": {
                "created_by": labelview_id
            }
        }
    )
    
    print(f"✅ {result.modified_count} tipos de veículos atualizados!")
    print()
    
    # Verificar
    tipos = await db.labelview_tipos_veiculo.find({}).to_list(length=10)
    
    print("📋 Tipos de veículos:")
    for tipo in tipos:
        print(f"   - {tipo.get('nome')} (created_by: {tipo.get('created_by')})")
    
    print()
    print("✅ Atualização concluída!")

if __name__ == "__main__":
    asyncio.run(update_creator())
