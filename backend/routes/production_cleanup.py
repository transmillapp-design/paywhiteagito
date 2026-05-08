"""
Endpoint especial para limpeza e setup de produção
Chamado MANUALMENTE pelo usuário via API
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from passlib.hash import bcrypt
import uuid
import logging

production_router = APIRouter(prefix="/api/production", tags=["production"])
logger = logging.getLogger(__name__)

from pydantic import BaseModel

class ResetRequest(BaseModel):
    secret_key: str

@production_router.post("/reset-to-clean-state")
async def reset_to_clean_state(request: ResetRequest):
    """
    ENDPOINT ESPECIAL: Limpa TUDO e recria apenas as 4 contas de produção
    
    USE COM CUIDADO! Deleta TODOS os dados exceto as 4 contas principais.
    
    Requer secret_key: "transmill-production-reset-2025"
    """
    from server import db as db_instance
    
    # Validar secret key
    if request.secret_key != "transmill-production-reset-2025":
        raise HTTPException(status_code=403, detail="Secret key inválida")
    
    try:
        logger.info("🔴 INICIANDO RESET DE PRODUÇÃO")
        
        # Lista de emails que devem ser mantidos
        KEEP_EMAILS = [
            'transmillapp@gmail.com',
            'labelview@transmill.com',
            'agitoautobrasil@gmail.com',
            'rafael.bersch@htmail.com',
        ]
        
        # 1. BUSCAR UNIDADE ATUAL (pode ter ID diferente)
        unidade_atual = await db_instance.users.find_one({'email': 'agitoautobrasil@gmail.com'})
        unidade_id = unidade_atual.get('id') if unidade_atual else str(uuid.uuid4())
        
        logger.info(f"📋 Unidade ID: {unidade_id}")
        
        # 2. DELETAR TODOS OS OUTROS USUÁRIOS
        result_users = await db_instance.users.delete_many({
            'email': {'$nin': KEEP_EMAILS}
        })
        logger.info(f"🗑️ Usuários deletados: {result_users.deleted_count}")
        
        # 3. GARANTIR QUE AS 4 CONTAS EXISTEM COM DADOS CORRETOS
        
        # Master Transmill
        master_transmill = await db_instance.users.find_one({'email': 'transmillapp@gmail.com'})
        if not master_transmill:
            master_id = str(uuid.uuid4())
            await db_instance.users.insert_one({
                'id': master_id,
                'email': 'transmillapp@gmail.com',
                'password_hash': bcrypt.hash('demo123'),
                'full_name': 'Master Transmill',
                'user_type': 'master',
                'phone': '',
                'balance': 0.0,
                'cashback_balance': 0.0,
                'is_active': True,
                'is_blocked': False,
                'is_master_account': True,
                'must_change_password': False,
                'profile_complete': True,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'referral_code': f"MASTER_{master_id[:8].upper()}",
            })
            logger.info("✅ Master Transmill criado")
        else:
            master_id = master_transmill.get('id')
            logger.info("✅ Master Transmill já existe")
        
        # Master Labelview
        master_labelview = await db_instance.users.find_one({'email': 'labelview@transmill.com'})
        if not master_labelview:
            master_lv_id = str(uuid.uuid4())
            await db_instance.users.insert_one({
                'id': master_lv_id,
                'email': 'labelview@transmill.com',
                'password_hash': bcrypt.hash('demo123'),
                'full_name': 'Master Labelview',
                'user_type': 'labelview_master',
                'phone': '',
                'balance': 0.0,
                'cashback_balance': 0.0,
                'is_active': True,
                'is_blocked': False,
                'is_labelview_master': True,
                'must_change_password': False,
                'profile_complete': True,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'referral_code': f"MASTERLV_{master_lv_id[:8].upper()}",
            })
            logger.info("✅ Master Labelview criado")
        else:
            master_lv_id = master_labelview.get('id')
            logger.info("✅ Master Labelview já existe")
        
        # Unidade AgitoAuto (atualizar se necessário)
        if unidade_atual:
            await db_instance.users.update_one(
                {'id': unidade_id},
                {'$set': {
                    'user_type': 'labelview_unidade',
                    'unidade_id': unidade_id,
                    'referred_by': master_lv_id,
                    'updated_at': datetime.utcnow()
                }}
            )
            logger.info("✅ Unidade atualizada")
        else:
            await db_instance.users.insert_one({
                'id': unidade_id,
                'email': 'agitoautobrasil@gmail.com',
                'password_hash': bcrypt.hash('!Ma04202011@'),
                'full_name': 'AgitoAuto Brasil',
                'user_type': 'labelview_unidade',
                'phone': '',
                'balance': 0.0,
                'cashback_balance': 0.0,
                'is_active': True,
                'is_blocked': False,
                'must_change_password': False,
                'profile_complete': True,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'referral_code': f"UNIT_{unidade_id[:8].upper()}",
                'referred_by': master_lv_id,
                'nome_fantasia': 'AgitoAuto',
                'razao_social': 'AgitoAuto Brasil LTDA',
                'cnpj': '12.345.678/0001-00',
                'unidade_id': unidade_id,
            })
            logger.info("✅ Unidade criada")
        
        # Rafael - DELETAR E RECRIAR com unidade_id correto
        await db_instance.users.delete_many({'email': 'rafael.bersch@htmail.com'})
        rafael_id = str(uuid.uuid4())
        await db_instance.users.insert_one({
            'id': rafael_id,
            'email': 'rafael.bersch@htmail.com',
            'password_hash': bcrypt.hash('!Ma04202011@'),
            'full_name': 'Rafael Bersch',
            'user_type': 'labelview_consultor',
            'unidade_id': unidade_id,  # USAR O ID CORRETO DA UNIDADE
            'regional_id': None,
            'phone': '',
            'balance': 0.0,
            'cashback_balance': 0.0,
            'is_active': True,
            'is_blocked': False,
            'must_change_password': False,
            'profile_complete': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'referral_code': f"CONS_{rafael_id[:8].upper()}",
            'referred_by': unidade_id,
            'natureza': 'cpf',
            'nome': 'Rafael Bersch',
            'cpf': '999.888.777-66',
            'comissao_mensalidade_tipo': 'percentual',
            'comissao_mensalidade_valor': 10.0,
        })
        logger.info(f"✅ Rafael recriado com unidade_id correto: {unidade_id}")
        
        # 4. LIMPAR OUTRAS COLEÇÕES
        collections_to_clean = [
            'stores', 'orders', 'transactions', 'labelview_leads',
            'labelview_protecoes', 'labelview_solicitacoes', 'labelview_clients',
            'cotacoes', 'referrals', 'notifications'
        ]
        
        deleted_counts = {}
        for col in collections_to_clean:
            try:
                result = await db_instance[col].delete_many({})
                if result.deleted_count > 0:
                    deleted_counts[col] = result.deleted_count
            except Exception:
                pass
        
        # 5. VERIFICAÇÃO FINAL
        final_count = await db_instance.users.count_documents({})
        
        logger.info("✅ RESET COMPLETO!")
        
        return {
            'success': True,
            'message': 'Sistema resetado com sucesso!',
            'usuarios_finais': final_count,
            'usuarios_deletados': result_users.deleted_count,
            'colecoes_limpas': deleted_counts,
            'contas_produção': {
                'master_transmill': 'transmillapp@gmail.com',
                'master_labelview': 'labelview@transmill.com',
                'unidade': 'agitoautobrasil@gmail.com',
                'consultor': 'rafael.bersch@htmail.com'
            },
            'rafael_unidade_id': unidade_id,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Erro no reset: {e}")
        raise HTTPException(status_code=500, detail=str(e))
