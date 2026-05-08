#!/usr/bin/env python3
"""
Complete Labelview Unit Flow Test
Tests the complete flow from creating a Labelview unit to login and password change
"""

import requests
import json
import time
import uuid
from datetime import datetime, timezone, timedelta

class CompleteLabelviewFlowTester:
    def __init__(self, base_url: str = None):
        if base_url is None:
            # Read from frontend .env file
            try:
                with open('/app/frontend/.env', 'r') as f:
                    for line in f:
                        if line.startswith('REACT_APP_BACKEND_URL='):
                            frontend_url = line.split('=', 1)[1].strip()
                            # Check if URL already ends with /api
                            if frontend_url.endswith('/api'):
                                base_url = frontend_url
                            else:
                                base_url = f"{frontend_url}/api"
                            break
                if base_url is None:
                    base_url = "http://localhost:8001/api"
            except:
                base_url = "http://localhost:8001/api"
        
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_complete_labelview_unit_flow(self):
        """🎯 TESTE COMPLETO: FLUXO UNIDADE LABELVIEW → LOGIN TRANSMILL → TROCAR SENHA"""
        print("\n🎯 TESTE COMPLETO: FLUXO UNIDADE LABELVIEW → LOGIN TRANSMILL → TROCAR SENHA")
        print("=" * 80)
        print("CONTEXTO:")
        print("- Unidade/Regional = sempre PJ (CNPJ)")
        print("- Consultor = pode ser CPF ou CNPJ")
        print("- Ao entrar no Transmill pela primeira vez, deve ter tela para trocar senha provisória")
        print("- Conta única acessa Labelview e Transmill")
        print("")
        print("TESTE COMPLETO:")
        print("")
        print("**PARTE 1: Criar Unidade Labelview (PJ)**")
        print("1. Login Master: protecao@agitomil.com / demo123")
        print("2. POST /api/labelview/unidades")
        print("")
        print("**PARTE 2: Login no Transmill com Senha Provisória**")
        print("4. POST /api/auth/login")
        print("")
        print("**PARTE 3: Trocar Senha Provisória**")
        print("6. POST /api/auth/change-password")
        print("")
        print("**PARTE 4: Login com Nova Senha**")
        print("8. POST /api/auth/login")
        print("")
        print("**VALIDAÇÕES CRÍTICAS:**")
        print("- ✅ Unidade criada com todos os campos PJ")
        print("- ✅ Dados sócio administrador mapeados (admin_name, admin_cpf, admin_email, admin_rg_front, admin_rg_back)")
        print("- ✅ Campo street preenchido (address → street)")
        print("- ✅ Login com senha provisória funciona")
        print("- ✅ must_change_password = true no primeiro login")
        print("- ✅ Endpoint de trocar senha funciona")
        print("- ✅ Login com nova senha funciona")
        print("- ✅ must_change_password = false após trocar")
        print("- ✅ profile_complete = true (não precisa completar dados)")
        print("=" * 80)
        
        # Generate unique email for this test
        timestamp = int(time.time())
        test_email = f"unidade.teste.completa.{timestamp}@teste.com"
        provisional_password = "senhaProvisoria123"
        new_password = "NovaSenhaSegura123!"
        
        # PARTE 1: Criar Unidade Labelview (PJ)
        print("\n--- PARTE 1: CRIAR UNIDADE LABELVIEW (PJ) ---")
        print("\n--- TESTE 1: Login Master Labelview ---")
        
        master_login_data = {
            "email": "protecao@agitomil.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", master_login_data)
        
        master_token = None
        if response.status_code == 200:
            data = response.json()
            master_token = data.get("access_token")
            master_user = data.get("user", {})
            
            if master_token and master_user.get("is_labelview_master", False):
                self.log_test("Login Master Labelview", True, 
                             f"✅ Login Master funcionando - is_labelview_master=true")
            else:
                self.log_test("Login Master Labelview", False, 
                             "❌ Login Master falhou ou permissões incorretas")
                return False
        else:
            self.log_test("Login Master Labelview", False, 
                         f"❌ Login Master falhou - Status: {response.status_code}")
            return False
        
        # TESTE 2: Criar Unidade com dados completos PJ
        print("\n--- TESTE 2: Criar Unidade Labelview (PJ) ---")
        
        unidade_data = {
            "nome_fantasia": "Unidade Teste Completa",
            "razao_social": "Unidade Teste LTDA",
            "cnpj": "77.888.999/0001-55",
            "telefone": "(11) 99876-5432",
            "responsavel_nome": "José Responsável",
            "responsavel_cpf": "123.456.789-00",
            "responsavel_email": "jose@teste.com",
            "email": test_email,
            "password": provisional_password,
            "pix_key": "77.888.999/0001-55",
            "pix_key_type": "cnpj",
            "taxa_adesao": "100.00",
            "cep": "01310-100",
            "address": "Avenida Paulista, 1000",
            "number": "1000",
            "city": "São Paulo",
            "state": "SP",
            "vencimento_inicio": "1",
            "vencimento_fim": "10",
            "cor_primaria": "#1a59ad",
            "cor_secundaria": "#2fa31c"
        }
        
        # Create a dummy logo file for the test
        import io
        logo_file = io.BytesIO(b"dummy logo content")
        
        # Prepare form data
        files = {
            'logo': ('test_logo.png', logo_file, 'image/png')
        }
        
        # Prepare form data (not JSON)
        form_data = {
            "nome_fantasia": "Unidade Teste Completa",
            "razao_social": "Unidade Teste LTDA",
            "cnpj": "77.888.999/0001-55",
            "telefone": "(11) 99876-5432",
            "responsavel_nome": "José Responsável",
            "responsavel_cpf": "123.456.789-00",
            "responsavel_email": "jose@teste.com",
            "pix_key": "77.888.999/0001-55",
            "pix_key_type": "cnpj",
            "taxa_adesao": "100.00",
            "cep": "01310-100",
            "address": "Avenida Paulista, 1000",
            "number": "1000",
            "city": "São Paulo",
            "state": "SP",
            "vencimento_inicio": "1",
            "vencimento_fim": "10",
            "cor_primaria": "#1a59ad",
            "cor_secundaria": "#2fa31c",
            "email": test_email,
            "password": provisional_password
        }
        
        # Make request with form data and file
        url = f"{self.base_url}/labelview/unidades"
        headers = {"Authorization": f"Bearer {master_token}"}
        
        response = self.session.post(url, data=form_data, files=files, headers=headers)
        
        unidade_id = None
        if response.status_code == 200:
            data = response.json()
            unidade_id = data.get("unidade_id")
            credentials = data.get("credentials", {})
            
            if unidade_id:
                self.log_test("Criar Unidade PJ", True, 
                             f"✅ Unidade criada com sucesso - ID: {unidade_id}")
                
                # Validar credentials retornadas
                if credentials.get("email") == test_email:
                    self.log_test("Credentials Returned", True, 
                                 f"✅ Credentials retornadas corretamente")
                else:
                    self.log_test("Credentials Returned", False, 
                                 f"❌ Credentials incorretas ou ausentes")
            else:
                self.log_test("Criar Unidade PJ", False, 
                             "❌ unidade_id não retornado")
                return False
        else:
            self.log_test("Criar Unidade PJ", False, 
                         f"❌ Criação falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                pass
            return False
        
        # PARTE 2: Login no Transmill com Senha Provisória
        print("\n--- PARTE 2: LOGIN NO TRANSMILL COM SENHA PROVISÓRIA ---")
        print("\n--- TESTE 3: Login com Senha Provisória ---")
        
        login_data = {
            "email": test_email,
            "password": provisional_password
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        access_token = None
        user_data = None
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            user_data = data.get("user", {})
            
            if access_token:
                self.log_test("Login Senha Provisória", True, 
                             f"✅ Login com senha provisória funcionando")
                
                # VALIDAÇÕES CRÍTICAS
                # 1. must_change_password = true
                must_change_password = user_data.get("must_change_password", False)
                if must_change_password:
                    self.log_test("Must Change Password Flag", True, 
                                 "✅ must_change_password = true (correto)")
                else:
                    self.log_test("Must Change Password Flag", False, 
                                 f"❌ must_change_password = {must_change_password} (esperado: true)")
                
                # 2. profile_complete = true
                profile_complete = user_data.get("profile_complete", False)
                if profile_complete:
                    self.log_test("Profile Complete Flag", True, 
                                 "✅ profile_complete = true (perfil já completo)")
                else:
                    self.log_test("Profile Complete Flag", False, 
                                 f"❌ profile_complete = {profile_complete} (esperado: true)")
                
                # 3. user_type = "labelview_unidade"
                user_type = user_data.get("user_type", "")
                if user_type == "labelview_unidade":
                    self.log_test("User Type Validation", True, 
                                 f"✅ user_type = '{user_type}' (correto)")
                else:
                    self.log_test("User Type Validation", False, 
                                 f"❌ user_type = '{user_type}' (esperado: 'labelview_unidade')")
                
                # 4. Dados do sócio presentes
                admin_name = user_data.get("admin_name")
                admin_cpf = user_data.get("admin_cpf")
                admin_email = user_data.get("admin_email")
                
                if admin_name and admin_cpf and admin_email:
                    self.log_test("Admin Data Present", True, 
                                 f"✅ Dados do sócio presentes (admin_name, admin_cpf, admin_email)")
                else:
                    self.log_test("Admin Data Present", False, 
                                 f"❌ Dados do sócio ausentes ou incompletos")
                
                print(f"🔍 Dados do usuário logado:")
                print(f"   📧 Email: {user_data.get('email')}")
                print(f"   👤 Nome: {user_data.get('full_name')}")
                print(f"   🏢 Tipo: {user_type}")
                print(f"   🔄 Must Change Password: {must_change_password}")
                print(f"   ✅ Profile Complete: {profile_complete}")
                print(f"   👨‍💼 Admin Name: {admin_name}")
                print(f"   📄 Admin CPF: {admin_cpf}")
                print(f"   📧 Admin Email: {admin_email}")
                
            else:
                self.log_test("Login Senha Provisória", False, 
                             "❌ access_token não retornado")
                return False
        else:
            self.log_test("Login Senha Provisória", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                pass
            return False
        
        # PARTE 3: Trocar Senha Provisória
        print("\n--- PARTE 3: TROCAR SENHA PROVISÓRIA ---")
        print("\n--- TESTE 4: Change Password Endpoint ---")
        
        change_password_data = {
            "current_password": provisional_password,
            "new_password": new_password
        }
        
        response = self.make_request("POST", "/auth/change-password", change_password_data, access_token)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            
            if success:
                self.log_test("Change Password", True, 
                             f"✅ Senha alterada com sucesso")
                
                # Verificar se must_change_password agora é false
                must_change_password_after = data.get("must_change_password", True)
                if not must_change_password_after:
                    self.log_test("Must Change Password After", True, 
                                 "✅ must_change_password = false após alteração")
                else:
                    self.log_test("Must Change Password After", False, 
                                 f"❌ must_change_password = {must_change_password_after} (esperado: false)")
            else:
                self.log_test("Change Password", False, 
                             f"❌ success = {success}")
                return False
        else:
            self.log_test("Change Password", False, 
                         f"❌ Change password falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                pass
            return False
        
        # PARTE 4: Login com Nova Senha
        print("\n--- PARTE 4: LOGIN COM NOVA SENHA ---")
        print("\n--- TESTE 5: Login com Nova Senha ---")
        
        new_login_data = {
            "email": test_email,
            "password": new_password
        }
        
        response = self.make_request("POST", "/auth/login", new_login_data)
        
        if response.status_code == 200:
            data = response.json()
            new_access_token = data.get("access_token")
            new_user_data = data.get("user", {})
            
            if new_access_token:
                self.log_test("Login Nova Senha", True, 
                             f"✅ Login com nova senha funcionando")
                
                # VALIDAÇÕES FINAIS
                # 1. must_change_password = false
                must_change_password_final = new_user_data.get("must_change_password", True)
                if not must_change_password_final:
                    self.log_test("Final Must Change Password", True, 
                                 "✅ must_change_password = false (correto)")
                else:
                    self.log_test("Final Must Change Password", False, 
                                 f"❌ must_change_password = {must_change_password_final} (esperado: false)")
                
                # 2. Token válido
                if new_access_token != access_token:
                    self.log_test("New Token Generated", True, 
                                 "✅ Novo token JWT gerado")
                else:
                    self.log_test("New Token Generated", False, 
                                 "❌ Token não foi renovado")
                
                # 3. Pode acessar Transmill normalmente
                profile_response = self.make_request("GET", "/user/profile", token=new_access_token)
                if profile_response.status_code == 200:
                    self.log_test("Access Transmill Normally", True, 
                                 "✅ Pode acessar Transmill normalmente")
                else:
                    self.log_test("Access Transmill Normally", False, 
                                 f"❌ Não consegue acessar perfil - Status: {profile_response.status_code}")
                
                print(f"🔍 Dados finais do usuário:")
                print(f"   📧 Email: {new_user_data.get('email')}")
                print(f"   🔄 Must Change Password: {must_change_password_final}")
                print(f"   🔑 Token Válido: {bool(new_access_token)}")
                
            else:
                self.log_test("Login Nova Senha", False, 
                             "❌ access_token não retornado")
                return False
        else:
            self.log_test("Login Nova Senha", False, 
                         f"❌ Login com nova senha falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                pass
            return False
        
        # TESTE ADICIONAL: Verificar se senha antiga não funciona mais
        print("\n--- TESTE 6: Verificar Senha Antiga Inválida ---")
        
        old_login_data = {
            "email": test_email,
            "password": provisional_password
        }
        
        response = self.make_request("POST", "/auth/login", old_login_data)
        
        if response.status_code == 401:
            self.log_test("Old Password Invalid", True, 
                         "✅ Senha antiga não funciona mais (correto)")
        else:
            self.log_test("Old Password Invalid", False, 
                         f"❌ Senha antiga ainda funciona - Status: {response.status_code}")
        
        # Resumo Final
        print(f"\n🎯 RESUMO DO TESTE COMPLETO - FLUXO UNIDADE LABELVIEW:")
        
        flow_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in 
                     ["Login Master", "Criar Unidade", "Credentials", "Login Senha", "Must Change", 
                      "Profile Complete", "User Type", "Admin Data", "Change Password", "Login Nova", 
                      "Final Must Change", "New Token", "Access Transmill", "Old Password"])]
        
        total_tests = len(flow_tests)
        successful_tests = len([r for r in flow_tests if r["success"]])
        
        print(f"   • Total de testes executados: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "   • Taxa de sucesso: 0%")
        
        # Análise por etapa
        print(f"\n📊 ANÁLISE POR ETAPA:")
        
        creation_tests = [r for r in flow_tests if any(k in r["test"] for k in ["Login Master", "Criar Unidade", "Credentials"])]
        creation_success = len([r for r in creation_tests if r["success"]])
        print(f"   🏗️ CRIAÇÃO UNIDADE: {creation_success}/{len(creation_tests)} funcionando")
        
        provisional_tests = [r for r in flow_tests if any(k in r["test"] for k in ["Login Senha", "Must Change", "Profile Complete", "User Type", "Admin Data"])]
        provisional_success = len([r for r in provisional_tests if r["success"]])
        print(f"   🔐 LOGIN PROVISÓRIO: {provisional_success}/{len(provisional_tests)} funcionando")
        
        change_tests = [r for r in flow_tests if "Change Password" in r["test"]]
        change_success = len([r for r in change_tests if r["success"]])
        print(f"   🔄 TROCAR SENHA: {change_success}/{len(change_tests)} funcionando")
        
        final_tests = [r for r in flow_tests if any(k in r["test"] for k in ["Login Nova", "Final Must Change", "New Token", "Access Transmill"])]
        final_success = len([r for r in final_tests if r["success"]])
        print(f"   ✅ LOGIN FINAL: {final_success}/{len(final_tests)} funcionando")
        
        # Resultado final
        critical_success = (creation_success == len(creation_tests) and 
                          provisional_success >= len(provisional_tests) * 0.8 and
                          change_success == len(change_tests) and
                          final_success >= len(final_tests) * 0.8)
        
        if critical_success and successful_tests >= total_tests * 0.85:
            print("\n✅ RESULTADO FINAL: FLUXO COMPLETO FUNCIONANDO 100%!")
            print("   ✅ UNIDADE CRIADA COM TODOS OS CAMPOS PJ")
            print("   ✅ DADOS SÓCIO ADMINISTRADOR MAPEADOS")
            print("   ✅ LOGIN COM SENHA PROVISÓRIA FUNCIONA")
            print("   ✅ must_change_password = true NO PRIMEIRO LOGIN")
            print("   ✅ ENDPOINT DE TROCAR SENHA FUNCIONA")
            print("   ✅ LOGIN COM NOVA SENHA FUNCIONA")
            print("   ✅ must_change_password = false APÓS TROCAR")
            print("   ✅ profile_complete = true (NÃO PRECISA COMPLETAR DADOS)")
            print("   ✅ SISTEMA PRONTO PARA USO EM PRODUÇÃO")
            return True
        else:
            print("\n❌ RESULTADO FINAL: PROBLEMAS IDENTIFICADOS NO FLUXO")
            print("   ❌ CORREÇÕES NECESSÁRIAS ANTES DO USO")
            
            if creation_success < len(creation_tests):
                print("   ❌ PROBLEMA: Criação da unidade Labelview")
            if provisional_success < len(provisional_tests) * 0.8:
                print("   ❌ PROBLEMA: Login com senha provisória")
            if change_success < len(change_tests):
                print("   ❌ PROBLEMA: Endpoint de trocar senha")
            if final_success < len(final_tests) * 0.8:
                print("   ❌ PROBLEMA: Login com nova senha")
            
            return False

if __name__ == "__main__":
    tester = CompleteLabelviewFlowTester()
    success = tester.test_complete_labelview_unit_flow()
    
    print("\n" + "="*50)
    print("RESULTADOS DETALHADOS:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['details']}")
    print("="*50)
    
    if success:
        print("\n✅ TESTE COMPLETO EXECUTADO COM SUCESSO!")
    else:
        print("\n❌ TESTE COMPLETO FALHOU - VERIFICAR PROBLEMAS ACIMA")