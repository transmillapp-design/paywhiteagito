#!/usr/bin/env python3
"""
Test Database Connection and Demo Users
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def test_db_connection():
    """Test database connection and check demo users"""
    
    # Load environment variables
    ROOT_DIR = Path("/app/backend")
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    print(f"🔍 TESTANDO CONEXÃO COM DATABASE")
    print(f"MongoDB URL: {mongo_url}")
    print(f"Database Name: {db_name}")
    print("=" * 60)
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Conexão com MongoDB estabelecida com sucesso")
        
        # Check if users collection exists
        collections = await db.list_collection_names()
        print(f"✅ Collections encontradas: {collections}")
        
        if 'users' in collections:
            # Count total users
            user_count = await db.users.count_documents({})
            print(f"✅ Total de usuários no banco: {user_count}")
            
            # Check for demo users
            demo_emails = ["cliente@demo.com", "lojista@demo.com", "master@agitocash.com"]
            
            for email in demo_emails:
                user = await db.users.find_one({"email": email})
                if user:
                    print(f"✅ Usuário encontrado: {email}")
                    print(f"   - ID: {user.get('id', 'N/A')}")
                    print(f"   - Nome: {user.get('full_name', 'N/A')}")
                    print(f"   - Tipo: {user.get('user_type', 'N/A')}")
                    print(f"   - Tem password_hash: {'Sim' if user.get('password_hash') else 'Não'}")
                    
                    # Check password hash format
                    password_hash = user.get('password_hash', '')
                    if password_hash:
                        if password_hash.startswith('$2b$'):
                            print(f"   - Hash bcrypt válido: {password_hash[:20]}...")
                        else:
                            print(f"   - Hash inválido/formato incorreto: {password_hash[:20]}...")
                    
                    if user.get('user_type') == 'lojista':
                        print(f"   - Empresa: {user.get('company_name', 'N/A')}")
                        print(f"   - CNPJ: {user.get('cnpj', 'N/A')}")
                        print(f"   - Cashback Rate: {user.get('cashback_rate', 0)}%")
                        print(f"   - Estado: {user.get('state', 'N/A')}")
                        print(f"   - Cidade: {user.get('city', 'N/A')}")
                        print(f"   - Segmento: {user.get('business_segment', 'N/A')}")
                    
                    if user.get('is_master_account'):
                        print(f"   - É conta master: Sim")
                        print(f"   - Platform Balance: R$ {user.get('platform_balance', 0):.2f}")
                    
                    print()
                else:
                    print(f"❌ Usuário NÃO encontrado: {email}")
        else:
            print("❌ Collection 'users' não encontrada")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Erro na conexão com database: {e}")

if __name__ == "__main__":
    asyncio.run(test_db_connection())