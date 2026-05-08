"""
Script para criar conta da Labelview no AgitoMil
Empresa de serviços interna (não aparece em listas públicas)
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
import os
from datetime import datetime
import uuid

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')

async def criar_conta_labelview():
    """Criar conta da Labelview no sistema AgitoMil"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[os.environ.get('DB_NAME', 'transmill')]
    
    try:
        # Verificar se já existe
        existing = await db.users.find_one({"email": "labelview@agitomil.com"})
        
        if existing:
            print("❌ Conta labelview@agitomil.com já existe!")
            print(f"   ID: {existing.get('id')}")
            print(f"   Tipo: {existing.get('user_type')}")
            return
        
        # Criar usuário Labelview
        labelview_id = str(uuid.uuid4())
        senha_hash = bcrypt.hash("labelview2025")  # Senha temporária
        
        user_doc = {
            "id": labelview_id,
            "email": "labelview@agitomil.com",
            "password": senha_hash,
            "full_name": "Labelview Proteção Veicular",
            "user_type": "service_provider",
            "is_internal_provider": True,  # FLAG ESPECIAL - não aparece em listas públicas
            
            # Dados da empresa
            "company_name": "Labelview Proteção Veicular LTDA",
            "document": "00.000.000/0001-00",  # CNPJ temporário - você vai completar
            "phone": "(00) 0000-0000",  # Telefone temporário
            
            # Saldos
            "balance": 0.0,
            "cashback_balance": 0.0,
            "usdt_balance": 0.0,
            
            # Status
            "is_active": True,
            "is_blocked": False,
            "email_verified": True,
            
            # Dados específicos de prestador
            "service_provider_profile": {
                "service_type": "protecao_veicular",
                "services": ["Proteção Veicular"],
                "description": "Empresa interna de proteção veicular - fornecedor exclusivo do AgitoMil",
                "is_available": False,  # Não disponível para agendamentos públicos
                "rating": 0.0,
                "completed_services": 0
            },
            
            # Datas
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.users.insert_one(user_doc)
        
        print("✅ CONTA LABELVIEW CRIADA COM SUCESSO!")
        print(f"   Email: labelview@agitomil.com")
        print(f"   Senha temporária: labelview2025")
        print(f"   ID: {labelview_id}")
        print(f"   Tipo: service_provider (prestador de serviços)")
        print(f"   is_internal_provider: True (não aparece em listas públicas)")
        print()
        print("⚠️  PRÓXIMOS PASSOS:")
        print("   1. Altere a senha no primeiro acesso")
        print("   2. Complete os dados da empresa:")
        print("      - CNPJ real")
        print("      - Telefone")
        print("      - Endereço completo")
        print("      - Dados bancários para recebimento")
        print()
        print("💡 IMPORTANTE:")
        print("   Esta conta receberá automaticamente os valores dos serviços")
        print("   conforme as proteções vendidas (split de pagamento)")
        
    except Exception as e:
        print(f"❌ Erro ao criar conta: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(criar_conta_labelview())
