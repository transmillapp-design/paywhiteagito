"""
Endpoint para importar dados de Roubo/Furto via API
Usado para popular o banco de produção após deploy
"""
from fastapi import HTTPException
from datetime import datetime
import uuid

# Dados da tabela Roubo/Furto
VALORES_ROUBO_FURTO = [
    {"min": 0, "max": 10000, "valor": 23.50},
    {"min": 10001, "max": 20000, "valor": 25.12},
    {"min": 20001, "max": 30000, "valor": 28.63},
    {"min": 30001, "max": 40000, "valor": 42.95},
    {"min": 40001, "max": 50000, "valor": 54.67},
    {"min": 50001, "max": 60000, "valor": 65.08},
    {"min": 60001, "max": 70000, "valor": 70.29},
    {"min": 70001, "max": 80000, "valor": 80.18},
    {"min": 80001, "max": 90000, "valor": 83.71},
    {"min": 90001, "max": 100000, "valor": 105.43},
    {"min": 100001, "max": 110000, "valor": 117.14},
    {"min": 110001, "max": 120000, "valor": 121.70},
]

TIPOS_VEICULO = [
    "Carros Leves",
    "Aplicativos",
    "Moto",
    "SUV, Pickup, Van",
    "Caminhão"
]

async def importar_roubo_furto_production(db, user_id: str):
    """
    Importar dados de Roubo/Furto para produção
    """
    collection = db['labelview_tabelas_valores']
    
    # Verificar se já existem dados
    count_existente = await collection.count_documents({"tipo_cobertura": "Roubo/Furto"})
    
    if count_existente > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Já existem {count_existente} registros de Roubo/Furto. Delete-os primeiro se quiser reimportar."
        )
    
    total_inseridos = 0
    
    for tipo_veiculo in TIPOS_VEICULO:
        for faixa in VALORES_ROUBO_FURTO:
            documento = {
                "id": str(uuid.uuid4()),
                "tipo_cobertura": "Roubo/Furto",
                "tipo_veiculo_assistencia": tipo_veiculo,
                "valor_servico": faixa["valor"],
                "valor_fipe_min": faixa["min"],
                "valor_fipe_max": faixa["max"],
                "descricao": f"Proteção contra Roubo e Furto - {tipo_veiculo}",
                "ativo": True,
                "criado_por": user_id,
                "criado_em": datetime.utcnow(),
                "atualizado_em": datetime.utcnow()
            }
            
            await collection.insert_one(documento)
            total_inseridos += 1
    
    return {
        "success": True,
        "message": f"Importação concluída com sucesso!",
        "total_inseridos": total_inseridos,
        "detalhes": {
            "tipos_veiculo": len(TIPOS_VEICULO),
            "faixas_por_tipo": len(VALORES_ROUBO_FURTO),
            "total": total_inseridos
        }
    }
