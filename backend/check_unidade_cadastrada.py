"""
Script para verificar se uma unidade foi cadastrada no banco
Execute após cadastrar a unidade no painel
"""
import asyncio
import sys
import os
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_unidade():
    """Verifica unidades cadastradas"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'transmill')]
    
    print("="*80)
    print("🔍 VERIFICANDO UNIDADES CADASTRADAS NO BANCO DE PRODUÇÃO")
    print("="*80)
    print(f"MongoDB: {mongo_url}")
    print(f"Database: {os.environ.get('DB_NAME', 'transmill')}")
    print()
    
    # Buscar TODAS as unidades
    unidades = await db.users.find({'user_type': 'labelview_unidade'}).to_list(None)
    
    print(f"📊 TOTAL DE UNIDADES: {len(unidades)}")
    print()
    
    if len(unidades) == 0:
        print("❌ NENHUMA UNIDADE ENCONTRADA NO BANCO!")
        print()
        print("Isso significa que o cadastro NÃO foi salvo.")
        print("Possíveis causas:")
        print("  1. Erro durante upload da logo")
        print("  2. Campo obrigatório faltando")
        print("  3. Timeout na requisição")
        print("  4. Erro de validação")
        
    else:
        print("="*80)
        for i, unidade in enumerate(unidades, 1):
            print(f"\n✅ UNIDADE {i}:")
            print("-"*80)
            print(f"📧 Email: {unidade.get('email')}")
            print(f"📛 Nome Fantasia: {unidade.get('nome_fantasia')}")
            print(f"🏢 Razão Social: {unidade.get('razao_social')}")
            print(f"📞 Telefone: {unidade.get('telefone')}")
            print(f"📱 WhatsApp: {unidade.get('whatsapp')}")
            print()
            print(f"🔑 CREDENCIAIS DE ACESSO:")
            print(f"   Email: {unidade.get('email')}")
            print(f"   Senha Provisória: {unidade.get('temporary_password')}")
            print()
            print(f"🔐 Must Change Password: {unidade.get('must_change_password')}")
            print(f"✅ Is Active: {unidade.get('is_active')}")
            print(f"🚫 Is Blocked: {unidade.get('is_blocked')}")
            print()
            print(f"🎨 IDENTIDADE VISUAL:")
            logo = unidade.get('logo_url', '')
            if logo:
                print(f"   🖼️  Logo: {logo[:80]}...")
            else:
                print(f"   ❌ Logo: NÃO DEFINIDA")
            
            cor_pri = unidade.get('cor_primaria')
            cor_sec = unidade.get('cor_secundaria')
            if cor_pri:
                print(f"   🎨 Cor Primária: {cor_pri}")
            else:
                print(f"   ❌ Cor Primária: NÃO DEFINIDA")
            
            if cor_sec:
                print(f"   🎨 Cor Secundária: {cor_sec}")
            else:
                print(f"   ❌ Cor Secundária: NÃO DEFINIDA")
            
            print()
            print(f"🆔 ID: {unidade.get('id')}")
            print(f"📅 Cadastrado em: {unidade.get('created_at')}")
            print()
            
            # Verificar se está tudo OK para login
            problemas = []
            if not unidade.get('email'):
                problemas.append("❌ Email não definido")
            if not unidade.get('temporary_password'):
                problemas.append("❌ Senha provisória não definida")
            if not unidade.get('is_active'):
                problemas.append("⚠️  Conta não está ativa")
            if unidade.get('is_blocked'):
                problemas.append("⚠️  Conta está bloqueada")
            
            if problemas:
                print("⚠️  PROBLEMAS ENCONTRADOS:")
                for p in problemas:
                    print(f"   {p}")
                print()
                print("❌ Esta unidade pode ter problemas no login!")
            else:
                print("✅ UNIDADE PRONTA PARA LOGIN!")
                print()
                print("🎯 PRÓXIMO PASSO:")
                print(f"   1. Faça logout do Master")
                print(f"   2. Faça login com:")
                print(f"      Email: {unidade.get('email')}")
                print(f"      Senha: {unidade.get('temporary_password')}")
                print(f"   3. Modal de troca de senha deve aparecer")
                print(f"   4. Após trocar senha, verificar se logo e cores aparecem")
            
            print("="*80)
    
    # Buscar especificamente por Agitoauto
    print("\n🔍 BUSCA ESPECÍFICA: Agitoauto")
    agito = await db.users.find({
        '$or': [
            {'email': {'$regex': 'agitoauto', '$options': 'i'}},
            {'nome_fantasia': {'$regex': 'agitoauto', '$options': 'i'}}
        ]
    }).to_list(None)
    
    if agito:
        print(f"✅ Encontrado {len(agito)} registro(s) com 'Agitoauto'")
    else:
        print("❌ Nenhum registro com 'Agitoauto' encontrado")
    
    client.close()
    print()

if __name__ == "__main__":
    asyncio.run(check_unidade())
