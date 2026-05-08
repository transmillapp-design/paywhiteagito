"""
Script para importar valores da Tabela Roubo/Furto
Baseado na imagem fornecida pelo usuário
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid
import os

# Dados extraídos da imagem
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
    "Carro Leve",
    "Aplicativo",
    "Moto",
    "SUV, Pickup, Van",
    "Caminhão"
]

async def importar_dados():
    # Conectar ao MongoDB
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['transmill']
    collection = db['labelview_tabelas_valores']
    
    print("=" * 60)
    print("IMPORTAÇÃO DE DADOS - ROUBO/FURTO")
    print("=" * 60)
    print(f"\nTotal de faixas: {len(VALORES_ROUBO_FURTO)}")
    print(f"Total de tipos de veículo: {len(TIPOS_VEICULO)}")
    print(f"Total de registros a inserir: {len(VALORES_ROUBO_FURTO) * len(TIPOS_VEICULO)}")
    print("\n" + "=" * 60)
    
    total_inseridos = 0
    
    for tipo_veiculo in TIPOS_VEICULO:
        print(f"\n📋 Tipo: {tipo_veiculo}")
        
        for idx, faixa in enumerate(VALORES_ROUBO_FURTO, 1):
            documento = {
                "id": str(uuid.uuid4()),
                "tipo_cobertura": "Roubo/Furto",
                "tipo_veiculo_assistencia": tipo_veiculo,
                "valor_servico": faixa["valor"],
                "valor_fipe_min": faixa["min"],
                "valor_fipe_max": faixa["max"],
                "descricao": f"Proteção contra Roubo e Furto - {tipo_veiculo}",
                "ativo": True,
                "criado_por": "sistema",
                "criado_em": datetime.utcnow(),
                "atualizado_em": datetime.utcnow()
            }
            
            await collection.insert_one(documento)
            total_inseridos += 1
            
            print(f"  ✓ Faixa {idx}: R$ {faixa['min']:,.2f} - R$ {faixa['max']:,.2f} → R$ {faixa['valor']:.2f}")
    
    print("\n" + "=" * 60)
    print(f"✅ IMPORTAÇÃO CONCLUÍDA!")
    print(f"Total de registros inseridos: {total_inseridos}")
    print("=" * 60)
    
    # Verificar o que foi inserido
    count = await collection.count_documents({"tipo_cobertura": "Roubo/Furto"})
    print(f"\n📊 Verificação: {count} registros de Roubo/Furto no banco")
    
    # Mostrar distribuição por tipo
    print("\n📈 Distribuição por tipo de veículo:")
    for tipo in TIPOS_VEICULO:
        count_tipo = await collection.count_documents({
            "tipo_cobertura": "Roubo/Furto",
            "tipo_veiculo_assistencia": tipo
        })
        print(f"  • {tipo}: {count_tipo} registros")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(importar_dados())
