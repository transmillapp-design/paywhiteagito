#!/usr/bin/env python3
"""
XGate Integration Testing Suite
Critical testing for XGate integration after credential corrections
"""

import requests
import json
import time
from typing import Dict, Any

class XGateTester:
    def __init__(self):
        # Read from frontend .env file
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        frontend_url = line.split('=', 1)[1].strip()
                        self.base_url = f"{frontend_url}/api"
                        break
                else:
                    self.base_url = "http://localhost:8001/api"
        except:
            self.base_url = "http://localhost:8001/api"
        
        self.session = requests.Session()
        self.demo_token = None
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

    def test_xgate_integration_critical(self):
        """🚨 TESTE CRÍTICO: Integração XGate após correções das credenciais"""
        print("\n🚨 TESTE CRÍTICO DA INTEGRAÇÃO XGATE APÓS CORREÇÕES DAS CREDENCIAIS")
        print("=" * 80)
        print("CONTEXTO: Apliquei as seguintes correções na integração XGate:")
        print("✅ URL da API: https://srvcs.xgsi.com (corrigida)")
        print("✅ Endpoint de auth: /authentication/user/token (corrigido)")
        print("✅ Formato de credenciais: {\"id\": \"userID\", \"pw\": \"password\"} (corrigido)")
        print("✅ Credenciais completas: marcelobersch@transmill.com.br / !Ma04202011@")
        print("\nTESTES PRIORITÁRIOS (execução sequencial):")
        print("1. **Login demo**: cliente@demo.com/demo123 (validar sistema base)")
        print("2. **Teste de conexão XGate**: GET /api/xgate/test-connection (CRÍTICO)")
        print("3. **Taxa de câmbio**: GET /api/xgate/exchange-rate (verificar se API responde)")
        print("4. **Criar cliente XGate**: POST /api/xgate/create-customer (registrar usuário)")
        print("5. **Depósito PIX teste**: POST /api/xgate/pix-deposit com R$ 10,00 (valor pequeno)")
        print("6. **Listar transações**: GET /api/xgate/transactions (verificar registro no banco)")
        print("\nOBJETIVO: Confirmar se as correções resolveram o erro HTTP 403 'Missing Authentication Token'")
        print("=" * 80)
        
        # Test 1: Login with demo account
        print("\n--- TESTE 1: LOGIN COM CONTA DEMO ---")
        
        login_data = {
            "email": "cliente@demo.com",
            "password": "demo123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response.status_code != 200:
            self.log_test("Demo Login for XGate", False, f"❌ Login falhou - Status: {response.status_code}")
            return
        
        login_result = response.json()
        self.demo_token = login_result["access_token"]
        demo_user = login_result["user"]
        
        self.log_test("Demo Login for XGate", True, 
                     f"✅ Login cliente@demo.com/demo123 funcionando - {demo_user.get('full_name', 'N/A')}")
        
        # Test 2: Test XGate connection (CRÍTICO)
        print("\n--- TESTE 2: TESTAR CONEXÃO COM API XGATE (CRÍTICO) ---")
        
        connection_response = self.make_request("GET", "/xgate/test-connection", token=self.demo_token)
        
        if connection_response.status_code == 200:
            connection_data = connection_response.json()
            if connection_data.get("success"):
                self.log_test("XGate Connection Test", True, 
                             f"✅ Conexão XGate funcionando - {connection_data.get('data', {}).get('message', 'OK')}")
            else:
                self.log_test("XGate Connection Test", False, 
                             f"❌ Conexão XGate falhou - {connection_data.get('error', 'Erro desconhecido')}")
        else:
            error_text = connection_response.text if connection_response.text else "Sem detalhes"
            self.log_test("XGate Connection Test", False, 
                         f"❌ Erro na requisição - Status: {connection_response.status_code}, Erro: {error_text}")
        
        # Test 3: Get exchange rate
        print("\n--- TESTE 3: TAXA DE CÂMBIO ---")
        
        exchange_response = self.make_request("GET", "/xgate/exchange-rate", token=self.demo_token)
        
        if exchange_response.status_code == 200:
            exchange_data = exchange_response.json()
            if exchange_data.get("success"):
                rate_data = exchange_data.get("data", {})
                self.log_test("XGate Exchange Rate", True, 
                             f"✅ Taxa de câmbio obtida - BRL/USDT: {rate_data.get('rate', 'N/A')}")
            else:
                self.log_test("XGate Exchange Rate", False, 
                             f"❌ Falha na taxa de câmbio - {exchange_data.get('error', 'Erro desconhecido')}")
        else:
            error_text = exchange_response.text if exchange_response.text else "Sem detalhes"
            self.log_test("XGate Exchange Rate", False, 
                         f"❌ Erro na requisição - Status: {exchange_response.status_code}, Erro: {error_text}")
        
        # Test 4: Create XGate customer
        print("\n--- TESTE 4: CRIAR CLIENTE XGATE ---")
        
        customer_response = self.make_request("POST", "/xgate/create-customer", token=self.demo_token)
        
        if customer_response.status_code == 200:
            customer_data = customer_response.json()
            if customer_data.get("success"):
                self.log_test("XGate Create Customer", True, 
                             f"✅ Cliente XGate criado - ID: {customer_data.get('data', {}).get('customer_id', 'N/A')}")
            else:
                self.log_test("XGate Create Customer", False, 
                             f"❌ Falha na criação do cliente - {customer_data.get('error', 'Erro desconhecido')}")
        else:
            error_text = customer_response.text if customer_response.text else "Sem detalhes"
            self.log_test("XGate Create Customer", False, 
                         f"❌ Erro na requisição - Status: {customer_response.status_code}, Erro: {error_text}")
        
        # Test 5: PIX deposit test with small amount
        print("\n--- TESTE 5: DEPÓSITO PIX TESTE (R$ 10,00) ---")
        
        deposit_data = {
            "amount": 10.00,
            "description": "Teste de depósito PIX via XGate"
        }
        
        deposit_response = self.make_request("POST", "/xgate/pix-deposit", deposit_data, token=self.demo_token)
        
        if deposit_response.status_code == 200:
            deposit_result = deposit_response.json()
            if deposit_result.get("success"):
                self.log_test("XGate PIX Deposit", True, 
                             f"✅ Depósito PIX criado - R$ 10,00, ID: {deposit_result.get('data', {}).get('deposit_id', 'N/A')}")
            else:
                self.log_test("XGate PIX Deposit", False, 
                             f"❌ Falha no depósito PIX - {deposit_result.get('error', 'Erro desconhecido')}")
        else:
            error_text = deposit_response.text if deposit_response.text else "Sem detalhes"
            self.log_test("XGate PIX Deposit", False, 
                         f"❌ Erro na requisição - Status: {deposit_response.status_code}, Erro: {error_text}")
        
        # Test 6: List XGate transactions
        print("\n--- TESTE 6: LISTAR TRANSAÇÕES XGATE ---")
        
        transactions_response = self.make_request("GET", "/xgate/transactions", token=self.demo_token)
        
        if transactions_response.status_code == 200:
            transactions_data = transactions_response.json()
            if transactions_data.get("success"):
                transactions_list = transactions_data.get("data", [])
                self.log_test("XGate Transactions List", True, 
                             f"✅ Transações XGate listadas - {len(transactions_list)} transações encontradas")
            else:
                self.log_test("XGate Transactions List", False, 
                             f"❌ Falha na listagem - {transactions_data.get('error', 'Erro desconhecido')}")
        else:
            error_text = transactions_response.text if transactions_response.text else "Sem detalhes"
            self.log_test("XGate Transactions List", False, 
                         f"❌ Erro na requisição - Status: {transactions_response.status_code}, Erro: {error_text}")
        
        # Final summary
        print(f"\n🎯 RESUMO FINAL DO TESTE XGATE:")
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Testes aprovados: {passed_tests}")
        print(f"   • Testes falharam: {failed_tests}")
        print(f"   • Taxa de sucesso: {success_rate:.1f}%")
        
        if passed_tests == total_tests:
            print("   ✅ RESULTADO: INTEGRAÇÃO XGATE FUNCIONANDO 100% PERFEITAMENTE")
            print("   ✅ PROBLEMA HTTP 403 'Missing Authentication Token' RESOLVIDO")
        elif passed_tests > 0:
            print(f"   ⚠️ RESULTADO: INTEGRAÇÃO XGATE PARCIALMENTE FUNCIONAL ({passed_tests}/{total_tests})")
            print("   ⚠️ ALGUMAS FUNCIONALIDADES XGATE PRECISAM DE CORREÇÃO")
        else:
            print("   ❌ RESULTADO: INTEGRAÇÃO XGATE NÃO ESTÁ FUNCIONANDO")
            print("   ❌ PROBLEMA HTTP 403 'Missing Authentication Token' PERSISTE")
        
        return passed_tests, total_tests

def main():
    """Run XGate integration tests"""
    print("🚀 INICIANDO TESTE CRÍTICO DA INTEGRAÇÃO XGATE")
    print("=" * 80)
    
    tester = XGateTester()
    passed, total = tester.test_xgate_integration_critical()
    
    print("\n" + "=" * 80)
    print("🎯 TESTE XGATE CONCLUÍDO!")
    print(f"Resultado: {passed}/{total} testes aprovados ({(passed/total*100):.1f}% sucesso)")
    print("=" * 80)

if __name__ == "__main__":
    main()