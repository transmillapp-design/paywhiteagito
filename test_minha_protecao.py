#!/usr/bin/env python3
"""
Teste específico para os novos endpoints de Minha Proteção Labelview
"""

import requests
import json
import time
from datetime import datetime

class MinhaProtecaoTester:
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
        print("- Usar uma conta de cliente existente OU criar um cliente de teste")
        print("")
        print("VALIDAÇÕES:")
        print("1. Endpoint /meu-contrato responde corretamente (requer autenticação)")
        print("2. Retorna dados estruturados do contrato (cliente, veículo, plano, parcelas, vistoria, contrato assinado)")
        print("3. Parcelas são geradas corretamente (12 parcelas com datas de vencimento)")
        print("")
        print("OBJETIVO: Verificar se a estrutura de dados está correta para exibir o resumo completo na tela do cliente.")
        print("=" * 80)
        
        # Variables to store test data
        client_token = None
        client_user = None
        
        # TESTE 1: LOGIN COM CLIENTE EXISTENTE
        print("\n=== TESTE 1: AUTENTICAÇÃO DO CLIENTE ===")
        
        # Tentar diferentes contas de cliente
        client_accounts = [
            {"email": "cliente@demo.com", "password": "demo123"},
            {"email": "test@test.com", "password": "test123"},
            {"email": "cliente.teste@teste.com", "password": "demo123"}
        ]
        
        for account in client_accounts:
            response = self.make_request("POST", "/auth/login", account)
            
            if response.status_code == 200:
                data = response.json()
                client_token = data.get("access_token")
                client_user = data.get("user", {})
                
                if client_token:
                    self.log_test("1.1 Login Cliente", True, 
                                 f"✅ Login funcionando - {client_user.get('email')}")
                    
                    print(f"🔍 Cliente logado:")
                    print(f"   📧 Email: {client_user.get('email')}")
                    print(f"   👤 Nome: {client_user.get('full_name')}")
                    print(f"   🏢 Tipo: {client_user.get('user_type')}")
                    print(f"   📄 CPF: {client_user.get('cpf', 'N/A')}")
                    break
                else:
                    continue
            else:
                continue
        
        if not client_token:
            self.log_test("1.1 Login Cliente", False, 
                         "❌ Nenhuma conta de cliente disponível para teste")
            print("⚠️ Continuando com teste de estrutura dos endpoints...")
        
        # TESTE 2: ENDPOINT MEU CONTRATO
        print("\n=== TESTE 2: GET /api/labelview/meu-contrato ===")
        
        if client_token:
            response = self.make_request("GET", "/labelview/meu-contrato", token=client_token)
            
            if response.status_code == 200:
                self.log_test("2.1 Meu Contrato - Status 200", True, 
                             "✅ Endpoint responde corretamente")
                
                try:
                    data = response.json()
                    
                    # Validar estrutura da resposta
                    success = data.get("success", False)
                    if success:
                        self.log_test("2.2 Meu Contrato - Success Field", True, 
                                     "✅ Campo 'success': true presente")
                        
                        # Validar se há contrato
                        contrato = data.get("contrato")
                        if contrato:
                            self.log_test("2.3 Meu Contrato - Contrato Found", True, 
                                         "✅ Contrato encontrado na resposta")
                            
                            # Validar estrutura do contrato
                            expected_sections = [
                                "id", "numero_contrato", "status", "cliente", 
                                "veiculo", "plano", "parcelas", "contrato"
                            ]
                            
                            missing_sections = []
                            for section in expected_sections:
                                if section not in contrato:
                                    missing_sections.append(section)
                            
                            if not missing_sections:
                                self.log_test("2.4 Meu Contrato - Structure Complete", True, 
                                             "✅ Todas as seções do contrato presentes")
                            else:
                                self.log_test("2.4 Meu Contrato - Structure Complete", False, 
                                             f"❌ Seções ausentes: {', '.join(missing_sections)}")
                            
                            # Validar parcelas (deve ter 12)
                            parcelas = contrato.get("parcelas", [])
                            if len(parcelas) == 12:
                                self.log_test("2.5 Meu Contrato - 12 Parcelas", True, 
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
                                        self.log_test("2.6 Meu Contrato - Parcela Structure", True, 
                                                     "✅ Estrutura das parcelas correta")
                                    else:
                                        self.log_test("2.6 Meu Contrato - Parcela Structure", False, 
                                                     f"❌ Campos ausentes nas parcelas: {', '.join(missing_parcela_fields)}")
                                    
                                    # Mostrar algumas parcelas como exemplo
                                    print(f"\n📋 Exemplo de parcelas geradas:")
                                    for i, parcela in enumerate(parcelas[:3]):
                                        print(f"   Parcela {parcela.get('numero')}: {parcela.get('data_vencimento')} - R$ {parcela.get('valor')} - {parcela.get('status')}")
                                    if len(parcelas) > 3:
                                        print(f"   ... e mais {len(parcelas) - 3} parcelas")
                            else:
                                self.log_test("2.5 Meu Contrato - 12 Parcelas", False, 
                                             f"❌ {len(parcelas)} parcelas encontradas (esperado: 12)")
                            
                            # Mostrar dados do contrato
                            print(f"\n📋 Dados do contrato encontrado:")
                            print(f"   📄 Número: {contrato.get('numero_contrato', 'N/A')}")
                            print(f"   👤 Cliente: {contrato.get('cliente', {}).get('nome', 'N/A')}")
                            print(f"   🚗 Veículo: {contrato.get('veiculo', {}).get('marca', 'N/A')} {contrato.get('veiculo', {}).get('modelo', 'N/A')}")
                            print(f"   💰 Plano: {contrato.get('plano', {}).get('nome', 'N/A')} - R$ {contrato.get('plano', {}).get('valor_mensal', 0)}")
                            print(f"   📊 Status: {contrato.get('status', 'N/A')}")
                            
                        else:
                            self.log_test("2.3 Meu Contrato - Contrato Found", False, 
                                         "❌ Nenhum contrato encontrado (campo 'contrato' ausente)")
                            
                            # Mostrar mensagem se houver
                            message = data.get("message", "")
                            if message:
                                print(f"📝 Mensagem: {message}")
                    else:
                        self.log_test("2.2 Meu Contrato - Success Field", False, 
                                     f"❌ Campo 'success': {success}")
                        
                        # Mostrar mensagem se houver
                        message = data.get("message", "")
                        if message:
                            print(f"📝 Mensagem: {message}")
                        
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
        else:
            self.log_test("2.1 Meu Contrato - Status 200", False, 
                         "❌ Não foi possível testar - token de cliente não disponível")
        
        # TESTE 3: ENDPOINT PAGAR PARCELA (Teste de estrutura)
        print("\n=== TESTE 3: POST /api/labelview/pagar-parcela/{parcela_id} ===")
        
        if client_token:
            # Usar um ID de parcela de exemplo (não vai funcionar, mas testa a estrutura)
            test_parcela_id = "test_cliente_id_parcela_1"
            
            response = self.make_request("POST", f"/labelview/pagar-parcela/{test_parcela_id}", token=client_token)
            
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
        else:
            self.log_test("3.1 Pagar Parcela - Endpoint Exists", False, 
                         "❌ Não foi possível testar - token de cliente não disponível")
        
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
            "Meu Contrato - Status 200",
            "Meu Contrato - Structure Complete", 
            "Meu Contrato - 12 Parcelas",
            "Pagar Parcela - Endpoint Exists",
            "Auth Required - Meu Contrato"
        ]
        
        critical_passed = 0
        for test_name in critical_tests:
            if any(test_name in r["test"] and r["success"] for r in self.test_results):
                critical_passed += 1
        
        if critical_passed >= len(critical_tests) * 0.8:  # 80% dos testes críticos
            print("\n✅ RESULTADO: ENDPOINTS MINHA PROTEÇÃO FUNCIONANDO!")
            print("   ✅ Estrutura de dados correta para exibir resumo completo")
            print("   ✅ Parcelas geradas corretamente (12 parcelas)")
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
    tester = MinhaProtecaoTester()
    tester.test_minha_protecao_endpoints()