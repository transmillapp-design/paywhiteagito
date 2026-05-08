"""
Script para testar o fluxo de must_change_password
"""
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import requests
import json

load_dotenv()

# Configuração
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'transmill')
api_url = 'http://localhost:8001/api'

async def test_flow():
    """Testa o fluxo completo de must_change_password"""
    
    print("🧪 TESTE DE MUST_CHANGE_PASSWORD\n")
    
    # Conectar ao banco
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Buscar uma unidade com must_change_password = true
    unidade = await db.users.find_one({
        'user_type': 'labelview_unidade',
        'must_change_password': True
    })
    
    if not unidade:
        print("❌ Nenhuma unidade com must_change_password=True encontrada")
        print("\n💡 Cadastre uma unidade no painel Labelview primeiro!")
        client.close()
        return
    
    email = unidade.get('email')
    temp_password = unidade.get('temporary_password')
    
    print(f"✅ Unidade encontrada:")
    print(f"  Email: {email}")
    print(f"  Nome: {unidade.get('nome_fantasia')}")
    print(f"  Must Change Password: {unidade.get('must_change_password')}")
    print(f"  Temporary Password: {temp_password}")
    print(f"  Logo URL: {unidade.get('logo_url')[:50] if unidade.get('logo_url') else None}...")
    print(f"  Cor Primária: {unidade.get('cor_primaria')}")
    print(f"  Cor Secundária: {unidade.get('cor_secundaria')}")
    
    # Teste 1: Login
    print("\n🔐 TESTE 1: LOGIN COM SENHA PROVISÓRIA")
    try:
        response = requests.post(
            f"{api_url}/auth/login",
            json={
                "email": email,
                "password": temp_password
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login bem-sucedido!")
            print(f"  Token: {data.get('access_token')[:50]}...")
            print(f"  Must Change Password (root): {data.get('must_change_password')}")
            print(f"  User Type: {data.get('user', {}).get('user_type')}")
            
            # Verificar se must_change_password está no nível raiz da resposta
            if 'must_change_password' not in data:
                print("⚠️  PROBLEMA: must_change_password NÃO está no nível raiz da resposta!")
            elif data.get('must_change_password') != True:
                print("⚠️  PROBLEMA: must_change_password não é True!")
            else:
                print("✅ must_change_password está correto na resposta do login!")
            
            token = data.get('access_token')
            
            # Teste 2: Buscar perfil
            print("\n📋 TESTE 2: BUSCAR PERFIL")
            profile_response = requests.get(
                f"{api_url}/user/profile",
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if profile_response.status_code == 200:
                profile = profile_response.json()
                print("✅ Perfil carregado!")
                print(f"  Must Change Password: {profile.get('must_change_password')}")
                print(f"  Profile Complete: {profile.get('profile_complete')}")
                print(f"  Nome Fantasia: {profile.get('nome_fantasia')}")
                print(f"  Logo URL: {profile.get('logo_url')[:50] if profile.get('logo_url') else None}...")
                print(f"  Cor Primária: {profile.get('cor_primaria')}")
                print(f"  Cor Secundária: {profile.get('cor_secundaria')}")
                
                # Verificar campos críticos
                if profile.get('must_change_password') != True:
                    print("⚠️  PROBLEMA: must_change_password no perfil não é True!")
                if not profile.get('logo_url'):
                    print("⚠️  PROBLEMA: logo_url não está presente!")
                if not profile.get('cor_primaria'):
                    print("⚠️  PROBLEMA: cor_primaria não está presente!")
                if not profile.get('cor_secundaria'):
                    print("⚠️  PROBLEMA: cor_secundaria não está presente!")
                
                if (profile.get('must_change_password') == True and 
                    profile.get('logo_url') and 
                    profile.get('cor_primaria') and 
                    profile.get('cor_secundaria')):
                    print("\n✅ TODOS OS CAMPOS ESTÃO CORRETOS!")
                else:
                    print("\n❌ ALGUNS CAMPOS ESTÃO FALTANDO OU INCORRETOS")
            else:
                print(f"❌ Erro ao buscar perfil: {profile_response.status_code}")
                print(profile_response.text)
        else:
            print(f"❌ Erro no login: {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"❌ Erro no teste: {str(e)}")
    
    client.close()
    
    print("\n" + "="*80)
    print("TESTE CONCLUÍDO")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(test_flow())
