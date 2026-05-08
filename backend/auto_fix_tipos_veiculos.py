"""
AUTO-FIX: Correção automática de tipos de veículos na inicialização
Este arquivo é executado automaticamente quando o backend inicia
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

async def auto_fix_tipos_veiculos():
    """
    Corrige automaticamente tipos de veículos no banco
    "Carro Leve" → "Carros Leves"
    "Aplicativo" → "Aplicativos"
    """
    try:
        # Conectar ao MongoDB
        MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(MONGO_URL)
        db = client.transmill
        
        logger.info("🔍 Verificando tipos de veículos no banco...")
        
        # Mapeamento de correções
        correcoes = {
            # Removido: "Carro Leve" → "Carros Leves" (usuário prefere singular)
            "Aplicativo": "Aplicativos",
            "Carros Leves": "Carro Leve"  # Reverter para singular conforme solicitado
        }
        
        total_corrigidos = 0
        
        # Aplicar correções
        for tipo_errado, tipo_correto in correcoes.items():
            # Contar registros com problema
            count_errado = await db.labelview_tabelas_valores.count_documents({
                "tipo_veiculo_assistencia": tipo_errado
            })
            
            if count_errado > 0:
                logger.info(f"🔧 Corrigindo '{tipo_errado}' → '{tipo_correto}' ({count_errado} registros)")
                
                result = await db.labelview_tabelas_valores.update_many(
                    {"tipo_veiculo_assistencia": tipo_errado},
                    {"$set": {"tipo_veiculo_assistencia": tipo_correto}}
                )
                
                total_corrigidos += result.modified_count
                logger.info(f"   ✅ {result.modified_count} registros corrigidos")
        
        if total_corrigidos > 0:
            logger.info(f"✅ AUTO-FIX COMPLETO: {total_corrigidos} registros corrigidos")
        else:
            logger.info("✅ Tipos de veículos já estão corretos")
        
        client.close()
        
    except Exception as e:
        logger.error(f"⚠️ Erro no auto-fix de tipos de veículos: {e}")
        # Não falhar a inicialização do backend por causa disso

def run_auto_fix():
    """Função síncrona para chamar da inicialização do servidor"""
    try:
        asyncio.run(auto_fix_tipos_veiculos())
    except Exception as e:
        logger.error(f"Erro ao executar auto-fix: {e}")
