"""
Endpoint de Diagnóstico - MongoDB em Produção
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

diagnostico_router = APIRouter(prefix="/api/diagnostico", tags=["diagnostico"])
logger = logging.getLogger(__name__)

@diagnostico_router.get("/mongodb-test")
async def test_mongodb():
    """Testar se MongoDB está funcionando corretamente"""
    from server import db as db_instance
    
    resultado = {
        'timestamp': datetime.utcnow().isoformat(),
        'tests': []
    }
    
    # Teste 1: Ping no MongoDB
    try:
        await db_instance.command('ping')
        resultado['tests'].append({
            'test': 'MongoDB Ping',
            'status': 'OK',
            'message': 'MongoDB está respondendo'
        })
    except Exception as e:
        resultado['tests'].append({
            'test': 'MongoDB Ping',
            'status': 'ERRO',
            'message': str(e)
        })
        
    # Teste 2: Contar documentos
    try:
        count = await db_instance.users.count_documents({})
        resultado['tests'].append({
            'test': 'Count Documents',
            'status': 'OK',
            'message': f'Total de usuários: {count}'
        })
    except Exception as e:
        resultado['tests'].append({
            'test': 'Count Documents',
            'status': 'ERRO',
            'message': str(e)
        })
    
    # Teste 3: Insert de teste
    try:
        test_id = f"TEST_{int(datetime.utcnow().timestamp())}"
        test_doc = {
            'id': test_id,
            'email': f'{test_id}@test.com',
            'test': True,
            'created_at': datetime.utcnow().isoformat()
        }
        
        insert_result = await db_instance.test_collection.insert_one(test_doc)
        
        resultado['tests'].append({
            'test': 'Insert Test',
            'status': 'OK',
            'message': f'Insert OK - acknowledged: {insert_result.acknowledged}, id: {insert_result.inserted_id}'
        })
        
        # Teste 4: Buscar documento inserido
        found = await db_instance.test_collection.find_one({'id': test_id})
        
        if found:
            resultado['tests'].append({
                'test': 'Find After Insert',
                'status': 'OK',
                'message': 'Documento encontrado após insert'
            })
            
            # Limpar teste
            await db_instance.test_collection.delete_one({'id': test_id})
        else:
            resultado['tests'].append({
                'test': 'Find After Insert',
                'status': 'ERRO',
                'message': 'CRÍTICO: Insert disse sucesso mas documento NÃO foi encontrado!'
            })
            
    except Exception as e:
        resultado['tests'].append({
            'test': 'Insert Test',
            'status': 'ERRO',
            'message': str(e)
        })
    
    # Teste 5: Buscar último consultor criado
    try:
        ultimo_consultor = await db_instance.users.find_one(
            {'user_type': 'labelview_consultor'},
            sort=[('created_at', -1)]
        )
        
        if ultimo_consultor:
            resultado['tests'].append({
                'test': 'Último Consultor',
                'status': 'OK',
                'message': f"ID: {ultimo_consultor.get('id')}, Nome: {ultimo_consultor.get('nome')}, CPF: {ultimo_consultor.get('cpf')}"
            })
        else:
            resultado['tests'].append({
                'test': 'Último Consultor',
                'status': 'INFO',
                'message': 'Nenhum consultor encontrado no banco'
            })
    except Exception as e:
        resultado['tests'].append({
            'test': 'Último Consultor',
            'status': 'ERRO',
            'message': str(e)
        })
    
    return resultado
