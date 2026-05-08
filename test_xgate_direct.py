#!/usr/bin/env python3
"""
XGate Integration Testing Script - Direct execution
"""

import requests
import json
import time
import uuid
from typing import Dict, Any, Optional

class XGateTester:
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

    def test_xgate_integration(self):
        """Test XGate integration routes"""
        print("🚨 TESTE URGENTE: INTEGRAÇÃO XGATE AGITOCASH")
        print("=" * 80)
        print("CONTEXTO: Integração do serviço XGate ao sistema AgitoCash")
        print("CREDENCIAIS CONFIGURADAS:")
        print("- Email: marcelober***@transmill.com.br")
        print("- Senha: !Ma0420***1@")
        print("- URL: https://api.xgateglobal.com/v1")
        print("\nROTAS A TESTAR:")
        print("1. GET /api/xgate/test-connection - Testar conexão com API XGate")
        print("2. POST /api/xgate/create-customer - Criar cliente no XGate")
        print("3. POST /api/xgate/pix-deposit - Criar depósito PIX via XGate")
        print("4. POST /api/xgate/convert-brl-usdt - Converter BRL para USDT")
        print("5. GET /api/xgate/exchange-rate - Consultar taxa de câmbio")
        print("6. GET /api/xgate/deposit-status/{deposit_id} - Status de depósito")
        print("7. GET /api/xgate/transactions - Listar transações XGate")
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
            return False
        
        login_result = response.json()
        demo_token = login_result["access_token"]
        demo_user = login_result["user"]
        
        self.log_test("Demo Login for XGate", True, 
                     f"✅ Login cliente@demo.com/demo123 funcionando - {demo_user.get('full_name', 'N/A')}")
        
        # Test 2: Test XGate connection
        print("\n--- TESTE 2: TESTAR CONEXÃO COM API XGATE ---")
        
        connection_response = self.make_request("GET", "/xgate/test-connection", token=demo_token)
        
        if connection_response.status_code == 200:
            connection_data = connection_response.json()
            if connection_data.get("success"):
                self.log_test("XGate Connection Test", True, 
                             f"✅ Conexão XGate funcionando - {connection_data.get('data', {}).get('message', 'OK')}")
            else:
                self.log_test("XGate Connection Test", False, 
                             f"❌ Conexão XGate falhou - {connection_data.get('error', 'Erro desconhecido')}")
        else:
            self.log_test("XGate Connection Test", False, 
                         f"❌ Erro na requisição - Status: {connection_response.status_code}")
        
        # Test 3: Create XGate customer
        print("\n--- TESTE 3: CRIAR CLIENTE NO XGATE ---")
        
        customer_response = self.make_request("POST", "/xgate/create-customer", token=demo_token)
        
        if customer_response.status_code == 200:
            customer_data = customer_response.json()
            if customer_data.get("success"):
                customer_id = customer_data.get("data", {}).get("customer_id")
                self.log_test("XGate Create Customer", True, 
                             f"✅ Cliente XGate criado - ID: {customer_id}")
                self.xgate_customer_id = customer_id  # Store for later tests
            else:
                self.log_test("XGate Create Customer", False, 
                             f"❌ Criação de cliente falhou - {customer_data.get('error', 'Erro desconhecido')}")
        else:
            self.log_test("XGate Create Customer", False, 
                         f"❌ Erro na requisição - Status: {customer_response.status_code}")
        
        # Test 4: Get exchange rate
        print("\n--- TESTE 4: CONSULTAR TAXA DE CÂMBIO BRL/USDT ---")
        
        rate_response = self.make_request("GET", "/xgate/exchange-rate", token=demo_token)
        
        if rate_response.status_code == 200:
            rate_data = rate_response.json()
            if rate_data.get("success"):
                exchange_data = rate_data.get("data", {})
                rate = exchange_data.get("rate", "N/A")
                self.log_test("XGate Exchange Rate", True, 
                             f"✅ Taxa de câmbio obtida - BRL/USDT: {rate}")
            else:
                self.log_test("XGate Exchange Rate", False, 
                             f"❌ Consulta de taxa falhou - {rate_data.get('error', 'Erro desconhecido')}")
        else:
            self.log_test("XGate Exchange Rate", False, 
                         f"❌ Erro na requisição - Status: {rate_response.status_code}")
        
        # Test 5: Create PIX deposit (small amount)
        print("\n--- TESTE 5: CRIAR DEPÓSITO PIX VIA XGATE (R$ 10,00) ---")
        
        deposit_data = {
            "amount": 10.00,
            "description": "Teste de depósito PIX via XGate"
        }
        
        deposit_response = self.make_request("POST", "/xgate/pix-deposit", deposit_data, token=demo_token)
        
        if deposit_response.status_code == 200:
            deposit_result = deposit_response.json()
            if deposit_result.get("success"):
                deposit_id = deposit_result.get("data", {}).get("deposit_id")
                self.log_test("XGate PIX Deposit", True, 
                             f"✅ Depósito PIX criado - ID: {deposit_id}, Valor: R$ {deposit_data['amount']:.2f}")
                self.xgate_deposit_id = deposit_id  # Store for status check
            else:
                self.log_test("XGate PIX Deposit", False, 
                             f"❌ Depósito PIX falhou - {deposit_result.get('error', 'Erro desconhecido')}")
        else:
            self.log_test("XGate PIX Deposit", False, 
                         f"❌ Erro na requisição - Status: {deposit_response.status_code}")
        
        # Test 6: Check deposit status (if deposit was created)
        if hasattr(self, 'xgate_deposit_id') and self.xgate_deposit_id:
            print("\n--- TESTE 6: VERIFICAR STATUS DO DEPÓSITO ---")
            
            status_response = self.make_request("GET", f"/xgate/deposit-status/{self.xgate_deposit_id}", token=demo_token)
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                if status_data.get("success"):
                    deposit_status = status_data.get("data", {}).get("status", "unknown")
                    self.log_test("XGate Deposit Status", True, 
                                 f"✅ Status do depósito consultado - Status: {deposit_status}")
                else:
                    self.log_test("XGate Deposit Status", False, 
                                 f"❌ Consulta de status falhou - {status_data.get('error', 'Erro desconhecido')}")
            else:
                self.log_test("XGate Deposit Status", False, 
                             f"❌ Erro na requisição - Status: {status_response.status_code}")
        
        # Test 7: List XGate transactions
        print("\n--- TESTE 7: LISTAR TRANSAÇÕES XGATE ---")
        
        transactions_response = self.make_request("GET", "/xgate/transactions", token=demo_token)
        
        if transactions_response.status_code == 200:
            transactions_data = transactions_response.json()
            if transactions_data.get("success"):
                deposits = transactions_data.get("data", {}).get("deposits", [])
                conversions = transactions_data.get("data", {}).get("conversions", [])
                total_transactions = len(deposits) + len(conversions)
                self.log_test("XGate Transactions List", True, 
                             f"✅ Transações XGate listadas - {len(deposits)} depósitos, {len(conversions)} conversões")
            else:
                self.log_test("XGate Transactions List", False, 
                             f"❌ Listagem de transações falhou - {transactions_data.get('error', 'Erro desconhecido')}")
        else:
            self.log_test("XGate Transactions List", False, 
                         f"❌ Erro na requisição - Status: {transactions_response.status_code}")
        
        # Test 8: Convert BRL to USDT (optional, only if customer exists)
        if hasattr(self, 'xgate_customer_id') and self.xgate_customer_id:
            print("\n--- TESTE 8: CONVERTER BRL PARA USDT ---")
            
            conversion_data = {
                "brl_amount": 50.00
            }
            
            conversion_response = self.make_request("POST", "/xgate/convert-brl-usdt", conversion_data, token=demo_token)
            
            if conversion_response.status_code == 200:
                conversion_result = conversion_response.json()
                if conversion_result.get("success"):
                    usdt_amount = conversion_result.get("data", {}).get("usdt_amount", 0)
                    exchange_rate = conversion_result.get("data", {}).get("exchange_rate", 0)
                    self.log_test("XGate BRL to USDT Conversion", True, 
                                 f"✅ Conversão realizada - R$ {conversion_data['brl_amount']:.2f} → {usdt_amount} USDT (Taxa: {exchange_rate})")
                else:
                    self.log_test("XGate BRL to USDT Conversion", False, 
                                 f"❌ Conversão falhou - {conversion_result.get('error', 'Erro desconhecido')}")
            else:
                self.log_test("XGate BRL to USDT Conversion", False, 
                             f"❌ Erro na requisição - Status: {conversion_response.status_code}")
        
        # Final Summary
        print(f"\n🎯 RESUMO FINAL DO TESTE XGATE:")
        
        # Count successful tests
        xgate_tests = [test for test in self.test_results if "XGate" in test["test"]]
        successful_xgate_tests = [test for test in xgate_tests if test["success"]]
        
        print(f"   • Testes XGate executados: {len(xgate_tests)}")
        print(f"   • Testes bem-sucedidos: {len(successful_xgate_tests)}")
        print(f"   • Taxa de sucesso: {(len(successful_xgate_tests)/len(xgate_tests)*100):.1f}%" if xgate_tests else "0%")
        
        if len(successful_xgate_tests) == len(xgate_tests):
            print("   ✅ RESULTADO: INTEGRAÇÃO XGATE FUNCIONANDO 100%")
            print("   ✅ FUNCIONALIDADES TESTADAS:")
            print("     - Conexão com API XGate")
            print("     - Criação de cliente XGate")
            print("     - Consulta de taxa de câmbio BRL/USDT")
            print("     - Criação de depósito PIX")
            print("     - Consulta de status de depósito")
            print("     - Listagem de transações XGate")
            print("     - Conversão BRL para USDT")
            return True
        elif len(successful_xgate_tests) > 0:
            print(f"   ⚠️ RESULTADO: INTEGRAÇÃO XGATE PARCIALMENTE FUNCIONAL ({len(successful_xgate_tests)}/{len(xgate_tests)})")
            failed_tests = [test["test"] for test in xgate_tests if not test["success"]]
            print(f"   ⚠️ TESTES FALHARAM: {', '.join(failed_tests)}")
            return False
        else:
            print("   ❌ RESULTADO: INTEGRAÇÃO XGATE NÃO ESTÁ FUNCIONANDO")
            print("   ❌ POSSÍVEIS CAUSAS:")
            print("     - Credenciais XGate inválidas")
            print("     - API XGate indisponível")
            print("     - Problemas de conectividade")
            print("     - Configuração incorreta")
            return False

def main():
    tester = XGateTester()
    success = tester.test_xgate_integration()
    
    # Print detailed summary
    print("\n" + "=" * 80)
    print("🎯 RESUMO DETALHADO DOS TESTES")
    print("=" * 80)
    
    total_tests = len(tester.test_results)
    successful_tests = len([test for test in tester.test_results if test["success"]])
    failed_tests = total_tests - successful_tests
    
    print(f"Total de testes executados: {total_tests}")
    print(f"Testes aprovados: {successful_tests}")
    print(f"Testes falharam: {failed_tests}")
    print(f"Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
    
    if failed_tests > 0:
        print("\n❌ PROBLEMAS IDENTIFICADOS:")
        for test in tester.test_results:
            if not test["success"]:
                print(f"  • {test['test']}: {test['details']}")
    
    if success:
        print("\n✅ INTEGRAÇÃO XGATE: TODOS OS TESTES PASSARAM")
        return 0
    else:
        print("\n❌ INTEGRAÇÃO XGATE: ALGUNS TESTES FALHARAM")
        return 1

if __name__ == "__main__":
    exit(main())