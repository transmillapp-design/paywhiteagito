#!/usr/bin/env python3
"""
AgitoCash Pre-Deploy Verification Test
Teste final antes do deploy oficial do AgitoCash
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class PreDeployTester:
    def __init__(self, base_url: str = "https://slim-super-app.preview.emergentagent.com/api"):
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
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_master_login(self):
        """1. Login Master: Testar master@agitocash.com/master123"""
        print("\n=== 1. TESTE LOGIN MASTER ===")
        
        login_data = {
            "email": "master@agitocash.com",
            "password": "master123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code == 200:
            data = response.json()
            self.master_token = data["access_token"]
            user_data = data["user"]
            
            # Verificar se é conta master
            if user_data.get("is_master_account"):
                self.log_test("Master Login", True, 
                             f"✅ Login master realizado: {user_data.get('full_name')}, "
                             f"Platform Balance: R$ {user_data.get('platform_balance', 0):.2f}")
                
                # Testar acesso ao perfil
                profile_response = self.make_request("GET", "/user/profile", token=self.master_token)
                if profile_response.status_code == 200:
                    self.log_test("Master Profile Access", True, "✅ Acesso ao perfil master funcionando")
                else:
                    self.log_test("Master Profile Access", False, f"Erro no acesso ao perfil: {profile_response.status_code}")
                    
            else:
                self.log_test("Master Login", False, "Conta não tem flag is_master_account")
        else:
            self.log_test("Master Login", False, f"Status: {response.status_code}, Error: {response.text}")
            self.master_token = None

    def test_business_segments_api(self):
        """2. Sistema de Segmentos: Verificar se a API está respondendo corretamente"""
        print("\n=== 2. TESTE SISTEMA DE SEGMENTOS ===")
        
        if not hasattr(self, 'master_token') or not self.master_token:
            self.log_test("Business Segments Test", False, "Token master não disponível")
            return
            
        # Testar listagem de segmentos (master)
        response = self.make_request("GET", "/master/business-segments", token=self.master_token)
        
        if response.status_code == 200:
            data = response.json()
            segments = data.get("segments", [])
            self.log_test("List Business Segments (Master)", True, 
                         f"✅ {len(segments)} segmentos encontrados via API master")
            
            # Mostrar alguns segmentos
            if segments:
                segment_names = [s.get("name") for s in segments[:3]]
                print(f"   📋 Exemplos: {', '.join(segment_names)}")
        else:
            self.log_test("List Business Segments (Master)", False, 
                         f"Status: {response.status_code}, Error: {response.text}")
        
        # Testar endpoint público de segmentos ativos
        response = self.make_request("GET", "/business-segments/active")
        
        if response.status_code == 200:
            data = response.json()
            active_segments = data.get("segments", [])
            self.log_test("List Active Segments (Public)", True, 
                         f"✅ {len(active_segments)} segmentos ativos via API pública")
            
            if active_segments:
                print(f"   📋 Segmentos ativos: {', '.join(active_segments[:5])}")
        else:
            self.log_test("List Active Segments (Public)", False, 
                         f"Status: {response.status_code}, Error: {response.text}")
        
        # Testar criação de segmento
        test_segment = {
            "name": f"Teste Deploy {int(time.time())}",
            "description": "Segmento de teste para verificação pré-deploy",
            "is_active": True
        }
        
        response = self.make_request("POST", "/master/business-segments", test_segment, token=self.master_token)
        
        if response.status_code == 200:
            self.log_test("Create Business Segment", True, "✅ Criação de segmento funcionando")
        else:
            self.log_test("Create Business Segment", False, 
                         f"Status: {response.status_code}, Error: {response.text}")

    def test_critical_endpoints(self):
        """3. Principais Endpoints: Testar algumas rotas críticas"""
        print("\n=== 3. TESTE ENDPOINTS CRÍTICOS ===")
        
        # Testar endpoints públicos
        public_endpoints = [
            ("/merchants", "Lista de lojistas"),
            ("/business-segments/active", "Segmentos ativos"),
            ("/stores/filters", "Filtros de lojas")
        ]
        
        for endpoint, description in public_endpoints:
            response = self.make_request("GET", endpoint)
            
            if response.status_code == 200:
                self.log_test(f"Public Endpoint {endpoint}", True, f"✅ {description} funcionando")
            else:
                self.log_test(f"Public Endpoint {endpoint}", False, 
                             f"{description} - Status: {response.status_code}")
        
        # Testar endpoints com autenticação (usando master token)
        if hasattr(self, 'master_token') and self.master_token:
            auth_endpoints = [
                ("/user/profile", "Perfil do usuário"),
                ("/user/balance", "Saldo do usuário"),
                ("/transactions/history", "Histórico de transações"),
                ("/master/dashboard", "Dashboard master")
            ]
            
            for endpoint, description in auth_endpoints:
                response = self.make_request("GET", endpoint, token=self.master_token)
                
                if response.status_code == 200:
                    self.log_test(f"Auth Endpoint {endpoint}", True, f"✅ {description} funcionando")
                else:
                    self.log_test(f"Auth Endpoint {endpoint}", False, 
                                 f"{description} - Status: {response.status_code}")

    def test_database_connectivity(self):
        """4. Database: Verificar se MongoDB está conectado e operacional"""
        print("\n=== 4. TESTE CONECTIVIDADE DATABASE ===")
        
        # Testar operações que dependem do banco
        database_tests = [
            # Teste 1: Login (requer consulta ao banco)
            {
                "name": "Database Login Query",
                "method": "POST",
                "endpoint": "/auth/login",
                "data": {"email": "master@agitocash.com", "password": "master123"},
                "expected_status": 200,
                "description": "Consulta de login no MongoDB"
            },
            
            # Teste 2: Listagem de usuários (requer consulta ao banco)
            {
                "name": "Database User List",
                "method": "GET", 
                "endpoint": "/admin/users",
                "token_required": True,
                "expected_status": 200,
                "description": "Listagem de usuários do MongoDB"
            },
            
            # Teste 3: Listagem de segmentos (requer consulta ao banco)
            {
                "name": "Database Segments Query",
                "method": "GET",
                "endpoint": "/business-segments/active", 
                "expected_status": 200,
                "description": "Consulta de segmentos no MongoDB"
            },
            
            # Teste 4: Listagem de lojistas (requer consulta ao banco)
            {
                "name": "Database Merchants Query",
                "method": "GET",
                "endpoint": "/merchants",
                "expected_status": 200,
                "description": "Consulta de lojistas no MongoDB"
            }
        ]
        
        for test in database_tests:
            token = None
            if test.get("token_required") and hasattr(self, 'master_token'):
                token = self.master_token
            
            response = self.make_request(
                test["method"], 
                test["endpoint"], 
                test.get("data"), 
                token
            )
            
            if response.status_code == test["expected_status"]:
                self.log_test(test["name"], True, f"✅ {test['description']} funcionando")
                
                # Para alguns endpoints, verificar se retornou dados
                if test["method"] == "GET" and response.status_code == 200:
                    try:
                        data = response.json()
                        if isinstance(data, list):
                            print(f"   📊 Retornou {len(data)} registros")
                        elif isinstance(data, dict):
                            if "segments" in data:
                                print(f"   📊 Retornou {len(data['segments'])} segmentos")
                            elif "users" in data:
                                print(f"   📊 Retornou {len(data['users'])} usuários")
                    except:
                        pass
            else:
                self.log_test(test["name"], False, 
                             f"{test['description']} - Status: {response.status_code}")

    def test_demo_credentials(self):
        """Teste adicional: Verificar credenciais demo"""
        print("\n=== 5. TESTE CREDENCIAIS DEMO ===")
        
        demo_accounts = [
            {"email": "cliente@demo.com", "password": "demo123", "type": "Cliente"},
            {"email": "lojista@demo.com", "password": "demo123", "type": "Lojista"}
        ]
        
        for account in demo_accounts:
            login_data = {
                "email": account["email"],
                "password": account["password"]
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                user_data = data["user"]
                self.log_test(f"Demo {account['type']} Login", True, 
                             f"✅ {account['type']} demo funcionando: {user_data.get('full_name', user_data.get('company_name'))}")
            else:
                self.log_test(f"Demo {account['type']} Login", False, 
                             f"Status: {response.status_code}")

    def test_system_health(self):
        """Teste de saúde geral do sistema"""
        print("\n=== 6. TESTE SAÚDE GERAL DO SISTEMA ===")
        
        # Verificar se o servidor está respondendo
        try:
            response = self.make_request("GET", "/merchants")
            response_time = response.elapsed.total_seconds()
            
            if response.status_code == 200:
                self.log_test("Server Response", True, 
                             f"✅ Servidor respondendo em {response_time:.2f}s")
            else:
                self.log_test("Server Response", False, 
                             f"Servidor retornou status {response.status_code}")
                
        except Exception as e:
            self.log_test("Server Response", False, f"Erro de conectividade: {str(e)}")
        
        # Verificar headers de resposta
        try:
            response = self.make_request("GET", "/merchants")
            
            # Verificar CORS
            if 'access-control-allow-origin' in response.headers:
                self.log_test("CORS Headers", True, "✅ Headers CORS configurados")
            else:
                self.log_test("CORS Headers", False, "Headers CORS não encontrados")
                
            # Verificar Content-Type
            if 'application/json' in response.headers.get('content-type', ''):
                self.log_test("JSON Response", True, "✅ Respostas em JSON")
            else:
                self.log_test("JSON Response", False, "Content-Type não é JSON")
                
        except Exception as e:
            self.log_test("Headers Check", False, f"Erro ao verificar headers: {str(e)}")

    def run_pre_deploy_tests(self):
        """Executar todos os testes de pré-deploy"""
        print("🚀 AGITOCASH - VERIFICAÇÃO PRÉ-DEPLOY")
        print("=" * 60)
        print("OBJETIVO: Garantir que o sistema está estável antes do deploy para produção")
        print("=" * 60)
        
        try:
            # 1. Login Master
            self.test_master_login()
            
            # 2. Sistema de Segmentos
            self.test_business_segments_api()
            
            # 3. Principais Endpoints
            self.test_critical_endpoints()
            
            # 4. Database
            self.test_database_connectivity()
            
            # 5. Credenciais Demo
            self.test_demo_credentials()
            
            # 6. Saúde do Sistema
            self.test_system_health()
            
        except Exception as e:
            print(f"❌ ERRO CRÍTICO NOS TESTES: {e}")
            self.log_test("Critical Test Error", False, str(e))
        
        # Imprimir resumo
        self.print_summary()

    def print_summary(self):
        """Imprimir resumo dos testes"""
        print("\n" + "=" * 60)
        print("🎯 RESUMO DA VERIFICAÇÃO PRÉ-DEPLOY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 ESTATÍSTICAS:")
        print(f"   • Total de testes: {total_tests}")
        print(f"   • ✅ Sucessos: {passed_tests}")
        print(f"   • ❌ Falhas: {failed_tests}")
        print(f"   • 📈 Taxa de sucesso: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ TESTES COM FALHA:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n✅ TESTES BEM-SUCEDIDOS:")
        for result in self.test_results:
            if result["success"]:
                print(f"   • {result['test']}: {result['details']}")
        
        # Conclusão
        print("\n" + "=" * 60)
        if success_rate >= 95:
            print("🎉 SISTEMA APROVADO PARA DEPLOY!")
            print("✅ Todos os componentes críticos estão funcionando corretamente.")
            print("✅ MongoDB conectado e operacional.")
            print("✅ APIs respondendo adequadamente.")
            print("✅ Autenticação master funcionando.")
        elif success_rate >= 80:
            print("⚠️  SISTEMA COM PROBLEMAS MENORES")
            print("🔧 Alguns componentes precisam de atenção, mas sistema está funcional.")
        else:
            print("🚨 SISTEMA NÃO APROVADO PARA DEPLOY!")
            print("❌ Problemas críticos encontrados que precisam ser resolvidos.")
        
        print("=" * 60)

if __name__ == "__main__":
    tester = PreDeployTester()
    tester.run_pre_deploy_tests()