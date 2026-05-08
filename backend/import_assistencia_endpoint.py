"""
Endpoint para importar dados de Assistência 24 Horas via API
Estrutura diferente: valor fixo por tipo de veículo (não por faixa FIPE)
"""
from fastapi import HTTPException
from datetime import datetime
import uuid

# Dados de Assistência 24 Horas - Valor fixo por tipo de veículo
VALORES_ASSISTENCIA = [
    {
        "tipo_veiculo": "Carro Leve",
        "valor": 9.90,
        "fipe_min": 0,
        "fipe_max": 120000
    },
    {
        "tipo_veiculo": "Aplicativo",
        "valor": 9.90,
        "fipe_min": 0,
        "fipe_max": 120000
    },
    {
        "tipo_veiculo": "Moto",
        "valor": 9.90,
        "fipe_min": 0,
        "fipe_max": 120000
    },
    {
        "tipo_veiculo": "SUV, Pickup, Van",
        "valor": 15.90,
        "fipe_min": 0,
        "fipe_max": 120000
    },
    {
        "tipo_veiculo": "Caminhão",
        "valor": 49.90,
        "fipe_min": 0,
        "fipe_max": 120000
    }
]

async def importar_assistencia_production(db, user_id: str):
    """
    Importar dados de Assistência 24 Horas para produção
    """
    collection = db['labelview_tabelas_valores']
    
    # Verificar se já existem dados
    count_existente = await collection.count_documents({"tipo_cobertura": "Assistencia 24hs"})
    
    if count_existente > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Já existem {count_existente} registros de Assistência 24hs. Delete-os primeiro se quiser reimportar."
        )
    
    total_inseridos = 0
    
    for item in VALORES_ASSISTENCIA:
        documento = {
            "id": str(uuid.uuid4()),
            "tipo_cobertura": "Assistencia 24hs",
            "tipo_veiculo_assistencia": item["tipo_veiculo"],
            "valor_servico": item["valor"],
            "valor_fipe_min": item["fipe_min"],
            "valor_fipe_max": item["fipe_max"],
            "descricao": f"Assistência 24 Horas - {item['tipo_veiculo']} - Valor único para qualquer faixa FIPE",
            "ativo": True,
            "criado_por": user_id,
            "criado_em": datetime.utcnow(),
            "atualizado_em": datetime.utcnow()
        }
        
        await collection.insert_one(documento)
        total_inseridos += 1
    
    return {
        "success": True,
        "message": f"Importação de Assistência 24hs concluída com sucesso!",
        "total_inseridos": total_inseridos,
        "detalhes": {
            "tipos_veiculo": len(VALORES_ASSISTENCIA),
            "observacao": "Cada tipo tem valor fixo (não varia por faixa FIPE)",
            "total": total_inseridos
        }
    }
