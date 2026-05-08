#!/usr/bin/env python3
"""
Teste simples para Modal de Trocar Senha - usando contas demo conhecidas
"""

import requests
import json
import time

def test_modal_trocar_senha():
    """🎯 TESTE: Modal de Trocar Senha no Primeiro Login"""
    print("\n🎯 TESTE: Modal de Trocar Senha no Primeiro Login")
    print("=" * 80)
    
    base_url = "http://localhost:8001/api"
    session = requests.Session()
    
    # Test with known demo accounts first to see the response structure
    demo_accounts = [
        {"email": "cliente@demo.com", "password": "demo123", "description": "Cliente Demo"},
        {"email": "lojista@demo.com", "password": "demo123", "description": "Lojista Demo"},
        {"email": "master@agitocoin.com", "password": "master123", "description": "Master Demo"},
        {"email": "transmillapp@gmail.com", "password": "demo123", "description": "Transmill App"},
        {"email": "labelview@transmill.com", "password": "demo123", "description": "Labelview Demo"}
    ]
    
    print("--- PASSO 1: Testar Contas Demo para Ver Estrutura da Resposta ---")
    
    for account in demo_accounts:
        print(f"\n🔍 Testando: {account['description']} ({account['email']})")
        
        login_data = {
            "email": account["email"],
            "password": account["password"]
        }
        
        try:
            response = session.post(
                f"{base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                print("✅ Login funcionando - Status 200")
                
                try:
                    login_response = response.json()
                    
                    # Check must_change_password field
                    must_change_password = login_response.get("must_change_password")
                    user_data = login_response.get("user", {})
                    user_type = user_data.get("user_type", "")
                    
                    print(f"   📧 Email: {account['email']}")
                    print(f"   🏢 User Type: {user_type}")
                    print(f"   🔑 must_change_password: {must_change_password}")
                    print(f"   🔑 must_change_password type: {type(must_change_password)}")
                    
                    # Check if must_change_password is in user object (wrong place)
                    user_must_change = user_data.get("must_change_password")
                    if user_must_change is not None:
                        print(f"   ❌ ERRO: must_change_password também encontrado em user: {user_must_change}")
                    
                    # Show key fields
                    print(f"   📋 Campos principais:")
                    print(f"      - access_token: {'presente' if login_response.get('access_token') else 'ausente'}")
                    print(f"      - token_type: {login_response.get('token_type', 'ausente')}")
                    print(f"      - user: {'presente' if login_response.get('user') else 'ausente'}")
                    print(f"      - must_change_password: {must_change_password}")
                    print(f"      - profile_incomplete: {login_response.get('profile_incomplete')}")
                    
                    # If this is a labelview account, show more details
                    if user_type.startswith('labelview_'):
                        print(f"   🎯 CONTA LABELVIEW ENCONTRADA!")
                        print(f"      - Tipo: {user_type}")
                        print(f"      - must_change_password: {must_change_password}")
                        
                        if must_change_password is True:
                            print(f"   ✅ PERFEITO: Esta conta tem must_change_password=true")
                            print(f"   ✅ Modal de trocar senha deve aparecer")
                        elif must_change_password is False:
                            print(f"   ⚠️ Esta conta tem must_change_password=false")
                            print(f"   ⚠️ Modal de trocar senha NÃO vai aparecer")
                        else:
                            print(f"   ❌ must_change_password tem valor inválido: {must_change_password}")
                    
                except Exception as e:
                    print(f"❌ Erro ao processar resposta: {str(e)}")
                    
            else:
                print(f"❌ Login falhou - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Erro: {error_data}")
                except:
                    print(f"❌ Erro sem detalhes")
                    
        except Exception as e:
            print(f"❌ Erro no login: {str(e)}")
    
    # Now try to create a unit with master account if available
    print("\n--- PASSO 2: Tentar Criar Unidade com must_change_password=true ---")
    
    # Try to login as master first
    master_accounts = [
        {"email": "master@agitocoin.com", "password": "master123"},
        {"email": "transmillapp@gmail.com", "password": "demo123"},
        {"email": "labelview@transmill.com", "password": "demo123"}
    ]
    
    master_token = None
    
    for master_cred in master_accounts:
        print(f"\n🔍 Tentando login master: {master_cred['email']}")
        
        try:
            response = session.post(
                f"{base_url}/auth/login",
                json=master_cred,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                user_data = data.get("user", {})
                
                # Check if this account can create labelview units
                is_master = user_data.get("is_master_account", False)
                is_labelview_master = user_data.get("is_labelview_master", False)
                
                print(f"   ✅ Login funcionando")
                print(f"   🔓 is_master_account: {is_master}")
                print(f"   🔓 is_labelview_master: {is_labelview_master}")
                
                if is_labelview_master:
                    master_token = data.get("access_token")
                    print(f"   ✅ MASTER LABELVIEW ENCONTRADO! Token obtido.")
                    break
                elif is_master:
                    print(f"   ⚠️ Master geral, mas não Labelview master")
                else:
                    print(f"   ❌ Não é master")
            else:
                print(f"   ❌ Login falhou - Status: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Erro: {str(e)}")
    
    if master_token:
        print(f"\n✅ Master token obtido! Tentando criar unidade de teste...")
        
        # Create test unit
        timestamp = int(time.time())
        test_email = f"modal.teste.{timestamp}@teste.com"
        test_password = "SenhaModal123!"
        
        # Create minimal PNG for logo
        import base64
        import io
        png_data = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=='
        )
        
        files = {
            'logo': ('test_logo.png', io.BytesIO(png_data), 'image/png')
        }
        
        form_data = {
            'nome_fantasia': 'Modal Teste Unidade',
            'razao_social': 'Modal Teste LTDA',
            'cnpj': f'44.555.666/0001-{timestamp % 100:02d}',
            'telefone': '(11) 99999-9999',
            'whatsapp': '(11) 99999-9999',
            'email': test_email,
            'password': test_password,
            'responsavel_nome': 'João Modal',
            'responsavel_cpf': '111.222.333-44',
            'responsavel_email': 'joao.modal@teste.com',
            'responsavel_whatsapp': '(11) 99999-9999',
            'pix_key': f'44.555.666/0001-{timestamp % 100:02d}',
            'pix_key_type': 'cnpj',
            'taxa_adesao': '100.00',
            'vencimento_inicio': '1',
            'vencimento_fim': '15',
            'cep': '01310-100',
            'address': 'Rua Modal, 123',
            'number': '123',
            'complement': '',
            'neighborhood': 'Centro',
            'city': 'São Paulo',
            'state': 'SP',
            'cor_primaria': '#1a59ad',
            'cor_secundaria': '#2fa31c'
        }
        
        headers = {
            'Authorization': f'Bearer {master_token}'
        }
        
        try:
            response = session.post(
                f"{base_url}/labelview/unidades",
                data=form_data,
                files=files,
                headers=headers
            )
            
            if response.status_code == 200:
                unit_data = response.json()
                success = unit_data.get("success", False)
                credentials = unit_data.get("credentials", {})
                
                if success and credentials:
                    unit_email = credentials.get("email")
                    unit_password = credentials.get("password")
                    
                    print(f"✅ Unidade criada com sucesso!")
                    print(f"   📧 Email: {unit_email}")
                    print(f"   🔑 Senha: {unit_password}")
                    
                    # Now test login with this new unit
                    print(f"\n--- PASSO 3: Testar Login com Nova Unidade ---")
                    
                    unit_login_data = {
                        "email": unit_email,
                        "password": unit_password
                    }
                    
                    try:
                        response = session.post(
                            f"{base_url}/auth/login",
                            json=unit_login_data,
                            headers={"Content-Type": "application/json"}
                        )
                        
                        if response.status_code == 200:
                            print("✅ Login com nova unidade funcionando - Status 200")
                            
                            try:
                                login_response = response.json()
                                
                                print("\n📋 VALIDAÇÃO CRÍTICA DA ESTRUTURA DA RESPOSTA:")
                                
                                # Check all required fields
                                access_token = login_response.get("access_token")
                                token_type = login_response.get("token_type")
                                user_data = login_response.get("user", {})
                                must_change_password = login_response.get("must_change_password")
                                profile_incomplete = login_response.get("profile_incomplete")
                                
                                print(f"✅ access_token: {'presente' if access_token else 'AUSENTE'}")
                                print(f"✅ token_type: {token_type}")
                                print(f"✅ user: {'presente' if user_data else 'AUSENTE'}")
                                print(f"✅ user.user_type: {user_data.get('user_type', 'AUSENTE')}")
                                print(f"🎯 must_change_password: {must_change_password} (tipo: {type(must_change_password)})")
                                print(f"✅ profile_incomplete: {profile_incomplete}")
                                
                                # CRITICAL VALIDATION
                                if must_change_password is True:
                                    print(f"\n🎉 SUCESSO TOTAL!")
                                    print(f"✅ Campo must_change_password=true está no nível raiz")
                                    print(f"✅ Frontend pode acessar: response.data.must_change_password")
                                    print(f"✅ Modal de trocar senha VAI APARECER automaticamente")
                                    print(f"✅ Estrutura da resposta está CORRETA")
                                    
                                    # Show complete structure
                                    print(f"\n📋 ESTRUTURA COMPLETA DA RESPOSTA:")
                                    print(json.dumps(login_response, indent=2, ensure_ascii=False))
                                    
                                    return True
                                    
                                elif must_change_password is False:
                                    print(f"\n❌ PROBLEMA IDENTIFICADO!")
                                    print(f"❌ Campo must_change_password=false (deveria ser true)")
                                    print(f"❌ Modal de trocar senha NÃO vai aparecer")
                                    print(f"❌ Unidade recém-criada deveria ter must_change_password=true")
                                    
                                elif must_change_password is None:
                                    print(f"\n❌ PROBLEMA CRÍTICO!")
                                    print(f"❌ Campo must_change_password está AUSENTE")
                                    print(f"❌ Frontend não conseguirá acessar o campo")
                                    print(f"❌ Modal de trocar senha NÃO vai aparecer")
                                    
                                else:
                                    print(f"\n❌ PROBLEMA CRÍTICO!")
                                    print(f"❌ Campo must_change_password tem valor inválido: {must_change_password}")
                                
                                # Show complete structure for debugging
                                print(f"\n📋 ESTRUTURA COMPLETA DA RESPOSTA:")
                                print(json.dumps(login_response, indent=2, ensure_ascii=False))
                                
                                return False
                                
                            except Exception as e:
                                print(f"❌ Erro ao processar resposta: {str(e)}")
                                return False
                                
                        else:
                            print(f"❌ Login com nova unidade falhou - Status: {response.status_code}")
                            try:
                                error_data = response.json()
                                print(f"❌ Erro: {error_data}")
                            except:
                                print(f"❌ Erro sem detalhes")
                            return False
                            
                    except Exception as e:
                        print(f"❌ Erro no login da nova unidade: {str(e)}")
                        return False
                        
                else:
                    print(f"❌ Falha ao criar unidade - success: {success}")
                    print(f"❌ Credentials: {credentials}")
                    return False
                    
            else:
                print(f"❌ Falha ao criar unidade - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Erro: {error_data}")
                except:
                    print(f"❌ Erro sem detalhes")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao criar unidade: {str(e)}")
            return False
    else:
        print(f"\n❌ Não foi possível obter token master")
        print(f"❌ Não é possível criar unidade de teste")
        print(f"❌ Teste não pode ser completado")
        return False

if __name__ == "__main__":
    result = test_modal_trocar_senha()
    
    print(f"\n🎯 RESULTADO FINAL:")
    if result:
        print(f"✅ MODAL DE TROCAR SENHA FUNCIONANDO 100%!")
        print(f"✅ Campo must_change_password está na posição correta")
        print(f"✅ Frontend conseguirá mostrar o modal automaticamente")
    else:
        print(f"❌ PROBLEMAS IDENTIFICADOS NO MODAL DE TROCAR SENHA")
        print(f"❌ Correções necessárias na estrutura da resposta")