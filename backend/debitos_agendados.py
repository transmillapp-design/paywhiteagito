"""
Sistema de Débitos Agendados/Futuros
Proteção Veicular Labelview
"""
from datetime import datetime, timedelta
import uuid
import logging
from dateutil.relativedelta import relativedelta

logger = logging.getLogger(__name__)

async def criar_debitos_agendados_protecao(db, protecao_id: str, cliente_id: str, valor_mensal: float, dia_vencimento: int, data_inicio: datetime):
    """
    Criar débitos agendados para os próximos 12 meses da proteção
    
    Esses débitos aparecem na área "Débitos Futuros" da carteira do cliente
    """
    try:
        debitos_criados = []
        
        # Criar débitos para os próximos 12 meses
        for mes in range(12):
            # Calcular data de vencimento
            if mes == 0:
                # Primeira mensalidade no mês seguinte
                data_vencimento = data_inicio + relativedelta(months=1)
            else:
                data_vencimento = data_inicio + relativedelta(months=mes + 1)
            
            # Ajustar para o dia de vencimento escolhido
            try:
                data_vencimento = data_vencimento.replace(day=dia_vencimento)
            except ValueError:
                # Se o dia não existe no mês (ex: 31 em fevereiro), usar último dia do mês
                data_vencimento = data_vencimento.replace(day=28)
            
            # Criar débito agendado
            debito = {
                "id": str(uuid.uuid4()),
                "cliente_id": cliente_id,
                "protecao_id": protecao_id,
                "tipo": "protecao_veicular",
                "descricao": f"Proteção Veicular - Mensalidade {data_vencimento.strftime('%m/%Y')}",
                "valor": valor_mensal,
                "data_vencimento": data_vencimento,
                "mes_referencia": data_vencimento.strftime("%Y-%m"),
                "status": "pendente",  # pendente, executado, cancelado
                "criado_em": datetime.utcnow()
            }
            
            await db.debitos_agendados.insert_one(debito)
            debitos_criados.append(debito)
        
        logger.info(f"✅ Criados {len(debitos_criados)} débitos agendados para proteção {protecao_id}")
        
        return {
            "success": True,
            "total_debitos": len(debitos_criados),
            "valor_mensal": valor_mensal
        }
        
    except Exception as e:
        logger.error(f"Erro ao criar débitos agendados: {e}")
        return {"success": False, "message": str(e)}


async def marcar_debito_como_executado(db, debito_id: str, transacao_id: str):
    """Marcar débito agendado como executado após cobrança"""
    try:
        await db.debitos_agendados.update_one(
            {"id": debito_id},
            {"$set": {
                "status": "executado",
                "executado_em": datetime.utcnow(),
                "transacao_id": transacao_id
            }}
        )
        return True
    except Exception as e:
        logger.error(f"Erro ao marcar débito como executado: {e}")
        return False


async def cancelar_debitos_agendados_protecao(db, protecao_id: str):
    """Cancelar todos os débitos pendentes de uma proteção (quando cancela proteção)"""
    try:
        result = await db.debitos_agendados.update_many(
            {
                "protecao_id": protecao_id,
                "status": "pendente"
            },
            {"$set": {
                "status": "cancelado",
                "cancelado_em": datetime.utcnow()
            }}
        )
        
        logger.info(f"✅ Cancelados {result.modified_count} débitos agendados da proteção {protecao_id}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao cancelar débitos: {e}")
        return False
