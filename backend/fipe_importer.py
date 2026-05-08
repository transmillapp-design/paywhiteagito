"""
Script para importar dados da API FIPE gratuita e armazenar no MongoDB
Executar: python3 fipe_importer.py
"""
import requests
import time
from pymongo import MongoClient
import os
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações
FIPE_BASE_URL = "https://parallelum.com.br/fipe/api/v1"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'transmill')
COLLECTION_NAME = 'fipe_veiculos'

# Delay entre requisições para evitar rate limit
DELAY_BETWEEN_REQUESTS = 0.5  # 500ms

class FIPEImporter:
    def __init__(self):
        self.client = MongoClient(MONGO_URL)
        self.db = self.client[DB_NAME]
        self.collection = self.db[COLLECTION_NAME]
        self.stats = {
            'carros': 0,
            'motos': 0,
            'caminhoes': 0,
            'total': 0,
            'erros': 0
        }
    
    def get_marcas(self, tipo):
        """Buscar marcas de veículos"""
        try:
            url = f"{FIPE_BASE_URL}/{tipo}/marcas"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            time.sleep(DELAY_BETWEEN_REQUESTS)
            return response.json()
        except Exception as e:
            logger.error(f"Erro ao buscar marcas {tipo}: {e}")
            return []
    
    def get_modelos(self, tipo, marca_codigo):
        """Buscar modelos de uma marca"""
        try:
            url = f"{FIPE_BASE_URL}/{tipo}/marcas/{marca_codigo}/modelos"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            time.sleep(DELAY_BETWEEN_REQUESTS)
            return response.json()
        except Exception as e:
            logger.error(f"Erro ao buscar modelos: {e}")
            return {"modelos": []}
    
    def get_anos(self, tipo, marca_codigo, modelo_codigo):
        """Buscar anos de um modelo"""
        try:
            url = f"{FIPE_BASE_URL}/{tipo}/marcas/{marca_codigo}/modelos/{modelo_codigo}/anos"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            time.sleep(DELAY_BETWEEN_REQUESTS)
            return response.json()
        except Exception as e:
            logger.error(f"Erro ao buscar anos: {e}")
            return []
    
    def get_valor(self, tipo, marca_codigo, modelo_codigo, ano_codigo):
        """Buscar valor de um veículo"""
        try:
            url = f"{FIPE_BASE_URL}/{tipo}/marcas/{marca_codigo}/modelos/{modelo_codigo}/anos/{ano_codigo}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            time.sleep(DELAY_BETWEEN_REQUESTS)
            return response.json()
        except Exception as e:
            logger.error(f"Erro ao buscar valor: {e}")
            return None
    
    def importar_tipo(self, tipo, limite_marcas=5, limite_modelos=10, limite_anos=3):
        """
        Importar veículos de um tipo específico
        
        Args:
            tipo: carros, motos ou caminhoes
            limite_marcas: quantas marcas importar (None = todas)
            limite_modelos: quantos modelos por marca
            limite_anos: quantos anos por modelo
        """
        tipo_normalizado = 'Carro' if tipo == 'carros' else 'Moto' if tipo == 'motos' else 'Caminhão'
        logger.info(f"\n{'='*60}")
        logger.info(f"IMPORTANDO {tipo_normalizado.upper()}")
        logger.info(f"{'='*60}")
        
        # Buscar marcas
        marcas = self.get_marcas(tipo)
        if not marcas:
            logger.warning(f"❌ Nenhuma marca encontrada para {tipo}")
            return
        
        total_marcas = len(marcas)
        marcas_a_processar = marcas[:limite_marcas] if limite_marcas else marcas
        
        logger.info(f"📊 Total de marcas disponíveis: {total_marcas}")
        logger.info(f"📥 Processando {len(marcas_a_processar)} marcas...\n")
        
        for idx_marca, marca in enumerate(marcas_a_processar, 1):
            marca_codigo = marca['codigo']
            marca_nome = marca['nome']
            
            logger.info(f"[{idx_marca}/{len(marcas_a_processar)}] Marca: {marca_nome}")
            
            # Buscar modelos
            modelos_data = self.get_modelos(tipo, marca_codigo)
            modelos = modelos_data.get('modelos', [])
            
            if not modelos:
                logger.warning(f"  ⚠️  Nenhum modelo encontrado")
                continue
            
            modelos_a_processar = modelos[:limite_modelos] if limite_modelos else modelos
            logger.info(f"  📦 Processando {len(modelos_a_processar)}/{len(modelos)} modelos...")
            
            for modelo in modelos_a_processar:
                modelo_codigo = str(modelo['codigo'])
                modelo_nome = modelo['nome']
                
                # Buscar anos
                anos = self.get_anos(tipo, marca_codigo, modelo_codigo)
                if not anos:
                    continue
                
                anos_a_processar = anos[:limite_anos] if limite_anos else anos
                
                for ano in anos_a_processar:
                    ano_codigo = ano['codigo']
                    ano_nome = ano['nome']
                    
                    # Buscar valor
                    valor_data = self.get_valor(tipo, marca_codigo, modelo_codigo, ano_codigo)
                    
                    if valor_data:
                        # Preparar documento
                        veiculo = {
                            'tipo': tipo_normalizado,
                            'marca': marca_nome,
                            'marca_codigo': marca_codigo,
                            'modelo': modelo_nome,
                            'modelo_codigo': modelo_codigo,
                            'ano': ano_nome.split(' ')[0] if ' ' in ano_nome else ano_nome,
                            'ano_codigo': ano_codigo,
                            'combustivel': valor_data.get('Combustivel', 'N/A'),
                            'valor': valor_data.get('Valor', 'R$ 0,00'),
                            'valor_numerico': self.parse_valor(valor_data.get('Valor', 'R$ 0,00')),
                            'mesReferencia': valor_data.get('MesReferencia', 'N/A'),
                            'codigoFipe': valor_data.get('CodigoFipe', 'N/A'),
                            'anoModelo': valor_data.get('AnoModelo', 'N/A'),
                            'tipoVeiculo': valor_data.get('TipoVeiculo', '1'),
                            'siglaCombustivel': valor_data.get('SiglaCombustivel', 'N/A'),
                            'imported_at': datetime.utcnow(),
                            'fonte': 'parallelum_fipe_api'
                        }
                        
                        # Inserir ou atualizar no MongoDB
                        self.collection.update_one(
                            {
                                'tipo': tipo_normalizado,
                                'marca_codigo': marca_codigo,
                                'modelo_codigo': modelo_codigo,
                                'ano_codigo': ano_codigo
                            },
                            {'$set': veiculo},
                            upsert=True
                        )
                        
                        self.stats[tipo] += 1
                        self.stats['total'] += 1
                        
                        if self.stats['total'] % 10 == 0:
                            logger.info(f"  ✅ {self.stats['total']} veículos importados...")
                    else:
                        self.stats['erros'] += 1
            
            logger.info(f"  ✓ Marca {marca_nome} concluída\n")
    
    def parse_valor(self, valor_str):
        """Converter valor string para número"""
        try:
            # Remove "R$" e espaços, substitui ponto por nada e vírgula por ponto
            valor_limpo = valor_str.replace('R$', '').replace(' ', '').replace('.', '').replace(',', '.')
            return float(valor_limpo)
        except:
            return 0.0
    
    def importar_todos(self, limite_marcas_por_tipo=5):
        """Importar carros, motos e caminhões"""
        inicio = time.time()
        
        logger.info("\n" + "="*60)
        logger.info("INICIANDO IMPORTAÇÃO DA TABELA FIPE")
        logger.info("="*60 + "\n")
        
        # Limpar collection antes de importar (opcional)
        # self.collection.delete_many({})
        # logger.info("🗑️  Collection limpa\n")
        
        # Importar cada tipo
        self.importar_tipo('carros', limite_marcas=limite_marcas_por_tipo, limite_modelos=10, limite_anos=2)
        self.importar_tipo('motos', limite_marcas=limite_marcas_por_tipo, limite_modelos=10, limite_anos=2)
        self.importar_tipo('caminhoes', limite_marcas=limite_marcas_por_tipo, limite_modelos=10, limite_anos=2)
        
        duracao = time.time() - inicio
        
        # Resumo final
        logger.info("\n" + "="*60)
        logger.info("IMPORTAÇÃO CONCLUÍDA!")
        logger.info("="*60)
        logger.info(f"\n📊 ESTATÍSTICAS:")
        logger.info(f"  🚗 Carros: {self.stats['carros']}")
        logger.info(f"  🏍️  Motos: {self.stats['motos']}")
        logger.info(f"  🚛 Caminhões: {self.stats['caminhoes']}")
        logger.info(f"  ✅ Total: {self.stats['total']}")
        logger.info(f"  ❌ Erros: {self.stats['erros']}")
        logger.info(f"  ⏱️  Tempo: {duracao:.2f}s ({duracao/60:.2f}min)")
        logger.info(f"  💾 Collection: {COLLECTION_NAME}")
        logger.info("")
        
        # Criar índices
        logger.info("📇 Criando índices...")
        self.collection.create_index([('tipo', 1)])
        self.collection.create_index([('marca', 1)])
        self.collection.create_index([('modelo', 1)])
        self.collection.create_index([('ano', 1)])
        self.collection.create_index([('valor_numerico', 1)])
        self.collection.create_index([('codigoFipe', 1)])
        logger.info("✅ Índices criados!")
        
        self.client.close()


if __name__ == "__main__":
    importer = FIPEImporter()
    
    # Importar 5 marcas de cada tipo (carros, motos, caminhões)
    # Isso dará ~300 veículos em alguns minutos
    importer.importar_todos(limite_marcas_por_tipo=5)
    
    # Para importar TUDO (demora horas):
    # importer.importar_todos(limite_marcas_por_tipo=None)
