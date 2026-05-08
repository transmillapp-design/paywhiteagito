"""
Endpoint para importar dados de Perda Total via API
Baseado na imagem fornecida pelo usuário
"""
from fastapi import HTTPException
from datetime import datetime
import uuid

# Dados extraídos da imagem - Tabela Perda Total
VALORES_PERDA_TOTAL = [
    {"min": 0, "max": 10000, "valor": 11.75},
    {"min": 10001, "max": 20000, "valor": 12.68},
    {"min": 20001, "max": 30000, "valor": 14.32},
    {"min": 30001, "max": 40000, "valor": 21.47},
    {"min": 40001, "max": 50000, "valor": 27.33},
    {"min": 50001, "max": 60000, "valor": 32.54},
    {"min": 60001, "max": 70000, "valor": 35.14},
    {"min": 70001, "max": 80000, "valor": 40.09},
    {"min": 80001, "max": 90000, "valor": 46.85},
    {"min": 90001, "max": 100000, "valor": 52.71},
    {"min": 100001, "max": 110000, "valor": 58.57},
    {"min": 110001, "max": 120000, "valor": 60.85},
]

TIPOS_VEICULO = [
    "Carros Leves",
    "Aplicativos",
    "Moto",
    "SUV, Pickup, Van",
    "Caminhão"
]

async def importar_perda_total_production(db, user_id: str):
    """
    Importar dados de Perda Total para produção
    """
    collection = db['labelview_tabelas_valores']
    
    # Verificar se já existem dados
    count_existente = await collection.count_documents({"tipo_cobertura": "Perda Total"})
    
    if count_existente > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Já existem {count_existente} registros de Perda Total. Delete-os primeiro se quiser reimportar."
        )
    
    total_inseridos = 0
    
    for tipo_veiculo in TIPOS_VEICULO:
        for faixa in VALORES_PERDA_TOTAL:
            documento = {
                "id": str(uuid.uuid4()),
                "tipo_cobertura": "Perda Total",
                "tipo_veiculo_assistencia": tipo_veiculo,
                "valor_servico": faixa["valor"],
                "valor_fipe_min": faixa["min"],
                "valor_fipe_max": faixa["max"],
                "descricao": f"Proteção contra Perda Total - {tipo_veiculo}",
                "ativo": True,
                "criado_por": user_id,
                "criado_em": datetime.utcnow(),
                "atualizado_em": datetime.utcnow()
            }
            
            await collection.insert_one(documento)
            total_inseridos += 1
    
    return {
        "success": True,
        "message": f"Importação de Perda Total concluída com sucesso!",
        "total_inseridos": total_inseridos,
        "detalhes": {
            "tipos_veiculo": len(TIPOS_VEICULO),
            "faixas_por_tipo": len(VALORES_PERDA_TOTAL),
            "total": total_inseridos
        }
    }
