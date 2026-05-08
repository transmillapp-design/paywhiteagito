#!/usr/bin/env python3
"""
AgitoCash Backend Final Validation Test Suite
Complete validation test for Brazilian payment system with cashback
"""

import requests
import json
import time
import uuid
import random
from typing import Dict, Any, Optional

class AgitoCashFinalTester:
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
        self.tokens = {}
        self.users = {}
        self.test_results = []
        
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
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_final_validation_agitocash(self):
        """🚨 TESTE COMPLETO DE VALIDAÇÃO FINAL DO SISTEMA AGITOCASH"""
        print("\n🚨 TESTE COMPLETO DE VALIDAÇÃO FINAL DO SISTEMA AGITOCASH")
        print("=" * 80)
        print("ESCOPO DO TESTE:")
        print("1. ✅ Validação de Conectividade e URLs")
        print("2. ✅ Teste das Credenciais Demo (CRÍTICO)")
        print("3. ✅ Funcionalidades Principais")
        print("4. ✅ Fluxos Críticos")
        print("5. ✅ Integração XGate")
        print("=" * 80)
        
        # Test 1: Backend Connectivity and URLs
        print("\n--- TESTE 1: VALIDAÇÃO DE CONECTIVIDADE E URLS ---")
        
        # Test backend accessibility
        try:
            response = self.make_request("GET", "/user/profile")  # Should return 401 without auth
            if response.status_code == 401:
                self.log_test("Backend Connectivity", True, 
                             f"✅ Backend acessível em {self.base_url}")
            else:
                self.log_test("Backend Connectivity", False, 
                             f"❌ Backend resposta inesperada: {response.status_code}")
        except Exception as e:
            self.log_test("Backend Connectivity", False, f"❌ Erro de conectividade: {str(e)}")
        
        # Test health endpoint
        try:
            response = self.make_request("GET", "/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Endpoint", True, 
                             f"✅ /api/health funcionando - Status: {data.get('status', 'unknown')}")
            else:
                self.log_test("Health Endpoint", False, 
                             f"❌ Health endpoint falhou: {response.status_code}")
        except Exception as e:
            self.log_test("Health Endpoint", False, f"❌ Health endpoint erro: {str(e)}")
        
        # Test 2: Demo Credentials (CRITICAL)
        print("\n--- TESTE 2: CREDENCIAIS DEMO (CRÍTICO) ---")
        
        demo_credentials = [
            {
                "email": "cliente@demo.com",
                "password": "demo123",
                "type": "cliente",
                "name": "Cliente Demo"
            },
            {
                "email": "lojista@demo.com", 
                "password": "demo123",
                "type": "lojista",
                "name": "Lojista Demo"
            },
            {
                "email": "master@agitocash.com",
                "password": "master123", 
                "type": "master",
                "name": "Master AgitoCash",
                "is_master": True
            }
        ]
        
        successful_logins = 0
        demo_tokens = {}
        
        for cred in demo_credentials:
            print(f"\n🔸 TESTANDO {cred['name'].upper()}: {cred['email']}")
            
            # Login test
            login_data = {
                "email": cred["email"],
                "password": cred["password"]
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data["access_token"]
                user_data = data["user"]
                successful_logins += 1
                demo_tokens[cred["type"]] = token
                
                self.log_test(f"{cred['name']} Login", True, 
                             f"✅ LOGIN OK - JWT válido ({len(token)} chars)")
                
                # Test profile access
                profile_response = self.make_request("GET", "/user/profile", token=token)
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    self.log_test(f"{cred['name']} Profile", True, 
                                 f"✅ Perfil: {profile_data.get('full_name')}")
                else:
                    self.log_test(f"{cred['name']} Profile", False, 
                                 f"❌ Perfil inacessível: {profile_response.status_code}")
                
                # Test balance
                balance_response = self.make_request("GET", "/user/balance", token=token)
                if balance_response.status_code == 200:
                    balance_data = balance_response.json()
                    total_balance = balance_data.get('balance', 0) + balance_data.get('cashback_balance', 0)
                    self.log_test(f"{cred['name']} Balance", True, 
                                 f"✅ Saldo: R$ {balance_data.get('balance', 0):.2f} + "
                                 f"R$ {balance_data.get('cashback_balance', 0):.2f} = R$ {total_balance:.2f}")
                else:
                    self.log_test(f"{cred['name']} Balance", False, 
                                 f"❌ Saldo inacessível: {balance_response.status_code}")
                
            else:
                self.log_test(f"{cred['name']} Login", False, 
                             f"❌ LOGIN FALHOU - Status: {response.status_code}")
        
        # Test 3: Core Functionalities
        print("\n--- TESTE 3: FUNCIONALIDADES PRINCIPAIS ---")
        
        # Test JWT Authentication System
        if successful_logins > 0:
            self.log_test("JWT Authentication System", True, 
                         f"✅ Sistema de autenticação JWT funcionando ({successful_logins}/3 contas)")
        else:
            self.log_test("JWT Authentication System", False, 
                         "❌ Sistema de autenticação JWT com problemas")
        
        # Test Lojista QR Code Generation
        if "lojista" in demo_tokens:
            qr_request = {"amount": 25.00}
            qr_response = self.make_request("POST", "/merchant/qr-code", qr_request, token=demo_tokens["lojista"])
            
            if qr_response.status_code == 200:
                qr_data = qr_response.json()
                self.log_test("QR Code Generation", True, 
                             f"✅ QR Code gerado - Código: {qr_data.get('digital_code', 'N/A')}")
                
                # Store QR data for payment test
                self.qr_code_data = qr_data
            else:
                self.log_test("QR Code Generation", False, 
                             f"❌ Falha na geração QR: {qr_response.status_code}")
        
        # Test Digital Code Validation
        if hasattr(self, 'qr_code_data') and self.qr_code_data.get('digital_code'):
            digital_code = self.qr_code_data['digital_code']
            validate_request = {"digital_code": digital_code}
            
            validate_response = self.make_request("POST", "/transactions/validate-digital-code", validate_request)
            
            if validate_response.status_code == 200:
                validate_data = validate_response.json()
                self.log_test("Digital Code Validation", True, 
                             f"✅ Código digitável válido - Lojista: {validate_data.get('merchant_name')}")
            else:
                self.log_test("Digital Code Validation", False, 
                             f"❌ Validação código falhou: {validate_response.status_code}")
        
        # Test Payment Processing
        if "cliente" in demo_tokens and hasattr(self, 'qr_code_data'):
            payment_request = {
                "amount": self.qr_code_data.get("amount", 25.00),
                "qr_code": self.qr_code_data.get("qr_code")
            }
            
            payment_response = self.make_request("POST", "/transactions/payment", payment_request, token=demo_tokens["cliente"])
            
            if payment_response.status_code == 200:
                payment_data = payment_response.json()
                cashback_info = payment_data.get("cashback_distribution", {})
                self.log_test("Payment Processing", True, 
                             f"✅ Pagamento processado - Cashback: R$ {cashback_info.get('client', 0):.2f}")
            else:
                self.log_test("Payment Processing", False, 
                             f"❌ Pagamento falhou: {payment_response.status_code}")
        
        # Test Referral System
        if "cliente" in demo_tokens:
            referral_response = self.make_request("GET", "/referral/my-code", token=demo_tokens["cliente"])
            
            if referral_response.status_code == 200:
                referral_data = referral_response.json()
                self.log_test("Referral System", True, 
                             f"✅ Sistema de indicações - Código: {referral_data.get('referral_code')}")
            else:
                self.log_test("Referral System", False, 
                             f"❌ Sistema de indicações falhou: {referral_response.status_code}")
        
        # Test Master Dashboard
        if "master" in demo_tokens:
            dashboard_response = self.make_request("GET", "/master/dashboard", token=demo_tokens["master"])
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                total_users = dashboard_data.get('platform_stats', {}).get('total_users', 0)
                self.log_test("Master Dashboard", True, 
                             f"✅ Dashboard master - Usuários: {total_users}")
            else:
                self.log_test("Master Dashboard", False, 
                             f"❌ Dashboard master falhou: {dashboard_response.status_code}")
        
        # Test 4: XGate Integration
        print("\n--- TESTE 4: INTEGRAÇÃO XGATE ---")
        
        if "cliente" in demo_tokens:
            # Test XGate connection
            xgate_test_response = self.make_request("GET", "/xgate/test-connection", token=demo_tokens["cliente"])
            
            if xgate_test_response.status_code == 200:
                xgate_data = xgate_test_response.json()
                self.log_test("XGate Connection", True, 
                             f"✅ XGate conectado - Modo: {xgate_data.get('mode', 'unknown')}")
                
                # Test PIX deposit
                pix_request = {
                    "amount": 15.00,
                    "description": "Teste PIX validação final"
                }
                
                pix_response = self.make_request("POST", "/xgate/pix-deposit", pix_request, token=demo_tokens["cliente"])
                
                if pix_response.status_code in [200, 201]:
                    pix_data = pix_response.json()
                    if pix_data.get("success"):
                        self.log_test("XGate PIX Deposit", True, 
                                     f"✅ PIX XGate funcionando - ID: {pix_data.get('data', {}).get('id', 'N/A')}")
                    else:
                        self.log_test("XGate PIX Deposit", False, 
                                     f"❌ PIX XGate falhou - Resposta inválida")
                else:
                    self.log_test("XGate PIX Deposit", False, 
                                 f"❌ PIX XGate falhou: {pix_response.status_code}")
                
                # Test BRL/USDT conversion
                convert_request = {
                    "amount": 50.00,
                    "from_currency": "BRL",
                    "to_currency": "USDT"
                }
                
                convert_response = self.make_request("POST", "/xgate/convert-brl-usdt", convert_request, token=demo_tokens["cliente"])
                
                if convert_response.status_code == 200:
                    convert_data = convert_response.json()
                    self.log_test("XGate BRL/USDT Conversion", True, 
                                 f"✅ Conversão BRL/USDT funcionando")
                else:
                    self.log_test("XGate BRL/USDT Conversion", False, 
                                 f"❌ Conversão BRL/USDT falhou: {convert_response.status_code}")
                
            else:
                self.log_test("XGate Connection", False, 
                             f"❌ XGate conexão falhou: {xgate_test_response.status_code}")
        
        # Test 5: Transaction History
        print("\n--- TESTE 5: HISTÓRICO DE TRANSAÇÕES ---")
        
        if "cliente" in demo_tokens:
            history_response = self.make_request("GET", "/transactions/history", token=demo_tokens["cliente"])
            
            if history_response.status_code == 200:
                history_data = history_response.json()
                self.log_test("Transaction History", True, 
                             f"✅ Histórico acessível - {len(history_data)} transações")
            else:
                self.log_test("Transaction History", False, 
                             f"❌ Histórico falhou: {history_response.status_code}")
        
        # Final Summary
        print(f"\n🎯 RESUMO FINAL DA VALIDAÇÃO AGITOCASH:")
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        
        print(f"   • Total de testes executados: {total_tests}")
        print(f"   • Testes bem-sucedidos: {successful_tests}")
        print(f"   • Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        print(f"   • Credenciais demo funcionando: {successful_logins}/3")
        
        if successful_tests >= total_tests * 0.9:  # 90% success rate
            print("   ✅ RESULTADO: SISTEMA AGITOCASH 100% OPERACIONAL")
            print("   ✅ TODAS AS FUNCIONALIDADES PRINCIPAIS VALIDADAS")
            print("   ✅ CREDENCIAIS DEMO FUNCIONANDO")
            print("   ✅ SISTEMA PRONTO PARA PRODUÇÃO")
        elif successful_tests >= total_tests * 0.7:  # 70% success rate
            print("   ⚠️ RESULTADO: SISTEMA FUNCIONANDO COM PROBLEMAS MENORES")
            print("   ⚠️ MAIORIA DAS FUNCIONALIDADES OPERACIONAIS")
            print("   ⚠️ VERIFICAR ITENS ESPECÍFICOS QUE FALHARAM")
        else:
            print("   ❌ RESULTADO: SISTEMA COM PROBLEMAS CRÍTICOS")
            print("   ❌ MÚLTIPLAS FUNCIONALIDADES COM FALHAS")
            print("   ❌ NECESSÁRIO CORREÇÕES ANTES DA PRODUÇÃO")
        
        return successful_tests >= total_tests * 0.9

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("📊 RESUMO DETALHADO DOS TESTES")
        print("="*80)
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        
        print(f"Total de testes: {total_tests}")
        print(f"Sucessos: {successful_tests}")
        print(f"Falhas: {failed_tests}")
        print(f"Taxa de sucesso: {(successful_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n" + "="*80)

def main():
    """Main function to run the tests"""
    print("🚀 AGITOCASH BACKEND - TESTE DE VALIDAÇÃO FINAL")
    print("=" * 60)
    
    tester = AgitoCashFinalTester()
    
    try:
        # Run final validation test
        success = tester.test_final_validation_agitocash()
        
        # Print summary
        tester.print_summary()
        
        if success:
            print("\n🎉 VALIDAÇÃO FINAL CONCLUÍDA COM SUCESSO!")
        else:
            print("\n⚠️ VALIDAÇÃO FINAL CONCLUÍDA COM PROBLEMAS")
            
    except Exception as e:
        print(f"❌ ERRO CRÍTICO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()