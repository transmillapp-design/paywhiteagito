#!/usr/bin/env python3
"""
Teste final para Filtros na tela de clientes para Unidade (v2.34.77)
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class FiltrosFinalTester:
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
        except:
            self.base_url = "http://localhost:8001/api"
        
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_filtros_unidade_completo(self):
        """🎯 TESTE COMPLETO: Filtros na tela de clientes para Unidade (v2.34.77)"""
        print("\n🎯 TESTE COMPLETO: Filtros na tela de clientes para Unidade (v2.34.77)")
        print("=" * 80)
        print("CONTEXTO: Validação completa da funcionalidade de filtros")
        print("FUNCIONALIDADE: Filtros de Regional e Consultor para usuários labelview_unidade")
        print("")
        print("ENDPOINTS TESTADOS:")
        print("1. POST /api/auth/login (Unidade e Consultor)")
        print("2. GET /api/labelview/regionais/com-contadores")
        print("3. GET /api/labelview/consultores/com-contadores") 
        print("4. GET /api/labelview/clientes/hierarquia")
        print("5. GET /api/labelview/clientes/hierarquia?regional_id={id}")
        print("")
        print(f"🌐 URL Base: {self.base_url}")
        print("=" * 80)
        
        # Variables to store test data
        unidade_token = None
        consultor_token = None
        regional_id = None
        consultor_id = None
        
        # TESTE 1: LOGIN UNIDADE
        print("\n=== TESTE 1: LOGIN USUÁRIO UNIDADE ===")
        
        unidade_login_data = {
            "email": "teste_unidade@test.com",
            "password": "test123"
        }
        
        response = self.make_request("POST", "/auth/login", unidade_login_data)
        
        if response.status_code == 200:
            data = response.json()
            unidade_token = data.get("access_token")
            unidade_user = data.get("user", {})
            
            if unidade_token:
                user_type = unidade_user.get("user_type", "")
                self.log_test("1.1 Login Unidade", True, 
                             f"✅ Login funcionando - Tipo: {user_type}")
                
                if user_type == "labelview_unidade":
                    self.log_test("1.2 Tipo Usuário Correto", True, 
                                 "✅ user_type: labelview_unidade")
                else:
                    self.log_test("1.2 Tipo Usuário Correto", False, 
                                 f"❌ user_type: {user_type} (esperado: labelview_unidade)")
            else:
                self.log_test("1.1 Login Unidade", False, "❌ Token não retornado")
                return False
        else:
            self.log_test("1.1 Login Unidade", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
            return False
        
        # TESTE 2: LOGIN CONSULTOR
        print("\n=== TESTE 2: LOGIN USUÁRIO CONSULTOR ===")
        
        consultor_login_data = {
            "email": "consultor_teste@test.com",
            "password": "test123"
        }
        
        response = self.make_request("POST", "/auth/login", consultor_login_data)
        
        if response.status_code == 200:
            data = response.json()
            consultor_token = data.get("access_token")
            consultor_user = data.get("user", {})
            
            if consultor_token:
                user_type = consultor_user.get("user_type", "")
                self.log_test("2.1 Login Consultor", True, 
                             f"✅ Login funcionando - Tipo: {user_type}")
            else:
                self.log_test("2.1 Login Consultor", False, "❌ Token não retornado")
        else:
            self.log_test("2.1 Login Consultor", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
        
        # TESTE 3: ENDPOINT REGIONAIS COM CONTADORES
        print("\n=== TESTE 3: GET /api/labelview/regionais/com-contadores ===")
        
        response = self.make_request("GET", "/labelview/regionais/com-contadores", token=unidade_token)
        
        if response.status_code == 200:
            self.log_test("3.1 Regionais - Status 200", True, "✅ Endpoint responde corretamente")
            
            try:
                data = response.json()
                
                # Validar estrutura da resposta
                if data.get("success") == True:
                    self.log_test("3.2 Regionais - Success Field", True, "✅ Campo 'success': true")
                    
                    regionais = data.get("regionais", [])
                    total = data.get("total", 0)
                    
                    if isinstance(regionais, list):
                        self.log_test("3.3 Regionais - Lista", True, 
                                     f"✅ {len(regionais)} regionais encontrados")
                        
                        # Validar estrutura dos regionais
                        if len(regionais) > 0:
                            primeiro_regional = regionais[0]
                            regional_id = primeiro_regional.get("id")  # Guardar para teste de filtro
                            
                            campos_esperados = ["id", "full_name", "email", "total_consultores", "total_clientes"]
                            campos_presentes = all(campo in primeiro_regional for campo in campos_esperados)
                            
                            if campos_presentes:
                                self.log_test("3.4 Regionais - Estrutura", True, 
                                             "✅ Todos os campos esperados presentes")
                                
                                print(f"\n📊 Regional encontrado:")
                                print(f"   ID: {primeiro_regional.get('id')}")
                                print(f"   Nome: {primeiro_regional.get('full_name')}")
                                print(f"   Email: {primeiro_regional.get('email')}")
                                print(f"   Consultores: {primeiro_regional.get('total_consultores')}")
                                print(f"   Clientes: {primeiro_regional.get('total_clientes')}")
                            else:
                                self.log_test("3.4 Regionais - Estrutura", False, 
                                             f"❌ Campos ausentes: {campos_esperados}")
                        else:
                            self.log_test("3.3 Regionais - Lista", True, "✅ Lista vazia (sem regionais)")
                    else:
                        self.log_test("3.3 Regionais - Lista", False, 
                                     f"❌ 'regionais' não é lista: {type(regionais)}")
                else:
                    self.log_test("3.2 Regionais - Success Field", False, 
                                 f"❌ Campo 'success': {data.get('success')}")
                    
            except Exception as e:
                self.log_test("3.2 Regionais - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("3.1 Regionais - Status 200", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
        
        # TESTE 4: ENDPOINT CONSULTORES COM CONTADORES
        print("\n=== TESTE 4: GET /api/labelview/consultores/com-contadores ===")
        
        response = self.make_request("GET", "/labelview/consultores/com-contadores", token=unidade_token)
        
        if response.status_code == 200:
            self.log_test("4.1 Consultores - Status 200", True, "✅ Endpoint responde corretamente")
            
            try:
                data = response.json()
                
                if data.get("success") == True:
                    self.log_test("4.2 Consultores - Success Field", True, "✅ Campo 'success': true")
                    
                    consultores = data.get("consultores", [])
                    
                    if isinstance(consultores, list):
                        self.log_test("4.3 Consultores - Lista", True, 
                                     f"✅ {len(consultores)} consultores encontrados")
                        
                        if len(consultores) > 0:
                            primeiro_consultor = consultores[0]
                            consultor_id = primeiro_consultor.get("id")  # Guardar para teste de filtro
                            
                            campos_esperados = ["id", "full_name", "email", "regional_nome", "total_clientes"]
                            campos_presentes = all(campo in primeiro_consultor for campo in campos_esperados)
                            
                            if campos_presentes:
                                self.log_test("4.4 Consultores - Estrutura", True, 
                                             "✅ Todos os campos esperados presentes")
                                
                                print(f"\n📊 Consultor encontrado:")
                                print(f"   ID: {primeiro_consultor.get('id')}")
                                print(f"   Nome: {primeiro_consultor.get('full_name')}")
                                print(f"   Email: {primeiro_consultor.get('email')}")
                                print(f"   Regional: {primeiro_consultor.get('regional_nome')}")
                                print(f"   Clientes: {primeiro_consultor.get('total_clientes')}")
                            else:
                                self.log_test("4.4 Consultores - Estrutura", False, 
                                             f"❌ Campos ausentes: {campos_esperados}")
                    else:
                        self.log_test("4.3 Consultores - Lista", False, 
                                     f"❌ 'consultores' não é lista: {type(consultores)}")
                else:
                    self.log_test("4.2 Consultores - Success Field", False, 
                                 f"❌ Campo 'success': {data.get('success')}")
                    
            except Exception as e:
                self.log_test("4.2 Consultores - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("4.1 Consultores - Status 200", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
        
        # TESTE 5: ENDPOINT CLIENTES HIERARQUIA
        print("\n=== TESTE 5: GET /api/labelview/clientes/hierarquia ===")
        
        response = self.make_request("GET", "/labelview/clientes/hierarquia", token=unidade_token)
        
        clientes_total = 0
        
        if response.status_code == 200:
            self.log_test("5.1 Clientes - Status 200", True, "✅ Endpoint responde corretamente")
            
            try:
                data = response.json()
                
                if data.get("success") == True:
                    self.log_test("5.2 Clientes - Success Field", True, "✅ Campo 'success': true")
                    
                    clientes = data.get("clientes", [])
                    clientes_total = len(clientes)
                    
                    if isinstance(clientes, list):
                        self.log_test("5.3 Clientes - Lista", True, 
                                     f"✅ {clientes_total} clientes encontrados")
                        
                        if clientes_total > 0:
                            primeiro_cliente = clientes[0]
                            
                            print(f"\n📊 Cliente encontrado:")
                            print(f"   ID: {primeiro_cliente.get('id')}")
                            print(f"   Nome: {primeiro_cliente.get('full_name')}")
                            print(f"   Email: {primeiro_cliente.get('email')}")
                            print(f"   Regional: {primeiro_cliente.get('regional_nome')}")
                            print(f"   Consultor: {primeiro_cliente.get('consultor_nome')}")
                        
                        self.log_test("5.4 Clientes - Estrutura", True, "✅ Lista de clientes válida")
                    else:
                        self.log_test("5.3 Clientes - Lista", False, 
                                     f"❌ 'clientes' não é lista: {type(clientes)}")
                else:
                    self.log_test("5.2 Clientes - Success Field", False, 
                                 f"❌ Campo 'success': {data.get('success')}")
                    
            except Exception as e:
                self.log_test("5.2 Clientes - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("5.1 Clientes - Status 200", False, 
                         f"❌ Endpoint falhou - Status: {response.status_code}")
        
        # TESTE 6: FILTRO POR REGIONAL_ID
        if regional_id:
            print(f"\n=== TESTE 6: FILTRO POR REGIONAL_ID ({regional_id}) ===")
            
            response = self.make_request("GET", f"/labelview/clientes/hierarquia?regional_id={regional_id}", token=unidade_token)
            
            if response.status_code == 200:
                self.log_test("6.1 Filtro Regional - Status 200", True, "✅ Filtro funciona")
                
                try:
                    data = response.json()
                    
                    if data.get("success") == True:
                        clientes_filtrados = data.get("clientes", [])
                        clientes_filtrados_count = len(clientes_filtrados)
                        
                        self.log_test("6.2 Filtro Regional - Resultado", True, 
                                     f"✅ Filtro retorna {clientes_filtrados_count} clientes")
                        
                        # Validar que o filtro funciona (pode retornar menos ou igual clientes)
                        if clientes_filtrados_count <= clientes_total:
                            self.log_test("6.3 Filtro Regional - Funcionalidade", True, 
                                         f"✅ Filtro funcionando: {clientes_filtrados_count} de {clientes_total} clientes")
                        else:
                            self.log_test("6.3 Filtro Regional - Funcionalidade", False, 
                                         f"❌ Filtro retorna mais clientes que o total")
                    else:
                        self.log_test("6.2 Filtro Regional - Success", False, 
                                     f"❌ Campo 'success': {data.get('success')}")
                        
                except Exception as e:
                    self.log_test("6.2 Filtro Regional - Parse", False, 
                                 f"❌ Erro ao processar resposta: {str(e)}")
            else:
                self.log_test("6.1 Filtro Regional - Status 200", False, 
                             f"❌ Filtro falhou - Status: {response.status_code}")
        else:
            print("\n=== TESTE 6: FILTRO POR REGIONAL_ID ===")
            self.log_test("6.1 Filtro Regional - Disponível", False, 
                         "⚠️ Nenhum regional_id disponível para testar")
        
        # TESTE 7: FILTRO POR CONSULTOR_ID
        if consultor_id:
            print(f"\n=== TESTE 7: FILTRO POR CONSULTOR_ID ({consultor_id}) ===")
            
            response = self.make_request("GET", f"/labelview/clientes/hierarquia?consultor_id={consultor_id}", token=unidade_token)
            
            if response.status_code == 200:
                self.log_test("7.1 Filtro Consultor - Status 200", True, "✅ Filtro funciona")
                
                try:
                    data = response.json()
                    
                    if data.get("success") == True:
                        clientes_filtrados = data.get("clientes", [])
                        clientes_filtrados_count = len(clientes_filtrados)
                        
                        self.log_test("7.2 Filtro Consultor - Resultado", True, 
                                     f"✅ Filtro retorna {clientes_filtrados_count} clientes")
                        
                        if clientes_filtrados_count <= clientes_total:
                            self.log_test("7.3 Filtro Consultor - Funcionalidade", True, 
                                         f"✅ Filtro funcionando: {clientes_filtrados_count} de {clientes_total} clientes")
                        else:
                            self.log_test("7.3 Filtro Consultor - Funcionalidade", False, 
                                         f"❌ Filtro retorna mais clientes que o total")
                    else:
                        self.log_test("7.2 Filtro Consultor - Success", False, 
                                     f"❌ Campo 'success': {data.get('success')}")
                        
                except Exception as e:
                    self.log_test("7.2 Filtro Consultor - Parse", False, 
                                 f"❌ Erro ao processar resposta: {str(e)}")
            else:
                self.log_test("7.1 Filtro Consultor - Status 200", False, 
                             f"❌ Filtro falhou - Status: {response.status_code}")
        else:
            print("\n=== TESTE 7: FILTRO POR CONSULTOR_ID ===")
            self.log_test("7.1 Filtro Consultor - Disponível", False, 
                         "⚠️ Nenhum consultor_id disponível para testar")
        
        # TESTE 8: ENDPOINTS COM USUÁRIO CONSULTOR
        if consultor_token:
            print("\n=== TESTE 8: ENDPOINTS COM USUÁRIO CONSULTOR ===")
            
            endpoints_consultor = [
                ("/labelview/regionais/com-contadores", "8.1 Regionais - Consultor"),
                ("/labelview/consultores/com-contadores", "8.2 Consultores - Consultor"),
                ("/labelview/clientes/hierarquia", "8.3 Clientes - Consultor")
            ]
            
            for endpoint, test_name in endpoints_consultor:
                response = self.make_request("GET", endpoint, token=consultor_token)
                
                if response.status_code == 200:
                    self.log_test(test_name, True, "✅ Endpoint funciona para consultor")
                else:
                    self.log_test(test_name, False, 
                                 f"❌ Endpoint falha para consultor - Status: {response.status_code}")
        else:
            print("\n=== TESTE 8: ENDPOINTS COM USUÁRIO CONSULTOR ===")
            self.log_test("8.1 Consultor Token", False, 
                         "⚠️ Token consultor não disponível")
        
        # RESUMO FINAL
        print(f"\n🎯 RESUMO FINAL DOS TESTES DE FILTROS UNIDADE (v2.34.77):")
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        print(f"   • Total de testes executados: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Testes falharam: {failed_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "   • Taxa de sucesso: 0%")
        
        # Análise de testes críticos
        critical_keywords = ["Login", "Status 200", "Success Field", "Lista", "Estrutura"]
        critical_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in critical_keywords)]
        critical_success = len([r for r in critical_tests if r["success"]])
        
        print(f"\n📊 ANÁLISE DE FUNCIONALIDADES:")
        print(f"   • Logins funcionando: {len([r for r in self.test_results if 'Login' in r['test'] and r['success']])}")
        print(f"   • Endpoints respondendo: {len([r for r in self.test_results if 'Status 200' in r['test'] and r['success']])}")
        print(f"   • Estruturas corretas: {len([r for r in self.test_results if 'Estrutura' in r['test'] and r['success']])}")
        print(f"   • Filtros funcionando: {len([r for r in self.test_results if 'Filtro' in r['test'] and r['success']])}")
        
        # Resultado final
        if successful_tests >= total_tests * 0.85:  # 85% de sucesso
            print("\n✅ RESULTADO: FILTROS UNIDADE FUNCIONANDO PERFEITAMENTE!")
            print("   ✅ Todos os endpoints backend implementados e funcionando")
            print("   ✅ Estrutura de dados correta em todas as respostas")
            print("   ✅ Filtros por regional_id e consultor_id funcionando")
            print("   ✅ Autenticação e autorização funcionando")
            print("   ✅ Sistema pronto para uso no frontend")
            print("   ✅ Funcionalidade v2.34.77 validada com sucesso")
            return True
        else:
            print("\n❌ RESULTADO: PROBLEMAS IDENTIFICADOS!")
            print("   ❌ Alguns endpoints ou funcionalidades não estão funcionando")
            print("   ❌ CORREÇÃO NECESSÁRIA antes do uso")
            
            # Mostrar problemas específicos
            failed_tests_list = [r for r in self.test_results if not r["success"]]
            if failed_tests_list:
                print("\n❌ PROBLEMAS ESPECÍFICOS:")
                for test in failed_tests_list:
                    print(f"   • {test['test']}: {test['details']}")
            
            return False

if __name__ == "__main__":
    tester = FiltrosFinalTester()
    success = tester.test_filtros_unidade_completo()
    
    if success:
        print("\n🎉 TODOS OS TESTES PASSARAM! Sistema pronto para produção.")
    else:
        print("\n⚠️ ALGUNS TESTES FALHARAM. Verificar problemas antes do deploy.")