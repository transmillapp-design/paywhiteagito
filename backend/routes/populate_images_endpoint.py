"""
Endpoint temporário para popular imagens nos tipos de veículos
USAR APENAS UMA VEZ e depois remover por segurança
"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import json
import os
from datetime import datetime

router = APIRouter()

# Função para obter banco de dados
async def get_database():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    return client.transmill

@router.post("/admin/populate-vehicle-images")
async def populate_vehicle_images(db = Depends(get_database)):
    """
    Endpoint para popular imagens nos tipos de veículos
    ATENÇÃO: Endpoint temporário para uso único
    """
    
    try:
        # Carregar JSON com imagens
        json_path = '/app/IMAGENS_VISTORIA_REFERENCIA.json'
        
        if not os.path.exists(json_path):
            raise HTTPException(status_code=500, detail="Arquivo de imagens não encontrado")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            imagens_data = json.load(f)
        
        # Buscar tipos de veículos existentes
        tipos_existentes = await db.labelview_tipos_veiculo.find({}).to_list(length=100)
        
        if not tipos_existentes:
            raise HTTPException(status_code=404, detail="Nenhum tipo de veículo encontrado")
        
        # Mapeamento de categorias para imagens
        mapeamento = {
            'carro leve': 'carros_suv',
            'aplicativo': 'carros_suv',
            'suv': 'carros_suv',
            'pickup': 'carros_suv',
            'van': 'carros_suv',
            'carro': 'carros_suv',
            'moto': 'moto',
            'motocicleta': 'moto',
            'caminhao': 'caminhao',
            'caminhão': 'caminhao',
            'kia bongo': 'caminhao',
            'effa': 'caminhao'
        }
        
        atualizados = 0
        ja_tinham = 0
        
        for tipo in tipos_existentes:
            nome = tipo.get('nome', 'Sem nome')
            categoria = tipo.get('categoria', '').lower()
            tipo_id = tipo.get('id')
            imagens_atuais = tipo.get('imagens_vistoria', [])
            
            # Verificar se já tem imagens
            if imagens_atuais and len(imagens_atuais) > 0:
                ja_tinham += 1
                continue
            
            # Identificar qual conjunto de imagens usar
            chave_imagens = None
            
            for key, value in mapeamento.items():
                if key in categoria or key in nome.lower():
                    chave_imagens = value
                    break
            
            if not chave_imagens:
                chave_imagens = 'carros_suv'
            
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
                atualizados += 1
        
        return {
            'success': True,
            'message': 'Imagens populadas com sucesso',
            'total_tipos': len(tipos_existentes),
            'atualizados': atualizados,
            'ja_tinham': ja_tinham
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/atualizar-imagens-14-fotos")
async def atualizar_imagens_14_fotos(db = Depends(get_database)):
    """
    🔧 CORREÇÃO v2.34.71: Atualizar imagens para 14 fotos
    Este endpoint FORÇA a atualização de TODOS os tipos para 14 imagens
    com o campo 'tipo' preenchido corretamente
    """
    
    try:
        # Carregar JSON com 14 imagens profissionais
        json_path = '/app/IMAGENS_VISTORIA_PROFISSIONAIS.json'
        
        if not os.path.exists(json_path):
            raise HTTPException(status_code=500, detail="Arquivo IMAGENS_VISTORIA_PROFISSIONAIS.json não encontrado")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            imagens_data = json.load(f)
        
        # Buscar tipos de veículos existentes
        tipos_existentes = await db.labelview_tipos_veiculo.find({}).to_list(length=100)
        
        if not tipos_existentes:
            raise HTTPException(status_code=404, detail="Nenhum tipo de veículo encontrado")
        
        # Função para adicionar campo 'tipo' nas imagens
        def adicionar_campo_tipo(imagens):
            """Adiciona campo 'tipo' baseado no nome da imagem"""
            mapa_tipo = {
                'frente': 'frente',
                'traseira': 'traseira',
                'lateral direita': 'lateral_direita',
                'lateral esquerda': 'lateral_esquerda',
                'motor': 'motor',
                'painel': 'painel',
                'volante': 'painel',
                'velocimetro': 'painel',
                'porta malas': 'porta_malas',
                'porta-malas': 'porta_malas',
                'banco dianteiro': 'banco_frente',
                'bancos dianteiros': 'banco_frente',
                'banco traseiro': 'banco_traseiro',
                'bancos traseiros': 'banco_traseiro',
                'quina direita frontal': 'quina_direita_frontal',
                'quina esquerda frontal': 'quina_esquerda_frontal',
                'quina direita traseira': 'quina_direita_traseira',
                'quina esquerda traseira': 'quina_esquerda_traseira',
                'chassi': 'chassi',
                'hodometro': 'hodometro',
                'guidao': 'guidao',
                'suspensao': 'suspensao',
                'pneu': 'pneu'
            }
            
            imagens_com_tipo = []
            for img in imagens:
                nome_lower = img.get('nome', '').lower()
                
                # Encontrar o tipo baseado no nome
                tipo_encontrado = None
                for chave, tipo in mapa_tipo.items():
                    if chave in nome_lower:
                        tipo_encontrado = tipo
                        break
                
                imagens_com_tipo.append({
                    'nome': img.get('nome'),
                    'url': img.get('url'),
                    'tipo': tipo_encontrado or nome_lower.replace(' ', '_').replace('-', '_')
                })
            
            return imagens_com_tipo
        
        # Mapeamento de categorias para imagens
        mapeamento = {
            'carro leve': 'carros',
            'carros leves': 'carros',
            'aplicativo': 'carros',
            'aplicativos': 'carros',
            'suv': 'carros',
            'pickup': 'carros',
            'van': 'carros',
            'carro': 'carros',
            'moto': 'moto',
            'motos': 'moto',
            'motocicleta': 'moto',
            'caminhao': 'caminhao',
            'caminhão': 'caminhao',
            'caminhoes': 'caminhao',
            'caminhões': 'caminhao'
        }
        
        atualizados = 0
        detalhes = []
        
        for tipo in tipos_existentes:
            nome = tipo.get('nome', 'Sem nome')
            categoria = tipo.get('categoria', '').lower()
            tipo_id = tipo.get('id')
            imagens_atuais = len(tipo.get('imagens_vistoria', []))
            
            # Identificar qual conjunto de imagens usar
            chave_imagens = None
            
            for key, value in mapeamento.items():
                if key in categoria or key in nome.lower():
                    chave_imagens = value
                    break
            
            if not chave_imagens:
                chave_imagens = 'carros'  # Padrão
            
            # Obter imagens e adicionar campo 'tipo'
            imagens_originais = imagens_data.get(chave_imagens, {}).get('imagens', [])
            imagens_com_tipo = adicionar_campo_tipo(imagens_originais)
            
            # FORÇAR atualização para todos
            result = await db.labelview_tipos_veiculo.update_one(
                {'id': tipo_id},
                {
                    '$set': {
                        'imagens_vistoria': imagens_com_tipo,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                atualizados += 1
                detalhes.append({
                    'nome': nome,
                    'anterior': imagens_atuais,
                    'atualizado_para': len(imagens_com_tipo)
                })
        
        return {
            'success': True,
            'message': f'✅ {atualizados} tipos de veículo atualizados para 14 imagens',
            'total_tipos': len(tipos_existentes),
            'atualizados': atualizados,
            'detalhes': detalhes
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
