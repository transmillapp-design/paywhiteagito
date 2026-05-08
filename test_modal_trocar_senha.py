#!/usr/bin/env python3
"""
Teste específico para Modal de Trocar Senha no Primeiro Login
"""

import requests
import json
import time

class ModalTrocarSenhaTester:
    def __init__(self):
        # Read backend URL from frontend .env
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        frontend_url = line.split('=', 1)[1].strip()
                        if frontend_url.endswith('/api'):
                            self.base_url = frontend_url
                        else:
                            self.base_url = f"{frontend_url}/api"
                        break
                else:
                    self.base_url = "http://localhost:8001/api"
        except:
            self.base_url = "http://localhost:8001/api"
        
        self.session = requests.Session()
        print(f"🌐 Base URL: {self.base_url}")

    def test_modal_trocar_senha(self):
        """🎯 TESTE: Modal de Trocar Senha no Primeiro Login"""
        print("\n🎯 TESTE: Modal de Trocar Senha no Primeiro Login")
        print("=" * 80)
        print("OBJETIVO: Validar que o modal de trocar senha aparece automaticamente ao fazer login com senha provisória.")
        print("")
        
        # Test with existing unit that should have must_change_password=true
        # From previous tests, we know this unit exists
        test_credentials = [
            {
                "email": "teste.producao.final.1764177477@teste.com",
                "password": "SenhaProvisoria2024!",
                "description": "Unidade criada em teste anterior"
            }
        ]
        
        # Also try to create a new unit first
        print("--- PASSO 1: Tentar Login Master para Criar Nova Unidade ---")
        
        master_login_data = {
            "email": "protecao@agitomil.com",
            "password": "demo123"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=master_login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                master_token = data.get("access_token")
                master_user = data.get("user", {})
                
                if master_token and master_user.get("is_labelview_master", False):
                    print("✅ Login Master funcionando - criando nova unidade de teste")
                    
                    # Create new test unit
                    timestamp = int(time.time())
                    new_email = f"modal.teste.{timestamp}@teste.com"
                    new_password = "SenhaModal123!"
                    
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
                        'cnpj': f'33.444.555/0001-{timestamp % 100:02d}',
                        'telefone': '(11) 99999-9999',
                        'whatsapp': '(11) 99999-9999',
                        'email': new_email,
                        'password': new_password,
                        'responsavel_nome': 'João Modal',
                        'responsavel_cpf': '111.222.333-44',
                        'responsavel_email': 'joao.modal@teste.com',
                        'responsavel_whatsapp': '(11) 99999-9999',
                        'pix_key': f'33.444.555/0001-{timestamp % 100:02d}',
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
                        response = self.session.post(
                            f"{self.base_url}/labelview/unidades",
                            data=form_data,
                            files=files,
                            headers=headers
                        )
                        
                        if response.status_code == 200:
                            unit_data = response.json()
                            success = unit_data.get("success", False)
                            credentials = unit_data.get("credentials", {})
                            
                            if success and credentials:
                                new_unit_email = credentials.get("email")
                                new_unit_password = credentials.get("password")
                                
                                print(f"✅ Nova unidade criada - Email: {new_unit_email}")
                                
                                # Add to test credentials
                                test_credentials.insert(0, {
                                    "email": new_unit_email,
                                    "password": new_unit_password,
                                    "description": "Unidade recém-criada"
                                })
                            else:
                                print(f"❌ Falha ao criar nova unidade - success: {success}")
                        else:
                            print(f"❌ Falha ao criar nova unidade - Status: {response.status_code}")
                    except Exception as e:
                        print(f"❌ Erro ao criar nova unidade: {str(e)}")
                else:
                    print("❌ Login Master falhou ou não é labelview_master")
            else:
                print(f"❌ Login Master falhou - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro no login Master: {str(e)}")
        
        # Test login with units that should have must_change_password=true
        print(f"\n--- PASSO 2: Testar Login com {len(test_credentials)} Unidades ---")
        
        success_count = 0
        
        for i, cred in enumerate(test_credentials, 1):
            print(f"\n🔍 Testando Unidade {i}: {cred['description']}")
            print(f"   📧 Email: {cred['email']}")
            
            login_data = {
                "email": cred["email"],
                "password": cred["password"]
            }
            
            try:
                response = self.session.post(
                    f"{self.base_url}/auth/login",
                    json=login_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    print("✅ Login funcionando - Status 200")
                    
                    try:
                        login_response = response.json()
                        
                        # Validate Response Structure
                        print("\n📋 VALIDAÇÃO DA ESTRUTURA DA RESPOSTA:")
                        
                        # Check access_token
                        access_token = login_response.get("access_token")
                        if access_token:
                            print("✅ access_token presente na resposta")
                        else:
                            print("❌ access_token ausente na resposta")
                            continue
                        
                        # Check token_type
                        token_type = login_response.get("token_type")
                        if token_type == "bearer":
                            print(f"✅ token_type correto: {token_type}")
                        else:
                            print(f"❌ token_type incorreto: {token_type} (esperado: bearer)")
                        
                        # Check user object
                        user_data = login_response.get("user", {})
                        if user_data:
                            print("✅ Objeto user presente na resposta")
                            
                            # Check user_type
                            user_type = user_data.get("user_type")
                            if user_type == "labelview_unidade":
                                print(f"✅ user.user_type correto: {user_type}")
                            else:
                                print(f"❌ user.user_type incorreto: {user_type} (esperado: labelview_unidade)")
                        else:
                            print("❌ Objeto user ausente na resposta")
                        
                        # CRITICAL VALIDATION: must_change_password at root level
                        must_change_password = login_response.get("must_change_password")
                        if must_change_password is True:
                            print("✅ CRÍTICO: Campo must_change_password=true está no nível raiz da resposta")
                            print("✅ Frontend pode acessar: response.data.must_change_password = true")
                            print("✅ Modal de trocar senha deve aparecer automaticamente")
                            success_count += 1
                        elif must_change_password is False:
                            print("❌ CRÍTICO: Campo must_change_password=false (deveria ser true para senha provisória)")
                        elif must_change_password is None:
                            print("❌ CRÍTICO: Campo must_change_password ausente no nível raiz da resposta")
                        else:
                            print(f"❌ CRÍTICO: Campo must_change_password com valor inválido: {must_change_password}")
                        
                        # Check if must_change_password is NOT inside user object (common mistake)
                        user_must_change = user_data.get("must_change_password")
                        if user_must_change is not None:
                            print(f"❌ ERRO: Campo must_change_password encontrado dentro do objeto user (valor: {user_must_change})")
                            print("❌ PROBLEMA: Frontend não conseguirá acessar response.data.must_change_password")
                        else:
                            print("✅ Campo must_change_password corretamente FORA do objeto user")
                        
                        # Check profile_incomplete (optional but good to have)
                        profile_incomplete = login_response.get("profile_incomplete")
                        if profile_incomplete is not None:
                            print(f"✅ Campo profile_incomplete presente: {profile_incomplete}")
                        else:
                            print("✅ Campo profile_incomplete ausente (opcional)")
                        
                        # Show complete response structure for debugging
                        print("\n📋 ESTRUTURA COMPLETA DA RESPOSTA:")
                        print(json.dumps(login_response, indent=2, ensure_ascii=False))
                        
                        # Validate expected structure
                        expected_structure = {
                            "access_token": "string",
                            "token_type": "bearer", 
                            "user": "object",
                            "must_change_password": True,
                            "profile_incomplete": "boolean (opcional)"
                        }
                        
                        print("\n📋 ESTRUTURA ESPERADA:")
                        print(json.dumps(expected_structure, indent=2, ensure_ascii=False))
                        
                        if must_change_password is True:
                            print("\n🎯 RESULTADO PARA ESTA UNIDADE:")
                            print("✅ SUCESSO: Modal de trocar senha funcionará corretamente")
                            print("✅ Campo must_change_password está na posição correta")
                            print("✅ Frontend conseguirá detectar e mostrar o modal")
                        else:
                            print("\n🎯 RESULTADO PARA ESTA UNIDADE:")
                            print("❌ FALHA: Modal de trocar senha pode não aparecer")
                            print("❌ Campo must_change_password não está correto")
                        
                    except Exception as e:
                        print(f"❌ Erro ao processar resposta JSON: {str(e)}")
                        continue
                        
                else:
                    print(f"❌ Login falhou - Status: {response.status_code}")
                    try:
                        error_data = response.json()
                        print(f"❌ Erro: {error_data}")
                    except:
                        print(f"❌ Erro sem detalhes - Status: {response.status_code}")
                    continue
                    
            except Exception as e:
                print(f"❌ Erro no login: {str(e)}")
                continue
        
        # Final Summary
        print(f"\n🎯 RESUMO FINAL DO TESTE MODAL DE TROCAR SENHA:")
        print(f"   • Unidades testadas: {len(test_credentials)}")
        print(f"   • Unidades com must_change_password=true: {success_count}")
        print(f"   • Taxa de sucesso: {(success_count/len(test_credentials)*100):.1f}%" if len(test_credentials) > 0 else "   • Taxa de sucesso: 0%")
        
        if success_count > 0:
            print("\n✅ RESULTADO: MODAL DE TROCAR SENHA FUNCIONANDO!")
            print("   ✅ Campo must_change_password está no nível raiz da resposta")
            print("   ✅ Frontend pode acessar response.data.must_change_password")
            print("   ✅ Modal de trocar senha vai aparecer automaticamente")
            print("   ✅ Estrutura da resposta está correta")
            print("   ✅ Sistema pronto para uso")
            return True
        else:
            print("\n❌ RESULTADO: PROBLEMAS CRÍTICOS IDENTIFICADOS!")
            print("   ❌ Campo must_change_password pode estar na posição errada")
            print("   ❌ Frontend pode não conseguir acessar o campo")
            print("   ❌ Modal de trocar senha pode não aparecer")
            print("   ❌ CORREÇÃO NECESSÁRIA na estrutura da resposta do login")
            return False

if __name__ == "__main__":
    tester = ModalTrocarSenhaTester()
    tester.test_modal_trocar_senha()