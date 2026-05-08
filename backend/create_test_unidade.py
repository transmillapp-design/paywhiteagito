"""
Cria uma unidade de teste para validar o fluxo
"""
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')
import set_cloudinary_env

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.hash import bcrypt
import uuid
from datetime import datetime

load_dotenv()

async def create_test_unidade():
    """Cria uma unidade de teste"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'transmill')]
    
    # Verificar se já existe
    existing = await db.users.find_one({'email': 'teste.unidade@labelview.com'})
    if existing:
        print("⚠️  Unidade de teste já existe. Atualizando...")
        await db.users.delete_one({'email': 'teste.unidade@labelview.com'})
    
    unidade_id = str(uuid.uuid4())
    temp_password = "SenhaProvisoria2024!"
    password_hash = bcrypt.hash(temp_password)
    
    unidade = {
        'id': unidade_id,
        'email': 'teste.unidade@labelview.com',
        'password_hash': password_hash,
        'temporary_password': temp_password,
        'full_name': 'Unidade Teste',
        'phone': '11999999999',
        'user_type': 'labelview_unidade',
        'is_labelview_master': False,
        'is_active': True,
        'is_blocked': False,
        'is_verified': True,
        'must_change_password': True,
        'profile_complete': True,
        'balance': 0.0,
        'cashback_balance': 0.0,
        'referral_code': f'UNIT_{unidade_id[:8].upper()}',
        'referral_count': 0,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
        
        # Dados da Unidade
        'nome_fantasia': 'Unidade Teste Completa',
        'razao_social': 'Unidade Teste LTDA',
        'cnpj': '12.345.678/0001-90',
        'telefone': '11999999999',
        'whatsapp': '11999999999',
        
        # Identidade Visual
        'logo_url': 'https://res.cloudinary.com/dx2nlnhq9/image/upload/v1/test/logo_test.png',
        'cor_primaria': '#FF0000',  # Vermelho para teste
        'cor_secundaria': '#00FF00',  # Verde para teste
        
        # Responsável
        'responsavel_nome': 'João Teste',
        'responsavel_cpf': '123.456.789-00',
        'responsavel_email': 'joao@teste.com',
        'responsavel_whatsapp': '11999999999',
        
        # PIX
        'pix_key': '12.345.678/0001-90',
        'pix_key_type': 'cnpj',
        
        # Endereço
        'cep': '01310-100',
        'address': 'Av Paulista, 1000',
        'street': 'Av Paulista',
        'number': '1000',
        'neighborhood': 'Bela Vista',
        'city': 'São Paulo',
        'state': 'SP',
        'complement': 'Sala 101'
    }
    
    await db.users.insert_one(unidade)
    
    print("✅ Unidade de teste criada com sucesso!")
    print(f"\n📧 Email: teste.unidade@labelview.com")
    print(f"🔑 Senha: {temp_password}")
    print(f"🆔 ID: {unidade_id}")
    print(f"🎨 Cor Primária: {unidade['cor_primaria']} (Vermelho)")
    print(f"🎨 Cor Secundária: {unidade['cor_secundaria']} (Verde)")
    print(f"🔐 Must Change Password: {unidade['must_change_password']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_unidade())
