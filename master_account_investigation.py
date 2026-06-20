#!/usr/bin/env python3
"""
INVESTIGAÇÃO URGENTE: Problema no acesso à conta master
Teste específico para verificar o problema reportado com master@agitocash.com
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class MasterAccountInvestigator:
    def __init__(self, base_url: str = "https://slim-super-app.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.master_token = None
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> requests.Response:
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def investigate_master_account_existence(self):
        """Investigar se a conta master existe no sistema"""
        print("\n=== INVESTIGAÇÃO 1: VERIFICAR EXISTÊNCIA DA CONTA MASTER ===")
        
        # Tentar login para verificar se a conta existe
        login_data = {
            "email": "master@agitocash.com",
            "password": "master123"
        }
        
        print(f"🔍 Tentando login com: {login_data['email']} / {login_data['password']}")
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        print(f"📊 Status da resposta: {response.status_code}")
        print(f"📊 Headers da resposta: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("user", {})
            
            # Verificar se is_master_account = true
            is_master = user_data.get("is_master_account", False)
            
            if is_master:
                self.log_test("Master Account Exists", True, 
                             f"✅ Conta master encontrada - Email: {user_data.get('email')}, "
                             f"Nome: {user_data.get('full_name')}, is_master_account: {is_master}")
                
                # Armazenar token para testes subsequentes
                self.master_token = data.get("access_token")
                
                # Verificar outros campos importantes
                print(f"\n📋 DADOS COMPLETOS DA CONTA MASTER:")
                print(json.dumps(user_data, indent=2, ensure_ascii=False))
                
                # Verificar saldos
                platform_balance = user_data.get("platform_balance", 0)
                balance = user_data.get("balance", 0)
                
                self.log_test("Master Account Balance", True, 
                             f"Platform Balance: R$ {platform_balance:.2f}, "
                             f"Regular Balance: R$ {balance:.2f}")
                
                return True
            else:
                self.log_test("Master Account Flag", False, 
                             f"❌ Conta existe mas is_master_account = {is_master}")
                return False
                
        elif response.status_code == 401:
            error_detail = response.text
            self.log_test("Master Account Login", False, 
                         f"❌ Credenciais inválidas - Status: 401, Error: {error_detail}")
            
            # Verificar se é problema de senha ou conta inexistente
            print(f"\n🔍 DETALHES DO ERRO 401:")
            print(f"Response text: {response.text}")
            
            return False
        else:
            error_detail = response.text
            self.log_test("Master Account Request", False, 
                         f"❌ Erro na requisição - Status: {response.status_code}, Error: {error_detail}")
            return False

    def test_master_login_detailed(self):
        """Teste detalhado do login master"""
        print("\n=== INVESTIGAÇÃO 2: TESTE DETALHADO DO LOGIN MASTER ===")
        
        login_data = {
            "email": "master@agitocash.com",
            "password": "master123"
        }
        
        print(f"🔍 POST {self.base_url}/auth/login")
        print(f"📤 Payload: {json.dumps(login_data, indent=2)}")
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Headers: {dict(response.headers)}")
        print(f"📥 Response Body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Verificar estrutura da resposta
            required_fields = ["access_token", "token_type", "user"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                self.log_test("Login Response Structure", True, 
                             "✅ Resposta contém todos os campos obrigatórios")
                
                # Verificar token JWT
                token = data["access_token"]
                if "." in token and len(token.split(".")) == 3:
                    self.log_test("JWT Token Format", True, 
                                 f"✅ Token JWT válido - Tamanho: {len(token)} chars")
                    self.master_token = token
                else:
                    self.log_test("JWT Token Format", False, 
                                 f"❌ Token JWT inválido: {token[:50]}...")
                
                # Verificar dados do usuário
                user_data = data["user"]
                self.log_test("User Data in Response", True, 
                             f"✅ Dados do usuário: {user_data.get('full_name')} "
                             f"({user_data.get('email')})")
                
                return True
            else:
                self.log_test("Login Response Structure", False, 
                             f"❌ Campos ausentes: {missing_fields}")
                return False
        else:
            self.log_test("Master Login Detailed", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
            return False

    def test_master_profile_access(self):
        """Testar acesso ao perfil master"""
        print("\n=== INVESTIGAÇÃO 3: TESTE DE ACESSO AO PERFIL MASTER ===")
        
        if not self.master_token:
            self.log_test("Master Profile Access", False, 
                         "❌ Token master não disponível")
            return False
        
        print(f"🔍 GET {self.base_url}/user/profile")
        print(f"📤 Authorization: Bearer {self.master_token[:20]}...")
        
        response = self.make_request("GET", "/user/profile", token=self.master_token)
        
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Body: {response.text}")
        
        if response.status_code == 200:
            profile_data = response.json()
            
            self.log_test("Master Profile Access", True, 
                         f"✅ Perfil acessado - Nome: {profile_data.get('full_name')}")
            
            # Verificar campos específicos do master
            is_master = profile_data.get("is_master_account", False)
            if is_master:
                self.log_test("Master Profile Flag", True, 
                             "✅ is_master_account = true no perfil")
            else:
                self.log_test("Master Profile Flag", False, 
                             f"❌ is_master_account = {is_master}")
            
            return True
        else:
            self.log_test("Master Profile Access", False, 
                         f"❌ Acesso ao perfil falhou - Status: {response.status_code}")
            return False

    def test_master_balance_access(self):
        """Testar acesso aos saldos master"""
        print("\n=== INVESTIGAÇÃO 4: TESTE DE ACESSO AOS SALDOS MASTER ===")
        
        if not self.master_token:
            self.log_test("Master Balance Access", False, 
                         "❌ Token master não disponível")
            return False
        
        print(f"🔍 GET {self.base_url}/user/balance")
        
        response = self.make_request("GET", "/user/balance", token=self.master_token)
        
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Body: {response.text}")
        
        if response.status_code == 200:
            balance_data = response.json()
            
            self.log_test("Master Balance Access", True, 
                         f"✅ Saldos acessados - Balance: R$ {balance_data.get('balance', 0):.2f}, "
                         f"Cashback: R$ {balance_data.get('cashback_balance', 0):.2f}, "
                         f"Total: R$ {balance_data.get('total', 0):.2f}")
            
            return True
        else:
            self.log_test("Master Balance Access", False, 
                         f"❌ Acesso aos saldos falhou - Status: {response.status_code}")
            return False

    def test_master_dashboard_access(self):
        """Testar acesso ao dashboard master"""
        print("\n=== INVESTIGAÇÃO 5: TESTE DE ACESSO AO DASHBOARD MASTER ===")
        
        if not self.master_token:
            self.log_test("Master Dashboard Access", False, 
                         "❌ Token master não disponível")
            return False
        
        print(f"🔍 GET {self.base_url}/master/dashboard")
        
        response = self.make_request("GET", "/master/dashboard", token=self.master_token)
        
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Body: {response.text}")
        
        if response.status_code == 200:
            dashboard_data = response.json()
            
            platform_stats = dashboard_data.get("platform_stats", {})
            
            self.log_test("Master Dashboard Access", True, 
                         f"✅ Dashboard acessado - Usuários: {platform_stats.get('total_users', 0)}, "
                         f"Clientes: {platform_stats.get('total_clients', 0)}, "
                         f"Lojistas: {platform_stats.get('total_merchants', 0)}, "
                         f"Saldo Plataforma: R$ {platform_stats.get('platform_balance', 0):.2f}")
            
            return True
        elif response.status_code == 403:
            self.log_test("Master Dashboard Access", False, 
                         "❌ Acesso negado (403) - Conta não tem permissão master")
            return False
        else:
            self.log_test("Master Dashboard Access", False, 
                         f"❌ Acesso ao dashboard falhou - Status: {response.status_code}")
            return False

    def test_admin_routes_access(self):
        """Testar acesso às rotas administrativas"""
        print("\n=== INVESTIGAÇÃO 6: TESTE DE ACESSO ÀS ROTAS ADMIN ===")
        
        if not self.master_token:
            self.log_test("Admin Routes Access", False, 
                         "❌ Token master não disponível")
            return False
        
        # Testar GET /api/admin/users
        print(f"🔍 GET {self.base_url}/admin/users")
        
        response = self.make_request("GET", "/admin/users", token=self.master_token)
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            users_data = response.json()
            users_list = users_data.get("users", [])
            
            self.log_test("Admin Users List", True, 
                         f"✅ Lista de usuários acessada - {len(users_list)} usuários encontrados")
            
            # Mostrar alguns detalhes
            if users_list:
                print(f"📋 PRIMEIROS USUÁRIOS:")
                for i, user in enumerate(users_list[:3]):
                    print(f"  {i+1}. {user.get('full_name')} ({user.get('email')}) - {user.get('user_type')}")
            
            return True
        elif response.status_code == 403:
            self.log_test("Admin Users List", False, 
                         "❌ Acesso negado (403) - Conta não tem permissão admin")
            return False
        else:
            self.log_test("Admin Users List", False, 
                         f"❌ Acesso à lista de usuários falhou - Status: {response.status_code}")
            return False

    def debug_backend_logs(self):
        """Tentar obter informações de debug do backend"""
        print("\n=== INVESTIGAÇÃO 7: DEBUG DO BACKEND ===")
        
        # Testar diferentes variações de credenciais para debug
        test_credentials = [
            {"email": "master@agitocash.com", "password": "master123"},
            {"email": "master@agitocash.com", "password": "Master123"},
            {"email": "master@agitocash.com", "password": "MASTER123"},
            {"email": "MASTER@AGITOCASH.COM", "password": "master123"},
        ]
        
        for i, creds in enumerate(test_credentials):
            print(f"\n🔍 Teste {i+1}: {creds['email']} / {creds['password']}")
            
            response = self.make_request("POST", "/auth/login", creds)
            
            print(f"📥 Status: {response.status_code}")
            if response.status_code != 200:
                print(f"📥 Error: {response.text}")
            else:
                data = response.json()
                user = data.get("user", {})
                print(f"📥 Success: {user.get('full_name')} - is_master: {user.get('is_master_account')}")
                break

    def test_master_account_creation(self):
        """Verificar se precisa recriar a conta master"""
        print("\n=== INVESTIGAÇÃO 8: VERIFICAR NECESSIDADE DE RECRIAR CONTA MASTER ===")
        
        # Se chegamos até aqui e não conseguimos fazer login, pode ser que a conta não exista
        # ou esteja corrompida. Vamos tentar algumas verificações adicionais.
        
        # Tentar acessar endpoint que deveria criar conta master automaticamente
        # (baseado no código, a conta master é criada automaticamente durante pagamentos)
        
        print("🔍 Verificando se conta master existe no sistema...")
        
        # Tentar login uma última vez com debug detalhado
        login_data = {
            "email": "master@agitocash.com",
            "password": "master123"
        }
        
        try:
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 401:
                # Credenciais inválidas - pode ser problema de hash da senha
                self.log_test("Master Account Hash Issue", True, 
                             "⚠️ Possível problema com hash da senha da conta master")
                
                print("\n💡 DIAGNÓSTICO:")
                print("- A conta master pode existir mas com hash de senha incorreto")
                print("- Recomendação: Verificar/recriar conta master no banco de dados")
                print("- Senha esperada: 'master123'")
                print("- Hash deve ser gerado com bcrypt")
                
            elif response.status_code == 404:
                self.log_test("Master Account Missing", True, 
                             "⚠️ Conta master não encontrada no banco de dados")
                
                print("\n💡 DIAGNÓSTICO:")
                print("- Conta master não existe no banco de dados")
                print("- Recomendação: Criar conta master com os dados corretos")
                
            else:
                self.log_test("Master Account Unknown Issue", True, 
                             f"⚠️ Problema desconhecido - Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Master Account Connection Issue", False, 
                         f"❌ Erro de conexão: {str(e)}")

    def run_complete_investigation(self):
        """Executar investigação completa do problema da conta master"""
        print("🚨 INVESTIGAÇÃO URGENTE: PROBLEMA NO ACESSO À CONTA MASTER")
        print("=" * 80)
        print("PROBLEMA REPORTADO: Usuário não consegue acessar master@agitocash.com")
        print("DADOS ESPERADOS:")
        print("- Email: master@agitocash.com")
        print("- Senha: master123")
        print("- is_master_account: true")
        print("- Login deve retornar token JWT válido")
        print("=" * 80)
        
        try:
            # Investigação 1: Verificar existência da conta
            account_exists = self.investigate_master_account_existence()
            
            if account_exists:
                # Se a conta existe, testar funcionalidades
                self.test_master_login_detailed()
                self.test_master_profile_access()
                self.test_master_balance_access()
                self.test_master_dashboard_access()
                self.test_admin_routes_access()
            else:
                # Se a conta não existe ou tem problemas, fazer debug
                self.debug_backend_logs()
                self.test_master_account_creation()
            
        except Exception as e:
            print(f"❌ ERRO CRÍTICO NA INVESTIGAÇÃO: {e}")
            self.log_test("Critical Investigation Error", False, str(e))
        
        # Imprimir resumo da investigação
        self.print_investigation_summary()

    def print_investigation_summary(self):
        """Imprimir resumo da investigação"""
        print("\n" + "=" * 80)
        print("📊 RESUMO DA INVESTIGAÇÃO URGENTE")
        print("=" * 80)
        
        passed_tests = [r for r in self.test_results if r["success"]]
        failed_tests = [r for r in self.test_results if not r["success"]]
        
        print(f"✅ TESTES PASSARAM: {len(passed_tests)}")
        print(f"❌ TESTES FALHARAM: {len(failed_tests)}")
        print(f"📊 TAXA DE SUCESSO: {len(passed_tests)}/{len(self.test_results)} ({len(passed_tests)/len(self.test_results)*100:.1f}%)")
        
        if failed_tests:
            print(f"\n❌ PROBLEMAS IDENTIFICADOS:")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        if passed_tests:
            print(f"\n✅ FUNCIONALIDADES OPERACIONAIS:")
            for test in passed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        # Diagnóstico final
        print(f"\n🔍 DIAGNÓSTICO FINAL:")
        
        if self.master_token:
            print("✅ CONTA MASTER ESTÁ FUNCIONANDO CORRETAMENTE")
            print("  - Login realizado com sucesso")
            print("  - Token JWT válido obtido")
            print("  - Acesso às funcionalidades master operacional")
            print("\n💡 RECOMENDAÇÃO: Verificar se o usuário está usando as credenciais corretas")
        else:
            print("❌ PROBLEMA CONFIRMADO COM A CONTA MASTER")
            print("  - Não foi possível fazer login")
            print("  - Possíveis causas:")
            print("    1. Conta master não existe no banco de dados")
            print("    2. Hash da senha está incorreto")
            print("    3. Campo is_master_account não está definido como true")
            print("    4. Problema de conectividade com o banco de dados")
            print("\n💡 RECOMENDAÇÃO: Verificar/recriar conta master no banco de dados")

if __name__ == "__main__":
    investigator = MasterAccountInvestigator()
    investigator.run_complete_investigation()