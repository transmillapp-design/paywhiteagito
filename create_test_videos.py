#!/usr/bin/env python3
"""
Script para criar vídeos de teste leves para testar performance
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone
import os

async def create_test_videos():
    """Criar vídeos de teste leves"""
    
    # Conectar ao MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitomil')
    db = client[db_name]
    
    print("🎬 Criando vídeos de teste para performance...")
    
    # Buscar usuários
    cliente = await db.users.find_one({"email": "cliente@demo.com"})
    lojista = await db.users.find_one({"email": "lojista@demo.com"})
    
    if not cliente or not lojista:
        print("❌ Usuários demo não encontrados")
        return
    
    # Video data leve (apenas placeholder - 100 bytes)
    light_video_data = "data:video/mp4;base64," + "A" * 100
    
    videos_to_create = [
        {
            'id': str(uuid.uuid4()),
            'user_id': cliente['id'],
            'user_type': 'cliente',
            'video_data': light_video_data,
            'duration': 15,
            'description': 'Vídeo de teste 1 - Cliente',
            'hashtags': ['teste', 'cliente'],
            'likes_count': 5,
            'comments_count': 2,
            'views_count': 10,
            'is_active': True,
            'created_at': datetime.now(timezone.utc)
        },
        {
            'id': str(uuid.uuid4()),
            'user_id': lojista['id'],
            'user_type': 'lojista',
            'video_data': light_video_data,
            'duration': 20,
            'description': 'Vídeo de teste 2 - Lojista',
            'hashtags': ['teste', 'loja'],
            'likes_count': 8,
            'comments_count': 4,
            'views_count': 15,
            'is_active': True,
            'created_at': datetime.now(timezone.utc)
        },
        {
            'id': str(uuid.uuid4()),
            'user_id': cliente['id'],
            'user_type': 'cliente',
            'video_data': light_video_data,
            'duration': 12,
            'description': 'Vídeo de teste 3 - Cliente',
            'hashtags': ['teste', 'agitomil'],
            'likes_count': 3,
            'comments_count': 1,
            'views_count': 8,
            'is_active': True,
            'created_at': datetime.now(timezone.utc)
        }
    ]
    
    # Limpar vídeos antigos de teste
    await db.social_videos.delete_many({'description': {'$regex': 'Vídeo de teste'}})
    
    # Inserir novos vídeos
    await db.social_videos.insert_many(videos_to_create)
    
    print(f"✅ {len(videos_to_create)} vídeos de teste criados")
    
    # Verificar
    count = await db.social_videos.count_documents({'is_active': True})
    print(f"📊 Total de vídeos ativos: {count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_videos())
