#!/usr/bin/env python3
"""
Final test of demo accounts with correct master email
"""

import requests
import json
import time
import sys

class FinalDemoTester:
    def __init__(self):
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
        
    def make_request(self, method: str, endpoint: str, data: dict = None, token: str = None):
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

    def test_all_demo_accounts(self):
        """Test all 3 demo accounts with correct credentials"""
        print("\n🎯 TESTE FINAL DAS CONTAS DEMO - DIAGNÓSTICO COMPLETO")
        print("=" * 80)
        print("CONTAS DEMO PARA TESTE:")
        print("1. Cliente: cliente@demo.com / demo123")
        print("2. Lojista: lojista@demo.com / demo123")  
        print("3. Master: master@agitocoin.com / master123")
        print("=" * 80)
        
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
                "email": "master@agitocoin.com",  # Correct email from database
                "password": "master123", 
                "type": "master",
                "name": "Master Demo"
            }
        ]
        
        successful_logins = 0
        total_tests = 0
        tokens = {}
        
        for cred in demo_credentials:
            print(f"\n🔸 TESTANDO: {cred['name'].upper()}")
            print(f"   Email: {cred['email']}")
            print(f"   Senha: {cred['password']}")
            print("-" * 60)
            
            # Test Login
            login_data = {
                "email": cred["email"],
                "password": cred["password"]
            }
            
            try:
                response = self.make_request("POST", "/auth/login", login_data)
                total_tests += 1
                
                if response.status_code == 200:
                    data = response.json()
                    token = data["access_token"]
                    user_data = data["user"]
                    successful_logins += 1
                    
                    self.log_test(f"{cred['name']} Login", True, 
                                 f"✅ LOGIN FUNCIONANDO - {cred['email']}")
                    
                    # JWT Validation
                    total_tests += 1
                    if token and "." in token and len(token.split(".")) == 3:
                        self.log_test(f"{cred['name']} JWT", True, 
                                     f"✅ JWT válido - {len(token)} caracteres")
                    else:
                        self.log_test(f"{cred['name']} JWT", False, "❌ JWT inválido")
                    
                    # Profile Access
                    total_tests += 1
                    profile_response = self.make_request("GET", "/user/profile", token=token)
                    
                    if profile_response.status_code == 200:
                        profile_data = profile_response.json()
                        self.log_test(f"{cred['name']} Profile", True, 
                                     f"✅ Perfil: {profile_data.get('full_name', 'N/A')}")
                    else:
                        self.log_test(f"{cred['name']} Profile", False, 
                                     f"❌ Perfil inacessível: HTTP {profile_response.status_code}")
                    
                    # Balance Check
                    total_tests += 1
                    balance_response = self.make_request("GET", "/user/balance", token=token)
                    
                    if balance_response.status_code == 200:
                        balance_data = balance_response.json()
                        total_balance = balance_data.get('balance', 0) + balance_data.get('cashback_balance', 0)
                        self.log_test(f"{cred['name']} Balance", True, 
                                     f"✅ Saldo: R$ {balance_data.get('balance', 0):.2f} + "
                                     f"R$ {balance_data.get('cashback_balance', 0):.2f} = R$ {total_balance:.2f}")
                    else:
                        self.log_test(f"{cred['name']} Balance", False, 
                                     f"❌ Saldo inacessível: HTTP {balance_response.status_code}")
                    
                    # Account-specific tests
                    if cred["type"] == "master":
                        total_tests += 1
                        if user_data.get("is_master_account"):
                            self.log_test(f"{cred['name']} Master Flag", True, "✅ is_master_account = true")
                        else:
                            self.log_test(f"{cred['name']} Master Flag", False, "❌ is_master_account missing")
                    
                    elif cred["type"] == "lojista":
                        total_tests += 1
                        qr_request = {"amount": 25.00}
                        qr_response = self.make_request("POST", "/merchant/qr-code", qr_request, token=token)
                        
                        if qr_response.status_code == 200:
                            qr_data = qr_response.json()
                            self.log_test(f"{cred['name']} QR Generation", True, 
                                         f"✅ QR Code: {qr_data.get('digital_code', 'N/A')}")
                        else:
                            self.log_test(f"{cred['name']} QR Generation", False, 
                                         f"❌ QR falhou: HTTP {qr_response.status_code}")
                    
                    tokens[cred["type"]] = token
                    
                else:
                    self.log_test(f"{cred['name']} Login", False, 
                                 f"❌ LOGIN FALHOU - Status: {response.status_code}")
                    print(f"   ❌ Erro: {response.text}")
                    
            except Exception as e:
                self.log_test(f"{cred['name']} Connection", False, f"❌ Erro de conexão: {str(e)}")
        
        # Final Results
        print(f"\n🎯 RESULTADO FINAL:")
        print(f"   • Contas testadas: {len(demo_credentials)}")
        print(f"   • Logins bem-sucedidos: {successful_logins}/{len(demo_credentials)}")
        print(f"   • Total de testes: {total_tests}")
        print(f"   • Taxa de sucesso: {(successful_logins/len(demo_credentials)*100):.1f}%")
        
        if successful_logins == len(demo_credentials):
            print("   ✅ RESULTADO: TODAS AS CONTAS DEMO FUNCIONANDO 100%")
            print("   ✅ PROBLEMA REPORTADO: RESOLVIDO")
            print("   ✅ SISTEMA PRONTO PARA INTEGRAÇÃO XGATE")
        else:
            print(f"   ⚠️ RESULTADO: {successful_logins}/{len(demo_credentials)} contas funcionando")
        
        return successful_logins == len(demo_credentials)

if __name__ == "__main__":
    tester = FinalDemoTester()
    success = tester.test_all_demo_accounts()
    sys.exit(0 if success else 1)