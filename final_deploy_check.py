#!/usr/bin/env python3
"""
AgitoCash Final Deploy Check
Verificação final específica conforme solicitado na revisão
"""

import requests
import json
import time

class FinalDeployChecker:
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_master_login_comprehensive(self):
        """1. Login Master: Testar master@agitocash.com/master123 COMPLETO"""
        print("\n🎯 1. TESTE COMPLETO LOGIN MASTER")
        print("=" * 50)
        
        login_data = {
            "email": "master@agitocash.com",
            "password": "master123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code == 200:
            data = response.json()
            self.master_token = data["access_token"]
            user_data = data["user"]
            
            # Verificações detalhadas
            checks = [
                ("Master Account Flag", user_data.get("is_master_account") == True),
                ("User Type", user_data.get("user_type") == "platform"),
                ("Email Correct", user_data.get("email") == "master@agitocash.com"),
                ("Full Name", user_data.get("full_name") == "AgitoCash Platform"),
                ("JWT Token Format", len(self.master_token.split(".")) == 3),
                ("Platform Balance Present", "platform_balance" in user_data)
            ]
            
            for check_name, check_result in checks:
                self.log_test(f"Master {check_name}", check_result, 
                             "✅ Verificado" if check_result else "❌ Falhou")
            
            # Testar acesso a rotas master
            master_routes = [
                ("/user/profile", "Perfil Master"),
                ("/user/balance", "Saldo Master"),
                ("/master/dashboard", "Dashboard Master"),
                ("/admin/users", "Lista Usuários Admin")
            ]
            
            for route, description in master_routes:
                route_response = self.make_request("GET", route, token=self.master_token)
                success = route_response.status_code == 200
                self.log_test(f"Master Route {route}", success, 
                             f"✅ {description} acessível" if success else f"❌ {description} inacessível")
                
        else:
            self.log_test("Master Login", False, f"Status: {response.status_code}, Error: {response.text}")
            self.master_token = None

    def test_business_segments_comprehensive(self):
        """2. Sistema de Segmentos: Verificação COMPLETA da API"""
        print("\n🎯 2. TESTE COMPLETO SISTEMA DE SEGMENTOS")
        print("=" * 50)
        
        if not hasattr(self, 'master_token') or not self.master_token:
            self.log_test("Segments Test", False, "Token master não disponível")
            return
        
        # Teste 1: Listar segmentos (master)
        response = self.make_request("GET", "/master/business-segments", token=self.master_token)
        
        if response.status_code == 200:
            data = response.json()
            segments = data.get("segments", [])
            self.log_test("List Segments Master", True, 
                         f"✅ {len(segments)} segmentos via API master")
            
            # Verificar estrutura dos segmentos
            if segments:
                first_segment = segments[0]
                required_fields = ["id", "name", "description", "is_active", "created_at"]
                missing_fields = [field for field in required_fields if field not in first_segment]
                
                if not missing_fields:
                    self.log_test("Segment Structure", True, "✅ Estrutura de segmentos correta")
                else:
                    self.log_test("Segment Structure", False, f"❌ Campos ausentes: {missing_fields}")
        else:
            self.log_test("List Segments Master", False, f"Status: {response.status_code}")
        
        # Teste 2: Endpoint público de segmentos ativos
        response = self.make_request("GET", "/business-segments/active")
        
        if response.status_code == 200:
            data = response.json()
            active_segments = data.get("segments", [])
            self.log_test("List Active Segments Public", True, 
                         f"✅ {len(active_segments)} segmentos ativos via API pública")
            
            # Verificar se há segmentos básicos
            expected_segments = ["Alimentação", "Saúde", "Tecnologia"]
            found_segments = [seg for seg in expected_segments if seg in active_segments]
            
            if len(found_segments) >= 2:
                self.log_test("Basic Segments Present", True, 
                             f"✅ Segmentos básicos encontrados: {found_segments}")
            else:
                self.log_test("Basic Segments Present", False, 
                             f"❌ Poucos segmentos básicos: {found_segments}")
        else:
            self.log_test("List Active Segments Public", False, f"Status: {response.status_code}")
        
        # Teste 3: Controle de acesso (usuário regular não deve acessar)
        # Primeiro fazer login como cliente demo
        client_login = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        client_response = self.make_request("POST", "/auth/login", client_login)
        
        if client_response.status_code == 200:
            client_token = client_response.json()["access_token"]
            
            # Tentar acessar endpoint master com token de cliente
            forbidden_response = self.make_request("GET", "/master/business-segments", token=client_token)
            
            if forbidden_response.status_code == 403:
                self.log_test("Access Control", True, "✅ Controle de acesso funcionando (403 para não-master)")
            else:
                self.log_test("Access Control", False, f"❌ Deveria retornar 403, retornou {forbidden_response.status_code}")
        else:
            self.log_test("Access Control Test Setup", False, "Não foi possível fazer login como cliente")

    def test_critical_endpoints_comprehensive(self):
        """3. Principais Endpoints: Teste COMPLETO das rotas críticas"""
        print("\n🎯 3. TESTE COMPLETO ENDPOINTS CRÍTICOS")
        print("=" * 50)
        
        # Endpoints públicos críticos
        public_endpoints = [
            {
                "endpoint": "/merchants",
                "name": "Lista Lojistas",
                "expected_fields": ["id", "company_name", "cashback_rate"]
            },
            {
                "endpoint": "/business-segments/active", 
                "name": "Segmentos Ativos",
                "expected_fields": ["segments"]
            },
            {
                "endpoint": "/stores/filters",
                "name": "Filtros de Lojas",
                "expected_fields": ["states", "cities", "business_segments"]
            }
        ]
        
        for endpoint_info in public_endpoints:
            response = self.make_request("GET", endpoint_info["endpoint"])
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # Verificar campos esperados
                    if endpoint_info["endpoint"] == "/merchants":
                        if isinstance(data, list) and len(data) > 0:
                            first_item = data[0]
                            missing_fields = [field for field in endpoint_info["expected_fields"] 
                                            if field not in first_item]
                            
                            if not missing_fields:
                                self.log_test(f"Public {endpoint_info['name']}", True, 
                                             f"✅ {len(data)} lojistas com estrutura correta")
                            else:
                                self.log_test(f"Public {endpoint_info['name']}", False, 
                                             f"❌ Campos ausentes: {missing_fields}")
                        else:
                            self.log_test(f"Public {endpoint_info['name']}", True, 
                                         f"✅ Endpoint funcionando (lista vazia)")
                    else:
                        # Para outros endpoints, verificar se tem os campos esperados
                        missing_fields = [field for field in endpoint_info["expected_fields"] 
                                        if field not in data]
                        
                        if not missing_fields:
                            self.log_test(f"Public {endpoint_info['name']}", True, 
                                         f"✅ Estrutura correta")
                        else:
                            self.log_test(f"Public {endpoint_info['name']}", False, 
                                         f"❌ Campos ausentes: {missing_fields}")
                            
                except json.JSONDecodeError:
                    self.log_test(f"Public {endpoint_info['name']}", False, "❌ Resposta não é JSON válido")
            else:
                self.log_test(f"Public {endpoint_info['name']}", False, 
                             f"❌ Status: {response.status_code}")
        
        # Endpoints autenticados críticos (usando token master)
        if hasattr(self, 'master_token') and self.master_token:
            auth_endpoints = [
                {
                    "endpoint": "/user/profile",
                    "name": "Perfil Usuário",
                    "expected_fields": ["id", "email", "full_name", "user_type"]
                },
                {
                    "endpoint": "/user/balance", 
                    "name": "Saldo Usuário",
                    "expected_fields": ["balance", "cashback_balance", "total"]
                },
                {
                    "endpoint": "/master/dashboard",
                    "name": "Dashboard Master",
                    "expected_fields": ["platform_stats"]
                },
                {
                    "endpoint": "/admin/users",
                    "name": "Lista Usuários Admin",
                    "expected_fields": ["users", "total_count"]
                }
            ]
            
            for endpoint_info in auth_endpoints:
                response = self.make_request("GET", endpoint_info["endpoint"], token=self.master_token)
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        missing_fields = [field for field in endpoint_info["expected_fields"] 
                                        if field not in data]
                        
                        if not missing_fields:
                            self.log_test(f"Auth {endpoint_info['name']}", True, 
                                         f"✅ Estrutura correta")
                        else:
                            self.log_test(f"Auth {endpoint_info['name']}", False, 
                                         f"❌ Campos ausentes: {missing_fields}")
                            
                    except json.JSONDecodeError:
                        self.log_test(f"Auth {endpoint_info['name']}", False, "❌ Resposta não é JSON válido")
                else:
                    self.log_test(f"Auth {endpoint_info['name']}", False, 
                                 f"❌ Status: {response.status_code}")

    def test_database_comprehensive(self):
        """4. Database: Verificação COMPLETA do MongoDB"""
        print("\n🎯 4. TESTE COMPLETO DATABASE MONGODB")
        print("=" * 50)
        
        # Testes de conectividade e operações CRUD
        database_operations = [
            {
                "name": "Login Query (Read)",
                "method": "POST",
                "endpoint": "/auth/login",
                "data": {"email": "master@agitocash.com", "password": "master123"},
                "expected_status": 200,
                "operation_type": "READ"
            },
            {
                "name": "User List Query (Read)",
                "method": "GET",
                "endpoint": "/admin/users",
                "token_required": True,
                "expected_status": 200,
                "operation_type": "READ"
            },
            {
                "name": "Segments Query (Read)",
                "method": "GET",
                "endpoint": "/business-segments/active",
                "expected_status": 200,
                "operation_type": "READ"
            },
            {
                "name": "Transaction History (Read)",
                "method": "GET",
                "endpoint": "/transactions/history",
                "token_required": True,
                "expected_status": 200,
                "operation_type": "READ"
            }
        ]
        
        read_operations_success = 0
        total_read_operations = len([op for op in database_operations if op["operation_type"] == "READ"])
        
        for operation in database_operations:
            token = None
            if operation.get("token_required") and hasattr(self, 'master_token'):
                token = self.master_token
            
            response = self.make_request(
                operation["method"],
                operation["endpoint"],
                operation.get("data"),
                token
            )
            
            if response.status_code == operation["expected_status"]:
                self.log_test(f"DB {operation['name']}", True, f"✅ Operação {operation['operation_type']} funcionando")
                
                if operation["operation_type"] == "READ":
                    read_operations_success += 1
                    
                # Verificar se retornou dados válidos
                if operation["method"] == "GET" and response.status_code == 200:
                    try:
                        data = response.json()
                        if isinstance(data, list):
                            print(f"   📊 Retornou {len(data)} registros")
                        elif isinstance(data, dict):
                            if "users" in data:
                                print(f"   📊 Retornou {len(data['users'])} usuários")
                            elif "segments" in data:
                                print(f"   📊 Retornou {len(data['segments'])} segmentos")
                    except:
                        pass
            else:
                self.log_test(f"DB {operation['name']}", False, 
                             f"❌ Status: {response.status_code}")
        
        # Calcular taxa de sucesso das operações de leitura
        read_success_rate = (read_operations_success / total_read_operations * 100) if total_read_operations > 0 else 0
        
        if read_success_rate >= 100:
            self.log_test("Database Connectivity", True, f"✅ MongoDB 100% operacional ({read_operations_success}/{total_read_operations} operações)")
        elif read_success_rate >= 75:
            self.log_test("Database Connectivity", True, f"⚠️ MongoDB parcialmente operacional ({read_operations_success}/{total_read_operations} operações)")
        else:
            self.log_test("Database Connectivity", False, f"❌ MongoDB com problemas ({read_operations_success}/{total_read_operations} operações)")

    def run_final_deploy_check(self):
        """Executar verificação final de deploy"""
        print("🚀 AGITOCASH - VERIFICAÇÃO FINAL PRÉ-DEPLOY")
        print("=" * 70)
        print("OBJETIVO: Garantir que o sistema está estável antes do deploy para produção")
        print("PAGAMENTO: 50 créditos mensais - Verificação crítica necessária")
        print("=" * 70)
        
        try:
            # 1. Login Master COMPLETO
            self.test_master_login_comprehensive()
            
            # 2. Sistema de Segmentos COMPLETO
            self.test_business_segments_comprehensive()
            
            # 3. Endpoints Críticos COMPLETO
            self.test_critical_endpoints_comprehensive()
            
            # 4. Database COMPLETO
            self.test_database_comprehensive()
            
        except Exception as e:
            print(f"❌ ERRO CRÍTICO: {e}")
            self.log_test("Critical System Error", False, str(e))
        
        # Imprimir resumo final
        self.print_final_summary()

    def print_final_summary(self):
        """Imprimir resumo final da verificação"""
        print("\n" + "=" * 70)
        print("🎯 RESUMO FINAL - VERIFICAÇÃO PRÉ-DEPLOY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 ESTATÍSTICAS FINAIS:")
        print(f"   • Total de verificações: {total_tests}")
        print(f"   • ✅ Sucessos: {passed_tests}")
        print(f"   • ❌ Falhas: {failed_tests}")
        print(f"   • 📈 Taxa de sucesso: {success_rate:.1f}%")
        
        # Análise por categoria
        categories = {
            "Master": [t for t in self.test_results if "Master" in t["test"]],
            "Segments": [t for t in self.test_results if "Segment" in t["test"]],
            "Endpoints": [t for t in self.test_results if "Public" in t["test"] or "Auth" in t["test"]],
            "Database": [t for t in self.test_results if "DB" in t["test"]]
        }
        
        print(f"\n📋 ANÁLISE POR CATEGORIA:")
        for category, tests in categories.items():
            if tests:
                category_success = len([t for t in tests if t["success"]])
                category_total = len(tests)
                category_rate = (category_success / category_total * 100) if category_total > 0 else 0
                status = "✅" if category_rate >= 90 else "⚠️" if category_rate >= 70 else "❌"
                print(f"   {status} {category}: {category_success}/{category_total} ({category_rate:.1f}%)")
        
        if failed_tests > 0:
            print(f"\n❌ PROBLEMAS ENCONTRADOS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        # Decisão final de deploy
        print("\n" + "=" * 70)
        print("🎯 DECISÃO FINAL DE DEPLOY")
        print("=" * 70)
        
        if success_rate >= 95:
            print("🎉 ✅ SISTEMA APROVADO PARA DEPLOY EM PRODUÇÃO!")
            print("✅ Todos os componentes críticos funcionando")
            print("✅ Login master operacional")
            print("✅ Sistema de segmentos funcionando")
            print("✅ APIs respondendo corretamente")
            print("✅ MongoDB conectado e operacional")
            print("✅ Pronto para pagamento de 50 créditos mensais")
        elif success_rate >= 85:
            print("⚠️  🔧 SISTEMA COM PROBLEMAS MENORES - DEPLOY CONDICIONAL")
            print("🔧 Alguns componentes precisam de atenção")
            print("🔧 Sistema funcional mas com melhorias necessárias")
            print("🔧 Considere corrigir problemas antes do deploy final")
        else:
            print("🚨 ❌ SISTEMA NÃO APROVADO PARA DEPLOY!")
            print("❌ Problemas críticos encontrados")
            print("❌ NÃO proceder com pagamento de 50 créditos")
            print("❌ Correções necessárias antes do deploy")
        
        print("=" * 70)

if __name__ == "__main__":
    checker = FinalDeployChecker()
    checker.run_final_deploy_check()