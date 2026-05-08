"""
Sistema de Importação FIPE em Background
Processa grandes volumes de dados sem travar o servidor
"""
import asyncio
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from fipe_integration import FIPEIntegration
import uuid

logger = logging.getLogger(__name__)

class FIPEBackgroundImporter:
    def __init__(self, db):
        self.db = db
        self.status_collection = db['fipe_import_status']
    
    async def start_import(self, user_id: str, modo: str = "completo"):
        """
        Iniciar importação em background
        
        Args:
            user_id: ID do usuário que iniciou
            modo: "completo" (últimos 30 anos) ou "rapido" (últimos 10 anos)
        """
        # Criar registro de status
        import_id = str(uuid.uuid4())
        status_doc = {
            "import_id": import_id,
            "user_id": user_id,
            "modo": modo,
            "status": "iniciando",
            "progress": 0,
            "total_esperado": 0,
            "veiculos_processados": 0,
            "veiculos_salvos": 0,
            "veiculos_duplicados": 0,
            "tipo_atual": "",
            "marca_atual": "",
            "erros": [],
            "started_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "completed_at": None
        }
        
        await self.status_collection.insert_one(status_doc)
        
        # Iniciar task em background
        asyncio.create_task(self._run_import(import_id, user_id, modo))
        
        return {
            "success": True,
            "import_id": import_id,
            "message": "Importação iniciada em background",
            "status_endpoint": f"/api/labelview/fipe/import-status/{import_id}"
        }
    
    async def _run_import(self, import_id: str, user_id: str, modo: str):
        """Executar importação em background"""
        try:
            await self._update_status(import_id, {
                "status": "em_progresso",
                "progress": 1
            })
            
            tipos = ["carros", "motos", "caminhoes"]
            total_salvos = 0
            total_duplicados = 0
            
            for idx, tipo in enumerate(tipos):
                await self._update_status(import_id, {
                    "tipo_atual": tipo,
                    "progress": int((idx / len(tipos)) * 100)
                })
                
                logger.info(f"[{import_id}] Importando {tipo}...")
                
                # Buscar veículos
                importacao_completa = (modo == "completo")
                veiculos = FIPEIntegration.buscar_multiplos_veiculos(
                    tipo=tipo,
                    limite_por_marca=50 if importacao_completa else 10,
                    importacao_completa=importacao_completa
                )
                
                logger.info(f"[{import_id}] Encontrados {len(veiculos)} veículos de {tipo}")
                
                # Salvar no banco
                for veiculo in veiculos:
                    # Verificar duplicata
                    existe = await self.db['fipe_veiculos'].find_one({
                        "$or": [
                            {"codigoFipe": veiculo.get("codigoFipe")},
                            {
                                "marca": veiculo.get("marca"),
                                "modelo": veiculo.get("modelo"),
                                "ano": veiculo.get("ano")
                            }
                        ]
                    })
                    
                    if existe:
                        total_duplicados += 1
                        continue
                    
                    # Detectar subcategoria (lógica simplificada inline)
                    tipo_veiculo = veiculo.get("tipo", "Carro")
                    modelo = veiculo.get("modelo", "").lower()
                    subcategoria = "-"
                    
                    if tipo_veiculo == "Carro":
                        if any(x in modelo for x in ['suv', 'cross', 'tracker', 'compass', 'tucson']):
                            subcategoria = "SUV"
                        elif any(x in modelo for x in ['picape', 'saveiro', 'strada', 'montana', 'toro']):
                            subcategoria = "Picape"
                        elif any(x in modelo for x in ['sedan', 'civic', 'corolla']):
                            subcategoria = "Sedan"
                        else:
                            subcategoria = "Hatch"
                    elif tipo_veiculo == "Caminhão":
                        subcategoria = "Caminhão Leve"
                    else:
                        subcategoria = "-"
                    
                    # Salvar
                    veiculo_data = {
                        "id": str(uuid.uuid4()),
                        "codigoFipe": veiculo.get("codigoFipe", ""),
                        "tipo": veiculo.get("tipo", "Carro"),
                        "subcategoria": subcategoria,
                        "marca": veiculo.get("marca", ""),
                        "modelo": veiculo.get("modelo", ""),
                        "ano": veiculo.get("ano", ""),
                        "combustivel": veiculo.get("combustivel", ""),
                        "valor": veiculo.get("valor", "R$ 0,00"),
                        "mesReferencia": veiculo.get("mesReferencia", ""),
                        "categoria": "Nacional",
                        "created_at": datetime.utcnow(),
                        "created_by": user_id,
                        "origem": "api_fipe_background"
                    }
                    
                    await self.db['fipe_veiculos'].insert_one(veiculo_data)
                    total_salvos += 1
                    
                    # Atualizar progresso a cada 10 veículos
                    if total_salvos % 10 == 0:
                        await self._update_status(import_id, {
                            "veiculos_salvos": total_salvos,
                            "veiculos_duplicados": total_duplicados,
                            "marca_atual": veiculo.get("marca", "")
                        })
            
            # Finalizar
            await self._update_status(import_id, {
                "status": "concluido",
                "progress": 100,
                "veiculos_salvos": total_salvos,
                "veiculos_duplicados": total_duplicados,
                "completed_at": datetime.utcnow()
            })
            
            logger.info(f"[{import_id}] Importação concluída: {total_salvos} salvos, {total_duplicados} duplicados")
            
        except Exception as e:
            logger.error(f"[{import_id}] Erro na importação: {e}")
            await self._update_status(import_id, {
                "status": "erro",
                "erros": [str(e)],
                "completed_at": datetime.utcnow()
            })
    
    async def _update_status(self, import_id: str, updates: dict):
        """Atualizar status da importação"""
        updates["updated_at"] = datetime.utcnow()
        await self.status_collection.update_one(
            {"import_id": import_id},
            {"$set": updates}
        )
    
    async def get_status(self, import_id: str):
        """Obter status da importação"""
        status = await self.status_collection.find_one({"import_id": import_id})
        if status:
            status['_id'] = str(status['_id'])
        return status
