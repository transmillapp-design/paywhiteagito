"""
FIPE / Brasil API Routes
Migrado de server.py para router modular.
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import logging
import os

from routes.deps import get_current_user, get_current_master_user, verify_token, security

logger = logging.getLogger(__name__)

router = APIRouter()

db = None


def set_db(database):
    global db
    db = database


@router.get("/brasil-api/fipe/marcas/{tipo}")
async def get_marcas_fipe_brasilapi(
    tipo: str,  # carros, motos, caminhoes
    current_user = Depends(get_current_user)
):
    """
    Busca marcas FIPE usando Brasil API (gratuita) ou FIPEAPI (paga) como fallback
    Tipos disponíveis: carros, motos, caminhoes
    """
    import requests
    import os
    try:
        # Mapear tipo para endpoint correto
        tipo_map = {
            'carros': 'carros',
            'carro': 'carros',
            'automovel': 'carros',
            'motos': 'motos',
            'moto': 'motos',
            'motocicleta': 'motos',
            'caminhoes': 'caminhoes',
            'caminhao': 'caminhoes',
            'caminhão': 'caminhoes'
        }
        
        tipo_normalizado = tipo_map.get(tipo.lower(), 'carros')
        
        logger.info(f"🌐 Buscando marcas FIPE: {tipo_normalizado}")
        
        # 1️⃣ PRIMEIRO: Tentar Brasil API (gratuita e confiável)
        brasilapi_url = f"https://brasilapi.com.br/api/fipe/marcas/v1/{tipo_normalizado}"
        
        try:
            response = requests.get(brasilapi_url, timeout=10)
            
            if response.status_code == 200:
                marcas = response.json()
                
                # Brasil API já retorna no formato correto: [{"nome": "...", "valor": "..."}]
                marcas_convertidas = []
                for marca in marcas:
                    marcas_convertidas.append({
                        'codigo': marca.get('valor', ''),
                        'nome': marca.get('nome', ''),
                        'valor': marca.get('valor', '')
                    })
                
                logger.info(f"✅ {len(marcas_convertidas)} marcas via Brasil API")
                return {
                    'success': True,
                    'marcas': marcas_convertidas,
                    'tipo': tipo_normalizado,
                    'fonte': 'BrasilAPI'
                }
        except Exception as e:
            logger.warning(f"⚠️ Brasil API falhou: {e}")
        
        # 2️⃣ FALLBACK: Tentar FIPEAPI (paga)
        FIPEAPI_TOKEN = os.environ.get('FIPEAPI_TOKEN', '')
        FIPEAPI_BASE_URL = os.environ.get('FIPEAPI_BASE_URL', 'https://api.fipeapi.com.br/v1')
        
        if FIPEAPI_TOKEN:
            try:
                url = f"{FIPEAPI_BASE_URL}/{tipo_normalizado}"
                params = {'apikey': FIPEAPI_TOKEN}
                
                response = requests.get(url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Verificar se é uma lista ou um dict de erro
                    if isinstance(data, list):
                        marcas_convertidas = []
                        for marca in data:
                            if isinstance(marca, dict):
                                marcas_convertidas.append({
                                    'codigo': marca.get('id', ''),
                                    'nome': marca.get('name', ''),
                                    'valor': marca.get('id', '')
                                })
                        
                        if marcas_convertidas:
                            logger.info(f"✅ {len(marcas_convertidas)} marcas via FIPEAPI")
                            return {
                                'success': True,
                                'marcas': marcas_convertidas,
                                'tipo': tipo_normalizado,
                                'fonte': 'FIPEAPI'
                            }
            except Exception as e:
                logger.warning(f"⚠️ FIPEAPI falhou: {e}")
        
        # 3️⃣ Se todas as fontes falharem
        logger.error("❌ Todas as fontes FIPE falharam")
        return {
            'success': False,
            'message': 'APIs FIPE indisponíveis no momento. Tente novamente.'
        }
            
    except Exception as e:
        logger.error(f"❌ Exceção ao buscar marcas FIPE: {str(e)}")
        return {
            'success': False,
            'message': f'Erro: {str(e)}'
        }


@router.get("/brasil-api/fipe/modelos/{tipo}/{marca_codigo}")
async def get_modelos_fipe_brasilapi(
    tipo: str,
    marca_codigo: str,
    current_user = Depends(get_current_user)
):
    """
    Busca modelos FIPE usando Parallelum API (gratuita) ou FIPEAPI (paga) como fallback
    """
    import requests
    import os
    try:
        tipo_map = {
            'carros': 'carros', 'carro': 'carros', 'automovel': 'carros',
            'motos': 'motos', 'moto': 'motos', 'motocicleta': 'motos',
            'caminhoes': 'caminhoes', 'caminhao': 'caminhoes'
        }
        tipo_normalizado = tipo_map.get(tipo.lower(), 'carros')
        
        logger.info(f"🌐 Buscando modelos FIPE: {tipo_normalizado} / Marca: {marca_codigo}")
        
        # 1️⃣ Parallelum API (gratuita e confiável)
        parallelum_url = f"https://parallelum.com.br/fipe/api/v1/{tipo_normalizado}/marcas/{marca_codigo}/modelos"
        try:
            response = requests.get(parallelum_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                modelos = data.get('modelos', data) if isinstance(data, dict) else data
                modelos_convertidos = []
                for modelo in modelos:
                    modelos_convertidos.append({
                        'codigo': str(modelo.get('codigo', '')),
                        'nome': modelo.get('nome', ''),
                        'modelo': modelo.get('nome', '')
                    })
                logger.info(f"✅ {len(modelos_convertidos)} modelos via Parallelum")
                return {'success': True, 'modelos': modelos_convertidos, 'fonte': 'Parallelum'}
        except Exception as e:
            logger.warning(f"⚠️ Parallelum API modelos falhou: {e}")
        
        # 2️⃣ FIPEAPI Fallback
        FIPEAPI_TOKEN = os.environ.get('FIPEAPI_TOKEN', '')
        if FIPEAPI_TOKEN:
            try:
                url = f"https://api.fipeapi.com.br/v1/{tipo_normalizado}/{marca_codigo}"
                response = requests.get(url, params={'apikey': FIPEAPI_TOKEN}, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        modelos_convertidos = [{'codigo': m.get('id_modelo', ''), 'nome': m.get('name', ''), 'modelo': m.get('name', '')} for m in data if isinstance(m, dict)]
                        if modelos_convertidos:
                            return {'success': True, 'modelos': modelos_convertidos, 'fonte': 'FIPEAPI'}
            except Exception as e:
                logger.warning(f"⚠️ FIPEAPI modelos falhou: {e}")
        
        return {'success': False, 'message': 'APIs FIPE indisponíveis'}
            
    except Exception as e:
        logger.error(f"❌ Exceção ao buscar modelos FIPE: {str(e)}")
        return {'success': False, 'message': f'Erro: {str(e)}'}


@router.get("/brasil-api/fipe/anos/{tipo}/{marca_codigo}/{modelo_codigo}")
async def get_anos_fipe_brasilapi(
    tipo: str,
    marca_codigo: str,
    modelo_codigo: str,
    current_user = Depends(get_current_user)
):
    """
    Busca anos disponíveis de um modelo FIPE usando Parallelum API (gratuita)
    """
    import requests
    import os
    try:
        tipo_map = {
            'carros': 'carros', 'carro': 'carros', 'automovel': 'carros',
            'motos': 'motos', 'moto': 'motos', 'motocicleta': 'motos',
            'caminhoes': 'caminhoes', 'caminhao': 'caminhoes'
        }
        tipo_normalizado = tipo_map.get(tipo.lower(), 'carros')
        
        logger.info(f"🌐 Buscando anos FIPE: {tipo_normalizado} / Marca: {marca_codigo} / Modelo: {modelo_codigo}")
        
        # 1️⃣ Parallelum API (gratuita)
        parallelum_url = f"https://parallelum.com.br/fipe/api/v1/{tipo_normalizado}/marcas/{marca_codigo}/modelos/{modelo_codigo}/anos"
        try:
            response = requests.get(parallelum_url, timeout=10)
            if response.status_code == 200:
                anos = response.json()
                anos_convertidos = []
                for ano in anos:
                    # Formato: {"codigo": "2024-1", "nome": "2024 Gasolina"}
                    nome = ano.get('nome', '')
                    partes = nome.split(' ')
                    anos_convertidos.append({
                        'codigo': ano.get('codigo', ''),
                        'nome': partes[0] if partes else '',
                        'id': ano.get('codigo', ''),
                        'combustivel': ' '.join(partes[1:]) if len(partes) > 1 else '',
                        'name': nome
                    })
                logger.info(f"✅ {len(anos_convertidos)} anos via Parallelum")
                return {'success': True, 'anos': anos_convertidos, 'fonte': 'Parallelum'}
        except Exception as e:
            logger.warning(f"⚠️ Parallelum API anos falhou: {e}")
        
        # 2️⃣ FIPEAPI Fallback
        FIPEAPI_TOKEN = os.environ.get('FIPEAPI_TOKEN', '')
        if FIPEAPI_TOKEN:
            try:
                url = f"https://api.fipeapi.com.br/v1/{tipo_normalizado}/{marca_codigo}/{modelo_codigo}"
                response = requests.get(url, params={'apikey': FIPEAPI_TOKEN}, timeout=15)
                if response.status_code == 200:
                    anos = response.json()
                    if isinstance(anos, list):
                        anos_convertidos = []
                        for ano in anos:
                            if isinstance(ano, dict):
                                name = ano.get('name', '')
                                partes = name.split(' ')
                                anos_convertidos.append({
                                    'codigo': ano.get('id_modelo_ano', ''),
                                    'nome': partes[0] if partes else '',
                                    'id': ano.get('id', ''),
                                    'combustivel': ' '.join(partes[1:]) if len(partes) > 1 else '',
                                    'name': name
                                })
                        if anos_convertidos:
                            return {'success': True, 'anos': anos_convertidos, 'fonte': 'FIPEAPI'}
            except Exception as e:
                logger.warning(f"⚠️ FIPEAPI anos falhou: {e}")
        
        return {'success': False, 'message': 'APIs FIPE indisponíveis'}
            
    except Exception as e:
        logger.error(f"❌ Exceção ao buscar anos FIPE: {str(e)}")
        return {'success': False, 'message': f'Erro: {str(e)}'}


@router.get("/brasil-api/fipe/valor/{tipo}/{marca_codigo}/{modelo_codigo}/{ano_codigo}")
async def get_valor_fipe_brasilapi(
    tipo: str,
    marca_codigo: str,
    modelo_codigo: str,
    ano_codigo: str,
    current_user = Depends(get_current_user)
):
    """
    Busca valor FIPE de um veículo específico usando Parallelum API (gratuita)
    """
    import requests
    import os
    try:
        tipo_map = {
            'carros': 'carros', 'carro': 'carros', 'automovel': 'carros',
            'motos': 'motos', 'moto': 'motos', 'motocicleta': 'motos',
            'caminhoes': 'caminhoes', 'caminhao': 'caminhoes'
        }
        tipo_normalizado = tipo_map.get(tipo.lower(), 'carros')
        
        logger.info(f"🌐 Buscando valor FIPE: {tipo_normalizado} / {marca_codigo} / {modelo_codigo} / {ano_codigo}")
        
        # 1️⃣ Parallelum API (gratuita)
        parallelum_url = f"https://parallelum.com.br/fipe/api/v1/{tipo_normalizado}/marcas/{marca_codigo}/modelos/{modelo_codigo}/anos/{ano_codigo}"
        try:
            response = requests.get(parallelum_url, timeout=15)
            if response.status_code == 200:
                dados = response.json()
                # Formato: {"TipoVeiculo":1,"Valor":"R$ 45.000,00","Marca":"VW","Modelo":"Gol","AnoModelo":2020,"Combustivel":"Gasolina","CodigoFipe":"005401-1","MesReferencia":"janeiro de 2026","SiglaCombustivel":"G"}
                valor = dados.get('Valor', '')
                logger.info(f"✅ Valor FIPE via Parallelum: {valor}")
                
                return {
                    'success': True,
                    'dados': dados,
                    'valor': valor,
                    'marca': dados.get('Marca', ''),
                    'modelo': dados.get('Modelo', ''),
                    'ano_modelo': str(dados.get('AnoModelo', '')),
                    'combustivel': dados.get('Combustivel', ''),
                    'codigo_fipe': dados.get('CodigoFipe', ''),
                    'mes_referencia': dados.get('MesReferencia', 'Atual'),
                    'tipo_veiculo': str(dados.get('TipoVeiculo', '1')),
                    'ano': str(dados.get('AnoModelo', '')),
                    'preco': valor,
                    'fonte': 'Parallelum'
                }
        except Exception as e:
            logger.warning(f"⚠️ Parallelum API valor falhou: {e}")
        
        # 2️⃣ FIPEAPI Fallback
        FIPEAPI_TOKEN = os.environ.get('FIPEAPI_TOKEN', '')
        if FIPEAPI_TOKEN:
            try:
                url = f"https://api.fipeapi.com.br/v1/{tipo_normalizado}/{marca_codigo}/{modelo_codigo}/{ano_codigo}"
                response = requests.get(url, params={'apikey': FIPEAPI_TOKEN}, timeout=15)
                if response.status_code == 200:
                    dados = response.json()
                    if isinstance(dados, dict) and dados.get('preco'):
                        return {
                            'success': True,
                            'dados': dados,
                            'valor': dados.get('preco', ''),
                            'marca': dados.get('marca', ''),
                            'modelo': dados.get('modelo', ''),
                            'ano_modelo': dados.get('ano', ''),
                            'combustivel': dados.get('combustivel', ''),
                            'codigo_fipe': dados.get('fipe_codigo', ''),
                            'mes_referencia': 'Atual',
                            'fonte': 'FIPEAPI'
                        }
            except Exception as e:
                logger.warning(f"⚠️ FIPEAPI valor falhou: {e}")
        
        return {'success': False, 'message': 'APIs FIPE indisponíveis'}
            
    except Exception as e:
        logger.error(f"❌ Exceção ao buscar valor FIPE: {str(e)}")
        return {'success': False, 'message': f'Erro: {str(e)}'}

