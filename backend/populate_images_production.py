#!/usr/bin/env python3
"""
Script para popular imagens de vistoria nos tipos de veículos
PODE SER EXECUTADO MÚLTIPLAS VEZES - Atualiza apenas tipos que não têm imagens
"""
import asyncio
import json
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Conexão MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.transmill

async def populate_images():
    """Adiciona imagens aos tipos de veículos que não têm"""
    
    print("=" * 80)
    print("🚗 POPULAR IMAGENS DE VISTORIA EM TIPOS DE VEÍCULOS")
    print("=" * 80)
    print()
    print(f"📡 Conectando ao MongoDB: {MONGO_URL}")
    print()
    
    # Carregar JSON com imagens
    json_path = '/app/IMAGENS_VISTORIA_REFERENCIA.json'
    
    if not os.path.exists(json_path):
        print(f"❌ ERRO: Arquivo não encontrado: {json_path}")
        print()
        print("Este arquivo contém as 62 imagens de referência.")
        print("Certifique-se de que o arquivo existe no servidor.")
        return False
    
    with open(json_path, 'r', encoding='utf-8') as f:
        imagens_data = json.load(f)
    
    print("✅ JSON de imagens carregado com sucesso!")
    print(f"   - Carros/SUV: {len(imagens_data['carros_suv']['imagens'])} imagens")
    print(f"   - Motos: {len(imagens_data['moto']['imagens'])} imagens")
    print(f"   - Caminhões: {len(imagens_data['caminhao']['imagens'])} imagens")
    print()
    
    # Buscar tipos de veículos existentes
    tipos_existentes = await db.labelview_tipos_veiculo.find({}).to_list(length=100)
    
    if not tipos_existentes:
        print("❌ NENHUM tipo de veículo encontrado no banco de dados!")
        print()
        print("Os tipos de veículos precisam ser cadastrados primeiro.")
        print("Execute primeiro: python3 seed_vehicle_types_with_images.py")
        return False
    
    print(f"✅ Encontrados {len(tipos_existentes)} tipos de veículos:")
    for tipo in tipos_existentes:
        nome = tipo.get('nome', 'Sem nome')
        imagens_atuais = len(tipo.get('imagens_vistoria', []))
        print(f"   - {nome}: {imagens_atuais} imagens")
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
        'effa': 'caminhao',
        'truck': 'caminhao'
    }
    
    # Atualizar tipos que não têm imagens
    atualizados = 0
    ja_tinham = 0
    
    print("🔄 Processando tipos de veículos...")
    print()
    
    for tipo in tipos_existentes:
        nome = tipo.get('nome', 'Sem nome')
        categoria = tipo.get('categoria', '').lower()
        tipo_id = tipo.get('id')
        imagens_atuais = tipo.get('imagens_vistoria', [])
        
        # Verificar se já tem imagens
        if imagens_atuais and len(imagens_atuais) > 0:
            print(f"⏭️  '{nome}' já possui {len(imagens_atuais)} imagens - pulando")
            ja_tinham += 1
            continue
        
        # Identificar qual conjunto de imagens usar
        chave_imagens = None
        
        # Primeiro tenta pela categoria
        for key, value in mapeamento.items():
            if key in categoria or key in nome.lower():
                chave_imagens = value
                break
        
        # Se não encontrou, usar carros_suv como padrão
        if not chave_imagens:
            chave_imagens = 'carros_suv'
            print(f"⚠️  '{nome}' não mapeado - usando imagens de carros como padrão")
        
        # Obter imagens
        imagens = imagens_data[chave_imagens]['imagens']
        
        # Atualizar no banco
        try:
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
                print(f"✅ '{nome}' atualizado com {len(imagens)} imagens ({chave_imagens})")
                atualizados += 1
            else:
                print(f"⚠️  '{nome}' não foi atualizado (possível erro)")
        except Exception as e:
            print(f"❌ Erro ao atualizar '{nome}': {e}")
    
    print()
    print("=" * 80)
    print("🎯 RESUMO DA OPERAÇÃO")
    print("=" * 80)
    print(f"   📊 Total de tipos no banco: {len(tipos_existentes)}")
    print(f"   ✅ Tipos atualizados agora: {atualizados}")
    print(f"   ⏭️  Tipos que já tinham imagens: {ja_tinham}")
    print(f"   📸 Total de imagens adicionadas: {atualizados * 14} (aprox)")
    print()
    
    if atualizados > 0:
        print("=" * 80)
        print("✅ OPERAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 80)
        print()
        print("📋 Próximos passos:")
        print("   1. Fazer logout e login novamente no painel")
        print("   2. Limpar cache: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)")
        print("   3. Editar um tipo de veículo")
        print("   4. Verificar se as imagens aparecem")
        print()
        return True
    elif ja_tinham == len(tipos_existentes):
        print("=" * 80)
        print("ℹ️  NADA A FAZER - TODOS OS TIPOS JÁ TÊM IMAGENS")
        print("=" * 80)
        print()
        print("⚠️  Se as imagens não aparecem no painel, o problema pode ser:")
        print("   1. Cache do navegador não foi limpo corretamente")
        print("   2. Código do frontend não foi atualizado (versão antiga)")
        print("   3. Problema na conversão de estrutura no TipoVeiculoModal.js")
        print()
        print("🔍 Execute o diagnóstico:")
        print("   ./diagnose_frontend.sh")
        print()
        return True
    else:
        print("=" * 80)
        print("⚠️  OPERAÇÃO CONCLUÍDA COM AVISOS")
        print("=" * 80)
        print()
        return True

if __name__ == "__main__":
    success = asyncio.run(populate_images())
    sys.exit(0 if success else 1)
