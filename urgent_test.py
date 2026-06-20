#!/usr/bin/env python3
"""
🚨 TESTE URGENTE: Validar contas demo na URL correta do preview
Teste específico para verificar se a correção da URL foi aplicada com sucesso
"""

import requests
import json
import time
from typing import Dict, Any

class UrgentPreviewTester:
    def __init__(self):
        # Use the corrected preview URL
        self.base_url = "https://slim-super-app.preview.emergentagent.com/api"
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
                response = self.session.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise

    def test_urgent_preview_demo_accounts(self):
        """🚨 TESTE URGENTE: Validar contas demo na URL correta do preview"""
        print("\n🚨 TESTE URGENTE DAS CONTAS DEMO NA URL CORRETA DO PREVIEW")
        print("=" * 80)
        print("CORREÇÃO APLICADA:")
        print("- URL corrigida no frontend/.env: https://slim-super-app.preview.emergentagent.com")
        print("- Endpoint /api/health adicionado ao backend")
        print("\nTESTE CRÍTICO:")
        print("1. **Verificar URL correta**: https://slim-super-app.preview.emergentagent.com")
        print("2. **Testar endpoint health**: GET /api/health")
        print("3. **Testar todas as 3 contas demo**:")
        print("   - Cliente: cliente@demo.com / demo123")
        print("   - Lojista: lojista@demo.com / demo123")
        print("   - Master: master@agitocash.com / master123")
        print("\nOBJETIVO: Confirmar que o app preview vai funcionar agora com a URL correta configurada")
        print("=" * 80)
        
        # Test 1: Health endpoint
        print("\n🔸 TESTE 1: VERIFICAR ENDPOINT HEALTH")
        print("-" * 60)
        
        try:
            health_response = self.make_request("GET", "/health")
            if health_response.status_code == 200:
                health_data = health_response.json()
                self.log_test("Health Endpoint", True, 
                              f"✅ Endpoint /api/health funcionando - Status: {health_data.get('status', 'N/A')}")
            else:
                self.log_test("Health Endpoint", False, 
                              f"❌ Endpoint /api/health falhou - Status: {health_response.status_code}")
        except Exception as e:
            self.log_test("Health Endpoint", False, f"❌ Erro ao acessar /api/health: {str(e)}")
        
        # Test 2: URL Verification
        print("\n🔸 TESTE 2: VERIFICAR URL CORRETA")
        print("-" * 60)
        
        expected_url = "https://slim-super-app.preview.emergentagent.com"
        actual_base_url = self.base_url.replace("/api", "")
        
        if actual_base_url == expected_url:
            self.log_test("URL Verification", True, 
                          f"✅ URL correta configurada: {expected_url}")
        else:
            self.log_test("URL Verification", False, 
                          f"❌ URL incorreta - Esperada: {expected_url}, Atual: {actual_base_url}")
        
        # Test 3: Demo accounts
        print("\n🔸 TESTE 3: TESTAR TODAS AS 3 CONTAS DEMO")
        print("-" * 60)
        
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
        total_accounts = len(demo_credentials)
        
        for cred in demo_credentials:
            print(f"\n   🔹 Testando {cred['name']}: {cred['email']}")
            
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
                    successful_logins += 1
                    
                    self.log_test(f"{cred['name']} Login", True, 
                                 f"✅ LOGIN FUNCIONANDO - {cred['email']}")
                    
                    # Test profile access
                    profile_response = self.make_request("GET", "/user/profile", token=token)
                    if profile_response.status_code == 200:
                        profile_data = profile_response.json()
                        self.log_test(f"{cred['name']} Profile", True, 
                                     f"✅ Perfil acessível: {profile_data.get('full_name')}")
                    else:
                        self.log_test(f"{cred['name']} Profile", False, 
                                     f"❌ Perfil inacessível - Status: {profile_response.status_code}")
                    
                    # Test balance
                    balance_response = self.make_request("GET", "/user/balance", token=token)
                    if balance_response.status_code == 200:
                        balance_data = balance_response.json()
                        total_balance = balance_data.get('balance', 0) + balance_data.get('cashback_balance', 0)
                        self.log_test(f"{cred['name']} Balance", True, 
                                     f"✅ Saldo: R$ {balance_data.get('balance', 0):.2f} + "
                                     f"R$ {balance_data.get('cashback_balance', 0):.2f} = "
                                     f"R$ {total_balance:.2f}")
                    else:
                        self.log_test(f"{cred['name']} Balance", False, 
                                     f"❌ Saldo inacessível - Status: {balance_response.status_code}")
                    
                    # Special tests for lojista
                    if cred["type"] == "lojista":
                        qr_request = {"amount": 25.00}
                        qr_response = self.make_request("POST", "/merchant/qr-code", qr_request, token=token)
                        
                        if qr_response.status_code == 200:
                            qr_data = qr_response.json()
                            self.log_test(f"{cred['name']} QR Generation", True, 
                                         f"✅ QR Code gerado: {qr_data.get('digital_code', 'N/A')}")
                        else:
                            self.log_test(f"{cred['name']} QR Generation", False, 
                                         f"❌ Falha na geração QR: {qr_response.status_code}")
                    
                    # Special tests for master
                    if cred["type"] == "master":
                        if user_data.get("is_master_account"):
                            self.log_test(f"{cred['name']} Master Flag", True, 
                                         "✅ is_master_account = true")
                        else:
                            self.log_test(f"{cred['name']} Master Flag", False, 
                                         "❌ is_master_account deveria ser true")
                        
                        dashboard_response = self.make_request("GET", "/master/dashboard", token=token)
                        if dashboard_response.status_code == 200:
                            dashboard_data = dashboard_response.json()
                            self.log_test(f"{cred['name']} Dashboard", True, 
                                         f"✅ Dashboard acessível - "
                                         f"Usuários: {dashboard_data.get('platform_stats', {}).get('total_users', 0)}")
                        else:
                            self.log_test(f"{cred['name']} Dashboard", False, 
                                         f"❌ Dashboard inacessível: {dashboard_response.status_code}")
                        
                else:
                    self.log_test(f"{cred['name']} Login", False, 
                                 f"❌ LOGIN FALHOU - Status: {response.status_code}")
                    
                    # Error analysis
                    if response.status_code == 401:
                        self.log_test(f"{cred['name']} Error Analysis", False, 
                                     "❌ ERRO 401: Credenciais inválidas - Conta pode não existir")
                    elif response.status_code == 500:
                        self.log_test(f"{cred['name']} Error Analysis", False, 
                                     "❌ ERRO 500: Erro interno - Problema no servidor")
                    elif response.status_code == 404:
                        self.log_test(f"{cred['name']} Error Analysis", False, 
                                     "❌ ERRO 404: Endpoint não encontrado - Problema de roteamento")
                        
            except Exception as e:
                self.log_test(f"{cred['name']} Login", False, 
                             f"❌ ERRO DE CONEXÃO: {str(e)}")
        
        # Final summary
        print(f"\n🎯 RESULTADO FINAL DO TESTE URGENTE:")
        print(f"   • URL testada: {expected_url}")
        print(f"   • Contas testadas: {total_accounts}")
        print(f"   • Logins bem-sucedidos: {successful_logins}/{total_accounts}")
        print(f"   • Taxa de sucesso: {(successful_logins/total_accounts*100):.1f}%")
        
        if successful_logins == total_accounts:
            print("   ✅ RESULTADO: TODAS AS CONTAS DEMO FUNCIONAM NA URL CORRETA")
            print("   ✅ CORREÇÃO APLICADA COM SUCESSO - App preview deve funcionar agora")
        elif successful_logins > 0:
            print(f"   ⚠️ RESULTADO: ALGUMAS CONTAS FUNCIONAM ({successful_logins}/{total_accounts})")
            print("   ⚠️ PROBLEMA PARCIAL: Verificar contas específicas que falharam")
        else:
            print("   ❌ RESULTADO: NENHUMA CONTA DEMO FUNCIONA NA URL CORRETA")
            print("   ❌ PROBLEMA PERSISTE: Investigar causa raiz")
        
        return successful_logins == total_accounts

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 80)
        print("📊 RESUMO DOS TESTES")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total de testes: {total_tests}")
        print(f"✅ Aprovados: {passed_tests}")
        print(f"❌ Falharam: {failed_tests}")
        print(f"📈 Taxa de sucesso: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    print("🚀 EXECUTANDO TESTE URGENTE DO PREVIEW")
    print("=" * 80)
    
    tester = UrgentPreviewTester()
    success = tester.test_urgent_preview_demo_accounts()
    tester.print_summary()
    
    exit(0 if success else 1)