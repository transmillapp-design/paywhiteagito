#!/usr/bin/env python3
"""
Specific test for preview URL demo accounts
"""

import requests
import json
import time

class PreviewTester:
    def __init__(self):
        self.preview_url = "https://slim-super-app.preview.emergentagent.com/api"
        self.session = requests.Session()
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: dict = None, token: str = None):
        url = f"{self.preview_url}{endpoint}"
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

    def test_preview_demo_accounts(self):
        print("🚨 TESTE ESPECÍFICO: CONTAS DEMO NO PREVIEW")
        print("=" * 60)
        print(f"URL: {self.preview_url}")
        print("=" * 60)
        
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
                "name": "Master Demo"
            }
        ]
        
        successful_logins = 0
        tokens = {}
        
        for cred in demo_credentials:
            print(f"\n🔸 Testando {cred['name']}: {cred['email']}")
            
            login_data = {
                "email": cred["email"],
                "password": cred["password"]
            }
            
            try:
                response = self.make_request("POST", "/auth/login", login_data)
                
                if response.status_code == 200:
                    data = response.json()
                    token = data["access_token"]
                    user_data = data["user"]
                    tokens[cred["type"]] = token
                    successful_logins += 1
                    
                    self.log_test(f"Preview {cred['name']} Login", True, 
                                 f"✅ Login funcionando - {user_data.get('full_name')}")
                    
                    # Test profile access
                    profile_response = self.make_request("GET", "/user/profile", token=token)
                    if profile_response.status_code == 200:
                        profile_data = profile_response.json()
                        self.log_test(f"Preview {cred['name']} Profile", True, 
                                     f"✅ Perfil acessível: {profile_data.get('full_name')}")
                    else:
                        self.log_test(f"Preview {cred['name']} Profile", False, 
                                     f"❌ Perfil inacessível: {profile_response.status_code}")
                    
                    # Test balance
                    balance_response = self.make_request("GET", "/user/balance", token=token)
                    if balance_response.status_code == 200:
                        balance_data = balance_response.json()
                        total = balance_data.get('balance', 0) + balance_data.get('cashback_balance', 0)
                        self.log_test(f"Preview {cred['name']} Balance", True, 
                                     f"✅ Saldo: R$ {balance_data.get('balance', 0):.2f} + "
                                     f"R$ {balance_data.get('cashback_balance', 0):.2f} = R$ {total:.2f}")
                    else:
                        self.log_test(f"Preview {cred['name']} Balance", False, 
                                     f"❌ Saldo inacessível: {balance_response.status_code}")
                        
                else:
                    self.log_test(f"Preview {cred['name']} Login", False, 
                                 f"❌ Login falhou - Status: {response.status_code}")
                    print(f"      Error: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Preview {cred['name']} Login", False, 
                             f"❌ Erro de conexão: {str(e)}")
        
        # Test lojista QR code generation if login worked
        if tokens.get("lojista"):
            print(f"\n🔸 Testando funcionalidade específica do lojista...")
            
            qr_request = {"amount": 25.00}
            qr_response = self.make_request("POST", "/merchant/qr-code", qr_request, token=tokens["lojista"])
            
            if qr_response.status_code == 200:
                qr_data = qr_response.json()
                self.log_test("Preview Lojista QR Generation", True, 
                             f"✅ QR Code gerado: {qr_data.get('digital_code', 'N/A')}, "
                             f"Valor: R$ {qr_data.get('amount', 0):.2f}")
            else:
                self.log_test("Preview Lojista QR Generation", False, 
                             f"❌ Falha na geração QR: {qr_response.status_code}")
        
        # Test master dashboard if login worked
        if tokens.get("master"):
            print(f"\n🔸 Testando funcionalidade específica do master...")
            
            dashboard_response = self.make_request("GET", "/master/dashboard", token=tokens["master"])
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                self.log_test("Preview Master Dashboard", True, 
                             f"✅ Dashboard acessível - "
                             f"Usuários: {dashboard_data.get('platform_stats', {}).get('total_users', 0)}")
            else:
                self.log_test("Preview Master Dashboard", False, 
                             f"❌ Dashboard inacessível: {dashboard_response.status_code}")
        
        # Final summary
        print(f"\n🎯 RESUMO FINAL:")
        print(f"   • URL testada: {self.preview_url}")
        print(f"   • Contas testadas: {len(demo_credentials)}")
        print(f"   • Logins bem-sucedidos: {successful_logins}/{len(demo_credentials)}")
        print(f"   • Taxa de sucesso: {(successful_logins/len(demo_credentials)*100):.1f}%")
        
        if successful_logins == len(demo_credentials):
            print("   ✅ RESULTADO: TODAS AS CONTAS DEMO FUNCIONAM NO PREVIEW")
            print("   ✅ PROBLEMA REPORTADO: NÃO CONFIRMADO - Sistema funcionando")
        else:
            print("   ❌ RESULTADO: ALGUMAS CONTAS NÃO FUNCIONAM NO PREVIEW")
            print("   ❌ PROBLEMA CONFIRMADO: Investigar contas específicas")
        
        return successful_logins == len(demo_credentials)

if __name__ == "__main__":
    tester = PreviewTester()
    tester.test_preview_demo_accounts()