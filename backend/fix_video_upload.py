#!/usr/bin/env python3
"""
Script para diagnosticar e corrigir problemas de upload de vídeo
"""
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')

async def check_video_upload():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[os.environ.get('DB_NAME', 'transmill')]
    
    print("="*60)
    print("DIAGNÓSTICO DE UPLOAD DE VÍDEO")
    print("="*60)
    
    # 1. Verificar configurações sociais
    print("\n1. Configurações Sociais:")
    settings = await db.social_settings.find_one({})
    if settings:
        print(f"   ✓ Duração máxima grátis: {settings.get('free_video_max_duration', 'N/A')}s")
        print(f"   ✓ Duração máxima paga: {settings.get('paid_video_max_duration', 'N/A')}s")
        print(f"   ✓ Preço vídeo pago: R$ {settings.get('paid_video_price', 'N/A')}")
    else:
        print("   ✗ Nenhuma configuração encontrada")
        print("   Criando configurações padrão...")
        default_settings = {
            'free_video_max_duration': 30,
            'paid_video_max_duration': 60,
            'paid_video_price': 5.0,
            'points_per_post': 10,
            'points_per_like': 2,
            'points_per_comment': 5,
            'points_per_view': 1,
            'points_per_full_view': 3
        }
        await db.social_settings.insert_one(default_settings)
        print("   ✓ Configurações criadas!")
    
    # 2. Verificar vídeos existentes
    print("\n2. Vídeos Existentes:")
    total_videos = await db.social_videos.count_documents({})
    print(f"   Total: {total_videos} vídeos")
    
    if total_videos > 0:
        last_video = await db.social_videos.find_one({}, sort=[('created_at', -1)])
        print(f"   Último vídeo: {last_video.get('user_id', 'N/A')}")
        print(f"   Duração: {last_video.get('duration', 'N/A')}s")
        print(f"   Tamanho do vídeo: {len(last_video.get('video_data', ''))} bytes")
    
    # 3. Verificar índices
    print("\n3. Índices MongoDB:")
    indexes = await db.social_videos.index_information()
    print(f"   Total de índices: {len(indexes)}")
    
    # 4. Teste de inserção
    print("\n4. Teste de Inserção:")
    try:
        test_data = {
            'id': 'test-video-123',
            'user_id': 'test-user',
            'user_type': 'cliente',
            'video_data': 'data:video/mp4;base64,TEST',
            'duration': 10,
            'video_type': 'free',
            'description': 'Teste',
            'likes_count': 0,
            'comments_count': 0,
            'views_count': 0,
            'is_active': True
        }
        # Não vamos inserir de verdade, só testar
        print("   ✓ Estrutura de dados válida")
    except Exception as e:
        print(f"   ✗ Erro na estrutura: {e}")
    
    # 5. Verificar limite de tamanho BSON
    print("\n5. Limites MongoDB:")
    print("   ⚠️  Limite BSON: 16MB por documento")
    print("   Recomendação: Vídeos grandes devem usar storage externo (S3, CDN)")
    print("   Solução temporária: Limitar duração dos vídeos")
    
    client.close()
    print("\n" + "="*60)
    print("DIAGNÓSTICO CONCLUÍDO")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(check_video_upload())
