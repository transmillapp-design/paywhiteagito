#!/usr/bin/env python3
"""
Script para adicionar informações detalhadas de serviços inclusos nas coberturas
Deve ser executado pelo Master Labelview
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Definição dos serviços inclusos em cada cobertura
SERVICOS_COBERTURAS = {
    "Roubo/Furto": {
        "titulo": "Proteção Roubo e Furto",
        "servicos": [
            "Cobertura 100% do valor FIPE em caso de roubo",
            "Cobertura 100% do valor FIPE em caso de furto",
            "Assistência 24 horas para localização",
            "Suporte jurídico em caso de sinistro",
            "Indenização sem franquia",
            "Cobertura nacional"
        ],
        "observacoes": "Cobertura válida após carência de 30 dias"
    },
    
    "Perda Total": {
        "titulo": "Proteção Perda Total",
        "servicos": [
            "Cobertura 100% do valor FIPE em perda total",
            "Indenização por colisão grave",
            "Cobertura por incêndio total",
            "Cobertura por enchente/alagamento",
            "Cobertura por queda de árvore/objeto",
            "Assistência em caso de sinistro"
        ],
        "observacoes": "Perda total caracterizada quando reparos > 75% do valor FIPE"
    },
    
    "Assistencia 24hs": {
        "titulo": "Assistência 24 Horas Completa",
        "servicos": [
            "02 Reboques de até 400 KM",
            "02 Diárias de hotel até R$ 500,00",
            "Serviço de Táxi e Uber",
            "Pane Seca (combustível emergencial)",
            "Pane Elétrica",
            "Troca de pneu",
            "Chaveiro 24h",
            "Guincho em caso de acidente",
            "Mecânico em domicílio",
            "Transporte alternativo"
        ],
        "observacoes": "Disponível 24h/7 dias por semana em todo território nacional"
    },
    
    "Vidros, Farois e Lanternas": {
        "titulo": "Cobertura Vidros, Faróis e Lanternas",
        "servicos": [
            "Troca de para-brisa",
            "Troca de vidros laterais",
            "Troca de vidro traseiro",
            "Troca de faróis dianteiros",
            "Troca de lanternas traseiras",
            "Serviço de instalação incluso",
            "Peças originais ou equivalentes"
        ],
        "observacoes": "Cobertura sem franquia. Até 2 sinistros por ano"
    },
    
    "Carro Reserva": {
        "titulo": "Carro Reserva",
        "servicos": [
            "Até 15 diárias de carro reserva por ano",
            "Veículo categoria econômica",
            "Seguro total do veículo reserva",
            "Entrega e retirada sem custo",
            "Disponível em caso de sinistro",
            "Disponível em manutenção programada",
            "Km livre"
        ],
        "observacoes": "Sujeito à disponibilidade na região"
    },
    
    "Colisão": {
        "titulo": "Cobertura de Colisão",
        "servicos": [
            "Cobertura de danos por colisão",
            "Funilaria e pintura",
            "Peças originais ou equivalentes",
            "Mão de obra especializada",
            "Oficinas credenciadas",
            "Franquia reduzida",
            "Até 3 sinistros por ano"
        ],
        "observacoes": "Franquia aplicável conforme tabela"
    },
    
    "Danos materiais e Terceiros": {
        "titulo": "Danos Materiais e Terceiros",
        "servicos": [
            "Cobertura de danos materiais a terceiros até R$ 100.000",
            "Cobertura de danos corporais a terceiros",
            "Assistência jurídica inclusa",
            "Defesa em processos",
            "Pagamento de indenizações",
            "Cobertura nacional"
        ],
        "observacoes": "Limite de cobertura conforme plano contratado"
    }
}

async def adicionar_servicos():
    """Adicionar informações de serviços inclusos nas tabelas de valores"""
    
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.transmill
    
    print("=" * 70)
    print("ADICIONANDO SERVIÇOS INCLUSOS NAS COBERTURAS")
    print("=" * 70)
    
    total_atualizado = 0
    
    for tipo_cobertura, dados_servicos in SERVICOS_COBERTURAS.items():
        print(f"\n📋 Atualizando: {tipo_cobertura}")
        
        # Atualizar todos os registros desta cobertura
        result = await db.labelview_tabelas_valores.update_many(
            {"tipo_cobertura": tipo_cobertura},
            {"$set": {"servicos_inclusos": dados_servicos}}
        )
        
        print(f"   ✅ {result.modified_count} registros atualizados")
        total_atualizado += result.modified_count
    
    print("\n" + "=" * 70)
    print(f"✅ TOTAL: {total_atualizado} registros atualizados com sucesso!")
    print("=" * 70)
    
    # Verificar um exemplo
    print("\n📊 EXEMPLO - Assistência 24hs:")
    doc = await db.labelview_tabelas_valores.find_one({
        "tipo_cobertura": "Assistencia 24hs"
    })
    
    if doc and 'servicos_inclusos' in doc:
        print(f"   Título: {doc['servicos_inclusos']['titulo']}")
        print(f"   Serviços ({len(doc['servicos_inclusos']['servicos'])}):")
        for servico in doc['servicos_inclusos']['servicos'][:3]:
            print(f"      • {servico}")
        print(f"   Observação: {doc['servicos_inclusos']['observacoes']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(adicionar_servicos())
