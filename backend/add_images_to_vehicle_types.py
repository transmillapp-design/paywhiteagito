#!/usr/bin/env python3
"""
Script para adicionar imagens de vistoria aos tipos de veículos cadastrados
"""
import asyncio
import json
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Conexão MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

async def add_images_to_vehicle_types():
    """Adiciona imagens aos tipos de veículos existentes"""
    
    # Carregar JSON com imagens
    json_path = '/app/IMAGENS_VISTORIA_REFERENCIA.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        imagens_data = json.load(f)
    
    print("📂 JSON de imagens carregado com sucesso!")
    print(f"   - Carros/SUV: {len(imagens_data['carros_suv']['imagens'])} imagens")
    print(f"   - Motos: {len(imagens_data['moto']['imagens'])} imagens")
    print(f"   - Caminhões: {len(imagens_data['caminhao']['imagens'])} imagens")
    print()
    
    # Buscar tipos de veículos existentes
    tipos_existentes = await db.labelview_tipos_veiculo.find({}).to_list(length=100)
    
    if not tipos_existentes:
        print("❌ Nenhum tipo de veículo encontrado no banco de dados.")
        print("   Os tipos de veículos precisam ser cadastrados primeiro no painel Master.")
        return
    
    print(f"🔍 Encontrados {len(tipos_existentes)} tipos de veículos no banco:")
    for tipo in tipos_existentes:
        print(f"   - {tipo.get('nome', 'Sem nome')} (categoria: {tipo.get('categoria', 'N/A')})")
    print()
    
    # Mapeamento de categorias para imagens
    mapeamento = {
        # Carros, Aplicativos, SUVs usam as mesmas imagens
        'carro leve': 'carros_suv',
        'aplicativo': 'carros_suv',
        'suv': 'carros_suv',
        'pickup': 'carros_suv',
        'van': 'carros_suv',
        'carro': 'carros_suv',
        
        # Motos
        'moto': 'moto',
        'motocicleta': 'moto',
        
        # Caminhões
        'caminhao': 'caminhao',
        'caminhão': 'caminhao',
        'kia bongo': 'caminhao',
        'effa': 'caminhao'
    }
    
    # Atualizar cada tipo de veículo
    atualizados = 0
    
    for tipo in tipos_existentes:
        nome = tipo.get('nome', '').lower()
        categoria = tipo.get('categoria', '').lower()
        tipo_id = tipo.get('id')
        
        # Verificar se já tem imagens
        if tipo.get('imagens_vistoria') and len(tipo.get('imagens_vistoria', [])) > 0:
            print(f"⏭️  Pulando '{tipo.get('nome')}' - já possui {len(tipo.get('imagens_vistoria', []))} imagens")
            continue
        
        # Identificar qual conjunto de imagens usar
        chave_imagens = None
        
        # Primeiro tenta pela categoria
        for key, value in mapeamento.items():
            if key in categoria:
                chave_imagens = value
                break
        
        # Se não encontrou, tenta pelo nome
        if not chave_imagens:
            for key, value in mapeamento.items():
                if key in nome:
                    chave_imagens = value
                    break
        
        # Se ainda não encontrou, usar carros_suv como padrão
        if not chave_imagens:
            chave_imagens = 'carros_suv'
            print(f"⚠️  '{tipo.get('nome')}' não mapeado - usando imagens de carros como padrão")
        
        # Obter imagens
        imagens = imagens_data[chave_imagens]['imagens']
        
        # Atualizar no banco
        result = await db.labelview_tipos_veiculo.update_one(
            {'id': tipo_id},
            {
                '$set': {
                    'imagens_vistoria': imagens,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"✅ '{tipo.get('nome')}' atualizado com {len(imagens)} imagens ({chave_imagens})")
            atualizados += 1
        else:
            print(f"⚠️  '{tipo.get('nome')}' não foi atualizado")
    
    print()
    print(f"🎯 RESUMO:")
    print(f"   - Total de tipos: {len(tipos_existentes)}")
    print(f"   - Atualizados: {atualizados}")
    print(f"   - Já tinham imagens: {len(tipos_existentes) - atualizados}")
    print()
    print("✅ Processo concluído!")

if __name__ == "__main__":
    asyncio.run(add_images_to_vehicle_types())
