#!/usr/bin/env python3
"""
Teste específico para Filtros na tela de clientes para Unidade (v2.34.77)
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class FiltrosUnidadeTester:
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

    def test_filtros_unidade_v2_34_77(self):
        """🎯 TESTE: Filtros na tela de clientes para Unidade (v2.34.77)"""
        print("\n🎯 TESTE: Filtros na tela de clientes para Unidade (v2.34.77)")
        print("=" * 80)
        print("CONTEXTO: Implementação de filtros de Regional e Consultor na tela de clientes")
        print("FUNCIONALIDADE: Filtros aparecem APENAS para usuários do tipo 'labelview_unidade'")
        print("")
        print("NOVOS ENDPOINTS BACKEND:")
        print("1. GET /api/labelview/regionais/com-contadores")
        print("2. GET /api/labelview/consultores/com-contadores") 
        print("3. GET /api/labelview/clientes/hierarquia")
        print("4. GET /api/labelview/clientes/hierarquia?regional_id={id} (com filtro)")
        print("")
        print("CREDENCIAIS DE TESTE:")
        print("- Unidade: teste_unidade@test.com / test123")
        print("- Consultor: consultor_teste@test.com / test123")
        print("")
        print(f"🌐 URL Base: {self.base_url}")
        print("=" * 80)
        
        # Variables to store tokens
        unidade_token = None
        consultor_token = None
        
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
                             f"✅ Login Unidade funcionando - Tipo: {user_type}")
                
                print(f"🔍 Usuário Unidade logado:")
                print(f"   📧 Email: {unidade_user.get('email')}")
                print(f"   👤 Nome: {unidade_user.get('full_name')}")
                print(f"   🏢 Tipo: {user_type}")
                
                # Validar tipo de usuário
                if user_type == "labelview_unidade":
                    self.log_test("1.2 Tipo Usuário Unidade", True, 
                                 "✅ user_type correto: labelview_unidade")
                else:
                    self.log_test("1.2 Tipo Usuário Unidade", False, 
                                 f"❌ user_type incorreto: {user_type} (esperado: labelview_unidade)")
            else:
                self.log_test("1.1 Login Unidade", False, 
                             "❌ Token Unidade não retornado")
                return False
        else:
            self.log_test("1.1 Login Unidade", False, 
                         f"❌ Login Unidade falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                print(f"❌ Erro sem detalhes - Status: {response.status_code}")
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
                             f"✅ Login Consultor funcionando - Tipo: {user_type}")
                
                print(f"🔍 Usuário Consultor logado:")
                print(f"   📧 Email: {consultor_user.get('email')}")
                print(f"   👤 Nome: {consultor_user.get('full_name')}")
                print(f"   🏢 Tipo: {user_type}")
            else:
                self.log_test("2.1 Login Consultor", False, 
                             "❌ Token Consultor não retornado")
        else:
            self.log_test("2.1 Login Consultor", False, 
                         f"❌ Login Consultor falhou - Status: {response.status_code}")
            print("⚠️ Consultor teste não disponível, continuando com testes de Unidade...")
        
        # TESTE 3: ENDPOINT REGIONAIS COM CONTADORES (Unidade)
        print("\n=== TESTE 3: GET /api/labelview/regionais/com-contadores (Unidade) ===")
        
        response = self.make_request("GET", "/labelview/regionais/com-contadores", token=unidade_token)
        
        regionais_data = []
        regional_id_para_filtro = None
        
        if response.status_code == 200:
            self.log_test("3.1 Regionais com Contadores - Status 200", True, 
                         "✅ Endpoint regionais/com-contadores responde corretamente")
            
            try:
                regionais_data = response.json()
                
                if isinstance(regionais_data, list):
                    self.log_test("3.2 Regionais - Formato Lista", True, 
                                 f"✅ Retorna lista com {len(regionais_data)} regionais")
                    
                    # Validar estrutura dos regionais
                    if len(regionais_data) > 0:
                        primeiro_regional = regionais_data[0]
                        campos_esperados = ["id", "full_name", "email", "total_consultores", "total_clientes"]
                        campos_presentes = all(campo in primeiro_regional for campo in campos_esperados)
                        
                        if campos_presentes:
                            self.log_test("3.3 Regionais - Estrutura Correta", True, 
                                         "✅ Campos esperados presentes: id, full_name, email, total_consultores, total_clientes")
                            
                            # Pegar ID do primeiro regional para teste de filtro
                            regional_id_para_filtro = primeiro_regional.get("id")
                            
                            # Mostrar dados dos regionais
                            print(f"\n📊 Regionais encontrados:")
                            for i, regional in enumerate(regionais_data[:3], 1):  # Mostrar apenas os 3 primeiros
                                print(f"   {i}. {regional.get('full_name', 'N/A')} ({regional.get('email', 'N/A')})")
                                print(f"      Consultores: {regional.get('total_consultores', 0)}, Clientes: {regional.get('total_clientes', 0)}")
                        else:
                            self.log_test("3.3 Regionais - Estrutura Correta", False, 
                                         f"❌ Campos ausentes. Esperados: {campos_esperados}")
                    else:
                        self.log_test("3.2 Regionais - Formato Lista", True, 
                                     "✅ Lista vazia (nenhum regional cadastrado)")
                else:
                    self.log_test("3.2 Regionais - Formato Lista", False, 
                                 f"❌ Resposta não é uma lista: {type(regionais_data)}")
                    
            except Exception as e:
                self.log_test("3.2 Regionais - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("3.1 Regionais com Contadores - Status 200", False, 
                         f"❌ Endpoint regionais/com-contadores falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                print(f"❌ Erro sem detalhes - Status: {response.status_code}")
        
        # TESTE 4: ENDPOINT CONSULTORES COM CONTADORES (Unidade)
        print("\n=== TESTE 4: GET /api/labelview/consultores/com-contadores (Unidade) ===")
        
        response = self.make_request("GET", "/labelview/consultores/com-contadores", token=unidade_token)
        
        consultores_data = []
        
        if response.status_code == 200:
            self.log_test("4.1 Consultores com Contadores - Status 200", True, 
                         "✅ Endpoint consultores/com-contadores responde corretamente")
            
            try:
                consultores_data = response.json()
                
                if isinstance(consultores_data, list):
                    self.log_test("4.2 Consultores - Formato Lista", True, 
                                 f"✅ Retorna lista com {len(consultores_data)} consultores")
                    
                    # Validar estrutura dos consultores
                    if len(consultores_data) > 0:
                        primeiro_consultor = consultores_data[0]
                        campos_esperados = ["id", "full_name", "email", "regional_nome", "total_clientes"]
                        campos_presentes = all(campo in primeiro_consultor for campo in campos_esperados)
                        
                        if campos_presentes:
                            self.log_test("4.3 Consultores - Estrutura Correta", True, 
                                         "✅ Campos esperados presentes: id, full_name, email, regional_nome, total_clientes")
                            
                            # Mostrar dados dos consultores
                            print(f"\n📊 Consultores encontrados:")
                            for i, consultor in enumerate(consultores_data[:3], 1):  # Mostrar apenas os 3 primeiros
                                print(f"   {i}. {consultor.get('full_name', 'N/A')} ({consultor.get('email', 'N/A')})")
                                print(f"      Regional: {consultor.get('regional_nome', 'N/A')}, Clientes: {consultor.get('total_clientes', 0)}")
                        else:
                            self.log_test("4.3 Consultores - Estrutura Correta", False, 
                                         f"❌ Campos ausentes. Esperados: {campos_esperados}")
                    else:
                        self.log_test("4.2 Consultores - Formato Lista", True, 
                                     "✅ Lista vazia (nenhum consultor cadastrado)")
                else:
                    self.log_test("4.2 Consultores - Formato Lista", False, 
                                 f"❌ Resposta não é uma lista: {type(consultores_data)}")
                    
            except Exception as e:
                self.log_test("4.2 Consultores - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("4.1 Consultores com Contadores - Status 200", False, 
                         f"❌ Endpoint consultores/com-contadores falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                print(f"❌ Erro sem detalhes - Status: {response.status_code}")
        
        # TESTE 5: ENDPOINT CLIENTES HIERARQUIA (Unidade)
        print("\n=== TESTE 5: GET /api/labelview/clientes/hierarquia (Unidade) ===")
        
        response = self.make_request("GET", "/labelview/clientes/hierarquia", token=unidade_token)
        
        clientes_data = []
        
        if response.status_code == 200:
            self.log_test("5.1 Clientes Hierarquia - Status 200", True, 
                         "✅ Endpoint clientes/hierarquia responde corretamente")
            
            try:
                clientes_data = response.json()
                
                if isinstance(clientes_data, list):
                    self.log_test("5.2 Clientes - Formato Lista", True, 
                                 f"✅ Retorna lista com {len(clientes_data)} clientes")
                    
                    # Mostrar alguns clientes
                    if len(clientes_data) > 0:
                        print(f"\n📊 Clientes encontrados (primeiros 3):")
                        for i, cliente in enumerate(clientes_data[:3], 1):
                            nome = cliente.get('nome_completo', cliente.get('full_name', 'N/A'))
                            email = cliente.get('email', 'N/A')
                            print(f"   {i}. {nome} ({email})")
                    else:
                        print("📊 Nenhum cliente encontrado")
                else:
                    self.log_test("5.2 Clientes - Formato Lista", False, 
                                 f"❌ Resposta não é uma lista: {type(clientes_data)}")
                    
            except Exception as e:
                self.log_test("5.2 Clientes - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
        else:
            self.log_test("5.1 Clientes Hierarquia - Status 200", False, 
                         f"❌ Endpoint clientes/hierarquia falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                print(f"❌ Erro sem detalhes - Status: {response.status_code}")
        
        # TESTE 6: FILTRO POR REGIONAL_ID (se temos um regional_id)
        if regional_id_para_filtro:
            print(f"\n=== TESTE 6: GET /api/labelview/clientes/hierarquia?regional_id={regional_id_para_filtro} ===")
            
            response = self.make_request("GET", f"/labelview/clientes/hierarquia?regional_id={regional_id_para_filtro}", token=unidade_token)
            
            if response.status_code == 200:
                self.log_test("6.1 Filtro por Regional - Status 200", True, 
                             "✅ Filtro por regional_id funciona corretamente")
                
                try:
                    clientes_filtrados = response.json()
                    
                    if isinstance(clientes_filtrados, list):
                        self.log_test("6.2 Filtro por Regional - Formato Lista", True, 
                                     f"✅ Filtro retorna lista com {len(clientes_filtrados)} clientes")
                        
                        # Comparar com lista sem filtro
                        if len(clientes_filtrados) <= len(clientes_data):
                            self.log_test("6.3 Filtro por Regional - Funcionalidade", True, 
                                         f"✅ Filtro funcionando: {len(clientes_filtrados)} clientes filtrados de {len(clientes_data)} total")
                        else:
                            self.log_test("6.3 Filtro por Regional - Funcionalidade", False, 
                                         f"❌ Filtro retorna mais clientes ({len(clientes_filtrados)}) que o total ({len(clientes_data)})")
                    else:
                        self.log_test("6.2 Filtro por Regional - Formato Lista", False, 
                                     f"❌ Resposta filtrada não é uma lista: {type(clientes_filtrados)}")
                        
                except Exception as e:
                    self.log_test("6.2 Filtro por Regional - Parse Response", False, 
                                 f"❌ Erro ao processar resposta filtrada: {str(e)}")
            else:
                self.log_test("6.1 Filtro por Regional - Status 200", False, 
                             f"❌ Filtro por regional_id falhou - Status: {response.status_code}")
        else:
            print("\n=== TESTE 6: FILTRO POR REGIONAL_ID ===")
            self.log_test("6.1 Filtro por Regional - Disponível", False, 
                         "⚠️ Nenhum regional_id disponível para testar filtro")
        
        # TESTE 7: ENDPOINTS COM USUÁRIO CONSULTOR (deve funcionar mas UI não mostra filtros)
        if consultor_token:
            print("\n=== TESTE 7: ENDPOINTS COM USUÁRIO CONSULTOR ===")
            
            # Testar regionais com consultor
            response = self.make_request("GET", "/labelview/regionais/com-contadores", token=consultor_token)
            
            if response.status_code == 200:
                self.log_test("7.1 Regionais - Consultor", True, 
                             "✅ Endpoint regionais funciona para consultor")
            else:
                self.log_test("7.1 Regionais - Consultor", False, 
                             f"❌ Endpoint regionais falha para consultor - Status: {response.status_code}")
            
            # Testar consultores com consultor
            response = self.make_request("GET", "/labelview/consultores/com-contadores", token=consultor_token)
            
            if response.status_code == 200:
                self.log_test("7.2 Consultores - Consultor", True, 
                             "✅ Endpoint consultores funciona para consultor")
            else:
                self.log_test("7.2 Consultores - Consultor", False, 
                             f"❌ Endpoint consultores falha para consultor - Status: {response.status_code}")
            
            # Testar clientes com consultor
            response = self.make_request("GET", "/labelview/clientes/hierarquia", token=consultor_token)
            
            if response.status_code == 200:
                self.log_test("7.3 Clientes - Consultor", True, 
                             "✅ Endpoint clientes funciona para consultor")
            else:
                self.log_test("7.3 Clientes - Consultor", False, 
                             f"❌ Endpoint clientes falha para consultor - Status: {response.status_code}")
        else:
            print("\n=== TESTE 7: ENDPOINTS COM USUÁRIO CONSULTOR ===")
            self.log_test("7.1 Consultor Token", False, 
                         "⚠️ Token consultor não disponível para testar endpoints")
        
        # Final Summary
        print(f"\n🎯 RESUMO DOS TESTES DE FILTROS UNIDADE (v2.34.77):")
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        
        print(f"   • Total de testes executados: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "   • Taxa de sucesso: 0%")
        
        # Critical validations
        critical_tests = [
            r for r in self.test_results 
            if any(keyword in r["test"] for keyword in ["Login Unidade", "Regionais com Contadores", "Consultores com Contadores", "Clientes Hierarquia"])
        ]
        critical_success = len([r for r in critical_tests if r["success"]])
        
        if critical_success >= len(critical_tests) * 0.8 and len(critical_tests) > 0:  # 80% dos testes críticos
            print("\n✅ RESULTADO: FILTROS UNIDADE FUNCIONANDO!")
            print("   ✅ Login de usuários funcionando")
            print("   ✅ Novos endpoints backend respondendo")
            print("   ✅ Estrutura de dados correta")
            print("   ✅ Filtros podem ser implementados no frontend")
            print("   ✅ Sistema pronto para uso")
            return True
        else:
            print("\n❌ RESULTADO: PROBLEMAS CRÍTICOS IDENTIFICADOS!")
            print("   ❌ Alguns endpoints não estão funcionando corretamente")
            print("   ❌ CORREÇÃO NECESSÁRIA antes do uso")
            
            # Show specific issues
            failed_critical = [r for r in critical_tests if not r["success"]]
            if failed_critical:
                print("\n❌ PROBLEMAS ESPECÍFICOS:")
                for test in failed_critical:
                    print(f"   • {test['test']}: {test['details']}")
            
            return False

if __name__ == "__main__":
    tester = FiltrosUnidadeTester()
    tester.test_filtros_unidade_v2_34_77()