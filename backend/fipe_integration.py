"""
Integração com API FIPE
API: https://api.invertexto.com/v1/fipe
Token armazenado de forma segura em variável de ambiente
"""
import requests
from typing import List, Dict, Optional
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

FIPE_BASE_URL = "https://api.invertexto.com/v1/fipe"
FIPE_TOKEN = os.environ.get('FIPE_API_TOKEN', '')

class FIPEIntegration:
    
    @staticmethod
    def get_marcas(tipo: str = "carros") -> List[Dict]:
        """
        Buscar marcas de veículos
        tipo: carros, motos, caminhoes
        Convertido para: 1=carros, 2=motos, 3=caminhões (API Invertexto)
        """
        try:
            # Converter tipo para código da API Invertexto
            tipo_codigo = "1"  # carros
            if tipo == "motos":
                tipo_codigo = "2"
            elif tipo == "caminhoes":
                tipo_codigo = "3"
            
            url = f"{FIPE_BASE_URL}/brands/{tipo_codigo}"
            params = {"token": FIPE_TOKEN}
            headers = {"Accept": "application/json"}
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            # Converter formato da resposta para o formato esperado
            # API Invertexto retorna: [{"id": 1, "brand": "Acura"}]
            # Formato esperado: [{"codigo": "1", "nome": "Acura"}]
            marcas_raw = response.json()
            marcas_convertidas = []
            for marca in marcas_raw:
                marcas_convertidas.append({
                    "codigo": str(marca.get("id", "")),
                    "nome": marca.get("brand", "")
                })
            return marcas_convertidas
        except Exception as e:
            logger.error(f"Erro ao buscar marcas {tipo}: {e}")
            return []
    
    @staticmethod
    def get_modelos(tipo: str, marca_codigo: str) -> Dict:
        """
        Buscar modelos de uma marca
        API Invertexto: GET /v1/fipe/models/:brand_id
        """
        try:
            url = f"{FIPE_BASE_URL}/models/{marca_codigo}"
            params = {"token": FIPE_TOKEN}
            headers = {"Accept": "application/json"}
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            # Converter formato da resposta
            # API Invertexto retorna: [{"id": 123, "fipe_code": "001004-1", "model": "Civic"}]
            # Formato esperado: {"modelos": [{"codigo": 123, "nome": "Civic"}], "anos": []}
            modelos_raw = response.json()
            modelos_convertidos = []
            for modelo in modelos_raw:
                modelos_convertidos.append({
                    "codigo": modelo.get("id", ""),
                    "nome": modelo.get("model", ""),
                    "fipe_code": modelo.get("fipe_code", "")
                })
            return {"modelos": modelos_convertidos, "anos": []}
        except Exception as e:
            logger.error(f"Erro ao buscar modelos {tipo}/{marca_codigo}: {e}")
            return {"modelos": [], "anos": []}
    
    @staticmethod
    def get_anos(tipo: str, marca_codigo: str, modelo_codigo: str, fipe_code: str = None) -> List[Dict]:
        """
        Buscar anos de um modelo usando o código FIPE
        API Invertexto: GET /v1/fipe/years/:fipe_code
        Retorna: {"brand": "...", "model": "...", "years": [{"year_id": "2023-1", "model_year": "2023", "price": 100000}]}
        """
        try:
            if not fipe_code:
                logger.warning(f"Código FIPE não fornecido para modelo {modelo_codigo}")
                return []
            
            url = f"{FIPE_BASE_URL}/years/{fipe_code}"
            params = {"token": FIPE_TOKEN}
            headers = {"Accept": "application/json"}
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            # Converter formato da resposta
            # API Invertexto retorna: {"brand": "...", "years": [{"year_id": "2023-1", "model_year": "2023", "price": 100000}]}
            # Formato esperado: [{"codigo": "2023-1", "nome": "2023", "price": "R$ 100.000,00"}]
            data = response.json()
            anos_raw = data.get("years", [])
            anos_convertidos = []
            for ano in anos_raw:
                # Converter preço numérico para formato brasileiro
                price_num = ano.get("price", 0)
                price_str = f"R$ {price_num:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                
                anos_convertidos.append({
                    "codigo": ano.get("year_id", ""),
                    "nome": str(ano.get("model_year", "")),
                    "price": price_str,
                    "fuel": ano.get("fuel", "N/A")
                })
            return anos_convertidos
        except Exception as e:
            logger.error(f"Erro ao buscar anos {tipo}/{marca_codigo}/{modelo_codigo}: {e}")
            return []
    
    @staticmethod
    def get_valor(tipo: str, marca_codigo: str, modelo_codigo: str, ano_codigo: str, fipe_code: str = None, year: str = None) -> Optional[Dict]:
        """
        Buscar valor de um veículo específico
        Na API Invertexto, os anos já vêm com o preço, então retornamos um formato compatível
        """
        try:
            # Na nova API, já recebemos o preço junto com os anos
            # Este método serve para manter compatibilidade
            if not fipe_code or not year:
                logger.warning(f"Dados insuficientes para buscar valor: fipe_code={fipe_code}, year={year}")
                return None
            
            # Buscar os anos novamente para pegar o preço
            url = f"{FIPE_BASE_URL}/years/{fipe_code}"
            params = {"token": FIPE_TOKEN}
            headers = {"Accept": "application/json"}
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            anos_data = response.json()
            
            # Encontrar o ano específico
            for ano in anos_data:
                if str(ano.get("year")) == str(year):
                    # Retornar no formato esperado
                    return {
                        "Valor": ano.get("price", "R$ 0,00"),
                        "Marca": marca_codigo,
                        "Modelo": modelo_codigo,
                        "AnoModelo": year,
                        "Combustivel": "N/A",
                        "CodigoFipe": fipe_code,
                        "MesReferencia": "atual",
                        "TipoVeiculo": "1" if tipo == "carros" else "2" if tipo == "motos" else "3"
                    }
            
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar valor {tipo}/{marca_codigo}/{modelo_codigo}/{ano_codigo}: {e}")
            return None
    
    @staticmethod
    def buscar_multiplos_veiculos(tipo: str = "carros", limite_por_marca: int = 5, importacao_completa: bool = False) -> List[Dict]:
        """
        Buscar veículos de um tipo
        
        Args:
            tipo: "carros", "motos" ou "caminhoes"
            limite_por_marca: quantidade de modelos por marca (quando não é completa)
            importacao_completa: True = busca TODAS marcas e TODOS modelos
        """
        veiculos = []
        
        try:
            # Buscar todas as marcas
            todas_marcas = FIPEIntegration.get_marcas(tipo)
            
            if not todas_marcas:
                logger.warning(f"Nenhuma marca encontrada para {tipo}")
                return []
            
            # Selecionar marcas para buscar
            if importacao_completa:
                # IMPORTAÇÃO COMPLETA: TODAS as marcas
                marcas_selecionadas = todas_marcas
                logger.info(f"🔥 IMPORTAÇÃO COMPLETA: Buscando TODAS as {len(todas_marcas)} marcas de {tipo}")
            else:
                # Importação limitada: marcas populares
                marcas_populares_carros = ['21', '59', '22', '1', '6', '11', '23', '26', '28', '31', '38', '44', '56', '80', '161']  
                # Fiat, VW, Chevrolet, Acura, Audi, BMW, Citroën, Ford, Honda, Hyundai, Jeep, Kia, Mitsubishi, Nissan, Peugeot, Renault, Toyota
                
                if tipo == 'carros':
                    marcas_selecionadas = [m for m in todas_marcas if m['codigo'] in marcas_populares_carros]
                else:
                    marcas_selecionadas = todas_marcas[:10]  # Primeiras 10 marcas
                
                if not marcas_selecionadas:
                    marcas_selecionadas = todas_marcas[:10]  # Fallback
                
                logger.info(f"Buscando {len(marcas_selecionadas)} marcas de {tipo}")
            
            for marca in marcas_selecionadas:
                marca_codigo = marca['codigo']
                marca_nome = marca['nome']
                
                # Buscar modelos da marca
                modelos_data = FIPEIntegration.get_modelos(tipo, marca_codigo)
                modelos = modelos_data.get('modelos', [])
                
                if not modelos:
                    continue
                
                # Limitar modelos por marca (ou todos se importação completa)
                limite_modelos = len(modelos) if importacao_completa else limite_por_marca
                for modelo in modelos[:limite_modelos]:
                    modelo_codigo = str(modelo['codigo'])
                    modelo_nome = modelo['nome']
                    fipe_code = modelo.get('fipe_code', '')
                    
                    if not fipe_code:
                        logger.warning(f"Modelo sem fipe_code: {marca_nome} {modelo_nome}")
                        continue
                    
                    # Buscar anos do modelo
                    anos = FIPEIntegration.get_anos(tipo, marca_codigo, modelo_codigo, fipe_code)
                    
                    if not anos:
                        continue
                    
                    # Filtrar últimos 30 anos (de 1995 até hoje)
                    from datetime import datetime
                    ano_atual = datetime.now().year
                    ano_minimo = ano_atual - 30  # Ex: 2025 - 30 = 1995
                    
                    anos_filtrados = []
                    for ano in anos:
                        try:
                            ano_numero = int(ano.get('nome', '0'))
                            if ano_numero >= ano_minimo:
                                anos_filtrados.append(ano)
                        except:
                            continue
                    
                    if not anos_filtrados:
                        continue
                    
                    # Importar TODOS os anos filtrados (últimos 30 anos)
                    for ano in anos_filtrados:
                        ano_codigo = ano.get('codigo', '')
                        ano_nome = ano.get('nome', '')
                        ano_preco = ano.get('price', 'R$ 0,00')
                        ano_combustivel = ano.get('fuel', 'N/A')
                        
                        # Na nova API, o preço já vem junto com os anos
                        # Criar valor_data diretamente
                        valor_data = {
                            'Valor': ano_preco,
                            'Marca': marca_nome,
                            'Modelo': modelo_nome,
                            'AnoModelo': ano_nome,
                            'Combustivel': ano_combustivel,
                            'CodigoFipe': fipe_code,
                            'MesReferencia': 'atual',
                            'TipoVeiculo': '1' if tipo == 'carros' else '2' if tipo == 'motos' else '3'
                        }
                        
                        if valor_data:
                            # Normalizar tipo
                            tipo_normalizado = 'Carro' if tipo == 'carros' else 'Moto' if tipo == 'motos' else 'Caminhão'
                            
                            veiculo = {
                                'tipo': tipo_normalizado,
                                'marca': marca_nome,
                                'modelo': modelo_nome,
                                'ano': ano_nome.split(' ')[0] if ' ' in ano_nome else ano_nome,
                                'combustivel': valor_data.get('Combustivel', 'N/A'),
                                'valor': valor_data.get('Valor', 'R$ 0,00'),
                                'mesReferencia': valor_data.get('MesReferencia', 'N/A'),
                                'codigoFipe': valor_data.get('CodigoFipe', 'N/A'),
                                'anoModelo': valor_data.get('AnoModelo', 'N/A'),
                                'tipoVeiculo': valor_data.get('TipoVeiculo', '1')
                            }
                            veiculos.append(veiculo)
                            logger.info(f"Veículo adicionado: {marca_nome} {modelo_nome} (Total: {len(veiculos)})")
                            
                            # Para importação limitada, parar em 1000 veículos para performance
                            if not importacao_completa and len(veiculos) >= 1000:
                                logger.info(f"Limite de 1000 veículos atingido para importação limitada de {tipo}")
                                return veiculos
            
            logger.info(f"Total de veículos coletados para {tipo}: {len(veiculos)}")
            return veiculos
        except Exception as e:
            logger.error(f"Erro ao buscar todos os veículos {tipo}: {e}")
            return []
