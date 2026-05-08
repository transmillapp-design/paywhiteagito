"""
Sistema de Cobrança Recorrente com Split Automático
Proteção Veicular Labelview
"""
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid
import os
import logging

logger = logging.getLogger(__name__)

async def processar_cobranca_mensal_protecao(db, protecao_id: str):
    """
    Processar cobrança mensal da proteção veicular com SPLIT AUTOMÁTICO
    
    Fluxo:
    1. Debita valor da carteira do CLIENTE
    2. NO MESMO MOMENTO faz SPLIT para beneficiários (Consultor/Regional/Unidade)
    3. Cada um recebe instantaneamente na sua carteira AgitoMil
    4. Registra todas as transações
    """
    try:
        # Buscar proteção ativa
        protecao = await db.protecoes_veiculares.find_one({"id": protecao_id})
        
        if not protecao or protecao.get('status') != 'ativa':
            logger.warning(f"Proteção {protecao_id} não está ativa")
            return {"success": False, "message": "Proteção não está ativa"}
        
        cliente_id = protecao.get('cliente_id')
        valor_mensal = protecao.get('valor_total_mensal', 0)
        
        # Buscar cliente
        cliente = await db.users.find_one({"id": cliente_id})
        if not cliente:
            logger.error(f"Cliente não encontrado: {cliente_id}")
            return {"success": False, "message": "Cliente não encontrado"}
        
        saldo_cliente = cliente.get('wallet_balance', 0)
        
        # Verificar se cliente tem saldo
        if saldo_cliente < valor_mensal:
            logger.warning(f"Cliente {cliente.get('email')} sem saldo suficiente")
            
            # Marcar proteção como "suspensa por falta de pagamento"
            await db.protecoes_veiculares.update_one(
                {"id": protecao_id},
                {"$set": {
                    "status": "suspensa",
                    "motivo_suspensao": "Saldo insuficiente",
                    "suspensa_em": datetime.utcnow()
                }}
            )
            
            return {
                "success": False,
                "message": f"Saldo insuficiente. Necessário: R$ {valor_mensal:.2f}, Disponível: R$ {saldo_cliente:.2f}"
            }
        
        # ========================================
        # CALCULAR COMISSÕES (SPLIT)
        # ========================================
        
        indicado_por_tipo = protecao.get('indicado_por_tipo')
        indicado_por_id = protecao.get('indicado_por_id')
        
        # Percentuais padrão
        percentual_padrao_consultor = 0.10
        percentual_padrao_regional = 0.15
        percentual_padrao_unidade = 0.75
        
        splits = []
        
        if not indicado_por_id:
            # Cliente não indicado - Master recebe 100%
            master = await db.users.find_one({"is_labelview_master": True})
            if master:
                splits.append({
                    "beneficiario_id": master.get('id'),
                    "beneficiario_nome": master.get('full_name'),
                    "tipo": "unidade_master",
                    "percentual": 1.0,
                    "valor": valor_mensal
                })
        
        elif indicado_por_tipo == "consultor":
            # Split: Consultor + Regional + Unidade
            consultor = await db.users.find_one({"id": indicado_por_id})
            if consultor:
                percentual_consultor = consultor.get('comissao_protecao_veicular', percentual_padrao_consultor)
                splits.append({
                    "beneficiario_id": consultor.get('id'),
                    "beneficiario_nome": consultor.get('full_name'),
                    "tipo": "consultor",
                    "percentual": percentual_consultor,
                    "valor": valor_mensal * percentual_consultor
                })
                
                # Regional
                regional_id = consultor.get('parent_id')
                if regional_id:
                    regional = await db.users.find_one({"id": regional_id})
                    if regional:
                        percentual_regional = regional.get('comissao_protecao_veicular', percentual_padrao_regional)
                        splits.append({
                            "beneficiario_id": regional.get('id'),
                            "beneficiario_nome": regional.get('full_name'),
                            "tipo": "regional",
                            "percentual": percentual_regional,
                            "valor": valor_mensal * percentual_regional
                        })
                        
                        # Unidade
                        unidade_id = regional.get('parent_id')
                        if unidade_id:
                            unidade = await db.users.find_one({"id": unidade_id})
                            if unidade:
                                percentual_unidade = unidade.get('comissao_protecao_veicular', percentual_padrao_unidade)
                                splits.append({
                                    "beneficiario_id": unidade.get('id'),
                                    "beneficiario_nome": unidade.get('full_name'),
                                    "tipo": "unidade",
                                    "percentual": percentual_unidade,
                                    "valor": valor_mensal * percentual_unidade
                                })
        
        elif indicado_por_tipo == "regional":
            # Split: Regional + Unidade
            regional = await db.users.find_one({"id": indicado_por_id})
            if regional:
                percentual_regional = regional.get('comissao_protecao_veicular', percentual_padrao_regional)
                percentual_regional_total = percentual_padrao_consultor + percentual_regional
                splits.append({
                    "beneficiario_id": regional.get('id'),
                    "beneficiario_nome": regional.get('full_name'),
                    "tipo": "regional",
                    "percentual": percentual_regional_total,
                    "valor": valor_mensal * percentual_regional_total
                })
                
                unidade_id = regional.get('parent_id')
                if unidade_id:
                    unidade = await db.users.find_one({"id": unidade_id})
                    if unidade:
                        percentual_unidade = unidade.get('comissao_protecao_veicular', percentual_padrao_unidade)
                        splits.append({
                            "beneficiario_id": unidade.get('id'),
                            "beneficiario_nome": unidade.get('full_name'),
                            "tipo": "unidade",
                            "percentual": percentual_unidade,
                            "valor": valor_mensal * percentual_unidade
                        })
        
        elif indicado_por_tipo == "unidade":
            # Split: Unidade recebe 100%
            unidade = await db.users.find_one({"id": indicado_por_id})
            if unidade:
                percentual_unidade = unidade.get('comissao_protecao_veicular', 1.0)
                splits.append({
                    "beneficiario_id": unidade.get('id'),
                    "beneficiario_nome": unidade.get('full_name'),
                    "tipo": "unidade",
                    "percentual": percentual_unidade,
                    "valor": valor_mensal * percentual_unidade
                })
        
        # ========================================
        # EXECUTAR TRANSAÇÕES (DÉBITO + SPLITS)
        # ========================================
        
        mes_referencia = datetime.utcnow().strftime("%Y-%m")
        data_cobranca = datetime.utcnow()
        
        # 1. DEBITAR DO CLIENTE
        novo_saldo_cliente = saldo_cliente - valor_mensal
        
        await db.users.update_one(
            {"id": cliente_id},
            {"$set": {"wallet_balance": novo_saldo_cliente}}
        )
        
        # Registrar débito no extrato do cliente
        transacao_debito = {
            "id": str(uuid.uuid4()),
            "user_id": cliente_id,
            "tipo": "debito",
            "categoria": "pagamento_protecao_veicular",
            "valor": valor_mensal,
            "saldo_anterior": saldo_cliente,
            "saldo_atual": novo_saldo_cliente,
            "descricao": f"Proteção Veicular - Mensalidade {mes_referencia}",
            "protecao_id": protecao_id,
            "mes_referencia": mes_referencia,
            "data": data_cobranca,
            "status": "concluido"
        }
        
        await db.wallet_transactions.insert_one(transacao_debito)
        
        # 2. CREDITAR BENEFICIÁRIOS (SPLIT AUTOMÁTICO)
        splits_executados = []
        
        for split in splits:
            beneficiario_id = split['beneficiario_id']
            valor_split = split['valor']
            
            # Buscar saldo atual do beneficiário
            beneficiario = await db.users.find_one({"id": beneficiario_id})
            if beneficiario:
                saldo_anterior = beneficiario.get('wallet_balance', 0)
                novo_saldo = saldo_anterior + valor_split
                
                # Atualizar saldo
                await db.users.update_one(
                    {"id": beneficiario_id},
                    {"$set": {"wallet_balance": novo_saldo}}
                )
                
                # Registrar crédito no extrato
                transacao_credito = {
                    "id": str(uuid.uuid4()),
                    "user_id": beneficiario_id,
                    "tipo": "credito",
                    "categoria": "comissao_protecao_veicular",
                    "valor": valor_split,
                    "saldo_anterior": saldo_anterior,
                    "saldo_atual": novo_saldo,
                    "descricao": f"Comissão Proteção Veicular - {split['tipo'].title()} - Ref: {mes_referencia}",
                    "protecao_id": protecao_id,
                    "mes_referencia": mes_referencia,
                    "data": data_cobranca,
                    "status": "concluido"
                }
                
                await db.wallet_transactions.insert_one(transacao_credito)
                
                splits_executados.append({
                    "beneficiario": split['beneficiario_nome'],
                    "valor": valor_split,
                    "percentual": split['percentual'] * 100
                })
        
        # 3. REGISTRAR COBRANÇA
        cobranca_doc = {
            "id": str(uuid.uuid4()),
            "protecao_id": protecao_id,
            "cliente_id": cliente_id,
            "valor_cobrado": valor_mensal,
            "mes_referencia": mes_referencia,
            "data_cobranca": data_cobranca,
            "splits": splits_executados,
            "status": "paga",
            "transacao_debito_id": transacao_debito['id']
        }
        
        await db.cobrancas_protecao.insert_one(cobranca_doc)
        
        # 3.5 MARCAR DÉBITO AGENDADO COMO EXECUTADO
        debito_agendado = await db.debitos_agendados.find_one({
            "protecao_id": protecao_id,
            "mes_referencia": mes_referencia,
            "status": "pendente"
        })
        
        if debito_agendado:
            await db.debitos_agendados.update_one(
                {"id": debito_agendado.get('id')},
                {"$set": {
                    "status": "executado",
                    "executado_em": data_cobranca,
                    "transacao_id": transacao_debito['id']
                }}
            )
        
        # 4. ATUALIZAR ÚLTIMA COBRANÇA NA PROTEÇÃO
        proxima_cobranca = data_cobranca.replace(month=data_cobranca.month + 1) if data_cobranca.month < 12 else data_cobranca.replace(year=data_cobranca.year + 1, month=1)
        
        await db.protecoes_veiculares.update_one(
            {"id": protecao_id},
            {"$set": {
                "ultima_cobranca": data_cobranca,
                "proxima_cobranca": proxima_cobranca
            }}
        )
        
        logger.info(f"✅ Cobrança processada: R$ {valor_mensal:.2f} - Cliente: {cliente.get('email')} - Splits: {len(splits_executados)}")
        
        return {
            "success": True,
            "message": f"Cobrança processada com sucesso! Valor: R$ {valor_mensal:.2f}",
            "valor_cobrado": valor_mensal,
            "splits_executados": splits_executados,
            "saldo_anterior_cliente": saldo_cliente,
            "saldo_atual_cliente": novo_saldo_cliente
        }
        
    except Exception as e:
        logger.error(f"Erro ao processar cobrança: {e}")
        return {"success": False, "message": str(e)}
