#!/usr/bin/env python3
"""
Script para popular dados necessários para o sistema de Proteção Veicular
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid

load_dotenv()

async def seed_protecao_veicular():
    """Popular dados necessários para Proteção Veicular"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'transmill')]
    
    print("🚗 Iniciando seed de Proteção Veicular...")
    
    # 1. TIPOS DE VEÍCULO
    print("\n1️⃣ Criando Tipos de Veículo...")
    tipos_veiculo = [
        {
            "id": str(uuid.uuid4()),
            "nome": "Carro",
            "descricao": "Automóvel de passeio",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome": "Moto",
            "descricao": "Motocicleta",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome": "Caminhonete",
            "descricao": "Picape / Caminhonete",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome": "SUV",
            "descricao": "SUV / Utilitário Esportivo",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.labelview_tipos_veiculo.delete_many({})
    await db.labelview_tipos_veiculo.insert_many(tipos_veiculo)
    print(f"✅ {len(tipos_veiculo)} tipos de veículo criados")
    
    # 2. PLANOS ADICIONAIS
    print("\n2️⃣ Criando Planos Adicionais...")
    adicionais = [
        {
            "id": str(uuid.uuid4()),
            "nome_plano": "Colisão",
            "tipo_plano": "Colisão",
            "categoria": "Adicional",
            "descricao": "Cobertura para colisões",
            "valor": 80.00,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome_plano": "Vidros",
            "tipo_plano": "Vidros",
            "categoria": "Adicional",
            "descricao": "Cobertura para vidros",
            "valor": 50.00,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome_plano": "Terceiros",
            "tipo_plano": "Terceiros",
            "categoria": "Adicional",
            "descricao": "Cobertura de terceiros",
            "valor": 60.00,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome_plano": "Assistência 24h Completa",
            "tipo_plano": "Assistência",
            "categoria": "Adicional",
            "descricao": "Assistência 24h com guincho, chaveiro e mais",
            "valor": 40.00,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome_plano": "Carro Reserva",
            "tipo_plano": "Carro Reserva",
            "categoria": "Adicional",
            "descricao": "Carro reserva em caso de sinistro",
            "valor": 70.00,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    # Limpar apenas adicionais antigos se existirem
    await db.labelview_planos.delete_many({"categoria": "Adicional"})
    await db.labelview_planos.insert_many(adicionais)
    print(f"✅ {len(adicionais)} planos adicionais criados")
    
    # 3. PLANOS COMPLETOS (PRINCIPAIS)
    print("\n3️⃣ Criando Planos Principais...")
    planos_principais = [
        {
            "id": str(uuid.uuid4()),
            "nome_plano": "Proteção Essencial",
            "tipo_plano_id": str(uuid.uuid4()),
            "tipo_beneficio": "Roubo e Furto",
            "classificacao": "Básico",
            "descricao": "Cobertura básica contra roubo, furto e perda total",
            "valor_plano": 150.00,
            "valor_parcela": 150.00,
            "vigencia_meses": 12,
            "forma_pagamento": "Mensal",
            "valor_veiculo_min": 15000.00,
            "valor_veiculo_max": 35000.00,
            "ativo": True,
            "adicionais": [],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome_plano": "Proteção Intermediária",
            "tipo_plano_id": str(uuid.uuid4()),
            "tipo_beneficio": "Roubo, Furto e Colisão",
            "classificacao": "Intermediário",
            "descricao": "Cobertura completa com roubo, furto, colisão e assistência 24h",
            "valor_plano": 280.00,
            "valor_parcela": 280.00,
            "vigencia_meses": 12,
            "forma_pagamento": "Mensal",
            "valor_veiculo_min": 30000.00,
            "valor_veiculo_max": 60000.00,
            "ativo": True,
            "adicionais": [],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome_plano": "Proteção Premium",
            "tipo_plano_id": str(uuid.uuid4()),
            "tipo_beneficio": "Cobertura Completa",
            "classificacao": "Premium",
            "descricao": "Cobertura total com todas as proteções incluídas",
            "valor_plano": 450.00,
            "valor_parcela": 450.00,
            "vigencia_meses": 12,
            "forma_pagamento": "Mensal",
            "valor_veiculo_min": 55000.00,
            "valor_veiculo_max": 150000.00,
            "ativo": True,
            "adicionais": [],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "nome_plano": "Proteção Econômica",
            "tipo_plano_id": str(uuid.uuid4()),
            "tipo_beneficio": "Roubo e Furto",
            "classificacao": "Econômico",
            "descricao": "Plano econômico para veículos de menor valor",
            "valor_plano": 95.00,
            "valor_parcela": 95.00,
            "vigencia_meses": 12,
            "forma_pagamento": "Mensal",
            "valor_veiculo_min": 5000.00,
            "valor_veiculo_max": 20000.00,
            "ativo": True,
            "adicionais": [],
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.labelview_planos_completos.delete_many({})
    await db.labelview_planos_completos.insert_many(planos_principais)
    print(f"✅ {len(planos_principais)} planos principais criados")
    
    # 4. DADOS DA EMPRESA MASTER LABELVIEW
    print("\n4️⃣ Atualizando dados da empresa Master Labelview...")
    
    master_user = await db.users.find_one({"email": "protecao@agitomil.com"})
    
    if master_user:
        empresa_data = {
            "empresa": {
                "nome_fantasia": "Labelview Proteção Veicular",
                "razao_social": "Labelview Proteção Veicular Ltda",
                "cnpj": "12.345.678/0001-90",
                "endereco": "Av. Paulista, 1000 - São Paulo/SP",
                "telefone": "(11) 3000-0000",
                "email": "contato@labelview.com.br",
                "site": "www.labelview.com.br"
            }
        }
        
        await db.users.update_one(
            {"email": "protecao@agitomil.com"},
            {"$set": empresa_data}
        )
        print("✅ Dados da empresa Master Labelview atualizados")
    else:
        print("⚠️ Usuário Master Labelview não encontrado - criar manualmente")
    
    # 5. RESUMO
    print("\n" + "="*60)
    print("✅ SEED CONCLUÍDO COM SUCESSO!")
    print("="*60)
    print(f"📊 Tipos de Veículo: {len(tipos_veiculo)}")
    print(f"💰 Planos Principais: {len(planos_principais)}")
    print(f"➕ Planos Adicionais: {len(adicionais)}")
    print(f"🏢 Empresa Master: {'Configurada' if master_user else 'Pendente'}")
    print("\n🎯 Sistema pronto para testar Proteção Veicular!")
    print("\n📝 Exemplo de teste:")
    print("   1. Login: cliente@demo.com / demo123")
    print("   2. Card: Proteção Veicular")
    print("   3. Tipo: Carro")
    print("   4. Veículo: Fiat Uno 2024 ABC-1234")
    print("   5. Sistema buscará planos disponíveis automaticamente")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_protecao_veicular())
