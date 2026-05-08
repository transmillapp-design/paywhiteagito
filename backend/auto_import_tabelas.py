"""
AUTO-IMPORT: Importação automática de todas as tabelas na inicialização
Este arquivo é executado automaticamente quando o backend inicia
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

async def auto_import_todas_tabelas():
    """
    Importa automaticamente todas as tabelas de valores se não existirem
    """
    try:
        # Conectar ao MongoDB
        MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(MONGO_URL)
        db = client.transmill
        
        logger.info("🔍 Verificando tabelas de valores no banco...")
        
        # Importar funções
        from tabelas_valores import (
            importar_assistencia_24h,
            importar_vidros_farois_lanternas,
            importar_carro_reserva,
            importar_colisao,
            importar_danos_materiais_terceiros
        )
        
        servicos_importar = [
            {
                "nome": "Assistencia 24hs",
                "funcao": importar_assistencia_24h,
                "tipo_cobertura": "Assistencia 24hs"
            },
            {
                "nome": "Vidros, Faróis e Lanternas",
                "funcao": importar_vidros_farois_lanternas,
                "tipo_cobertura": "Vidros, Farois e Lanternas"
            },
            {
                "nome": "Carro Reserva",
                "funcao": importar_carro_reserva,
                "tipo_cobertura": "Carro Reserva"
            },
            {
                "nome": "Colisão",
                "funcao": importar_colisao,
                "tipo_cobertura": "Colisão"
            },
            {
                "nome": "Danos Materiais e Terceiros",
                "funcao": importar_danos_materiais_terceiros,
                "tipo_cobertura": "Danos materiais e Terceiros"
            }
        ]
        
        total_importados = 0
        
        for servico in servicos_importar:
            # Verificar se já existe
            count = await db.labelview_tabelas_valores.count_documents({
                "tipo_cobertura": servico["tipo_cobertura"],
                "ativo": True
            })
            
            if count == 0:
                logger.info(f"📦 Importando {servico['nome']}...")
                resultado = await servico["funcao"](db, "auto-import")
                
                if resultado['success']:
                    registros = resultado.get('registros_criados', 0)
                    logger.info(f"   ✅ {servico['nome']}: {registros} registros criados")
                    total_importados += registros
                else:
                    logger.warning(f"   ⚠️ {servico['nome']}: {resultado.get('message', 'Erro desconhecido')}")
            else:
                logger.info(f"✓ {servico['nome']}: {count} registros já existem")
        
        if total_importados > 0:
            logger.info(f"✅ AUTO-IMPORT COMPLETO: {total_importados} registros criados no total")
        else:
            logger.info("✅ Todas as tabelas já estavam importadas")
        
        client.close()
        
    except Exception as e:
        logger.error(f"⚠️ Erro no auto-import de tabelas: {e}")
        # Não falhar a inicialização do backend por causa disso

def run_auto_import():
    """Função síncrona para chamar da inicialização do servidor"""
    try:
        asyncio.run(auto_import_todas_tabelas())
    except Exception as e:
        logger.error(f"Erro ao executar auto-import: {e}")
