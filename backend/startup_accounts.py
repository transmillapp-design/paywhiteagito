"""
Script de inicialização automática para criar contas demo
Executa automaticamente quando o backend inicia
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_demo_accounts():
    """
    Cria automaticamente as contas demo se não existirem
    """
    try:
        # Conectar ao MongoDB
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
        db_name = os.environ.get('DB_NAME', 'transmill')
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Senha única para todas as contas
        password_hash = pwd_context.hash("demo123")
        
        # Lista de todas as 8 contas demo
        accounts = [
            # Sistema básico
            {
                "email": "cliente@demo.com",
                "full_name": "Cliente Demo",
                "user_type": "cliente",
                "phone": "(11) 99999-9999",
            },
            {
                "email": "lojista@demo.com",
                "full_name": "Lojista Demo",
                "user_type": "lojista",
                "phone": "(11) 98888-8888",
            },
            {
                "email": "prestador@demo.com",
                "full_name": "Prestador Demo",
                "user_type": "service_provider",
                "phone": "(11) 97777-7777",
            },
            {
                "email": "master@transmill.com",
                "full_name": "Master Sistema",
                "user_type": "master",
                "phone": "(11) 96666-6666",
                "is_master_account": True,
            },
            # Hierarquia Labelview
            {
                "email": "protecao@agitomil.com",
                "full_name": "Master Labelview",
                "user_type": "labelview_master",
                "phone": "(11) 95555-5555",
                "is_labelview_master": True,
            },
            {
                "email": "agitoauto@agitomil.com",
                "full_name": "AgitoAuto Unidade",
                "user_type": "labelview_unidade",
                "phone": "(11) 94444-4444",
                "document": "12.345.678/0001-90",
            },
            {
                "email": "regional@agitomil.com",
                "full_name": "Regional Sul",
                "user_type": "labelview_regional",
                "phone": "(11) 93333-3333",
            },
            {
                "email": "rafael@agitomil.com",
                "full_name": "Rafael Consultor",
                "user_type": "labelview_consultor",
                "phone": "(11) 92222-2222",
            },
        ]
        
        created = 0
        updated = 0
        
        for account in accounts:
            email = account["email"]
            
            # Verificar se conta existe
            existing = await db.users.find_one({"email": email})
            
            if existing:
                # Atualizar senha e garantir campos corretos
                await db.users.update_one(
                    {"email": email},
                    {"$set": {
                        "password_hash": password_hash,
                        "full_name": account["full_name"],
                        "user_type": account["user_type"],
                        "phone": account.get("phone", ""),
                        "is_active": True,
                        "is_blocked": False,
                        "is_master_account": account.get("is_master_account", False),
                        "is_labelview_master": account.get("is_labelview_master", False),
                        "updated_at": datetime.utcnow().isoformat()
                    }}
                )
                updated += 1
                logger.info(f"✅ Conta atualizada: {email}")
            else:
                # Criar nova conta
                user_data = {
                    "id": str(uuid.uuid4()),
                    "email": email,
                    "password_hash": password_hash,
                    "full_name": account["full_name"],
                    "user_type": account["user_type"],
                    "phone": account.get("phone", ""),
                    "document": account.get("document", ""),
                    "balance": 0.0,
                    "cashback_balance": 0.0,
                    "usdt_balance": 0.0,
                    "social_points": 0,
                    "is_active": True,
                    "is_blocked": False,
                    "is_verified": True,
                    "is_master_account": account.get("is_master_account", False),
                    "is_labelview_master": account.get("is_labelview_master", False),
                    "referral_code": email.split("@")[0].upper(),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                await db.users.insert_one(user_data)
                created += 1
                logger.info(f"✅ Conta criada: {email}")
        
        logger.info(f"🎉 Contas demo: {created} criadas, {updated} atualizadas")
        client.close()
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar contas demo: {e}")

def init_demo_accounts():
    """
    Função síncrona para chamar no startup do FastAPI
    """
    try:
        asyncio.run(create_demo_accounts())
    except Exception as e:
        logger.error(f"Erro na inicialização de contas: {e}")
