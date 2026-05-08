#!/usr/bin/env python3
"""
Script para inicializar as configurações do Social
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def init_social_settings():
    """Inicializar configurações do social"""
    
    # Conectar ao MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'agitomil')
    db = client[db_name]
    
    print("⚙️ Inicializando configurações do AgitoMil Social...")
    
    # Verificar se já existe
    existing = await db.social_settings.find_one({})
    if existing:
        print("ℹ️  Configurações já existem")
        print(f"   - Pontos por post: {existing.get('points_per_post', 0)}")
        print(f"   - Pontos por like: {existing.get('points_per_like', 0)}")
        print(f"   - Pontos por comentário: {existing.get('points_per_comment', 0)}")
        print(f"   - Pontos por visualização: {existing.get('points_per_view', 0)}")
        client.close()
        return
    
    # Criar configurações padrão
    default_settings = {
        # Monetization settings
        'free_video_min_duration': 7,  # seconds
        'free_video_max_duration': 30,  # seconds
        'paid_video_min_duration': 30,  # seconds
        'paid_video_max_duration': 60,  # seconds
        'paid_video_price': 5.00,  # BRL per video
        
        # Points system
        'points_per_post': 50,
        'points_per_like': 5,
        'points_per_comment': 10,
        'points_per_view': 2,  # For viewers
        'points_per_full_view': 5,  # Bonus for watching until end
        
        # Conversion
        'points_to_brl_rate': 0.01,  # 100 points = R$ 1.00
        
        # Master control
        'social_enabled': True
    }
    
    await db.social_settings.insert_one(default_settings)
    
    print("✅ Configurações criadas com sucesso!")
    print("\n📊 Configurações de Pontuação:")
    print(f"   🎬 Postar vídeo: {default_settings['points_per_post']} pontos")
    print(f"   ❤️  Curtir vídeo: {default_settings['points_per_like']} pontos")
    print(f"   💬 Comentar: {default_settings['points_per_comment']} pontos")
    print(f"   👁️  Visualizar: {default_settings['points_per_view']} pontos")
    print(f"   ⭐ Visualização completa: {default_settings['points_per_full_view']} pontos")
    print(f"\n💰 Taxa de conversão: {default_settings['points_to_brl_rate']} BRL por ponto")
    print(f"   (100 pontos = R$ {default_settings['points_to_brl_rate'] * 100:.2f})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_social_settings())
