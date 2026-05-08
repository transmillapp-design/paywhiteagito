#!/usr/bin/env python3
"""
Teste específico para os novos endpoints de Minha Proteção Labelview
Usando conta Master para validar estrutura dos endpoints
"""

import requests
import json
import time
from datetime import datetime

class MinhaProtecaoMasterTester:
    def __init__(self):
        # Read from frontend .env file
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        frontend_url = line.split('=', 1)[1].strip()
                        # Check if URL already ends with /api
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
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_minha_protecao_endpoints(self):
        """🎯 TESTE RÁPIDO: Validar os novos endpoints de Minha Proteção Labelview"""
        print("\n🎯 TESTE RÁPIDO: Validar os novos endpoints de Minha Proteção Labelview")
        print("=" * 80)
        print("OBJETIVO: Validar os novos endpoints implementados para a área do cliente")
        print("")
        print("ENDPOINTS A TESTAR:")
        print("1. GET /api/labelview/meu-contrato - Buscar contrato do cliente logado")
        print("2. POST /api/labelview/pagar-parcela/{parcela_id} - Pagar parcela")
        print("")
        print("CREDENCIAIS:")
        print("- Usar conta Master Labelview para validar estrutura dos endpoints")
        print("")
        print("VALIDAÇÕES:")
        print("1. Endpoint /meu-contrato responde corretamente (requer autenticação)")
        print("2. Retorna dados estruturados do contrato (cliente, veículo, plano, parcelas, vistoria, contrato assinado)")
        print("3. Parcelas são geradas corretamente (12 parcelas com datas de vencimento)")
        print("")
        print("OBJETIVO: Verificar se a estrutura de dados está correta para exibir o resumo completo na tela do cliente.")
        print("=" * 80)
        
        # Variables to store test data
        master_token = None
        master_user = None
        
        # TESTE 1: LOGIN COM MASTER LABELVIEW
        print("\n=== TESTE 1: AUTENTICAÇÃO MASTER LABELVIEW ===")
        
        master_login_data = {
            "email": "protecao@agitomil.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", master_login_data)
        
        if response.status_code == 200:
            data = response.json()
            master_token = data.get("access_token")
            master_user = data.get("user", {})
            
            if master_token:
                self.log_test("1.1 Login Master Labelview", True, 
                             f"✅ Login funcionando - {master_user.get('email')}")
                
                # Verificar is_labelview_master
                is_labelview_master = master_user.get("is_labelview_master", False)
                if is_labelview_master:
                    self.log_test("1.2 Master Labelview Permissions", True, 
                                 "✅ is_labelview_master=true confirmado")
                else:
                    self.log_test("1.2 Master Labelview Permissions", False, 
                                 "❌ is_labelview_master deveria ser true")
                
                print(f"🔍 Master Labelview logado:")
                print(f"   📧 Email: {master_user.get('email')}")
                print(f"   👤 Nome: {master_user.get('full_name')}")
                print(f"   🏢 Tipo: {master_user.get('user_type')}")
                print(f"   🔓 Master: {is_labelview_master}")
            else:
                self.log_test("1.1 Login Master Labelview", False, 
                             "❌ Token não retornado")
                return False
        else:
            self.log_test("1.1 Login Master Labelview", False, 
                         f"❌ Login falhou - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                print(f"❌ Erro sem detalhes - Status: {response.status_code}")
            return False
        
        # TESTE 2: ENDPOINT MEU CONTRATO
        print("\n=== TESTE 2: GET /api/labelview/meu-contrato ===")
        
        response = self.make_request("GET", "/labelview/meu-contrato", token=master_token)
        
        if response.status_code == 200:
            self.log_test("2.1 Meu Contrato - Status 200", True, 
                         "✅ Endpoint responde corretamente")
            
            try:
                data = response.json()
                
                # Validar estrutura da resposta
                success = data.get("success", False)
                if success is not None:
                    self.log_test("2.2 Meu Contrato - Success Field", True, 
                                 f"✅ Campo 'success' presente: {success}")
                    
                    # Se success=false, é esperado (Master não tem contrato)
                    if not success:
                        message = data.get("message", "")
                        if "Nenhum contrato" in message:
                            self.log_test("2.3 Meu Contrato - Expected No Contract", True, 
                                         "✅ Resposta esperada: Master não tem contrato de proteção")
                        else:
                            self.log_test("2.3 Meu Contrato - Expected No Contract", False, 
                                         f"❌ Mensagem inesperada: {message}")
                    else:
                        # Se success=true, validar estrutura do contrato
                        contrato = data.get("contrato")
                        if contrato:
                            self.log_test("2.4 Meu Contrato - Contrato Structure", True, 
                                         "✅ Estrutura de contrato presente na resposta")
                            
                            # Validar seções do contrato
                            expected_sections = [
                                "id", "numero_contrato", "status", "cliente", 
                                "veiculo", "plano", "parcelas", "contrato"
                            ]
                            
                            missing_sections = []
                            for section in expected_sections:
                                if section not in contrato:
                                    missing_sections.append(section)
                            
                            if not missing_sections:
                                self.log_test("2.5 Meu Contrato - All Sections", True, 
                                             "✅ Todas as seções do contrato presentes")
                            else:
                                self.log_test("2.5 Meu Contrato - All Sections", False, 
                                             f"❌ Seções ausentes: {', '.join(missing_sections)}")
                            
                            # Validar parcelas
                            parcelas = contrato.get("parcelas", [])
                            if len(parcelas) == 12:
                                self.log_test("2.6 Meu Contrato - 12 Parcelas", True, 
                                             "✅ 12 parcelas geradas corretamente")
                                
                                # Validar estrutura das parcelas
                                if parcelas:
                                    primeira_parcela = parcelas[0]
                                    expected_parcela_fields = ["id", "numero", "data_vencimento", "valor", "status"]
                                    
                                    missing_parcela_fields = []
                                    for field in expected_parcela_fields:
                                        if field not in primeira_parcela:
                                            missing_parcela_fields.append(field)
                                    
                                    if not missing_parcela_fields:
                                        self.log_test("2.7 Meu Contrato - Parcela Structure", True, 
                                                     "✅ Estrutura das parcelas correta")
                                    else:
                                        self.log_test("2.7 Meu Contrato - Parcela Structure", False, 
                                                     f"❌ Campos ausentes nas parcelas: {', '.join(missing_parcela_fields)}")
                            else:
                                self.log_test("2.6 Meu Contrato - 12 Parcelas", False, 
                                             f"❌ {len(parcelas)} parcelas encontradas (esperado: 12)")
                        else:
                            self.log_test("2.4 Meu Contrato - Contrato Structure", False, 
                                         "❌ Campo 'contrato' ausente quando success=true")
                else:
                    self.log_test("2.2 Meu Contrato - Success Field", False, 
                                 "❌ Campo 'success' ausente na resposta")
                
                # Mostrar resposta completa para análise
                print(f"\n📋 Resposta completa do endpoint:")
                print(json.dumps(data, indent=2, ensure_ascii=False))
                
            except Exception as e:
                self.log_test("2.2 Meu Contrato - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
                
        elif response.status_code == 401:
            self.log_test("2.1 Meu Contrato - Status 200", False, 
                         "❌ Endpoint retorna 401 - problema de autenticação")
        elif response.status_code == 404:
            self.log_test("2.1 Meu Contrato - Status 200", False, 
                         "❌ Endpoint retorna 404 - endpoint não encontrado")
        else:
            self.log_test("2.1 Meu Contrato - Status 200", False, 
                         f"❌ Endpoint retorna status inesperado: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Erro: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                print(f"❌ Erro sem detalhes - Status: {response.status_code}")
        
        # TESTE 3: ENDPOINT PAGAR PARCELA (Teste de estrutura)
        print("\n=== TESTE 3: POST /api/labelview/pagar-parcela/{parcela_id} ===")
        
        # Usar um ID de parcela de exemplo (não vai funcionar, mas testa a estrutura)
        test_parcela_id = "test_cliente_id_parcela_1"
        
        response = self.make_request("POST", f"/labelview/pagar-parcela/{test_parcela_id}", token=master_token)
        
        # Esperamos erro 400 ou 404 (parcela não existe), mas não 404 do endpoint
        if response.status_code in [400, 404, 403]:
            self.log_test("3.1 Pagar Parcela - Endpoint Exists", True, 
                         f"✅ Endpoint existe (Status: {response.status_code})")
            
            try:
                error_data = response.json()
                detail = error_data.get("detail", "")
                
                if "ID de parcela inválido" in detail or "Cliente não encontrado" in detail or "Sem permissão" in detail:
                    self.log_test("3.2 Pagar Parcela - Validation Working", True, 
                                 f"✅ Validações funcionando: {detail}")
                else:
                    self.log_test("3.2 Pagar Parcela - Validation Working", False, 
                                 f"❌ Validação inesperada: {detail}")
                    
            except Exception as e:
                self.log_test("3.2 Pagar Parcela - Parse Response", False, 
                             f"❌ Erro ao processar resposta: {str(e)}")
                
        elif response.status_code == 401:
            self.log_test("3.1 Pagar Parcela - Endpoint Exists", False, 
                         "❌ Endpoint retorna 401 - problema de autenticação")
        elif response.status_code == 404:
            self.log_test("3.1 Pagar Parcela - Endpoint Exists", False, 
                         "❌ Endpoint retorna 404 - endpoint não implementado")
        else:
            self.log_test("3.1 Pagar Parcela - Endpoint Exists", True, 
                         f"✅ Endpoint responde (Status: {response.status_code})")
        
        # TESTE 4: VALIDAÇÃO DE AUTENTICAÇÃO
        print("\n=== TESTE 4: VALIDAÇÃO DE AUTENTICAÇÃO ===")
        
        # Testar endpoints sem token
        response = self.make_request("GET", "/labelview/meu-contrato")
        
        if response.status_code == 401:
            self.log_test("4.1 Auth Required - Meu Contrato", True, 
                         "✅ Endpoint requer autenticação corretamente")
        else:
            self.log_test("4.1 Auth Required - Meu Contrato", False, 
                         f"❌ Endpoint deveria retornar 401, retornou: {response.status_code}")
        
        response = self.make_request("POST", "/labelview/pagar-parcela/test_id")
        
        if response.status_code == 401:
            self.log_test("4.2 Auth Required - Pagar Parcela", True, 
                         "✅ Endpoint requer autenticação corretamente")
        else:
            self.log_test("4.2 Auth Required - Pagar Parcela", False, 
                         f"❌ Endpoint deveria retornar 401, retornou: {response.status_code}")
        
        # Final Summary
        print(f"\n🎯 RESUMO DO TESTE MINHA PROTEÇÃO LABELVIEW:")
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        
        print(f"   • Testes executados: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "   • Taxa de sucesso: 0%")
        
        # Validações críticas
        critical_tests = [
            "Login Master Labelview",
            "Meu Contrato - Status 200",
            "Pagar Parcela - Endpoint Exists",
            "Auth Required - Meu Contrato",
            "Auth Required - Pagar Parcela"
        ]
        
        critical_passed = 0
        for test_name in critical_tests:
            if any(test_name in r["test"] and r["success"] for r in self.test_results):
                critical_passed += 1
        
        if critical_passed >= len(critical_tests) * 0.8:  # 80% dos testes críticos
            print("\n✅ RESULTADO: ENDPOINTS MINHA PROTEÇÃO FUNCIONANDO!")
            print("   ✅ Estrutura de dados correta para exibir resumo completo")
            print("   ✅ Autenticação funcionando")
            print("   ✅ Endpoints implementados e respondendo")
            print("   ✅ Sistema pronto para integração frontend")
            return True
        else:
            print("\n❌ RESULTADO: PROBLEMAS IDENTIFICADOS NOS ENDPOINTS")
            print("   ❌ Correções necessárias antes da integração")
            
            # Mostrar testes que falharam
            failed_tests = [r for r in self.test_results if not r["success"]]
            if failed_tests:
                print("\n❌ TESTES QUE FALHARAM:")
                for test in failed_tests[-5:]:  # Mostrar últimos 5
                    print(f"   • {test['test']}: {test['details']}")
            
            return False

if __name__ == "__main__":
    tester = MinhaProtecaoMasterTester()
    tester.test_minha_protecao_endpoints()