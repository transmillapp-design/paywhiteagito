#!/usr/bin/env python3
"""
XGate Integration Testing Suite for AgitoCash
Comprehensive testing for XGate API integration
"""

import requests
import json
import time
from typing import Dict, Any

class XGateIntegrationTester:
    def __init__(self, base_url: str = None):
        if base_url is None:
            # Read from frontend .env file
            try:
                with open('/app/frontend/.env', 'r') as f:
                    for line in f:
                        if line.startswith('REACT_APP_BACKEND_URL='):
                            frontend_url = line.split('=', 1)[1].strip()
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

    def test_xgate_integration_complete(self):
        """🚨 TESTE COMPLETO DA INTEGRAÇÃO XGATE CONFORME SOLICITADO PELO USUÁRIO"""
        print("\n🚨 TESTE COMPLETO DA INTEGRAÇÃO XGATE")
        print("=" * 80)
        print("INFORMAÇÕES CORRETAS DO USUÁRIO:")
        print("- Endpoint POST: https://api.xgateglobal.com/auth/token")
        print("- Endpoint Login: https://api.xgateglobal.com/auth/token")
        print("- Credenciais: marcelobersch@transmill.com.br / !Ma04202011@")
        print("\nTESTES ESPECÍFICOS:")
        print("1. **Login demo**: cliente@demo.com/demo123 (validar sistema base)")
        print("2. **Teste direto do endpoint XGate**:")
        print("   - POST https://api.xgateglobal.com/auth/token")
        print("   - Payload: {\"email\": \"marcelobersch@transmill.com.br\", \"password\": \"!Ma04202011@\"}")
        print("   - Headers: {\"Content-Type\": \"application/json\"}")
        print("3. **Teste das rotas XGate**:")
        print("   - GET /api/xgate/test-connection (deve funcionar agora)")
        print("   - GET /api/xgate/exchange-rate")
        print("   - POST /api/xgate/create-customer")
        print("   - POST /api/xgate/pix-deposit com R$ 25,00")
        print("\nOBJETIVO: Confirmar se o endpoint https://api.xgateglobal.com/auth/token")
        print("funciona corretamente com as credenciais fornecidas e identificar qualquer")
        print("erro específico.")
        print("ATENÇÃO: Fazer teste direto do endpoint de autenticação primeiro para")
        print("diagnosticar exatamente qual é o problema, se houver.")
        print("=" * 80)
        
        # Test 1: Login with demo account
        print("\n--- TESTE 1: LOGIN DEMO (VALIDAR SISTEMA BASE) ---")
        
        login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code != 200:
            self.log_test("Demo Login for XGate Integration", False, f"❌ Login falhou - Status: {response.status_code}")
            print("❌ SISTEMA BASE NÃO FUNCIONA - Interrompendo testes XGate")
            return
        
        login_result = response.json()
        demo_token = login_result["access_token"]
        demo_user = login_result["user"]
        
        self.log_test("Demo Login for XGate Integration", True, 
                     f"✅ Login cliente@demo.com/demo123 funcionando - {demo_user.get('full_name', 'N/A')}")
        
        # Test 2: Direct XGate endpoint test (CRITICAL TEST)
        print("\n--- TESTE 2: TESTE DIRETO DO ENDPOINT XGATE (CRÍTICO) ---")
        print("🔸 Testando diretamente: POST https://api.xgateglobal.com/auth/token")
        print("🔸 Credenciais: marcelobersch@transmill.com.br / !Ma04202011@")
        
        try:
            # Direct test of XGate authentication endpoint
            xgate_credentials = {
                "email": "marcelobersch@transmill.com.br",
                "password": "!Ma04202011@"
            }
            
            xgate_headers = {"Content-Type": "application/json"}
            
            # Test direct XGate API call
            xgate_response = requests.post(
                "https://api.xgateglobal.com/auth/token",
                json=xgate_credentials,
                headers=xgate_headers,
                timeout=30
            )
            
            if xgate_response.status_code in [200, 201]:
                xgate_data = xgate_response.json()
                self.log_test("Direct XGate Authentication", True, 
                             f"✅ AUTENTICAÇÃO XGATE FUNCIONANDO - Status: {xgate_response.status_code}")
                
                # Check if we got a token
                token = xgate_data.get('token') or xgate_data.get('access_token')
                if token:
                    self.log_test("XGate Token Received", True, 
                                 f"✅ Token JWT recebido - {len(token)} caracteres")
                    self.xgate_token = token
                else:
                    self.log_test("XGate Token Received", False, 
                                 "❌ Token não encontrado na resposta")
                    
                print(f"      📋 Resposta XGate: {xgate_data}")
                
            else:
                self.log_test("Direct XGate Authentication", False, 
                             f"❌ AUTENTICAÇÃO XGATE FALHOU - Status: {xgate_response.status_code}")
                print(f"      ❌ Erro XGate: {xgate_response.text}")
                
                # Analyze specific error types
                if xgate_response.status_code == 401:
                    self.log_test("XGate Error Analysis", False, 
                                 "❌ ERRO 401: Credenciais inválidas - Verificar email/senha")
                elif xgate_response.status_code == 403:
                    self.log_test("XGate Error Analysis", False, 
                                 "❌ ERRO 403: Acesso negado - Conta pode estar bloqueada")
                elif xgate_response.status_code == 404:
                    self.log_test("XGate Error Analysis", False, 
                                 "❌ ERRO 404: Endpoint não encontrado - URL incorreta")
                elif xgate_response.status_code == 500:
                    self.log_test("XGate Error Analysis", False, 
                                 "❌ ERRO 500: Erro interno do servidor XGate")
                    
        except Exception as e:
            self.log_test("Direct XGate Authentication", False, 
                         f"❌ ERRO DE CONEXÃO: {str(e)}")
            print(f"      ❌ Detalhes do erro: {str(e)}")
        
        # Test 3: Test XGate connection via our backend (INTEGRATION TEST)
        print("\n--- TESTE 3: TESTE DE CONEXÃO XGATE VIA BACKEND ---")
        
        response = self.make_request("GET", "/xgate/test-connection", token=demo_token)
        
        if response.status_code == 200:
            data = response.json()
            self.log_test("XGate Backend Connection", True, 
                         f"✅ Conexão XGate via backend funcionando - {data.get('message', 'N/A')}")
        else:
            self.log_test("XGate Backend Connection", False, 
                         f"❌ Conexão XGate via backend falhou - Status: {response.status_code}")
            print(f"      ❌ Erro: {response.text}")
        
        # Test 4: Test XGate exchange rate endpoint
        print("\n--- TESTE 4: TESTE DE TAXA DE CÂMBIO XGATE ---")
        
        response = self.make_request("GET", "/xgate/exchange-rate", token=demo_token)
        
        if response.status_code == 200:
            data = response.json()
            self.log_test("XGate Exchange Rate", True, 
                         f"✅ Taxa de câmbio obtida - {data}")
        else:
            self.log_test("XGate Exchange Rate", False, 
                         f"❌ Falha na taxa de câmbio - Status: {response.status_code}")
            print(f"      ❌ Erro: {response.text}")
        
        # Test 5: Test XGate customer creation
        print("\n--- TESTE 5: TESTE DE CRIAÇÃO DE CLIENTE XGATE ---")
        
        response = self.make_request("POST", "/xgate/create-customer", token=demo_token)
        
        if response.status_code == 200:
            data = response.json()
            self.log_test("XGate Customer Creation", True, 
                         f"✅ Cliente XGate criado - {data.get('message', 'N/A')}")
        else:
            self.log_test("XGate Customer Creation", False, 
                         f"❌ Falha na criação de cliente - Status: {response.status_code}")
            print(f"      ❌ Erro: {response.text}")
        
        # Test 6: Test XGate PIX deposit with R$ 25,00
        print("\n--- TESTE 6: TESTE DE DEPÓSITO PIX XGATE COM R$ 25,00 ---")
        
        pix_deposit_data = {
            "amount": 25.00,
            "description": "Teste de depósito PIX via XGate"
        }
        
        response = self.make_request("POST", "/xgate/pix-deposit", pix_deposit_data, token=demo_token)
        
        if response.status_code == 200:
            data = response.json()
            self.log_test("XGate PIX Deposit R$ 25,00", True, 
                         f"✅ Depósito PIX R$ 25,00 criado - {data.get('message', 'N/A')}")
            
            # Check if we got PIX key or QR code
            if 'pix_key' in data or 'qr_code' in data:
                self.log_test("XGate PIX Data", True, 
                             f"✅ Dados PIX recebidos - Chave: {data.get('pix_key', 'N/A')}")
            else:
                self.log_test("XGate PIX Data", False, 
                             "❌ Dados PIX não encontrados na resposta")
                
        else:
            self.log_test("XGate PIX Deposit R$ 25,00", False, 
                         f"❌ Falha no depósito PIX - Status: {response.status_code}")
            print(f"      ❌ Erro: {response.text}")
        
        # Test 7: Test XGate transactions list
        print("\n--- TESTE 7: TESTE DE LISTAGEM DE TRANSAÇÕES XGATE ---")
        
        response = self.make_request("GET", "/xgate/transactions", token=demo_token)
        
        if response.status_code == 200:
            data = response.json()
            transaction_count = len(data) if isinstance(data, list) else 0
            self.log_test("XGate Transactions List", True, 
                         f"✅ Transações XGate listadas - {transaction_count} transações")
        else:
            self.log_test("XGate Transactions List", False, 
                         f"❌ Falha na listagem de transações - Status: {response.status_code}")
            print(f"      ❌ Erro: {response.text}")
        
        # Test 8: Test XGate BRL to USDT conversion
        print("\n--- TESTE 8: TESTE DE CONVERSÃO BRL → USDT ---")
        
        conversion_data = {
            "brl_amount": 100.00
        }
        
        response = self.make_request("POST", "/xgate/convert-brl-usdt", conversion_data, token=demo_token)
        
        if response.status_code == 200:
            data = response.json()
            self.log_test("XGate BRL→USDT Conversion", True, 
                         f"✅ Conversão BRL→USDT realizada - {data}")
        else:
            self.log_test("XGate BRL→USDT Conversion", False, 
                         f"❌ Falha na conversão - Status: {response.status_code}")
            print(f"      ❌ Erro: {response.text}")
        
        # Final Summary
        print(f"\n🎯 RESUMO FINAL DO TESTE XGATE:")
        
        # Count successful tests
        xgate_tests = [result for result in self.test_results if 'XGate' in result['test']]
        successful_xgate_tests = [test for test in xgate_tests if test['success']]
        
        print(f"   • Testes XGate executados: {len(xgate_tests)}")
        print(f"   • Testes bem-sucedidos: {len(successful_xgate_tests)}")
        print(f"   • Taxa de sucesso: {(len(successful_xgate_tests)/len(xgate_tests)*100):.1f}%" if xgate_tests else "0%")
        
        if len(successful_xgate_tests) == len(xgate_tests):
            print("   ✅ RESULTADO: INTEGRAÇÃO XGATE FUNCIONANDO 100%")
            print("   ✅ ENDPOINT https://api.xgateglobal.com/auth/token FUNCIONANDO")
            print("   ✅ CREDENCIAIS marcelobersch@transmill.com.br / !Ma04202011@ VÁLIDAS")
        elif len(successful_xgate_tests) > 0:
            print(f"   ⚠️ RESULTADO: INTEGRAÇÃO XGATE PARCIALMENTE FUNCIONAL")
            print(f"   ⚠️ {len(successful_xgate_tests)}/{len(xgate_tests)} testes passaram")
        else:
            print("   ❌ RESULTADO: INTEGRAÇÃO XGATE NÃO FUNCIONANDO")
            print("   ❌ PROBLEMA CRÍTICO: Verificar credenciais e configuração")
        
        return len(successful_xgate_tests) == len(xgate_tests)

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 60)
        print("📊 RESUMO FINAL DOS TESTES")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        successful_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - successful_tests
        
        print(f"Total de testes: {total_tests}")
        print(f"✅ Sucessos: {successful_tests}")
        print(f"❌ Falhas: {failed_tests}")
        print(f"📈 Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ TESTES QUE FALHARAM:")
            for test in self.test_results:
                if not test['success']:
                    print(f"   • {test['test']}: {test['details']}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    tester = XGateIntegrationTester()
    
    # Run XGate integration tests as requested by user
    print("🚀 EXECUTANDO TESTES ESPECÍFICOS DA INTEGRAÇÃO XGATE")
    print("=" * 80)
    
    # Run the complete XGate integration test
    tester.test_xgate_integration_complete()
    
    # Print final summary
    tester.print_test_summary()